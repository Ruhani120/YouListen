package com.youlisten.transfer.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public final class TransferDtos {

    private TransferDtos() {
    }

    public record CreateRequest(
            @NotNull Long playlistId,
            @Size(max = 150) String destinationName,
            @Pattern(regexp = "public|unlisted|private", message = "privacy must be public, unlisted or private")
            String privacy) {
    }

    public record JobResponse(
            Long id,
            Long playlistId,
            String playlistName,
            String destinationPlatform,
            String destinationPlaylistId,
            String destinationPlaylistName,
            String destinationUrl,
            String privacy,
            /** PENDING | IN_PROGRESS | COMPLETED | FAILED | CANCELLED */
            String status,
            int totalTracks,
            int readyTracks,
            int skippedTracks,
            int transferredTracks,
            int failedTracks,
            int progressPercent,
            String errorMessage,
            Long durationSeconds,
            LocalDateTime startedAt,
            LocalDateTime completedAt,
            LocalDateTime createdAt) {
    }

    public record TrackResponse(
            Long id,
            int position,
            String title,
            String artist,
            String youtubeVideoId,
            String youtubeVideoTitle,
            Double confidence,
            /** PENDING | MATCHED | TRANSFERRED | FAILED | SKIPPED */
            String status,
            String errorMessage) {
    }
}
