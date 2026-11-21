package com.youlisten.reverse;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * One Spotify candidate for one playlist track (YouTube -> Spotify direction).
 * A track that was searched but had no result gets one placeholder row with spotifyTrackId = null.
 */
@Entity
@Table(name = "spotify_matches")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SpotifyMatch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "playlist_track_id", nullable = false)
    private Long playlistTrackId;

    @Column(name = "spotify_track_id", length = 64)
    private String spotifyTrackId;

    @Column(name = "spotify_uri", length = 100)
    private String spotifyUri;

    @Column(name = "title", length = 500)
    private String title;

    @Column(name = "artist", length = 500)
    private String artist;

    @Column(name = "album", length = 500)
    private String album;

    @Column(name = "duration_ms")
    private Long durationMs;

    @Column(name = "isrc", length = 20)
    private String isrc;

    @Column(name = "cover_url", length = 1000)
    private String coverUrl;

    @Column(name = "confidence_score", precision = 5, scale = 2)
    private BigDecimal confidenceScore;

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
