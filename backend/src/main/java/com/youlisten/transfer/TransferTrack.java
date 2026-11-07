package com.youlisten.transfer;

import com.youlisten.song.PlaylistTrack;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "transfer_tracks")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransferTrack {

    public enum Status {
        PENDING, MATCHED, TRANSFERRED, FAILED, SKIPPED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transfer_job_id", nullable = false)
    private TransferJob transferJob;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "playlist_track_id", nullable = false)
    private PlaylistTrack playlistTrack;

    @Column(name = "youtube_video_id", length = 100)
    private String youtubeVideoId;

    @Column(name = "youtube_video_title", length = 500)
    private String youtubeVideoTitle;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private Status status = Status.PENDING;

    @Column(name = "confidence_score", precision = 5, scale = 2)
    private BigDecimal confidenceScore;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
