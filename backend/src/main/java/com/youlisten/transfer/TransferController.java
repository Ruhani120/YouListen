package com.youlisten.transfer;

import com.youlisten.exception.ResourceNotFoundException;
import com.youlisten.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transfers")
@RequiredArgsConstructor
public class TransferController {

    private final TransferJobRepository transferJobRepository;

    @GetMapping
    public ResponseEntity<List<TransferJob>> getUserTransfers(@AuthenticationPrincipal User currentUser) {
        List<TransferJob> transfers = transferJobRepository.findByUserIdOrderByCreatedAtDesc(currentUser.getId());
        return ResponseEntity.ok(transfers);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TransferJob> getTransfer(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        TransferJob job = transferJobRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("TransferJob", "id", id));
        return ResponseEntity.ok(job);
    }
}
