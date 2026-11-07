package com.youlisten.playlist;

import com.youlisten.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "playlists")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Playlist {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 500)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "source_platform", length = 100)
    private String sourcePlatform;

    @Column(name = "source_playlist_id", length = 500)
    private String sourcePlaylistId;

    @Column(name = "cover_image_url", length = 1000)
    private String coverImageUrl;

    @Column(name = "is_public", nullable = false)
    @Builder.Default
    private boolean isPublic = false;

    @Column(name = "is_favorite", nullable = false)
    @Builder.Default
    private boolean isFavorite = false;

    @Column(name = "track_count", nullable = false)
    @Builder.Default
    private int trackCount = 0;

    @Column(name = "total_duration_ms", nullable = false)
    @Builder.Default
    private long totalDurationMs = 0L;

    @Column(name = "import_source", length = 100)
    private String importSource;

    @Column(name = "imported_file_name", length = 500)
    private String importedFileName;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
