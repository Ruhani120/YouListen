package com.youlisten.transfer;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Jobs are run by a thread inside this application, so a restart kills them mid-way.
 * On startup mark such jobs as FAILED so the user can press "Resume" instead of staring at a frozen progress bar.
 * (Assumes a single backend instance. With several instances this would need a heartbeat column.)
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class TransferRecovery {

    private final TransferJobRepository jobRepository;

    @EventListener(ApplicationReadyEvent.class)
    public void recoverInterruptedJobs() {
        List<TransferJob> stuck = jobRepository.findByStatusIn(
                List.of(TransferJob.Status.PENDING, TransferJob.Status.IN_PROGRESS));
        for (TransferJob job : stuck) {
            jobRepository.finish(job.getId(), job.getStatus(), TransferJob.Status.FAILED,
                    "The server restarted while this transfer was running. Press Resume to continue.", LocalDateTime.now());
            log.warn("Marked interrupted transfer {} as FAILED", job.getId());
        }
    }
}
