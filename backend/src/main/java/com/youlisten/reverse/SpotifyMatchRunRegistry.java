package com.youlisten.reverse;

import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/** In-memory progress of Spotify matching runs, keyed by playlist id. The results themselves live in the database. */
@Component
public class SpotifyMatchRunRegistry {

    public static final class RunState {
        public volatile boolean running = true;
        public volatile int total;
        public final AtomicInteger processed = new AtomicInteger();
        public volatile String error;
    }

    private final Map<Long, RunState> runs = new ConcurrentHashMap<>();

    /** Returns a fresh state, or null when a run for this playlist is already going. */
    public RunState tryStart(Long playlistId) {
        RunState fresh = new RunState();
        RunState current = runs.compute(playlistId, (k, v) -> (v != null && v.running) ? v : fresh);
        return current == fresh ? fresh : null;
    }

    public RunState get(Long playlistId) {
        return runs.get(playlistId);
    }
}
