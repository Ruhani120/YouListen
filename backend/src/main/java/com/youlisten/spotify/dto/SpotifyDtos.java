package com.youlisten.spotify.dto;

import java.time.LocalDateTime;

public final class SpotifyDtos {

    private SpotifyDtos() {
    }

    public record StatusResponse(
            boolean configured,
            boolean connected,
            String displayName,
            String spotifyUserId,
            LocalDateTime connectedAt,
            /** false for connections made before the write scopes were added: reconnect to create playlists */
            boolean canCreatePlaylists) {
    }

    public record AuthorizeUrlResponse(String authorizeUrl) {
    }

    public record PlaylistSummary(
            String id,
            String name,
            String description,
            String coverUrl,
            int trackCount,
            String ownerName,
            boolean importable,
            boolean alreadyImported,
            Long importedPlaylistId) {
    }

    public record ImportResult(
            Long playlistId,
            String name,
            int trackCount,
            int skippedCount,
            boolean alreadyImported) {
    }
}
