package com.youlisten.playlist.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class PlaylistRequest {

    @NotBlank(message = "Playlist name is required")
    @Size(max = 500, message = "Playlist name must not exceed 500 characters")
    private String name;

    private String description;
    private String sourcePlatform;
    private String sourcePlaylistId;
    private String coverImageUrl;
    private boolean isPublic;
}
