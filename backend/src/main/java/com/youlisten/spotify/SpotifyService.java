package com.youlisten.spotify;

import com.fasterxml.jackson.databind.JsonNode;
import com.youlisten.config.SpotifyConfig;
import com.youlisten.exception.BadRequestException;
import com.youlisten.exception.SpotifyApiException;
import com.youlisten.exception.SpotifyApiException.Reason;
import com.youlisten.platform.ConnectedAccount;
import com.youlisten.platform.ConnectedAccountRepository;
import com.youlisten.platform.Platform;
import com.youlisten.platform.PlatformRepository;
import com.youlisten.playlist.Playlist;
import com.youlisten.playlist.PlaylistRepository;
import com.youlisten.playlist.PlaylistTrackRepository;
import com.youlisten.song.PlaylistTrack;
import com.youlisten.song.Song;
import com.youlisten.song.SongRepository;
import com.youlisten.spotify.dto.SpotifyDtos.ImportResult;
import com.youlisten.spotify.dto.SpotifyDtos.PlaylistSummary;
import com.youlisten.spotify.dto.SpotifyDtos.StatusResponse;
import com.youlisten.user.User;
import com.youlisten.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class SpotifyService {

    private static final String PLATFORM = "spotify";
    private static final Pattern PLAYLIST_ID = Pattern.compile("^[A-Za-z0-9]{1,64}$");

    private final SpotifyConfig config;
    private final SpotifyApiClient apiClient;
    private final SpotifyStateService stateService;
    private final TokenCrypto crypto;
    private final ConnectedAccountRepository accountRepository;
    private final PlatformRepository platformRepository;
    private final UserRepository userRepository;
    private final PlaylistRepository playlistRepository;
    private final PlaylistTrackRepository playlistTrackRepository;
    private final SongRepository songRepository;
    private final TransactionTemplate transactionTemplate;

    // ───────────────────────── connect / callback ─────────────────────────

    public String createAuthorizeUrl(User user) {
        requireConfigured();
        return apiClient.buildAuthorizeUrl(stateService.create(user.getId()));
    }

    /**
     * Called from the browser redirect after the user approves (or denies) access on Spotify.
     * Returns a short result code that the controller puts on the frontend redirect URL:
     * connected | restricted | denied | invalid_state | error
     */
    public String handleCallback(String code, String state, String error) {
        if (!config.isConfigured()) {
            return "error";
        }
        if (error != null || code == null || code.isBlank()) {
            return "denied";
        }

        User user;
        try {
            Long userId = stateService.verify(state);
            user = userRepository.findById(userId).orElse(null);
        } catch (BadRequestException e) {
            return "invalid_state";
        }
        if (user == null) {
            return "invalid_state";
        }

        try {
            SpotifyApiClient.TokenResponse tokens = apiClient.exchangeCode(code);

            String result = "connected";
            String spotifyUserId = null;
            String displayName = null;
            try {
                JsonNode me = apiClient.getMe(tokens.accessToken());
                spotifyUserId = text(me, "id");
                displayName = text(me, "display_name");
            } catch (SpotifyApiException e) {
                if (e.getReason() == Reason.FORBIDDEN) {
                    // Typical when the Spotify app owner has no active Premium. Keep the tokens anyway,
                    // so everything starts working later without asking the user to log in again.
                    result = "restricted";
                } else {
                    log.warn("Spotify /me failed after token exchange: {}", e.getMessage());
                }
            }

            saveConnection(user, tokens, spotifyUserId, displayName);
            return result;
        } catch (SpotifyApiException e) {
            log.warn("Spotify callback failed: {}", e.getMessage());
            return "error";
        } catch (RuntimeException e) {
            log.error("Unexpected error in Spotify callback", e);
            return "error";
        }
    }

    private void saveConnection(User user, SpotifyApiClient.TokenResponse tokens,
                                String spotifyUserId, String displayName) {
        Platform platform = platformRepository.findByName(PLATFORM)
                .orElseThrow(() -> new IllegalStateException("'spotify' row missing in platforms table"));

        ConnectedAccount account = accountRepository.findByUserIdAndPlatformName(user.getId(), PLATFORM)
                .orElseGet(() -> ConnectedAccount.builder().user(user).platform(platform).build());

        if (spotifyUserId != null) {
            account.setPlatformUserId(spotifyUserId);
        }
        if (displayName != null) {
            account.setPlatformUsername(displayName);
        }
        applyTokens(account, tokens);
        account.setActive(true);
        accountRepository.save(account);
    }

    private void applyTokens(ConnectedAccount account, SpotifyApiClient.TokenResponse tokens) {
        account.setAccessToken(crypto.encrypt(tokens.accessToken()));
        if (tokens.refreshToken() != null) {
            account.setRefreshToken(crypto.encrypt(tokens.refreshToken()));
        }
        account.setTokenExpiresAt(LocalDateTime.now().plusSeconds(tokens.expiresIn()));
        account.setScope(tokens.scope());
    }

    // ───────────────────────── status / disconnect ─────────────────────────

    public StatusResponse getStatus(User user) {
        boolean configured = config.isConfigured();
        Optional<ConnectedAccount> account = findActiveAccount(user);
        return new StatusResponse(
                configured,
                account.isPresent(),
                account.map(ConnectedAccount::getPlatformUsername).orElse(null),
                account.map(ConnectedAccount::getPlatformUserId).orElse(null),
                account.map(ConnectedAccount::getConnectedAt).orElse(null),
                account.map(this::hasWriteScope).orElse(false));
    }

    /** A valid Spotify access token for the user (refreshed if needed). Used by the YouTube -> Spotify transfer. */
    public String accessToken(User user) {
        return accessTokenForUser(user.getId());
    }

    /** Same, by user id: for background threads that have no User object. */
    public String accessTokenForUser(Long userId) {
        requireConfigured();
        ConnectedAccount account = accountRepository.findByUserIdAndPlatformName(userId, PLATFORM)
                .filter(a -> a.isActive() && a.getAccessToken() != null)
                .orElseThrow(() -> new SpotifyApiException(Reason.NOT_CONNECTED,
                        "Spotify is not connected. Connect your account first."));
        return validAccessToken(account);
    }

    /** Throws unless the stored Spotify connection was granted permission to create playlists. */
    public void requireWriteAccess(User user) {
        requireConfigured();
        ConnectedAccount account = requireAccount(user);
        if (!hasWriteScope(account)) {
            throw new SpotifyApiException(Reason.REAUTH_REQUIRED,
                    "Your Spotify connection can only read playlists. Reconnect Spotify (Connections page) "
                            + "to allow YouListen to create playlists.");
        }
    }

    private boolean hasWriteScope(ConnectedAccount account) {
        return account.getScope() != null && account.getScope().contains("playlist-modify");
    }

    public void disconnect(User user) {
        accountRepository.findByUserIdAndPlatformName(user.getId(), PLATFORM)
                .ifPresent(accountRepository::delete);
    }

    // ───────────────────────── playlists ─────────────────────────

    public List<PlaylistSummary> listPlaylists(User user) {
        requireConfigured();
        ConnectedAccount account = requireAccount(user);
        String token = validAccessToken(account);

        Map<String, Long> imported = new HashMap<>();
        for (Playlist p : playlistRepository.findByUserIdAndSourcePlatform(user.getId(), PLATFORM)) {
            if (p.getSourcePlaylistId() != null) {
                imported.put(p.getSourcePlaylistId(), p.getId());
            }
        }

        String me = account.getPlatformUserId();
        List<PlaylistSummary> result = new ArrayList<>();
        for (JsonNode node : apiClient.getAllPlaylists(token)) {
            String id = text(node, "id");
            if (id == null) {
                continue;
            }
            String ownerId = text(node.path("owner"), "id");
            String ownerName = text(node.path("owner"), "display_name");
            boolean collaborative = node.path("collaborative").asBoolean(false);
            // Spotify only returns tracks for playlists the user owns or collaborates on.
            // If we don't know the user's Spotify id yet, let Spotify decide.
            boolean importable = collaborative || me == null || me.equals(ownerId);

            int trackCount = node.path("items").path("total")
                    .asInt(node.path("tracks").path("total").asInt(0));

            Long importedId = imported.get(id);
            result.add(new PlaylistSummary(
                    id,
                    text(node, "name") == null ? "Untitled playlist" : text(node, "name"),
                    text(node, "description"),
                    pickImage(node.path("images")),
                    trackCount,
                    ownerName != null ? ownerName : ownerId,
                    importable,
                    importedId != null,
                    importedId));
        }
        return result;
    }

    public ImportResult importPlaylist(User user, String spotifyPlaylistId) {
        requireConfigured();
        if (spotifyPlaylistId == null || !PLAYLIST_ID.matcher(spotifyPlaylistId).matches()) {
            throw new BadRequestException("Invalid Spotify playlist id");
        }

        Optional<Playlist> existing = playlistRepository
                .findFirstByUserIdAndSourcePlatformAndSourcePlaylistId(user.getId(), PLATFORM, spotifyPlaylistId);
        if (existing.isPresent()) {
            Playlist p = existing.get();
            return new ImportResult(p.getId(), p.getName(), p.getTrackCount(), 0, true);
        }

        ConnectedAccount account = requireAccount(user);
        String token = validAccessToken(account);

        JsonNode meta = apiClient.getPlaylistMeta(token, spotifyPlaylistId);
        if (meta == null || meta.isNull()) {
            throw new SpotifyApiException(Reason.UPSTREAM_ERROR, "Spotify returned no data for this playlist.");
        }
        List<JsonNode> entries;
        try {
            entries = apiClient.getPlaylistItems(token, spotifyPlaylistId);
        } catch (SpotifyApiException e) {
            if (e.getReason() == Reason.FORBIDDEN) {
                throw new SpotifyApiException(Reason.FORBIDDEN,
                        "Spotify denied access to this playlist's tracks. In Development Mode, apps can only "
                                + "read playlists you own or collaborate on, and the app owner needs active Premium.");
            }
            throw e;
        }

        // Keep only real, matchable tracks (skip podcasts, local files, removed items)
        List<JsonNode> tracks = new ArrayList<>();
        int skippedUpfront = 0;
        for (JsonNode entry : entries) {
            JsonNode track = SpotifyApiClient.extractTrack(entry);
            boolean usable = track != null
                    && "track".equals(track.path("type").asText("track"))
                    && !track.path("is_local").asBoolean(false)
                    && text(track, "id") != null;
            if (usable) {
                tracks.add(track);
            } else {
                skippedUpfront++;
            }
        }

        final int skippedBase = skippedUpfront;
        final String name = trunc(text(meta, "name") == null ? "Spotify playlist" : text(meta, "name"), 500);
        final String description = text(meta, "description");
        final String cover = trunc(pickImage(meta.path("images")), 1000);

        return transactionTemplate.execute(status -> {
            Playlist playlist = playlistRepository.save(Playlist.builder()
                    .user(user)
                    .name(name)
                    .description(description)
                    .sourcePlatform(PLATFORM)
                    .sourcePlaylistId(spotifyPlaylistId)
                    .coverImageUrl(cover)
                    .isPublic(false)
                    .importSource("spotify_oauth")
                    .build());

            Set<Long> seenSongs = new HashSet<>();
            int position = 0;
            int skipped = skippedBase;
            long totalDuration = 0;

            for (JsonNode track : tracks) {
                String spotifyTrackId = text(track, "id");
                Song song = songRepository.findBySpotifyId(spotifyTrackId)
                        .orElseGet(() -> songRepository.save(buildSong(track, spotifyTrackId)));

                // playlist_tracks has UNIQUE(playlist_id, song_id)
                if (!seenSongs.add(song.getId())) {
                    skipped++;
                    continue;
                }
                playlistTrackRepository.save(PlaylistTrack.builder()
                        .playlist(playlist)
                        .song(song)
                        .position(position++)
                        .build());
                totalDuration += song.getDurationMs() == null ? 0 : song.getDurationMs();
            }

            playlist.setTrackCount(position);
            playlist.setTotalDurationMs(totalDuration);
            playlistRepository.save(playlist);

            return new ImportResult(playlist.getId(), playlist.getName(), position, skipped, false);
        });
    }

    // ───────────────────────── helpers ─────────────────────────

    private void requireConfigured() {
        if (!config.isConfigured()) {
            throw new SpotifyApiException(Reason.NOT_CONFIGURED,
                    "Spotify is not configured on this server (missing SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET "
                            + "or SPOTIFY_TOKEN_ENCRYPTION_KEY).");
        }
    }

    private Optional<ConnectedAccount> findActiveAccount(User user) {
        return accountRepository.findByUserIdAndPlatformName(user.getId(), PLATFORM)
                .filter(a -> a.isActive() && a.getAccessToken() != null);
    }

    private ConnectedAccount requireAccount(User user) {
        return findActiveAccount(user).orElseThrow(() ->
                new SpotifyApiException(Reason.NOT_CONNECTED, "Spotify is not connected. Connect your account first."));
    }

    /** Returns a decrypted access token, refreshing it first when it is about to expire. */
    private String validAccessToken(ConnectedAccount account) {
        LocalDateTime expiresAt = account.getTokenExpiresAt();
        boolean needsRefresh = expiresAt == null || expiresAt.isBefore(LocalDateTime.now().plusSeconds(60));

        if (!needsRefresh) {
            return crypto.decrypt(account.getAccessToken());
        }
        if (account.getRefreshToken() == null) {
            throw new SpotifyApiException(Reason.REAUTH_REQUIRED, "Please reconnect Spotify.");
        }
        try {
            SpotifyApiClient.TokenResponse tokens = apiClient.refresh(crypto.decrypt(account.getRefreshToken()));
            applyTokens(account, tokens);
            accountRepository.save(account);
            return tokens.accessToken();
        } catch (SpotifyApiException e) {
            if (e.getReason() == Reason.REAUTH_REQUIRED) {
                accountRepository.delete(account);   // dead tokens are useless; user reconnects from the UI
            }
            throw e;
        }
    }

    private Song buildSong(JsonNode t, String spotifyId) {
        List<String> artists = new ArrayList<>();
        t.path("artists").forEach(a -> {
            String n = text(a, "name");
            if (n != null) {
                artists.add(n);
            }
        });
        return Song.builder()
                .title(trunc(text(t, "name") == null ? "Untitled" : text(t, "name"), 500))
                .artist(trunc(String.join(", ", artists), 500))
                .album(trunc(text(t.path("album"), "name"), 500))
                .durationMs(t.hasNonNull("duration_ms") ? t.get("duration_ms").asLong() : null)
                .isrc(trunc(text(t.path("external_ids"), "isrc"), 20))   // may be absent: handled as null
                .spotifyId(spotifyId)
                .thumbnailUrl(trunc(pickImage(t.path("album").path("images")), 1000))
                .build();
    }

    /** Spotify lists images largest first; the second one (~300px) is plenty for cards. */
    private static String pickImage(JsonNode images) {
        if (images == null || !images.isArray() || images.isEmpty()) {
            return null;
        }
        JsonNode chosen = images.get(Math.min(1, images.size() - 1));
        return text(chosen, "url");
    }

    private static String text(JsonNode node, String field) {
        if (node == null || node.isMissingNode() || !node.hasNonNull(field)) {
            return null;
        }
        String v = node.get(field).asText();
        return v.isBlank() ? null : v;
    }

    private static String trunc(String s, int max) {
        if (s == null) {
            return null;
        }
        return s.length() <= max ? s : s.substring(0, max);
    }
}
