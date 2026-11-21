package com.youlisten.google.dto;

import java.time.LocalDateTime;

public final class GoogleDtos {

    private GoogleDtos() {
    }

    public record StatusResponse(
            boolean configured,
            boolean connected,
            boolean apiKeyConfigured,
            /** api_key | account | none : which credentials song matching (YouTube search) will use */
            String searchMode,
            String channelTitle,
            String channelId,
            LocalDateTime connectedAt) {
    }

    public record AuthorizeUrlResponse(String authorizeUrl) {
    }
}
