package com.youlisten.matching;

import com.youlisten.matching.MatchScorer.Preference;
import com.youlisten.matching.dto.MatchingDtos.ManualMatchRequest;
import com.youlisten.matching.dto.MatchingDtos.Overview;
import com.youlisten.matching.dto.MatchingDtos.TrackMatchDto;
import com.youlisten.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/matching")
@RequiredArgsConstructor
public class MatchingController {

    private final MatchingService matchingService;

    @GetMapping("/playlists/{playlistId}")
    public ResponseEntity<Overview> overview(
            @PathVariable Long playlistId,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(matchingService.overview(currentUser, playlistId));
    }

    /** Starts matching in the background (202). Poll GET /playlists/{id} for progress. */
    @PostMapping("/playlists/{playlistId}/run")
    public ResponseEntity<Overview> run(
            @PathVariable Long playlistId,
            @RequestParam(defaultValue = "false") boolean retryUnmatched,
            @RequestParam(defaultValue = "VIDEO") Preference preference,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.accepted().body(matchingService.startRun(currentUser, playlistId, retryUnmatched, preference));
    }

    /** Re-ranks the stored candidates for another preference (VIDEO | AUDIO | LYRICS). Free: no YouTube quota. */
    @PostMapping("/playlists/{playlistId}/rescore")
    public ResponseEntity<Overview> rescore(
            @PathVariable Long playlistId,
            @RequestParam(defaultValue = "VIDEO") Preference preference,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(matchingService.rescore(currentUser, playlistId, preference));
    }

    @PostMapping("/playlists/{playlistId}/confirm-all")
    public ResponseEntity<Overview> confirmAll(
            @PathVariable Long playlistId,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(matchingService.confirmAll(currentUser, playlistId));
    }

    @PutMapping("/matches/{matchId}/select")
    public ResponseEntity<Overview> select(
            @PathVariable Long matchId,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(matchingService.select(currentUser, matchId));
    }

    @PostMapping("/tracks/{playlistTrackId}/rematch")
    public ResponseEntity<TrackMatchDto> rematch(
            @PathVariable Long playlistTrackId,
            @RequestParam(defaultValue = "VIDEO") Preference preference,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(matchingService.rematch(currentUser, playlistTrackId, preference));
    }

    /** Use a specific YouTube video for this track (paste its link). */
    @PostMapping("/tracks/{playlistTrackId}/manual")
    public ResponseEntity<Overview> manual(
            @PathVariable Long playlistTrackId,
            @jakarta.validation.Valid @RequestBody ManualMatchRequest request,
            @RequestParam(defaultValue = "VIDEO") Preference preference,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(matchingService.manualMatch(currentUser, playlistTrackId, request.url(), preference));
    }

    @DeleteMapping("/tracks/{playlistTrackId}/selection")
    public ResponseEntity<Overview> skip(
            @PathVariable Long playlistTrackId,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(matchingService.skipTrack(currentUser, playlistTrackId));
    }
}
