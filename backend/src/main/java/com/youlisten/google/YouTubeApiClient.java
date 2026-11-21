package com.youlisten.google;

import com.fasterxml.jackson.databind.JsonNode;
import com.youlisten.config.GoogleConfig;
import com.youlisten.exception.GoogleApiException;
import com.youlisten.exception.GoogleApiException.Reason;
import com.youlisten.matching.MatchScorer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * YouTube Data API v3.
 * Quota cost per call (default quota is 10,000 units per day for the whole Google Cloud project):
 * search.list = 100, videos.list = 1, playlists.insert = 50, playlistItems.insert = 50, channels.list = 1.
 * So matching one track costs about 101 units, and adding one track to a playlist costs 50.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class YouTubeApiClient {

    /** search.list costs 100 quota units whether it returns 5 or 50 results, so ask for plenty. */
    private static final int SEARCH_RESULTS = 15;
    private static final int MAX_LISTED_ITEMS = 2000;
    /** Resources that hold the signed-in user's own data: these always need the access token, even with an API key. */
    private static final java.util.Set<String> USER_RESOURCES = java.util.Set.of("channels", "playlists", "playlistItems");

    public record PlaylistInfo(String id, String title, String thumbnail, int itemCount, String privacy) {
    }

    public record PlaylistItem(String videoId, String title, String channel) {
    }

    private final GoogleConfig config;

    private final RestClient http = RestClient.builder()
            .baseUrl("https://www.googleapis.com/youtube/v3")
            .requestFactory(timeouts())
            .build();

    private static SimpleClientHttpRequestFactory timeouts() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5_000);
        factory.setReadTimeout(20_000);
        return factory;
    }

    // ───────────────────────── search (matching) ─────────────────────────

    /**
     * Searches music videos. Uses the API key when configured, otherwise the user's access token.
     * Returns candidates with durations filled in (second call to videos.list).
     */
    public List<MatchScorer.Candidate> searchMusicVideos(String query, String accessTokenOrNull) {
        if (!config.hasApiKey() && accessTokenOrNull == null) {
            throw new GoogleApiException(Reason.NOT_CONFIGURED,
                    "YouTube search needs either YOUTUBE_API_KEY on the server or a connected Google account.");
        }

        JsonNode search = call("search", accessTokenOrNull,
                "part=snippet&type=video&maxResults=" + SEARCH_RESULTS + "&q={q}", query);
        JsonNode items = search == null ? null : search.get("items");
        if (items == null || !items.isArray() || items.isEmpty()) {
            return List.of();
        }

        Map<String, String[]> meta = new LinkedHashMap<>();   // id -> {title, channel}
        for (JsonNode item : items) {
            String id = item.path("id").path("videoId").asText(null);
            if (id == null || id.isBlank()) {
                continue;
            }
            meta.put(id, new String[]{
                    unescapeHtml(item.path("snippet").path("title").asText("")),
                    unescapeHtml(item.path("snippet").path("channelTitle").asText(""))});
        }
        if (meta.isEmpty()) {
            return List.of();
        }

        Map<String, Long> durations = new LinkedHashMap<>();
        JsonNode videos = call("videos", accessTokenOrNull,
                "part=contentDetails&id={ids}", String.join(",", meta.keySet()));
        if (videos != null && videos.path("items").isArray()) {
            for (JsonNode v : videos.get("items")) {
                durations.put(v.path("id").asText(), parseIsoDuration(v.path("contentDetails").path("duration").asText(null)));
            }
        }

        List<MatchScorer.Candidate> out = new ArrayList<>();
        meta.forEach((id, tc) -> out.add(new MatchScorer.Candidate(id, tc[0], tc[1], durations.get(id))));
        return out;
    }

    /** One video's title, channel and duration (1 quota unit). Null when YouTube has no such video. */
    public MatchScorer.Candidate getVideoDetails(String videoId, String accessTokenOrNull) {
        if (!config.hasApiKey() && accessTokenOrNull == null) {
            throw new GoogleApiException(Reason.NOT_CONFIGURED,
                    "Looking up a video needs either YOUTUBE_API_KEY on the server or a connected Google account.");
        }
        JsonNode body = call("videos", accessTokenOrNull, "part=snippet,contentDetails&id={id}", videoId);
        JsonNode items = body == null ? null : body.get("items");
        if (items == null || !items.isArray() || items.isEmpty()) {
            return null;
        }
        JsonNode v = items.get(0);
        return new MatchScorer.Candidate(
                v.path("id").asText(videoId),
                unescapeHtml(v.path("snippet").path("title").asText("")),
                unescapeHtml(v.path("snippet").path("channelTitle").asText("")),
                parseIsoDuration(v.path("contentDetails").path("duration").asText(null)));
    }

    // ───────────────────────── account ─────────────────────────

    /** The signed-in user's channel, or null when the Google account has no YouTube channel yet. */
    public String[] getMyChannel(String accessToken) {
        JsonNode body = call("channels", accessToken, "part=snippet&mine=true");
        JsonNode items = body == null ? null : body.get("items");
        if (items == null || !items.isArray() || items.isEmpty()) {
            return null;
        }
        JsonNode first = items.get(0);
        return new String[]{first.path("id").asText(), first.path("snippet").path("title").asText("")};
    }

    // ───────────────────────── reading the user's playlists (YouTube -> Spotify) ─────────────────────────
    // All of these cost 1 quota unit per call.

    /** The signed-in user's own playlists (YouTube Music playlists show up here too). */
    public List<PlaylistInfo> listMyPlaylists(String accessToken) {
        List<PlaylistInfo> out = new ArrayList<>();
        String pageToken = null;
        for (int page = 0; page < 10; page++) {
            JsonNode body = pageToken == null
                    ? call("playlists", accessToken, "part=snippet,contentDetails,status&mine=true&maxResults=50")
                    : call("playlists", accessToken, "part=snippet,contentDetails,status&mine=true&maxResults=50&pageToken={t}", pageToken);
            JsonNode items = body == null ? null : body.get("items");
            if (items != null && items.isArray()) {
                for (JsonNode n : items) {
                    out.add(toPlaylistInfo(n));
                }
            }
            pageToken = body == null || body.path("nextPageToken").isMissingNode() ? null : body.path("nextPageToken").asText(null);
            if (pageToken == null) {
                break;
            }
        }
        return out;
    }

    public PlaylistInfo getPlaylist(String accessToken, String playlistId) {
        JsonNode body = call("playlists", accessToken, "part=snippet,contentDetails,status&id={id}", playlistId);
        JsonNode items = body == null ? null : body.get("items");
        if (items == null || !items.isArray() || items.isEmpty()) {
            throw new GoogleApiException(Reason.NOT_FOUND, "That YouTube playlist was not found in your account.");
        }
        return toPlaylistInfo(items.get(0));
    }

    /** Every item of a playlist, in order (capped at 2,000). */
    public List<PlaylistItem> listPlaylistItems(String accessToken, String playlistId) {
        List<PlaylistItem> out = new ArrayList<>();
        String pageToken = null;
        while (out.size() < MAX_LISTED_ITEMS) {
            JsonNode body = pageToken == null
                    ? call("playlistItems", accessToken, "part=snippet&maxResults=50&playlistId={p}", playlistId)
                    : call("playlistItems", accessToken, "part=snippet&maxResults=50&playlistId={p}&pageToken={t}", playlistId, pageToken);
            JsonNode items = body == null ? null : body.get("items");
            if (items != null && items.isArray()) {
                for (JsonNode n : items) {
                    JsonNode sn = n.path("snippet");
                    out.add(new PlaylistItem(
                            sn.path("resourceId").path("videoId").asText(null),
                            unescapeHtml(sn.path("title").asText("")),
                            unescapeHtml(sn.path("videoOwnerChannelTitle").asText(""))));
                }
            }
            pageToken = body == null || body.path("nextPageToken").isMissingNode() ? null : body.path("nextPageToken").asText(null);
            if (pageToken == null) {
                break;
            }
        }
        return out;
    }

    /** Durations for up to 50 videos per call. Missing / live videos are simply absent from the map. */
    public Map<String, Long> getDurations(String accessToken, List<String> videoIds) {
        Map<String, Long> out = new LinkedHashMap<>();
        for (int i = 0; i < videoIds.size(); i += 50) {
            List<String> batch = videoIds.subList(i, Math.min(i + 50, videoIds.size()));
            JsonNode body = call("videos", accessToken, "part=contentDetails&id={ids}", String.join(",", batch));
            if (body != null && body.path("items").isArray()) {
                for (JsonNode v : body.get("items")) {
                    Long ms = parseIsoDuration(v.path("contentDetails").path("duration").asText(null));
                    if (ms != null) {
                        out.put(v.path("id").asText(), ms);
                    }
                }
            }
        }
        return out;
    }

    private static PlaylistInfo toPlaylistInfo(JsonNode n) {
        JsonNode thumbs = n.path("snippet").path("thumbnails");
        String thumb = thumbs.path("medium").path("url").asText(null);
        if (thumb == null) {
            thumb = thumbs.path("default").path("url").asText(null);
        }
        return new PlaylistInfo(
                n.path("id").asText(),
                unescapeHtml(n.path("snippet").path("title").asText("Untitled playlist")),
                thumb,
                n.path("contentDetails").path("itemCount").asInt(0),
                n.path("status").path("privacyStatus").asText("private"));
    }

    // ───────────────────────── playlists (transfer) ─────────────────────────

    public String createPlaylist(String accessToken, String title, String description, String privacy) {
        Map<String, Object> body = Map.of(
                "snippet", Map.of("title", title, "description", description),
                "status", Map.of("privacyStatus", privacy));
        JsonNode created = post("playlists", accessToken, "part=snippet,status", body);
        String id = created == null ? null : created.path("id").asText(null);
        if (id == null || id.isBlank()) {
            throw new GoogleApiException(Reason.UPSTREAM_ERROR, "YouTube did not return a playlist id.");
        }
        return id;
    }

    public void addVideoToPlaylist(String accessToken, String playlistId, String videoId) {
        Map<String, Object> body = Map.of("snippet", Map.of(
                "playlistId", playlistId,
                "resourceId", Map.of("kind", "youtube#video", "videoId", videoId)));
        post("playlistItems", accessToken, "part=snippet", body);
    }

    // ───────────────────────── plumbing ─────────────────────────

    private JsonNode call(String resource, String accessTokenOrNull, String query, Object... vars) {
        try {
            String uri = "/" + resource + "?" + query + keyParam();
            RestClient.RequestHeadersSpec<?> spec = http.get().uri(uri, vars);
            if (accessTokenOrNull != null && (!config.hasApiKey() || USER_RESOURCES.contains(resource))) {
                spec = spec.header(HttpHeaders.AUTHORIZATION, "Bearer " + accessTokenOrNull);
            }
            return spec.retrieve().body(JsonNode.class);
        } catch (RestClientResponseException e) {
            throw toException(e);
        } catch (RestClientException e) {
            log.warn("YouTube API unreachable: {}", e.getMessage());
            throw new GoogleApiException(Reason.UPSTREAM_ERROR, "Could not reach YouTube. Try again in a moment.");
        }
    }

    private JsonNode post(String resource, String accessToken, String query, Object body) {
        try {
            return http.post()
                    .uri("/" + resource + "?" + query)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientResponseException e) {
            throw toException(e);
        } catch (RestClientException e) {
            log.warn("YouTube API unreachable: {}", e.getMessage());
            throw new GoogleApiException(Reason.UPSTREAM_ERROR, "Could not reach YouTube. Try again in a moment.");
        }
    }

    private String keyParam() {
        return config.hasApiKey() ? "&key=" + config.getYoutubeApiKey().trim() : "";
    }

    private GoogleApiException toException(RestClientResponseException e) {
        int status = e.getStatusCode().value();
        String body = e.getResponseBodyAsString();
        String reason = "";
        String message = "";
        try {
            JsonNode root = new com.fasterxml.jackson.databind.ObjectMapper().readTree(body);
            reason = root.path("error").path("errors").path(0).path("reason").asText("");
            message = root.path("error").path("message").asText("");
        } catch (Exception ignored) {
            // body was not JSON
        }
        log.warn("YouTube API responded {} reason={} message={}", status, reason, message);

        if (reason.equals("quotaExceeded") || reason.equals("dailyLimitExceeded")) {
            return new GoogleApiException(Reason.QUOTA_EXCEEDED,
                    "YouTube's daily API quota is used up. It resets at midnight Pacific Time. "
                            + "Your progress is saved, so you can resume later.");
        }
        if (reason.equals("rateLimitExceeded") || reason.equals("userRateLimitExceeded") || status == 429) {
            return new GoogleApiException(Reason.RATE_LIMITED, "YouTube is rate limiting requests. Slowing down.");
        }
        if (reason.equals("youtubeSignupRequired") || reason.equals("channelNotFound")) {
            return new GoogleApiException(Reason.NO_CHANNEL,
                    "This Google account has no YouTube channel yet. Open youtube.com once, create a channel, then try again.");
        }
        if (reason.equals("accessNotConfigured") || message.contains("has not been used in project")
                || message.contains("is disabled")) {
            return new GoogleApiException(Reason.NOT_CONFIGURED,
                    "The YouTube Data API v3 is not enabled for this Google Cloud project.");
        }
        if (reason.equals("keyInvalid") || (reason.equals("badRequest") && message.toLowerCase().contains("api key"))) {
            return new GoogleApiException(Reason.NOT_CONFIGURED, "The YOUTUBE_API_KEY is not valid.");
        }
        if (status == 401) {
            return new GoogleApiException(Reason.REAUTH_REQUIRED, "Your Google session expired. Please reconnect Google.");
        }
        if (status == 404) {
            return new GoogleApiException(Reason.NOT_FOUND, "YouTube could not find that video or playlist.");
        }
        if (status == 409 && (reason.toLowerCase().contains("duplicate") || reason.toLowerCase().contains("alreadyin"))) {
            return new GoogleApiException(Reason.DUPLICATE, "That video is already in the playlist.");
        }
        if (status == 403) {
            return new GoogleApiException(Reason.FORBIDDEN,
                    message.isBlank() ? "YouTube refused the request (403)." : "YouTube refused the request: " + message);
        }
        return new GoogleApiException(Reason.UPSTREAM_ERROR, "YouTube returned an error (" + status + ").");
    }

    // ───────────────────────── small helpers ─────────────────────────

    public static Long parseIsoDuration(String iso) {
        if (iso == null || iso.isBlank()) {
            return null;
        }
        try {
            long ms = Duration.parse(iso).toMillis();
            return ms > 0 ? ms : null;
        } catch (Exception e) {
            return null;
        }
    }

    /** search.list titles come back HTML-escaped (&amp; &#39; ...). */
    public static String unescapeHtml(String s) {
        if (s == null || s.indexOf('&') < 0) {
            return s;
        }
        return s.replace("&amp;", "&").replace("&quot;", "\"").replace("&#39;", "'")
                .replace("&lt;", "<").replace("&gt;", ">");
    }
}
