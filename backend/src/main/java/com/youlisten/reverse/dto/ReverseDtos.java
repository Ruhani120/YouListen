package com.youlisten.reverse.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public final class ReverseDtos {

    private ReverseDtos() {
    }

    // ── importing from YouTube ──

    public record YouTubePlaylistDto(
            String id,
            String title,
            String thumbnail,
            int itemCount,
            String privacy,
            boolean alreadyImported,
            Long importedPlaylistId) {
    }

    public record YouTubeImportResult(
            Long playlistId,
            String name,
            int trackCount,
            int skippedCount,
            /** tracks whose artist/title could only be guessed from the video title */
            int lowConfidenceCount,
            boolean alreadyImported) {
    }

    // ── matching on Spotify ──

    public record SpotifyCandidateDto(
            Long matchId,
            String spotifyTrackId,
            String title,
            String artist,
            String album,
            Long durationMs,
            String coverUrl,
            double confidence,
            boolean selected,
            boolean confirmed) {
    }

    /** status: PENDING | CONFIRMED | REVIEW | UNMATCHED */
    public record SpotifyTrackMatchDto(
            Long playlistTrackId,
            int position,
            String title,
            String artist,
            Long durationMs,
            String status,
            List<SpotifyCandidateDto> candidates) {
    }

    public record SpotifyOverview(
            Long playlistId,
            String playlistName,
            int totalTracks,
            int pending,
            int confirmed,
            int needsReview,
            int unmatched,
            boolean running,
            int runProcessed,
            int runTotal,
            String runError,
            List<SpotifyTrackMatchDto> tracks) {
    }

    // ── creating the Spotify playlist ──

    public record SpotifyTransferRequest(
            @NotNull Long playlistId,
            @Size(max = 100) String name,
            boolean makePublic) {
    }

    public record SpotifyTransferResult(
            Long jobId,
            String spotifyPlaylistId,
            String spotifyUrl,
            String name,
            int added,
            int skipped) {
    }
}
