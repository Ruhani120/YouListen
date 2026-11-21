package com.youlisten.matching;

import com.youlisten.config.GoogleConfig;
import com.youlisten.exception.BadRequestException;
import com.youlisten.exception.GoogleApiException;
import com.youlisten.exception.GoogleApiException.Reason;
import com.youlisten.exception.ResourceNotFoundException;
import com.youlisten.google.YouTubeApiClient;
import com.youlisten.google.YouTubeUrls;
import com.youlisten.google.GoogleService;
import com.youlisten.matching.MatchRunRegistry.RunState;
import com.youlisten.matching.MatchScorer.Preference;
import com.youlisten.matching.dto.MatchingDtos.CandidateDto;
import com.youlisten.matching.dto.MatchingDtos.Overview;
import com.youlisten.matching.dto.MatchingDtos.TrackMatchDto;
import com.youlisten.playlist.Playlist;
import com.youlisten.playlist.PlaylistRepository;
import com.youlisten.playlist.PlaylistTrackRepository;
import com.youlisten.song.PlaylistTrack;
import com.youlisten.song.Song;
import com.youlisten.song.SongRepository;
import com.youlisten.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MatchingService {

    /** search.list (100) + videos.list (1) */
    private static final int QUOTA_PER_TRACK = 101;

    private final PlaylistRepository playlistRepository;
    private final PlaylistTrackRepository playlistTrackRepository;
    private final SongMatchRepository matchRepository;
    private final SongRepository songRepository;
    private final GoogleService googleService;
    private final GoogleConfig googleConfig;
    private final MatchRunRegistry registry;
    private final MatchingRunner runner;
    private final TrackMatcher trackMatcher;
    private final YouTubeApiClient youTube;

    // ───────────────────────── read ─────────────────────────

    public Overview overview(User user, Long playlistId) {
        Playlist playlist = ownedPlaylist(user, playlistId);
        List<PlaylistTrack> tracks = playlistTrackRepository.findWithSongByPlaylistId(playlistId);
        Map<Long, List<SongMatch>> byTrack = matchesByTrack(tracks);

        String preferenceName = storedPreference(byTrack);
        Preference scoredWith = preferenceName == null ? Preference.VIDEO : Preference.valueOf(preferenceName);

        List<TrackMatchDto> dtos = new ArrayList<>();
        int pending = 0, confirmed = 0, review = 0, unmatched = 0;
        for (PlaylistTrack pt : tracks) {
            TrackMatchDto dto = toDto(pt, byTrack.get(pt.getId()), scoredWith);
            switch (dto.status()) {
                case "CONFIRMED" -> confirmed++;
                case "REVIEW" -> review++;
                case "UNMATCHED" -> unmatched++;
                default -> pending++;
            }
            dtos.add(dto);
        }

        RunState run = registry.get(playlistId);
        boolean running = run != null && run.running;
        String preference = preferenceName;
        return new Overview(
                playlist.getId(),
                playlist.getName(),
                tracks.size(),
                pending, confirmed, review, unmatched,
                running,
                run == null ? 0 : run.processed.get(),
                run == null ? 0 : run.total,
                run == null ? null : run.error,
                preference,
                pending * QUOTA_PER_TRACK,
                searchMode(user.getId()),
                dtos);
    }

    // ───────────────────────── actions ─────────────────────────

    /** Starts matching in the background and returns the current overview. */
    public Overview startRun(User user, Long playlistId, boolean retryUnmatched, Preference preference) {
        ownedPlaylist(user, playlistId);
        if ("none".equals(searchMode(user.getId()))) {
            throw new GoogleApiException(Reason.NOT_CONNECTED,
                    "Connect your Google account first (or set YOUTUBE_API_KEY on the server) so YouListen can search YouTube.");
        }
        if (registry.tryStart(playlistId) != null) {
            runner.run(user.getId(), playlistId, retryUnmatched, preference);
        }
        return overview(user, playlistId);
    }

    /** Use this candidate for the track and mark it confirmed. */
    public Overview select(User user, Long matchId) {
        SongMatch match = matchRepository.findById(matchId)
                .orElseThrow(() -> new ResourceNotFoundException("SongMatch", "id", matchId));
        Long trackId = match.getPlaylistTrackId();
        ensureOwnsTrack(user, trackId);
        if (match.getCandidateYoutubeId() == null) {
            throw new BadRequestException("This entry has no video to select.");
        }

        List<SongMatch> rows = matchRepository.findByPlaylistTrackId(trackId);
        for (SongMatch r : rows) {
            boolean chosen = r.getId().equals(match.getId());
            r.setSelected(chosen);
            r.setConfirmed(chosen);
            if (chosen) {
                r.setMatchMethod("manual");     // the user decided: re-ranking by preference leaves this track alone
            }
        }
        matchRepository.saveAll(rows);

        playlistTrackRepository.findSongIdById(trackId)
                .flatMap(songRepository::findById)
                .ifPresent(song -> {
                    song.setYoutubeId(match.getCandidateYoutubeId());
                    songRepository.save(song);
                });

        Long playlistId = playlistTrackRepository.findPlaylistIdById(trackId)
                .orElseThrow(() -> new ResourceNotFoundException("PlaylistTrack", "id", trackId));
        return overview(user, playlistId);
    }

    /** Approve every suggested (selected but not yet confirmed) match in the playlist. */
    public Overview confirmAll(User user, Long playlistId) {
        ownedPlaylist(user, playlistId);
        List<PlaylistTrack> tracks = playlistTrackRepository.findWithSongByPlaylistId(playlistId);
        List<SongMatch> toSave = new ArrayList<>();
        for (List<SongMatch> rows : matchesByTrack(tracks).values()) {
            for (SongMatch r : rows) {
                if (r.isSelected() && !r.isConfirmed()) {
                    r.setConfirmed(true);
                    toSave.add(r);
                }
            }
        }
        matchRepository.saveAll(toSave);
        return overview(user, playlistId);
    }

    /** "Do not transfer this track": removes the selection, keeps the candidates visible. */
    public Overview skipTrack(User user, Long playlistTrackId) {
        ensureOwnsTrack(user, playlistTrackId);
        List<SongMatch> rows = matchRepository.findByPlaylistTrackId(playlistTrackId);
        for (SongMatch r : rows) {
            r.setSelected(false);
            r.setConfirmed(false);
        }
        matchRepository.saveAll(rows);
        Long playlistId = playlistTrackRepository.findPlaylistIdById(playlistTrackId)
                .orElseThrow(() -> new ResourceNotFoundException("PlaylistTrack", "id", playlistTrackId));
        return overview(user, playlistId);
    }

    /** Throws away the stored candidates for one track and searches again (costs about 101 quota units). */
    public TrackMatchDto rematch(User user, Long playlistTrackId, Preference preference) {
        ensureOwnsTrack(user, playlistTrackId);
        PlaylistTrack pt = playlistTrackRepository.findWithSongById(playlistTrackId)
                .orElseThrow(() -> new ResourceNotFoundException("PlaylistTrack", "id", playlistTrackId));
        if ("none".equals(searchMode(user.getId()))) {
            throw new GoogleApiException(Reason.NOT_CONNECTED,
                    "Connect your Google account first (or set YOUTUBE_API_KEY on the server).");
        }
        matchRepository.deleteAllForTrack(playlistTrackId);
        String token = googleConfig.hasApiKey() ? null : googleService.accessTokenOrNull(user.getId());
        trackMatcher.matchTrack(pt, token, preference);
        return toDto(pt, matchRepository.findByPlaylistTrackId(playlistTrackId), preference == null ? Preference.VIDEO : preference);
    }

    /**
     * The user pastes a YouTube link for a track (when the right video never showed up in the search).
     * Costs 1 quota unit. The video is selected and confirmed, and re-ranking leaves this track alone afterwards.
     */
    public Overview manualMatch(User user, Long playlistTrackId, String url, Preference preference) {
        ensureOwnsTrack(user, playlistTrackId);
        String videoId = YouTubeUrls.extractVideoId(url);
        if (videoId == null) {
            throw new BadRequestException("That doesn't look like a YouTube link. Paste the video's address, e.g. https://www.youtube.com/watch?v=...");
        }
        if ("none".equals(searchMode(user.getId()))) {
            throw new GoogleApiException(Reason.NOT_CONNECTED,
                    "Connect your Google account first (or set YOUTUBE_API_KEY on the server).");
        }
        String token = googleConfig.hasApiKey() ? null : googleService.accessTokenOrNull(user.getId());
        MatchScorer.Candidate video = youTube.getVideoDetails(videoId, token);
        if (video == null) {
            throw new BadRequestException("YouTube has no video with that link (it may be private or deleted).");
        }

        PlaylistTrack pt = playlistTrackRepository.findWithSongById(playlistTrackId)
                .orElseThrow(() -> new ResourceNotFoundException("PlaylistTrack", "id", playlistTrackId));
        Song song = pt.getSong();
        Preference pref = preference == null ? Preference.VIDEO : preference;

        List<SongMatch> rows = new ArrayList<>(matchRepository.findByPlaylistTrackId(playlistTrackId));
        SongMatch chosen = rows.stream().filter(r -> videoId.equals(r.getCandidateYoutubeId())).findFirst().orElse(null);
        if (chosen == null) {
            chosen = SongMatch.builder().playlistTrackId(playlistTrackId).candidateYoutubeId(videoId).build();
            rows.add(chosen);
        }
        chosen.setCandidateTitle(video.title() == null ? null : video.title().substring(0, Math.min(500, video.title().length())));
        chosen.setCandidateChannel(video.channel() == null ? null : video.channel().substring(0, Math.min(500, video.channel().length())));
        chosen.setCandidateDurationMs(video.durationMs());
        chosen.setConfidenceScore(BigDecimal.valueOf(MatchScorer.score(
                song.getTitle(), song.getArtist(), song.getAlbum(), song.getDurationMs(), video, pref).total()));

        for (SongMatch r : rows) {
            boolean isChosen = r == chosen;
            r.setSelected(isChosen);
            r.setConfirmed(isChosen);
            if (isChosen) {
                r.setMatchMethod("manual");
            }
        }
        matchRepository.saveAll(rows);

        song.setYoutubeId(videoId);
        songRepository.save(song);

        Long playlistId = playlistTrackRepository.findPlaylistIdById(playlistTrackId)
                .orElseThrow(() -> new ResourceNotFoundException("PlaylistTrack", "id", playlistTrackId));
        return overview(user, playlistId);
    }

    /**
     * Re-ranks the stored candidates of every track for a different preference. Free: no YouTube calls.
     * Tracks the user decided by hand (or that reuse an earlier confirmed match) are left alone.
     */
    public Overview rescore(User user, Long playlistId, Preference preference) {
        ownedPlaylist(user, playlistId);
        List<PlaylistTrack> tracks = playlistTrackRepository.findWithSongByPlaylistId(playlistId);
        Map<Long, List<SongMatch>> byTrack = matchesByTrack(tracks);

        List<SongMatch> toSave = new ArrayList<>();
        for (PlaylistTrack pt : tracks) {
            List<SongMatch> rows = byTrack.get(pt.getId());
            if (rows == null || rows.isEmpty()) {
                continue;
            }
            boolean decided = rows.stream().anyMatch(r -> "manual".equals(r.getMatchMethod()) || "cache".equals(r.getMatchMethod()));
            if (decided) {
                continue;
            }
            trackMatcher.rescore(pt.getSong(), rows, preference);
            toSave.addAll(rows);
        }
        matchRepository.saveAll(toSave);
        return overview(user, playlistId);
    }

    // ───────────────────────── helpers ─────────────────────────

    /** The preference the stored scores were last computed with (stored in match_method, e.g. "metadata_v2:AUDIO"), or null. */
    private static String storedPreference(Map<Long, List<SongMatch>> byTrack) {
        for (List<SongMatch> rows : byTrack.values()) {
            for (SongMatch r : rows) {
                String method = r.getMatchMethod();
                if (method != null && method.startsWith(MatchScorer.METHOD + ":")) {
                    return method.substring(MatchScorer.METHOD.length() + 1);
                }
            }
        }
        return null;     // scored by an older version: the UI then offers a free re-rank
    }

    private Playlist ownedPlaylist(User user, Long playlistId) {
        return playlistRepository.findByIdAndUserId(playlistId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Playlist", "id", playlistId));
    }

    private void ensureOwnsTrack(User user, Long playlistTrackId) {
        if (!playlistTrackRepository.existsByIdAndPlaylistUserId(playlistTrackId, user.getId())) {
            throw new ResourceNotFoundException("PlaylistTrack", "id", playlistTrackId);
        }
    }

    private String searchMode(Long userId) {
        if (googleConfig.hasApiKey()) {
            return "api_key";
        }
        return googleService.isConnected(userId) ? "account" : "none";
    }

    private Map<Long, List<SongMatch>> matchesByTrack(List<PlaylistTrack> tracks) {
        List<Long> ids = tracks.stream().map(PlaylistTrack::getId).collect(Collectors.toList());
        Map<Long, List<SongMatch>> map = new HashMap<>();
        if (ids.isEmpty()) {
            return map;
        }
        for (SongMatch m : matchRepository.findByPlaylistTrackIdIn(ids)) {
            map.computeIfAbsent(m.getPlaylistTrackId(), k -> new ArrayList<>()).add(m);
        }
        return map;
    }

    private TrackMatchDto toDto(PlaylistTrack pt, List<SongMatch> rows, Preference pref) {
        Song song = pt.getSong();
        List<CandidateDto> candidates = new ArrayList<>();
        String status = "PENDING";

        if (rows != null && !rows.isEmpty()) {
            status = "UNMATCHED";
            for (SongMatch r : rows) {
                if (r.getCandidateYoutubeId() == null) {
                    continue;   // "no result" placeholder
                }
                var scored = MatchScorer.score(song.getTitle(), song.getArtist(), song.getAlbum(), song.getDurationMs(),
                        new MatchScorer.Candidate(r.getCandidateYoutubeId(), r.getCandidateTitle(),
                                r.getCandidateChannel(), r.getCandidateDurationMs()), pref);
                candidates.add(new CandidateDto(
                        r.getId(),
                        r.getCandidateYoutubeId(),
                        r.getCandidateTitle(),
                        r.getCandidateChannel(),
                        r.getCandidateDurationMs(),
                        r.getConfidenceScore() == null ? 0 : r.getConfidenceScore().doubleValue(),
                        MatchScorer.classify(r.getCandidateTitle(), r.getCandidateChannel(), song.getTitle()).name(),
                        MatchScorer.describe(scored),
                        r.isSelected(),
                        r.isConfirmed(),
                        r.getMatchMethod()));
                if (r.isSelected()) {
                    status = r.isConfirmed() ? "CONFIRMED" : "REVIEW";
                }
            }
            candidates.sort(Comparator.comparingDouble(CandidateDto::confidence).reversed());
        }

        return new TrackMatchDto(
                pt.getId(),
                pt.getPosition() == null ? 0 : pt.getPosition() + 1,
                song.getTitle(),
                song.getArtist(),
                song.getAlbum(),
                song.getDurationMs(),
                song.getIsrc(),
                status,
                candidates);
    }
}
