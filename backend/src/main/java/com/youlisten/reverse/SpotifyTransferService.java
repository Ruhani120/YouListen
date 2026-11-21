package com.youlisten.reverse;

import com.youlisten.exception.BadRequestException;
import com.youlisten.exception.ResourceNotFoundException;
import com.youlisten.exception.SpotifyApiException;
import com.youlisten.notification.Notification;
import com.youlisten.notification.NotificationRepository;
import com.youlisten.playlist.Playlist;
import com.youlisten.playlist.PlaylistRepository;
import com.youlisten.playlist.PlaylistTrackRepository;
import com.youlisten.reverse.dto.ReverseDtos.SpotifyTransferRequest;
import com.youlisten.reverse.dto.ReverseDtos.SpotifyTransferResult;
import com.youlisten.song.PlaylistTrack;
import com.youlisten.spotify.SpotifyApiClient;
import com.youlisten.spotify.SpotifyService;
import com.youlisten.transfer.TransferJob;
import com.youlisten.transfer.TransferJobRepository;
import com.youlisten.user.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Creates the Spotify playlist from the confirmed matches. Spotify takes 100 tracks per call and has no daily
 * quota like YouTube, so this runs in the request instead of a background job, and is recorded in transfer history.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SpotifyTransferService {

    private static final int BATCH = 100;

    private final PlaylistRepository playlistRepository;
    private final PlaylistTrackRepository playlistTrackRepository;
    private final SpotifyMatchRepository matchRepository;
    private final SpotifyService spotifyService;
    private final SpotifyApiClient spotifyClient;
    private final TransferJobRepository jobRepository;
    private final NotificationRepository notificationRepository;

    public SpotifyTransferResult create(User user, SpotifyTransferRequest request) {
        Playlist playlist = playlistRepository.findByIdAndUserId(request.playlistId(), user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Playlist", "id", request.playlistId()));

        spotifyService.requireWriteAccess(user);

        List<PlaylistTrack> tracks = playlistTrackRepository.findWithSongByPlaylistId(playlist.getId());
        Map<Long, List<SpotifyMatch>> byTrack = new HashMap<>();
        if (!tracks.isEmpty()) {
            for (SpotifyMatch m : matchRepository.findByPlaylistTrackIdIn(
                    tracks.stream().map(PlaylistTrack::getId).collect(Collectors.toList()))) {
                byTrack.computeIfAbsent(m.getPlaylistTrackId(), k -> new ArrayList<>()).add(m);
            }
        }

        // confirmed matches, in playlist order, without duplicate URIs
        Set<String> uris = new LinkedHashSet<>();
        for (PlaylistTrack pt : tracks) {
            List<SpotifyMatch> rows = byTrack.get(pt.getId());
            if (rows == null) {
                continue;
            }
            rows.stream().filter(r -> r.isSelected() && r.isConfirmed() && r.getSpotifyUri() != null)
                    .findFirst().ifPresent(r -> uris.add(r.getSpotifyUri()));
        }
        if (uris.isEmpty()) {
            throw new BadRequestException("No confirmed Spotify matches yet. Run matching and confirm some tracks first.");
        }

        String name = request.name() == null || request.name().isBlank()
                ? trunc(playlist.getName() + " (YouListen)", 100)
                : trunc(request.name().trim(), 100);

        String token = spotifyService.accessToken(user);
        LocalDateTime startedAt = LocalDateTime.now();
        String[] created = spotifyClient.createPlaylist(token, name, "Transferred with YouListen", request.makePublic());

        List<String> all = new ArrayList<>(uris);
        int added = 0;
        SpotifyApiException failure = null;
        try {
            for (int i = 0; i < all.size(); i += BATCH) {
                List<String> batch = all.subList(i, Math.min(i + BATCH, all.size()));
                spotifyClient.addItems(token, created[0], batch);
                added += batch.size();
            }
        } catch (SpotifyApiException e) {
            failure = e;
            log.warn("Adding tracks to Spotify playlist {} stopped after {} tracks: {}", created[0], added, e.getMessage());
        }

        boolean ok = failure == null;
        TransferJob job = jobRepository.save(TransferJob.builder()
                .user(user)
                .sourcePlaylist(playlist)
                .destinationPlatform("spotify")
                .destinationPlaylistId(created[0])
                .destinationPlaylistName(name)
                .destinationPrivacy(request.makePublic() ? "public" : "private")
                .totalTracks(tracks.size())
                .matchedTracks(all.size())
                .transferredTracks(added)
                .failedTracks(all.size() - added)
                .status(ok ? TransferJob.Status.COMPLETED : TransferJob.Status.FAILED)
                .errorMessage(ok ? null : failure.getMessage())
                .startedAt(startedAt)
                .completedAt(LocalDateTime.now())
                .build());

        try {
            notificationRepository.save(Notification.builder()
                    .user(user)
                    .type(ok ? Notification.Type.SUCCESS : Notification.Type.ERROR)
                    .title(ok ? "Spotify playlist created" : "Spotify transfer stopped")
                    .message(ok ? added + " tracks added to \"" + name + "\" on Spotify."
                            : "Only " + added + " of " + all.size() + " tracks were added to \"" + name + "\".")
                    .actionUrl("/app/transfers")
                    .build());
        } catch (RuntimeException e) {
            log.warn("Could not save notification: {}", e.getMessage());
        }

        if (!ok) {
            throw failure;
        }
        return new SpotifyTransferResult(job.getId(), created[0], created[1], name, added, tracks.size() - added);
    }

    private static String trunc(String s, int max) {
        return s == null || s.length() <= max ? s : s.substring(0, max);
    }
}
