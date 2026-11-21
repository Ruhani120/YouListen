package com.youlisten.transfer;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface TransferJobRepository extends JpaRepository<TransferJob, Long> {

    List<TransferJob> findByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<TransferJob> findByIdAndUserId(Long id, Long userId);

    List<TransferJob> findByUserIdAndStatus(Long userId, TransferJob.Status status);

    List<TransferJob> findByStatusIn(Collection<TransferJob.Status> statuses);

    boolean existsByUserIdAndStatusIn(Long userId, Collection<TransferJob.Status> statuses);

    // ── reads that load the source playlist so the DTO can be built safely ──

    @Query("select j from TransferJob j join fetch j.sourcePlaylist where j.user.id = :userId order by j.createdAt desc")
    List<TransferJob> findDetailedByUserId(Long userId);

    @Query("select j from TransferJob j join fetch j.sourcePlaylist where j.id = :id and j.user.id = :userId")
    Optional<TransferJob> findDetailedByIdAndUserId(Long id, Long userId);

    @Query("select j.status from TransferJob j where j.id = :id")
    Optional<TransferJob.Status> findStatusById(Long id);

    @Query("select j.user.id from TransferJob j where j.id = :id")
    Optional<Long> findUserIdById(Long id);

    // ── small atomic updates used by the background worker ──

    @Modifying
    @Transactional
    @Query("update TransferJob j set j.status = :toStatus, j.startedAt = coalesce(j.startedAt, :ts), "
            + "j.errorMessage = null, j.completedAt = null, j.updatedAt = :ts "
            + "where j.id = :id and j.status = :fromStatus")
    int transition(Long id, TransferJob.Status fromStatus, TransferJob.Status toStatus, LocalDateTime ts);

    @Modifying
    @Transactional
    @Query("update TransferJob j set j.status = :status, j.errorMessage = :message, "
            + "j.completedAt = :ts, j.updatedAt = :ts where j.id = :id and j.status = :expected")
    int finish(Long id, TransferJob.Status expected, TransferJob.Status status, String message, LocalDateTime ts);

    @Modifying
    @Transactional
    @Query("update TransferJob j set j.status = :toStatus, j.completedAt = :ts, j.updatedAt = :ts "
            + "where j.id = :id and j.status in :fromStatuses")
    int cancel(Long id, Collection<TransferJob.Status> fromStatuses, TransferJob.Status toStatus, LocalDateTime ts);

    @Modifying
    @Transactional
    @Query("update TransferJob j set j.destinationPlaylistId = :destinationId, j.updatedAt = :ts where j.id = :id")
    int setDestinationPlaylist(Long id, String destinationId, LocalDateTime ts);

    @Modifying
    @Transactional
    @Query("update TransferJob j set j.transferredTracks = j.transferredTracks + :transferred, "
            + "j.failedTracks = j.failedTracks + :failed, j.updatedAt = :ts where j.id = :id")
    int incrementProgress(Long id, int transferred, int failed, LocalDateTime ts);
}
