package com.youlisten.song;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "songs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Song {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(length = 500)
    private String artist;

    @Column(length = 500)
    private String album;

    @Column(name = "duration_ms")
    private Long durationMs;

    @Column(length = 20)
    private String isrc;

    @Column(name = "spotify_id", length = 100)
    private String spotifyId;

    @Column(name = "youtube_id", length = 100)
    private String youtubeId;

    @Column(name = "thumbnail_url", length = 1000)
    private String thumbnailUrl;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
