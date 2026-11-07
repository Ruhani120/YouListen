package com.youlisten.user;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class UserProfileResponse {
    private Long id;
    private String email;
    private String username;
    private String displayName;
    private String avatarUrl;
    private String role;
    private boolean emailVerified;
    private LocalDateTime createdAt;
}
