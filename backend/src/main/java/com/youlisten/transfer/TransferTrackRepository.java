package com.youlisten.transfer;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TransferTrackRepository extends JpaRepository<TransferTrack, Long> {

    @Query("select t from TransferTrack t join fetch t.playlistTrack pt join fetch pt.song "
            + "where t.transferJob.id = :jobId order by pt.position asc")
    List<TransferTrack> findDetailedByJobId(Long jobId);

    @Query("select new com.youlisten.transfer.TransferWorkItem(t.id, t.youtubeVideoId, t.youtubeVideoTitle) "
            + "from TransferTrack t where t.transferJob.id = :jobId and t.status = :status "
            + "order by t.playlistTrack.position asc")
    List<TransferWorkItem> findWorkItems(Long jobId, TransferTrack.Status status);

    @Modifying
    @Transactional
    @Query("update TransferTrack t set t.status = :status, t.errorMessage = :message, t.updatedAt = :ts "
            + "where t.id = :id")
    int updateStatus(Long id, TransferTrack.Status status, String message, LocalDateTime ts);
}
