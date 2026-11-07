package com.youlisten.platform;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "platforms")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Platform {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String name;

    @Column(name = "display_name", nullable = false, length = 100)
    private String displayName;

    @Column(name = "icon_url", length = 500)
    private String iconUrl;

    @Column(name = "supports_import", nullable = false)
    @Builder.Default
    private boolean supportsImport = false;

    @Column(name = "supports_export", nullable = false)
    @Builder.Default
    private boolean supportsExport = false;

    @Column(name = "supports_oauth", nullable = false)
    @Builder.Default
    private boolean supportsOauth = false;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
