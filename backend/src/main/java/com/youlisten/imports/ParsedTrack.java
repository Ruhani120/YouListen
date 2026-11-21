package com.youlisten.imports;

/** One row parsed from an uploaded CSV/JSON playlist export. */
public record ParsedTrack(
        int position,
        String title,
        String artist,
        String album,
        Long durationMs,
        String isrc,
        String spotifyId,
        boolean valid,
        String issue) {
}
