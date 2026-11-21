package com.youlisten.imports.dto;

import com.youlisten.imports.ParsedTrack;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

public final class ImportDtos {

    private ImportDtos() {
    }

    public record PreviewResponse(
            String fileName,
            String format,
            int totalRows,
            int validCount,
            int invalidCount,
            int isrcCount,
            List<ParsedTrack> tracks) {
    }

    public record TrackInput(
            @Size(max = 500) String title,
            @Size(max = 500) String artist,
            @Size(max = 500) String album,
            Long durationMs,
            @Size(max = 20) String isrc,
            @Size(max = 100) String spotifyId) {
    }

    public record ConfirmRequest(
            @NotBlank @Size(max = 500) String name,
            @Size(max = 500) String fileName,
            @Size(max = 20) String format,
            @NotEmpty @Size(max = 5000) List<@Valid TrackInput> tracks) {
    }

    public record ConfirmResponse(
            Long playlistId,
            String name,
            int trackCount,
            int skippedCount) {
    }
}
