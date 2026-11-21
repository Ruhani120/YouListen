package com.youlisten.reverse;

import com.fasterxml.jackson.databind.JsonNode;
import com.youlisten.exception.SpotifyApiException;
import com.youlisten.matching.MatchScorer;
import com.youlisten.matching.SpotifyMatchScorer;
import com.youlisten.playlist.PlaylistTrackRepository;
import com.youlisten.reverse.SpotifyMatchRunRegistry.RunState;
import com.youlisten.song.PlaylistTrack;
import com.youlisten.song.Song;
import com.youlisten.spotify.SpotifyApiClient;
import com.youlisten.spotify.SpotifyService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/** Finds Spotify matches for a whole playlist on a background thread (Spotify search has no daily quota, only rate limits). */
@Component
@RequiredArgsConstructor
@Slf4j
public class SpotifyMatchingRunner {

    private static final int MAX_CANDIDATES = 5;
    private static final int MAX_CONSECUTIVE_ERRORS = 5;

    private final PlaylistTrackRepository playlistTrackRepository;
    private final SpotifyMatchRepository matchRepository;
    private final SpotifyApiClient spotifyClient;
    private final SpotifyService spotifyService;
    private final SpotifyMatchRunRegistry registry;

    @Async("jobExecutor")
    public void run(Long userId, Long playlistId, boolean retryUnmatched) {
        RunState state = registry.get(playlistId);
        if (state == null) {
            return;
        }
        try {
            List<PlaylistTrack> tracks = playlistTrackRepository.findWithSongByPlaylistId(playlistId);
            List<Long> ids = tracks.stream().map(PlaylistTrack::getId).collect(Collectors.toList());
            Map<Long, List<SpotifyMatch>> existing = new HashMap<>();
            for (SpotifyMatch m : matchRepository.findByPlaylistTrackIdIn(ids)) {
                existing.computeIfAbsent(m.getPlaylistTrackId(), k -> new ArrayList<>()).add(m);
            }

            List<PlaylistTrack> todo = new ArrayList<>();
            for (PlaylistTrack pt : tracks) {
                List<SpotifyMatch> rows = existing.get(pt.getId());
                if (rows == null || rows.isEmpty()) {
                    todo.add(pt);
                } else if (retryUnmatched && rows.stream().noneMatch(SpotifyMatch::isSelected)) {
                    matchRepository.deleteAllForTrack(pt.getId());
                    todo.add(pt);
                }
            }
            state.total = todo.size();

            int consecutiveErrors = 0;
            for (PlaylistTrack pt : todo) {
                try {
                    matchWithOneRetry(userId, pt);
                    consecutiveErrors = 0;
                } catch (SpotifyApiException e) {
                    if (e.isFatalForJob()) {
                        state.error = e.getMessage();
                        break;
                    }
                    log.warn("Spotify matching failed for track {}: {}", pt.getId(), e.getMessage());
                    if (++consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
                        state.error = "Stopped after several errors in a row: " + e.getMessage();
                        break;
                    }
                }
                state.processed.incrementAndGet();
                sleepQuietly(120);
            }
        } catch (RuntimeException e) {
            log.error("Spotify matching run crashed for playlist {}", playlistId, e);
            state.error = "Unexpected error while matching. Check the server log.";
        } finally {
            state.running = false;
        }
    }

    private void matchWithOneRetry(Long userId, PlaylistTrack pt) {
        try {
            matchOne(pt, spotifyService.accessTokenForUser(userId));
        } catch (SpotifyApiException e) {
            if (!e.isTransient()) {
                throw e;
            }
            sleepQuietly(2500);
            matchOne(pt, spotifyService.accessTokenForUser(userId));
        }
    }

    private void matchOne(PlaylistTrack pt, String token) {
        Song song = pt.getSong();

        List<JsonNode> results = spotifyClient.searchTracks(token, SpotifyMatchScorer.filteredQuery(song.getTitle(), song.getArtist()));
        if (results.isEmpty()) {
            results = spotifyClient.searchTracks(token, SpotifyMatchScorer.plainQuery(song.getTitle(), song.getArtist()));
        }
        if (results.isEmpty()) {
            matchRepository.save(SpotifyMatch.builder()
                    .playlistTrackId(pt.getId())
                    .confidenceScore(BigDecimal.ZERO)
                    .build());
            return;
        }

        record Scored(SpotifyMatchScorer.Candidate candidate, double total) {
        }
        List<Scored> scored = new ArrayList<>();
        for (JsonNode node : results) {
            SpotifyMatchScorer.Candidate c = toCandidate(node);
            if (c == null) {
                continue;
            }
            double total = SpotifyMatchScorer.score(song.getTitle(), song.getArtist(), song.getAlbum(), song.getDurationMs(), c).total();
            // Same recording (ISRC) is the strongest possible signal
            if (song.getIsrc() != null && song.getIsrc().equalsIgnoreCase(c.isrc())) {
                total = 100;
            }
            scored.add(new Scored(c, total));
        }
        scored.sort(Comparator.comparingDouble(Scored::total).reversed());

        List<SpotifyMatch> rows = new ArrayList<>();
        for (int i = 0; i < Math.min(MAX_CANDIDATES, scored.size()); i++) {
            Scored s = scored.get(i);
            SpotifyMatchScorer.Candidate c = s.candidate();
            boolean best = i == 0;
            rows.add(SpotifyMatch.builder()
                    .playlistTrackId(pt.getId())
                    .spotifyTrackId(c.trackId())
                    .spotifyUri(c.uri())
                    .title(trunc(c.title(), 500))
                    .artist(trunc(String.join(", ", c.artists()), 500))
                    .album(trunc(c.album(), 500))
                    .durationMs(c.durationMs())
                    .isrc(c.isrc())
                    .coverUrl(trunc(c.coverUrl(), 1000))
                    .confidenceScore(BigDecimal.valueOf(s.total()))
                    .selected(best && s.total() >= MatchScorer.REVIEW_MIN)
                    .confirmed(best && s.total() >= MatchScorer.AUTO_CONFIRM)
                    .build());
        }
        if (rows.isEmpty()) {
            rows.add(SpotifyMatch.builder().playlistTrackId(pt.getId()).confidenceScore(BigDecimal.ZERO).build());
        }
        matchRepository.saveAll(rows);
    }

    private static SpotifyMatchScorer.Candidate toCandidate(JsonNode n) {
        String id = n.path("id").asText(null);
        String uri = n.path("uri").asText(null);
        if (id == null || id.isBlank() || uri == null || uri.isBlank()) {
            return null;
        }
        List<String> artists = new ArrayList<>();
        n.path("artists").forEach(a -> {
            String name = a.path("name").asText(null);
            if (name != null && !name.isBlank()) {
                artists.add(name);
            }
        });
        JsonNode images = n.path("album").path("images");
        String cover = null;
        if (images.isArray() && !images.isEmpty()) {
            cover = images.get(Math.min(1, images.size() - 1)).path("url").asText(null);
        }
        return new SpotifyMatchScorer.Candidate(
                id, uri,
                n.path("name").asText(""),
                artists,
                n.path("album").path("name").asText(null),
                n.hasNonNull("duration_ms") ? n.get("duration_ms").asLong() : null,
                n.path("external_ids").path("isrc").asText(null),
                cover);
    }

    private static String trunc(String s, int max) {
        return s == null || s.length() <= max ? s : s.substring(0, max);
    }

    private static void sleepQuietly(long ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
