package com.youlisten.transfer;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TransferJobRepository extends JpaRepository<TransferJob, Long> {

    List<TransferJob> findByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<TransferJob> findByIdAndUserId(Long id, Long userId);

    List<TransferJob> findByUserIdAndStatus(Long userId, TransferJob.Status status);
}
