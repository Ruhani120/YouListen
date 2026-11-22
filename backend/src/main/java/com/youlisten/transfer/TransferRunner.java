package com.youlisten.transfer;

import com.youlisten.exception.GoogleApiException;
import com.youlisten.exception.GoogleApiException.Reason;
import com.youlisten.google.GoogleService;
import com.youlisten.google.YouTubeApiClient;
import com.youlisten.notification.Notification;
import com.youlisten.notification.NotificationRepository;
import com.youlisten.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Executes a transfer job on a background thread:
 * create the YouTube playlist, then add the confirmed videos one by one, saving
 * progress after every track
 * so the UI can poll it and so a stopped job can be resumed.
 * Works only with ids and plain values (no lazy entities), because there is no
 * web session on this thread.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class TransferRunner {

    private static final int MAX_ATTEMPTS = 3;
    private static final int MAX_CONSECUTIVE_FORBIDDEN = 3;

    private final TransferJobRepository jobRepository;
    private final TransferTrackRepository trackRepository;
    private final GoogleService googleService;
    private final YouTubeApiClient youTube;
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final TransferEventPublisher events;

    @Async("jobExecutor")
    public void run(Long jobId) {
        Long userId = null;
        try {
            if (jobRepository.transition(jobId, TransferJob.Status.PENDING, TransferJob.Status.IN_PROGRESS,
                    now()) == 0) {
                log.info("Transfer {} was not PENDING, not starting", jobId);
                return;
            }
            userId = jobRepository.findUserIdById(jobId).orElseThrow();
            execute(jobId, userId);
        } catch (Throwable t) {
            log.error("Transfer {} crashed", jobId, t);
            jobRepository.finish(jobId, TransferJob.Status.IN_PROGRESS, TransferJob.Status.FAILED,
                    "Unexpected error. Check the server log, then try Resume.", now());
            publishEvent(jobId);
            notifyUser(userId, Notification.Type.ERROR, "Transfer stopped",
                    "Something went wrong during the transfer. You can resume it from Transfer History.");
        }
    }

    private void execute(Long jobId, Long userId) {
        TransferJob job = jobRepository.findById(jobId).orElseThrow();
        String destinationId = job.getDestinationPlaylistId();
        String title = job.getDestinationPlaylistName();
        String privacy = job.getDestinationPrivacy();

        // 1. destination playlist (created once; a resumed job reuses it)
        if (destinationId == null) {
            try {
                String token = googleService.accessToken(userId);
                destinationId = createPlaylistWithRetry(token, title, privacy);
                jobRepository.setDestinationPlaylist(jobId, destinationId, now());
            } catch (GoogleApiException e) {
                stop(jobId, userId, e.getMessage());
                return;
            }
        }

        // 2. add tracks in playlist order
        List<TransferWorkItem> items = trackRepository.findWorkItems(jobId, TransferTrack.Status.MATCHED);
        String stopReason = null;
        int consecutiveForbidden = 0;

        for (TransferWorkItem item : items) {
            if (jobRepository.findStatusById(jobId).orElse(null) != TransferJob.Status.IN_PROGRESS) {
                log.info("Transfer {} was cancelled, stopping", jobId);
                return;
            }
            try {
                String token = googleService.accessToken(userId);
                addWithRetry(token, destinationId, item.videoId());
                markTransferred(jobId, item.id());
                consecutiveForbidden = 0;
            } catch (GoogleApiException e) {
                if (e.getReason() == Reason.DUPLICATE) {
                    markTransferred(jobId, item.id()); // already there (e.g. after a resume)
                } else if (e.isFatalForJob()) {
                    stopReason = e.getMessage();
                    break;
                } else {
                    trackRepository.updateStatus(item.id(), TransferTrack.Status.FAILED, e.getMessage(), now());
                    jobRepository.incrementProgress(jobId, 0, 1, now());
                    if (e.getReason() == Reason.FORBIDDEN && ++consecutiveForbidden >= MAX_CONSECUTIVE_FORBIDDEN) {
                        stopReason = "YouTube keeps refusing to add videos: " + e.getMessage();
                        break;
                    }
                }
            }
            sleepQuietly(250); // gentle pacing
        }

        // 3. finish
        if (stopReason != null) {
            stop(jobId, userId, stopReason);
            return;
        }
        TransferJob done = jobRepository.findById(jobId).orElseThrow();
        if (done.getTransferredTracks() == 0 && !items.isEmpty()) {
            jobRepository.finish(jobId, TransferJob.Status.IN_PROGRESS, TransferJob.Status.FAILED,
                    "None of the tracks could be added to YouTube.", now());
            publishEvent(jobId);
            notifyUser(userId, Notification.Type.ERROR, "Transfer failed",
                    "No tracks could be added to \"" + title + "\".");
            return;
        }
        String note = done.getFailedTracks() > 0 ? done.getFailedTracks() + " track(s) could not be added." : null;
        if (jobRepository.finish(jobId, TransferJob.Status.IN_PROGRESS, TransferJob.Status.COMPLETED, note,
                now()) > 0) {
            publishEvent(jobId);
            notifyUser(userId, Notification.Type.SUCCESS, "Transfer complete",
                    done.getTransferredTracks() + " tracks added to \"" + title + "\" on YouTube.");
        }
    }

    // ───────────────────────── helpers ─────────────────────────

    private void markTransferred(Long jobId, Long transferTrackId) {
        trackRepository.updateStatus(transferTrackId, TransferTrack.Status.TRANSFERRED, null, now());
        jobRepository.incrementProgress(jobId, 1, 0, now());
    }

    /**
     * A "stop the whole job" problem (quota, expired login). Progress so far is
     * kept and the job can be resumed.
     */
    private void stop(Long jobId, Long userId, String message) {
        jobRepository.finish(jobId, TransferJob.Status.IN_PROGRESS, TransferJob.Status.FAILED, message, now());
        publishEvent(jobId);
        notifyUser(userId, Notification.Type.WARNING, "Transfer paused", message);
    }

    private String createPlaylistWithRetry(String token, String title, String privacy) {
        int attempt = 0;
        while (true) {
            try {
                return youTube.createPlaylist(token, title, "Transferred with YouListen", privacy);
            } catch (GoogleApiException e) {
                if (!e.isTransient() || ++attempt >= MAX_ATTEMPTS) {
                    throw e;
                }
                sleepQuietly(1000L * attempt);
            }
        }
    }

    private void addWithRetry(String token, String playlistId, String videoId) {
        int attempt = 0;
        while (true) {
            try {
                youTube.addVideoToPlaylist(token, playlistId, videoId);
                return;
            } catch (GoogleApiException e) {
                if (!e.isTransient() || ++attempt >= MAX_ATTEMPTS) {
                    throw e;
                }
                sleepQuietly(1000L * attempt);
            }
        }
    }

    private void notifyUser(Long userId, Notification.Type type, String title, String message) {
        if (userId == null) {
            return;
        }
        try {
            notificationRepository.save(Notification.builder()
                    .user(userRepository.getReferenceById(userId))
                    .type(type)
                    .title(title)
                    .message(message)
                    .actionUrl("/app/transfers")
                    .build());
        } catch (RuntimeException e) {
            log.warn("Could not save notification: {}", e.getMessage());
        }
    }

    /**
     * Sends a small "transfer finished" event to SQS. Never throws, so it can't
     * break a transfer.
     */
    private void publishEvent(Long jobId) {
        try {
            jobRepository.findById(jobId).ifPresent(j -> events.publish(
                    j.getId(), j.getStatus().name(), j.getTransferredTracks(), j.getFailedTracks()));
        } catch (RuntimeException e) {
            log.warn("Could not publish transfer event: {}", e.getMessage());
        }
    }

    private static LocalDateTime now() {
        return LocalDateTime.now();
    }

    private static void sleepQuietly(long ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}