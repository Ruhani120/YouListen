package com.youlisten.imports;

/** A track ready to be saved into a new playlist, whatever the source (file, YouTube, ...). */
public record ImportedTrack(
        String title,
        String artist,
        String album,
        Long durationMs,
        String isrc,
        String spotifyId,
        String youtubeId) {
}
