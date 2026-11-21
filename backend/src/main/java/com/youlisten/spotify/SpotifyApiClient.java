package com.youlisten.spotify;

import com.fasterxml.jackson.databind.JsonNode;
import com.youlisten.config.SpotifyConfig;
import com.youlisten.exception.SpotifyApiException;
import com.youlisten.exception.SpotifyApiException.Reason;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;

/**
 * Thin client for Spotify's accounts + Web API.
 * Written against the February 2026 Development Mode rules:
 * playlist contents come from /playlists/{id}/items (field "item"), and only for playlists
 * the user owns or collaborates on.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class SpotifyApiClient {

    public static final String SCOPES =
            "playlist-read-private playlist-read-collaborative playlist-modify-private playlist-modify-public";

    private static final int PLAYLIST_PAGE_SIZE = 50;
    private static final int ITEMS_PAGE_SIZE = 100;
    private static final int MAX_PLAYLISTS = 500;
    private static final int MAX_ITEMS = 5000;

    public record TokenResponse(String accessToken, String refreshToken, long expiresIn, String scope) {
    }

    private final SpotifyConfig config;

    private final RestClient accounts = RestClient.builder()
            .baseUrl("https://accounts.spotify.com")
            .requestFactory(timeouts())
            .build();

    private final RestClient api = RestClient.builder()
            .baseUrl("https://api.spotify.com/v1")
            .requestFactory(timeouts())
            .build();

    private static SimpleClientHttpRequestFactory timeouts() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5_000);
        factory.setReadTimeout(20_000);
        return factory;
    }

    // ───────────────────────── OAuth ─────────────────────────

    public String buildAuthorizeUrl(String state) {
        return "https://accounts.spotify.com/authorize"
                + "?client_id=" + enc(config.getClientId())
                + "&response_type=code"
                + "&redirect_uri=" + enc(config.getRedirectUri())
                + "&scope=" + enc(SCOPES)
                + "&state=" + enc(state)
                + "&show_dialog=true";
    }

    public TokenResponse exchangeCode(String code) {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "authorization_code");
        form.add("code", code);
        form.add("redirect_uri", config.getRedirectUri());
        return tokenRequest(form);
    }

    public TokenResponse refresh(String refreshToken) {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "refresh_token");
        form.add("refresh_token", refreshToken);
        return tokenRequest(form);
    }

    private TokenResponse tokenRequest(MultiValueMap<String, String> form) {
        String basic = Base64.getEncoder().encodeToString(
                (config.getClientId() + ":" + config.getClientSecret()).getBytes(StandardCharsets.UTF_8));
        try {
            JsonNode body = accounts.post()
                    .uri("/api/token")
                    .header(HttpHeaders.AUTHORIZATION, "Basic " + basic)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(form)
                    .retrieve()
                    .body(JsonNode.class);
            if (body == null || !body.hasNonNull("access_token")) {
                throw new SpotifyApiException(Reason.UPSTREAM_ERROR, "Spotify returned no access token.");
            }
            return new TokenResponse(
                    body.get("access_token").asText(),
                    body.hasNonNull("refresh_token") ? body.get("refresh_token").asText() : null,
                    body.path("expires_in").asLong(3600),
                    body.path("scope").asText(""));
        } catch (RestClientResponseException e) {
            throw toException(e, true);
        } catch (RestClientException e) {
            log.warn("Spotify token endpoint unreachable: {}", e.getMessage());
            throw new SpotifyApiException(Reason.UPSTREAM_ERROR, "Could not reach Spotify. Try again in a moment.");
        }
    }

    // ───────────────────────── Web API ─────────────────────────

    public JsonNode getMe(String accessToken) {
        return get(accessToken, "/me");
    }

    public List<JsonNode> getAllPlaylists(String accessToken) {
        List<JsonNode> all = new ArrayList<>();
        int offset = 0;
        while (offset < MAX_PLAYLISTS) {
            JsonNode page = get(accessToken, "/me/playlists?limit={l}&offset={o}", PLAYLIST_PAGE_SIZE, offset);
            JsonNode items = page == null ? null : page.get("items");
            if (items == null || !items.isArray() || items.isEmpty()) {
                break;
            }
            items.forEach(n -> {
                if (n != null && !n.isNull()) {
                    all.add(n);
                }
            });
            if (page.path("next").isMissingNode() || page.path("next").isNull()) {
                break;
            }
            offset += PLAYLIST_PAGE_SIZE;
        }
        return all;
    }

    public JsonNode getPlaylistMeta(String accessToken, String playlistId) {
        return get(accessToken, "/playlists/{id}?fields=id,name,description,images,owner(id)", playlistId);
    }

    /** Returns the raw entries of /playlists/{id}/items. Use {@link #extractTrack(JsonNode)} on each. */
    public List<JsonNode> getPlaylistItems(String accessToken, String playlistId) {
        List<JsonNode> all = new ArrayList<>();
        int offset = 0;
        while (offset < MAX_ITEMS) {
            JsonNode page = get(accessToken,
                    "/playlists/{id}/items?limit={l}&offset={o}&additional_types=track",
                    playlistId, ITEMS_PAGE_SIZE, offset);
            JsonNode items = page == null ? null : page.get("items");
            if (items == null || !items.isArray() || items.isEmpty()) {
                break;
            }
            items.forEach(all::add);
            if (page.path("next").isMissingNode() || page.path("next").isNull()) {
                break;
            }
            offset += ITEMS_PAGE_SIZE;
        }
        return all;
    }

    /** Search tracks. Development Mode caps the page size at 10. Returns the raw track objects. */
    public List<JsonNode> searchTracks(String accessToken, String query) {
        JsonNode body = get(accessToken, "/search?q={q}&type=track&limit=10", query);
        JsonNode items = body == null ? null : body.path("tracks").get("items");
        List<JsonNode> out = new ArrayList<>();
        if (items != null && items.isArray()) {
            items.forEach(n -> {
                if (n != null && !n.isNull()) {
                    out.add(n);
                }
            });
        }
        return out;
    }

    /** POST /me/playlists. Returns {id, url}. */
    public String[] createPlaylist(String accessToken, String name, String description, boolean isPublic) {
        JsonNode created = post(accessToken, "/me/playlists", Map.of(
                "name", name, "description", description, "public", isPublic));
        String id = created == null ? null : created.path("id").asText(null);
        if (id == null || id.isBlank()) {
            throw new SpotifyApiException(Reason.UPSTREAM_ERROR, "Spotify did not return a playlist id.");
        }
        return new String[]{id, created.path("external_urls").path("spotify").asText("https://open.spotify.com/playlist/" + id)};
    }

    /** POST /playlists/{id}/items, at most 100 URIs per call. */
    public void addItems(String accessToken, String playlistId, List<String> uris) {
        post(accessToken, "/playlists/" + playlistId + "/items", Map.of("uris", uris));
    }

    /** New API uses "item", the old one used "track". Returns null if there is no usable track object. */
    public static JsonNode extractTrack(JsonNode entry) {
        if (entry == null || entry.isNull()) {
            return null;
        }
        JsonNode node = entry.hasNonNull("item") ? entry.get("item")
                : entry.hasNonNull("track") ? entry.get("track") : null;
        return node;
    }

    private JsonNode get(String accessToken, String uri, Object... vars) {
        try {
            return api.get()
                    .uri(uri, vars)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientResponseException e) {
            throw toException(e, false);
        } catch (RestClientException e) {
            log.warn("Spotify API unreachable: {}", e.getMessage());
            throw new SpotifyApiException(Reason.UPSTREAM_ERROR, "Could not reach Spotify. Try again in a moment.");
        }
    }

    private JsonNode post(String accessToken, String uri, Object body) {
        try {
            return api.post()
                    .uri(uri)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientResponseException e) {
            throw toException(e, false);
        } catch (RestClientException e) {
            log.warn("Spotify API unreachable: {}", e.getMessage());
            throw new SpotifyApiException(Reason.UPSTREAM_ERROR, "Could not reach Spotify. Try again in a moment.");
        }
    }

    private SpotifyApiException toException(RestClientResponseException e, boolean tokenEndpoint) {
        int status = e.getStatusCode().value();
        String body = e.getResponseBodyAsString();
        log.warn("Spotify responded {}: {}", status, body.length() > 300 ? body.substring(0, 300) : body);

        if (tokenEndpoint && status == 400 && body.contains("invalid_grant")) {
            return new SpotifyApiException(Reason.REAUTH_REQUIRED,
                    "Your Spotify authorization expired or was revoked. Please reconnect Spotify.");
        }
        if (status == 401) {
            return new SpotifyApiException(Reason.REAUTH_REQUIRED,
                    "Your Spotify session expired. Please reconnect Spotify.");
        }
        if (status == 403) {
            return new SpotifyApiException(Reason.FORBIDDEN,
                    "Spotify refused the request (403). In Spotify Development Mode the app owner needs an "
                            + "active Premium subscription, and your Spotify account must be added under "
                            + "User Management in the Spotify Developer Dashboard.");
        }
        if (status == 429) {
            return new SpotifyApiException(Reason.RATE_LIMITED,
                    "Spotify is rate limiting this app. Wait a minute and try again.");
        }
        return new SpotifyApiException(Reason.UPSTREAM_ERROR, "Spotify returned an error (" + status + ").");
    }

    private static String enc(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
