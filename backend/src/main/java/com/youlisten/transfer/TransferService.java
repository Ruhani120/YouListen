package com.youlisten.transfer;

import com.youlisten.exception.BadRequestException;
import com.youlisten.exception.ResourceNotFoundException;
import com.youlisten.google.GoogleService;
import com.youlisten.matching.SongMatch;
import com.youlisten.matching.SongMatchRepository;
import com.youlisten.playlist.Playlist;
import com.youlisten.playlist.PlaylistRepository;
import com.youlisten.playlist.PlaylistTrackRepository;
import com.youlisten.song.PlaylistTrack;
import com.youlisten.transfer.dto.TransferDtos.CreateRequest;
import com.youlisten.transfer.dto.TransferDtos.JobResponse;
import com.youlisten.transfer.dto.TransferDtos.TrackResponse;
import com.youlisten.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TransferService {

    private static final List<TransferJob.Status> ACTIVE = List.of(TransferJob.Status.PENDING, TransferJob.Status.IN_PROGRESS);

    private final TransferJobRepository jobRepository;
    private final TransferTrackRepository trackRepository;
    private final PlaylistRepository playlistRepository;
    private final PlaylistTrackRepository playlistTrackRepository;
    private final SongMatchRepository matchRepository;
    private final GoogleService googleService;
    private final TransferRunner runner;
    private final TransactionTemplate transactionTemplate;

    // ───────────────────────── create / control ─────────────────────────

    public JobResponse create(User user, CreateRequest request) {
        Playlist playlist = playlistRepository.findByIdAndUserId(request.playlistId(), user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Playlist", "id", request.playlistId()));

        ensureNoActiveJob(user);
        googleService.accessToken(user.getId());        // throws NOT_CONNECTED / REAUTH_REQUIRED early, with a clear message

        List<PlaylistTrack> tracks = playlistTrackRepository.findWithSongByPlaylistId(playlist.getId());
        if (tracks.isEmpty()) {
            throw new BadRequestException("This playlist has no tracks.");
        }

        Map<Long, List<SongMatch>> matches = new HashMap<>();
        for (SongMatch m : matchRepository.findByPlaylistTrackIdIn(
                tracks.stream().map(PlaylistTrack::getId).collect(Collectors.toList()))) {
            matches.computeIfAbsent(m.getPlaylistTrackId(), k -> new ArrayList<>()).add(m);
        }

        String privacy = normalizePrivacy(request.privacy());
        String title = request.destinationName() == null || request.destinationName().isBlank()
                ? trunc(playlist.getName() + " (YouListen)", 150)
                : trunc(request.destinationName().trim(), 150);

        Long jobId = transactionTemplate.execute(status -> {
            List<TransferTrack> rows = new ArrayList<>();
            int ready = 0;
            for (PlaylistTrack pt : tracks) {
                List<SongMatch> candidates = matches.get(pt.getId());
                SongMatch selected = candidates == null ? null
                        : candidates.stream().filter(SongMatch::isSelected).findFirst().orElse(null);

                TransferTrack.TransferTrackBuilder row = TransferTrack.builder().playlistTrack(pt);
                if (selected != null && selected.isConfirmed() && selected.getCandidateYoutubeId() != null) {
                    ready++;
                    row.status(TransferTrack.Status.MATCHED)
                            .youtubeVideoId(selected.getCandidateYoutubeId())
                            .youtubeVideoTitle(selected.getCandidateTitle())
                            .confidenceScore(selected.getConfidenceScore());
                } else {
                    String why = candidates == null ? "Not matched yet"
                            : selected != null ? "Match not confirmed"
                            : "No good match found";
                    row.status(TransferTrack.Status.SKIPPED).errorMessage(why);
                }
                rows.add(row.build());
            }
            if (ready == 0) {
                throw new BadRequestException("No confirmed matches yet. Run song matching and confirm some tracks first.");
            }

            TransferJob job = jobRepository.save(TransferJob.builder()
                    .user(user)
                    .sourcePlaylist(playlist)
                    .destinationPlatform("youtube")
                    .destinationPlaylistName(title)
                    .destinationPrivacy(privacy)
                    .totalTracks(tracks.size())
                    .matchedTracks(ready)
                    .build());
            rows.forEach(r -> r.setTransferJob(job));
            trackRepository.saveAll(rows);
            return job.getId();
        });

        runner.run(jobId);      // starts on a background thread, returns immediately
        return get(user, jobId);
    }

    /** Continue a job that stopped (quota used up, server restarted, ...). Only tracks not yet tried are sent. */
    public JobResponse resume(User user, Long jobId) {
        TransferJob job = jobRepository.findDetailedByIdAndUserId(jobId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("TransferJob", "id", jobId));
        if (job.getStatus() != TransferJob.Status.FAILED) {
            throw new BadRequestException("Only a stopped (failed) transfer can be resumed.");
        }
        if (trackRepository.findWorkItems(jobId, TransferTrack.Status.MATCHED).isEmpty()) {
            throw new BadRequestException("Nothing is left to transfer in this job.");
        }
        ensureNoActiveJob(user);
        googleService.accessToken(user.getId());

        if (jobRepository.transition(jobId, TransferJob.Status.FAILED, TransferJob.Status.PENDING, LocalDateTime.now()) == 0) {
            throw new BadRequestException("This transfer can no longer be resumed.");
        }
        runner.run(jobId);
        return get(user, jobId);
    }

    public JobResponse cancel(User user, Long jobId) {
        jobRepository.findByIdAndUserId(jobId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("TransferJob", "id", jobId));
        int changed = jobRepository.cancel(jobId, ACTIVE, TransferJob.Status.CANCELLED, LocalDateTime.now());
        if (changed == 0) {
            throw new BadRequestException("This transfer is not running.");
        }
        return get(user, jobId);
    }

    // ───────────────────────── read ─────────────────────────

    @Transactional(readOnly = true)
    public List<JobResponse> list(User user) {
        return jobRepository.findDetailedByUserId(user.getId()).stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public JobResponse get(User user, Long jobId) {
        return toResponse(jobRepository.findDetailedByIdAndUserId(jobId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("TransferJob", "id", jobId)));
    }

    @Transactional(readOnly = true)
    public List<TrackResponse> tracks(User user, Long jobId) {
        jobRepository.findByIdAndUserId(jobId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("TransferJob", "id", jobId));
        return trackRepository.findDetailedByJobId(jobId).stream().map(t -> new TrackResponse(
                t.getId(),
                t.getPlaylistTrack().getPosition() == null ? 0 : t.getPlaylistTrack().getPosition() + 1,
                t.getPlaylistTrack().getSong().getTitle(),
                t.getPlaylistTrack().getSong().getArtist(),
                t.getYoutubeVideoId(),
                t.getYoutubeVideoTitle(),
                t.getConfidenceScore() == null ? null : t.getConfidenceScore().doubleValue(),
                t.getStatus().name(),
                t.getErrorMessage())).toList();
    }

    // ───────────────────────── helpers ─────────────────────────

    private JobResponse toResponse(TransferJob j) {
        int ready = j.getMatchedTracks();
        int done = j.getTransferredTracks() + j.getFailedTracks();
        int percent = ready == 0 ? 0 : (int) Math.round(100.0 * done / ready);
        if (j.getStatus() == TransferJob.Status.COMPLETED) {
            percent = 100;
        }
        String destinationId = j.getDestinationPlaylistId();
        Long duration = null;
        if (j.getStartedAt() != null) {
            LocalDateTime end = j.getCompletedAt() != null ? j.getCompletedAt() : LocalDateTime.now();
            duration = Math.max(0, Duration.between(j.getStartedAt(), end).getSeconds());
        }
        return new JobResponse(
                j.getId(),
                j.getSourcePlaylist().getId(),
                j.getSourcePlaylist().getName(),
                j.getDestinationPlatform(),
                destinationId,
                j.getDestinationPlaylistName(),
                destinationId == null ? null
                        : "spotify".equals(j.getDestinationPlatform())
                                ? "https://open.spotify.com/playlist/" + destinationId
                                : "https://music.youtube.com/playlist?list=" + destinationId,
                j.getDestinationPrivacy(),
                j.getStatus().name(),
                j.getTotalTracks(),
                ready,
                Math.max(0, j.getTotalTracks() - ready),
                j.getTransferredTracks(),
                j.getFailedTracks(),
                Math.min(100, percent),
                j.getErrorMessage(),
                duration,
                j.getStartedAt(),
                j.getCompletedAt(),
                j.getCreatedAt());
    }

    private void ensureNoActiveJob(User user) {
        if (jobRepository.existsByUserIdAndStatusIn(user.getId(), ACTIVE)) {
            throw new BadRequestException("Another transfer is still running. Wait for it to finish or cancel it first.");
        }
    }

    private static String normalizePrivacy(String privacy) {
        return privacy == null ? "private" : Set.of("public", "unlisted", "private").contains(privacy) ? privacy : "private";
    }

    private static String trunc(String s, int max) {
        return s == null || s.length() <= max ? s : s.substring(0, max);
    }
}
