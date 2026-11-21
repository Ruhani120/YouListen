package com.youlisten.spotify;

import com.youlisten.config.SpotifyConfig;
import com.youlisten.spotify.dto.SpotifyDtos.AuthorizeUrlResponse;
import com.youlisten.spotify.dto.SpotifyDtos.ImportResult;
import com.youlisten.spotify.dto.SpotifyDtos.PlaylistSummary;
import com.youlisten.spotify.dto.SpotifyDtos.StatusResponse;
import com.youlisten.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/spotify")
@RequiredArgsConstructor
public class SpotifyController {

    private final SpotifyService spotifyService;
    private final SpotifyConfig config;

    @GetMapping("/status")
    public ResponseEntity<StatusResponse> status(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(spotifyService.getStatus(currentUser));
    }

    /** The frontend calls this (with the JWT), then sends the browser to the returned Spotify URL. */
    @GetMapping("/connect")
    public ResponseEntity<AuthorizeUrlResponse> connect(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(new AuthorizeUrlResponse(spotifyService.createAuthorizeUrl(currentUser)));
    }

    /** Public on purpose: Spotify redirects the browser here. The signed state identifies the user. */
    @GetMapping("/callback")
    public ResponseEntity<Void> callback(
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String error) {
        String result = spotifyService.handleCallback(code, state, error);
        String base = config.getFrontendUrl().replaceAll("/+$", "");
        return ResponseEntity.status(HttpStatus.FOUND)
                .location(URI.create(base + "/app/import?spotify=" + result))
                .build();
    }

    @GetMapping("/playlists")
    public ResponseEntity<List<PlaylistSummary>> playlists(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(spotifyService.listPlaylists(currentUser));
    }

    @PostMapping("/playlists/{playlistId}/import")
    public ResponseEntity<ImportResult> importPlaylist(
            @PathVariable String playlistId,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(spotifyService.importPlaylist(currentUser, playlistId));
    }

    @DeleteMapping("/connection")
    public ResponseEntity<Void> disconnect(@AuthenticationPrincipal User currentUser) {
        spotifyService.disconnect(currentUser);
        return ResponseEntity.noContent().build();
    }
}
