package com.youlisten.matching;

import com.youlisten.config.GoogleConfig;
import com.youlisten.exception.GoogleApiException;
import com.youlisten.google.GoogleService;
import com.youlisten.matching.MatchRunRegistry.RunState;
import com.youlisten.playlist.PlaylistTrackRepository;
import com.youlisten.song.PlaylistTrack;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/** Runs matching for a whole playlist on a background thread, so the HTTP request returns immediately. */
@Component
@RequiredArgsConstructor
@Slf4j
public class MatchingRunner {

    private static final int MAX_CONSECUTIVE_ERRORS = 5;

    private final PlaylistTrackRepository playlistTrackRepository;
    private final SongMatchRepository matchRepository;
    private final TrackMatcher trackMatcher;
    private final GoogleService googleService;
    private final GoogleConfig googleConfig;
    private final MatchRunRegistry registry;

    @Async("jobExecutor")
    public void run(Long userId, Long playlistId, boolean retryUnmatched, MatchScorer.Preference preference) {
        RunState state = registry.get(playlistId);
        if (state == null) {
            return;
        }
        try {
            List<PlaylistTrack> tracks = playlistTrackRepository.findWithSongByPlaylistId(playlistId);
            List<Long> ids = tracks.stream().map(PlaylistTrack::getId).collect(Collectors.toList());
            Map<Long, List<SongMatch>> existing = new HashMap<>();
            for (SongMatch m : matchRepository.findByPlaylistTrackIdIn(ids)) {
                existing.computeIfAbsent(m.getPlaylistTrackId(), k -> new ArrayList<>()).add(m);
            }

            List<PlaylistTrack> todo = new ArrayList<>();
            for (PlaylistTrack pt : tracks) {
                List<SongMatch> rows = existing.get(pt.getId());
                if (rows == null || rows.isEmpty()) {
                    todo.add(pt);
                } else if (retryUnmatched && rows.stream().noneMatch(SongMatch::isSelected)) {
                    matchRepository.deleteAllForTrack(pt.getId());
                    todo.add(pt);
                }
            }
            state.total = todo.size();

            int consecutiveErrors = 0;
            for (PlaylistTrack pt : todo) {
                try {
                    matchWithOneRetry(userId, pt, preference);
                    consecutiveErrors = 0;
                } catch (GoogleApiException e) {
                    if (e.isFatalForJob()) {
                        state.error = e.getMessage();
                        break;
                    }
                    log.warn("Matching failed for track {}: {}", pt.getId(), e.getMessage());
                    if (++consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
                        state.error = "Stopped after several errors in a row: " + e.getMessage();
                        break;
                    }
                }
                state.processed.incrementAndGet();
                sleepQuietly(150);
            }
        } catch (RuntimeException e) {
            log.error("Matching run crashed for playlist {}", playlistId, e);
            state.error = "Unexpected error while matching. Check the server log.";
        } finally {
            state.running = false;
        }
    }

    private void matchWithOneRetry(Long userId, PlaylistTrack pt, MatchScorer.Preference preference) {
        try {
            trackMatcher.matchTrack(pt, tokenFor(userId), preference);
        } catch (GoogleApiException e) {
            if (!e.isTransient()) {
                throw e;
            }
            sleepQuietly(2000);
            trackMatcher.matchTrack(pt, tokenFor(userId), preference);
        }
    }

    /** With an API key no token is needed; otherwise use (and refresh) the user's Google token. */
    private String tokenFor(Long userId) {
        return googleConfig.hasApiKey() ? null : googleService.accessTokenOrNull(userId);
    }

    private static void sleepQuietly(long ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
