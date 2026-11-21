package com.youlisten.transfer;

import com.youlisten.transfer.dto.TransferDtos.CreateRequest;
import com.youlisten.transfer.dto.TransferDtos.JobResponse;
import com.youlisten.transfer.dto.TransferDtos.TrackResponse;
import com.youlisten.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transfers")
@RequiredArgsConstructor
public class TransferController {

    private final TransferService transferService;

    @GetMapping
    public ResponseEntity<List<JobResponse>> list(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(transferService.list(currentUser));
    }

    @GetMapping("/{id}")
    public ResponseEntity<JobResponse> get(@PathVariable Long id, @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(transferService.get(currentUser, id));
    }

    @GetMapping("/{id}/tracks")
    public ResponseEntity<List<TrackResponse>> tracks(@PathVariable Long id, @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(transferService.tracks(currentUser, id));
    }

    /** Creates the job and starts it on a background thread. Poll GET /{id} for progress. */
    @PostMapping
    public ResponseEntity<JobResponse> create(
            @Valid @RequestBody CreateRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(transferService.create(currentUser, request));
    }

    @PostMapping("/{id}/resume")
    public ResponseEntity<JobResponse> resume(@PathVariable Long id, @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.accepted().body(transferService.resume(currentUser, id));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<JobResponse> cancel(@PathVariable Long id, @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(transferService.cancel(currentUser, id));
    }
}
