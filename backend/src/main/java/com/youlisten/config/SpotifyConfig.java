package com.youlisten.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "app.spotify")
@Data
public class SpotifyConfig {

    private String clientId = "";
    private String clientSecret = "";
    private String redirectUri = "http://127.0.0.1:8080/api/spotify/callback";
    private String frontendUrl = "http://localhost:5173";
    private String tokenEncryptionKey = "";

    /** The Spotify feature stays disabled (and the app keeps working) until all of these are set. */
    public boolean isConfigured() {
        return notBlank(clientId) && notBlank(clientSecret) && notBlank(redirectUri)
                && tokenEncryptionKey != null && tokenEncryptionKey.trim().length() >= 16;
    }

    private static boolean notBlank(String s) {
        return s != null && !s.isBlank();
    }
}
