package com.youlisten.playlist;

import com.youlisten.playlist.dto.PlaylistRequest;
import com.youlisten.playlist.dto.PlaylistResponse;
import com.youlisten.song.PlaylistTrack;
import com.youlisten.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/playlists")
@RequiredArgsConstructor
public class PlaylistController {

    private final PlaylistService playlistService;

    @GetMapping
    public ResponseEntity<List<PlaylistResponse>> getUserPlaylists(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(playlistService.getUserPlaylists(currentUser));
    }

    @PostMapping
    public ResponseEntity<PlaylistResponse> createPlaylist(
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody PlaylistRequest request) {
        PlaylistResponse response = playlistService.createPlaylist(currentUser, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PlaylistResponse> getPlaylist(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(playlistService.getPlaylistById(id, currentUser));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PlaylistResponse> updatePlaylist(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody PlaylistRequest request) {
        return ResponseEntity.ok(playlistService.updatePlaylist(id, currentUser, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePlaylist(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        playlistService.deletePlaylist(id, currentUser);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/favorite")
    public ResponseEntity<PlaylistResponse> toggleFavorite(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(playlistService.toggleFavorite(id, currentUser));
    }

    @GetMapping("/{id}/tracks")
    public ResponseEntity<List<PlaylistTrack>> getPlaylistTracks(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(playlistService.getPlaylistTracks(id, currentUser));
    }
}
