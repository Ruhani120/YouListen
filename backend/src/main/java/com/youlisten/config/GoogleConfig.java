package com.youlisten.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "app.google")
@Data
public class GoogleConfig {

    private String clientId = "";
    private String clientSecret = "";
    private String redirectUri = "http://localhost:8080/api/google/callback";
    private String frontendUrl = "http://localhost:5173";

    /**
     * Optional. With an API key, song matching (YouTube search) works without the user logging in with Google.
     * Without one, matching uses the connected Google account.
     */
    private String youtubeApiKey = "";

    public boolean isOAuthConfigured() {
        return notBlank(clientId) && notBlank(clientSecret) && notBlank(redirectUri);
    }

    public boolean hasApiKey() {
        return notBlank(youtubeApiKey);
    }

    private static boolean notBlank(String s) {
        return s != null && !s.isBlank();
    }
}
