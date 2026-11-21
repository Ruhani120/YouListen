package com.youlisten.reverse;

import com.youlisten.exception.ResourceNotFoundException;
import com.youlisten.playlist.Playlist;
import com.youlisten.playlist.PlaylistRepository;
import com.youlisten.playlist.PlaylistTrackRepository;
import com.youlisten.reverse.SpotifyMatchRunRegistry.RunState;
import com.youlisten.reverse.dto.ReverseDtos.SpotifyCandidateDto;
import com.youlisten.reverse.dto.ReverseDtos.SpotifyOverview;
import com.youlisten.reverse.dto.ReverseDtos.SpotifyTrackMatchDto;
import com.youlisten.song.PlaylistTrack;
import com.youlisten.song.Song;
import com.youlisten.spotify.SpotifyService;
import com.youlisten.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/** Review screen data for the YouTube -> Spotify direction. */
@Service
@RequiredArgsConstructor
public class SpotifyMatchingService {

    private final PlaylistRepository playlistRepository;
    private final PlaylistTrackRepository playlistTrackRepository;
    private final SpotifyMatchRepository matchRepository;
    private final SpotifyMatchRunRegistry registry;
    private final SpotifyMatchingRunner runner;
    private final SpotifyService spotifyService;

    public SpotifyOverview overview(User user, Long playlistId) {
        Playlist playlist = ownedPlaylist(user, playlistId);
        List<PlaylistTrack> tracks = playlistTrackRepository.findWithSongByPlaylistId(playlistId);
        Map<Long, List<SpotifyMatch>> byTrack = matchesByTrack(tracks);

        List<SpotifyTrackMatchDto> dtos = new ArrayList<>();
        int pending = 0, confirmed = 0, review = 0, unmatched = 0;
        for (PlaylistTrack pt : tracks) {
            SpotifyTrackMatchDto dto = toDto(pt, byTrack.get(pt.getId()));
            switch (dto.status()) {
                case "CONFIRMED" -> confirmed++;
                case "REVIEW" -> review++;
                case "UNMATCHED" -> unmatched++;
                default -> pending++;
            }
            dtos.add(dto);
        }

        RunState run = registry.get(playlistId);
        return new SpotifyOverview(
                playlist.getId(), playlist.getName(), tracks.size(),
                pending, confirmed, review, unmatched,
                run != null && run.running,
                run == null ? 0 : run.processed.get(),
                run == null ? 0 : run.total,
                run == null ? null : run.error,
                dtos);
    }

    /** Starts matching in the background. Fails early (with a clear message) if Spotify is not connected. */
    public SpotifyOverview startRun(User user, Long playlistId, boolean retryUnmatched) {
        ownedPlaylist(user, playlistId);
        spotifyService.accessToken(user);       // throws NOT_CONNECTED / NOT_CONFIGURED / REAUTH_REQUIRED
        if (registry.tryStart(playlistId) != null) {
            runner.run(user.getId(), playlistId, retryUnmatched);
        }
        return overview(user, playlistId);
    }

    public SpotifyOverview select(User user, Long matchId) {
        SpotifyMatch match = matchRepository.findById(matchId)
                .orElseThrow(() -> new ResourceNotFoundException("SpotifyMatch", "id", matchId));
        Long trackId = match.getPlaylistTrackId();
        ensureOwnsTrack(user, trackId);
        if (match.getSpotifyTrackId() == null) {
            throw new com.youlisten.exception.BadRequestException("This entry has no Spotify track to select.");
        }
        List<SpotifyMatch> rows = matchRepository.findByPlaylistTrackId(trackId);
        for (SpotifyMatch r : rows) {
            boolean chosen = r.getId().equals(match.getId());
            r.setSelected(chosen);
            r.setConfirmed(chosen);
        }
        matchRepository.saveAll(rows);
        return overview(user, playlistIdOf(trackId));
    }

    public SpotifyOverview confirmAll(User user, Long playlistId) {
        ownedPlaylist(user, playlistId);
        List<PlaylistTrack> tracks = playlistTrackRepository.findWithSongByPlaylistId(playlistId);
        List<SpotifyMatch> toSave = new ArrayList<>();
        for (List<SpotifyMatch> rows : matchesByTrack(tracks).values()) {
            for (SpotifyMatch r : rows) {
                if (r.isSelected() && !r.isConfirmed()) {
                    r.setConfirmed(true);
                    toSave.add(r);
                }
            }
        }
        matchRepository.saveAll(toSave);
        return overview(user, playlistId);
    }

    public SpotifyOverview skipTrack(User user, Long playlistTrackId) {
        ensureOwnsTrack(user, playlistTrackId);
        List<SpotifyMatch> rows = matchRepository.findByPlaylistTrackId(playlistTrackId);
        for (SpotifyMatch r : rows) {
            r.setSelected(false);
            r.setConfirmed(false);
        }
        matchRepository.saveAll(rows);
        return overview(user, playlistIdOf(playlistTrackId));
    }

    // ───────────────────────── helpers ─────────────────────────

    private Playlist ownedPlaylist(User user, Long playlistId) {
        return playlistRepository.findByIdAndUserId(playlistId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Playlist", "id", playlistId));
    }

    private void ensureOwnsTrack(User user, Long playlistTrackId) {
        if (!playlistTrackRepository.existsByIdAndPlaylistUserId(playlistTrackId, user.getId())) {
            throw new ResourceNotFoundException("PlaylistTrack", "id", playlistTrackId);
        }
    }

    private Long playlistIdOf(Long playlistTrackId) {
        return playlistTrackRepository.findPlaylistIdById(playlistTrackId)
                .orElseThrow(() -> new ResourceNotFoundException("PlaylistTrack", "id", playlistTrackId));
    }

    private Map<Long, List<SpotifyMatch>> matchesByTrack(List<PlaylistTrack> tracks) {
        Map<Long, List<SpotifyMatch>> map = new HashMap<>();
        if (tracks.isEmpty()) {
            return map;
        }
        List<Long> ids = tracks.stream().map(PlaylistTrack::getId).collect(Collectors.toList());
        for (SpotifyMatch m : matchRepository.findByPlaylistTrackIdIn(ids)) {
            map.computeIfAbsent(m.getPlaylistTrackId(), k -> new ArrayList<>()).add(m);
        }
        return map;
    }

    private SpotifyTrackMatchDto toDto(PlaylistTrack pt, List<SpotifyMatch> rows) {
        Song song = pt.getSong();
        List<SpotifyCandidateDto> candidates = new ArrayList<>();
        String status = "PENDING";

        if (rows != null && !rows.isEmpty()) {
            status = "UNMATCHED";
            for (SpotifyMatch r : rows) {
                if (r.getSpotifyTrackId() == null) {
                    continue;   // "no result" placeholder
                }
                candidates.add(new SpotifyCandidateDto(
                        r.getId(), r.getSpotifyTrackId(), r.getTitle(), r.getArtist(), r.getAlbum(),
                        r.getDurationMs(), r.getCoverUrl(),
                        r.getConfidenceScore() == null ? 0 : r.getConfidenceScore().doubleValue(),
                        r.isSelected(), r.isConfirmed()));
                if (r.isSelected()) {
                    status = r.isConfirmed() ? "CONFIRMED" : "REVIEW";
                }
            }
            candidates.sort(Comparator.comparingDouble(SpotifyCandidateDto::confidence).reversed());
        }
        return new SpotifyTrackMatchDto(
                pt.getId(),
                pt.getPosition() == null ? 0 : pt.getPosition() + 1,
                song.getTitle(), song.getArtist(), song.getDurationMs(),
                status, candidates);
    }
}
