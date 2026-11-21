package com.youlisten.reverse;

import com.youlisten.reverse.dto.ReverseDtos.SpotifyOverview;
import com.youlisten.reverse.dto.ReverseDtos.SpotifyTransferRequest;
import com.youlisten.reverse.dto.ReverseDtos.SpotifyTransferResult;
import com.youlisten.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/** YouTube -> Spotify: match tracks on Spotify, review them, then create the Spotify playlist. */
@RestController
@RequestMapping("/api/spotify")
@RequiredArgsConstructor
public class SpotifyMatchingController {

    private final SpotifyMatchingService matchingService;
    private final SpotifyTransferService transferService;

    @GetMapping("/matching/playlists/{playlistId}")
    public ResponseEntity<SpotifyOverview> overview(
            @PathVariable Long playlistId, @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(matchingService.overview(currentUser, playlistId));
    }

    @PostMapping("/matching/playlists/{playlistId}/run")
    public ResponseEntity<SpotifyOverview> run(
            @PathVariable Long playlistId,
            @RequestParam(defaultValue = "false") boolean retryUnmatched,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.accepted().body(matchingService.startRun(currentUser, playlistId, retryUnmatched));
    }

    @PostMapping("/matching/playlists/{playlistId}/confirm-all")
    public ResponseEntity<SpotifyOverview> confirmAll(
            @PathVariable Long playlistId, @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(matchingService.confirmAll(currentUser, playlistId));
    }

    @PutMapping("/matching/matches/{matchId}/select")
    public ResponseEntity<SpotifyOverview> select(
            @PathVariable Long matchId, @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(matchingService.select(currentUser, matchId));
    }

    @DeleteMapping("/matching/tracks/{playlistTrackId}/selection")
    public ResponseEntity<SpotifyOverview> skip(
            @PathVariable Long playlistTrackId, @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(matchingService.skipTrack(currentUser, playlistTrackId));
    }

    /** Creates the Spotify playlist from the confirmed matches. */
    @PostMapping("/transfers")
    public ResponseEntity<SpotifyTransferResult> createPlaylist(
            @Valid @RequestBody SpotifyTransferRequest request, @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(transferService.create(currentUser, request));
    }
}
