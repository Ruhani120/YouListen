package com.youlisten.matching;

import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * In-memory state of matching runs, keyed by playlist id. It only drives the progress bar:
 * the real results are in the song_matches table, so a restart loses nothing but the running flag.
 */
@Component
public class MatchRunRegistry {

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
