package com.youlisten.matching;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * One YouTube candidate for one playlist track. Up to 3 candidates are stored per track.
 * A track with no result at all gets a single placeholder row (candidateYoutubeId = null, method NO_RESULT)
 * so that "searched, found nothing" can be told apart from "not searched yet".
 * The playlist track is referenced by plain id on purpose, to avoid lazy-loading surprises.
 */
@Entity
@Table(name = "song_matches")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SongMatch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "playlist_track_id", nullable = false)
    private Long playlistTrackId;

    @Column(name = "candidate_youtube_id", length = 100)
    private String candidateYoutubeId;

    @Column(name = "candidate_title", length = 500)
    private String candidateTitle;

    @Column(name = "candidate_channel", length = 500)
    private String candidateChannel;

    @Column(name = "candidate_duration_ms")
    private Long candidateDurationMs;

    @Column(name = "confidence_score", precision = 5, scale = 2)
    private BigDecimal confidenceScore;

    @Column(name = "match_method", length = 100)
    private String matchMethod;

    @Column(name = "is_selected", nullable = false)
    @Builder.Default
    private boolean selected = false;

    @Column(name = "confirmed", nullable = false)
    @Builder.Default
    private boolean confirmed = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
