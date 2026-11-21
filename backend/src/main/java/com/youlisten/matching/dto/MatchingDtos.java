package com.youlisten.matching.dto;

import java.util.List;

public final class MatchingDtos {

    public record ManualMatchRequest(
            @jakarta.validation.constraints.NotBlank @jakarta.validation.constraints.Size(max = 300) String url) {
    }

    private MatchingDtos() {
    }

    public record CandidateDto(
            Long matchId,
            String videoId,
            String title,
            String channel,
            Long durationMs,
            double confidence,
            /** VIDEO | AUDIO | LYRICS | OTHER */
            String kind,
            /** why this score, e.g. "Title 100% · Artist 100% · Length 98% · Music video" */
            String explanation,
            boolean selected,
            boolean confirmed,
            String method) {
    }

    /** status: PENDING (not searched yet) | CONFIRMED | REVIEW | UNMATCHED */
    public record TrackMatchDto(
            Long playlistTrackId,
            int position,
            String title,
            String artist,
            String album,
            Long durationMs,
            String isrc,
            String status,
            List<CandidateDto> candidates) {
    }

    public record Overview(
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
            /** VIDEO | AUDIO | LYRICS : the preference the stored scores were last computed with */
            String preference,
            int estimatedQuotaUnits,
            /** api_key | account | none */
            String searchMode,
            List<TrackMatchDto> tracks) {
    }
}
