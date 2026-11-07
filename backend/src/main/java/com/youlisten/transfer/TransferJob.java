package com.youlisten.transfer;

import com.youlisten.playlist.Playlist;
import com.youlisten.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "transfer_jobs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransferJob {

    public enum Status {
        PENDING, IN_PROGRESS, COMPLETED, FAILED, CANCELLED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_playlist_id", nullable = false)
    private Playlist sourcePlaylist;

    @Column(name = "destination_platform", nullable = false, length = 100)
    private String destinationPlatform;

    @Column(name = "destination_playlist_id", length = 500)
    private String destinationPlaylistId;

    @Column(name = "destination_playlist_name", length = 500)
    private String destinationPlaylistName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private Status status = Status.PENDING;

    @Column(name = "total_tracks", nullable = false)
    @Builder.Default
    private int totalTracks = 0;

    @Column(name = "matched_tracks", nullable = false)
    @Builder.Default
    private int matchedTracks = 0;

    @Column(name = "transferred_tracks", nullable = false)
    @Builder.Default
    private int transferredTracks = 0;

    @Column(name = "failed_tracks", nullable = false)
    @Builder.Default
    private int failedTracks = 0;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
