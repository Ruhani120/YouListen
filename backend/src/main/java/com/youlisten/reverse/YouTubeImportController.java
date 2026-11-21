package com.youlisten.reverse;

import com.youlisten.reverse.dto.ReverseDtos.YouTubeImportResult;
import com.youlisten.reverse.dto.ReverseDtos.YouTubePlaylistDto;
import com.youlisten.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/youtube")
@RequiredArgsConstructor
public class YouTubeImportController {

    private final YouTubeImportService importService;

    /** The signed-in user's YouTube / YouTube Music playlists (needs the Google connection). */
    @GetMapping("/playlists")
    public ResponseEntity<List<YouTubePlaylistDto>> playlists(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(importService.listPlaylists(currentUser));
    }

    @PostMapping("/playlists/{playlistId}/import")
    public ResponseEntity<YouTubeImportResult> importPlaylist(
            @PathVariable String playlistId,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(importService.importPlaylist(currentUser, playlistId));
    }
}
