package com.youlisten.playlist.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class PlaylistResponse {
    private Long id;
    private Long userId;
    private String name;
    private String description;
    private String sourcePlatform;
    private String sourcePlaylistId;
    private String coverImageUrl;
    private boolean isPublic;
    private boolean isFavorite;
    private int trackCount;
    private long totalDurationMs;
    private String importSource;
    private String importedFileName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
