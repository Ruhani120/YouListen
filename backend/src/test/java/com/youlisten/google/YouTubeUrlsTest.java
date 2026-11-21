package com.youlisten.google;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class YouTubeUrlsTest {

    @Test
    void understandsTheCommonLinkShapes() {
        assertEquals("dQw4w9WgXcQ", YouTubeUrls.extractVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ"));
        assertEquals("dQw4w9WgXcQ", YouTubeUrls.extractVideoId("https://www.youtube.com/watch?feature=share&v=dQw4w9WgXcQ&t=42"));
        assertEquals("dQw4w9WgXcQ", YouTubeUrls.extractVideoId("https://music.youtube.com/watch?v=dQw4w9WgXcQ&list=RDAMVM"));
        assertEquals("dQw4w9WgXcQ", YouTubeUrls.extractVideoId("https://youtu.be/dQw4w9WgXcQ?si=abc"));
        assertEquals("dQw4w9WgXcQ", YouTubeUrls.extractVideoId("https://www.youtube.com/shorts/dQw4w9WgXcQ"));
        assertEquals("dQw4w9WgXcQ", YouTubeUrls.extractVideoId("https://www.youtube.com/embed/dQw4w9WgXcQ"));
        assertEquals("dQw4w9WgXcQ", YouTubeUrls.extractVideoId("youtube.com/watch?v=dQw4w9WgXcQ"));
        assertEquals("dQw4w9WgXcQ", YouTubeUrls.extractVideoId("  dQw4w9WgXcQ  "));
    }

    @Test
    void rejectsEverythingElse() {
        assertNull(YouTubeUrls.extractVideoId(null));
        assertNull(YouTubeUrls.extractVideoId(""));
        assertNull(YouTubeUrls.extractVideoId("hello world"));
        assertNull(YouTubeUrls.extractVideoId("https://example.com/watch?v=dQw4w9WgXcQ"));
        assertNull(YouTubeUrls.extractVideoId("https://www.youtube.com/playlist?list=PL123"));
        assertNull(YouTubeUrls.extractVideoId("https://www.youtube.com/watch?v=short"));
    }
}
