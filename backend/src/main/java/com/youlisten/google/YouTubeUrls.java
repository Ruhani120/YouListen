package com.youlisten.google;

import java.net.URI;
import java.util.Locale;
import java.util.regex.Pattern;

/** Pulls the 11-character video id out of any YouTube / YouTube Music link (or accepts a bare id). */
public final class YouTubeUrls {

    private static final Pattern VIDEO_ID = Pattern.compile("^[A-Za-z0-9_-]{11}$");

    private YouTubeUrls() {
    }

    /** Returns the video id, or null when the text is not a recognisable YouTube video link. */
    public static String extractVideoId(String input) {
        if (input == null) {
            return null;
        }
        String s = input.trim();
        if (VIDEO_ID.matcher(s).matches()) {
            return s;
        }
        try {
            URI uri = URI.create(s.startsWith("http://") || s.startsWith("https://") ? s : "https://" + s);
            String host = uri.getHost() == null ? "" : uri.getHost().toLowerCase(Locale.ROOT);
            String path = uri.getPath() == null ? "" : uri.getPath();

            if (host.equals("youtu.be") || host.endsWith(".youtu.be")) {
                return valid(firstSegment(path, 0));
            }
            if (host.equals("youtube.com") || host.endsWith(".youtube.com")) {
                String query = uri.getRawQuery();
                if (query != null) {
                    for (String pair : query.split("&")) {
                        if (pair.startsWith("v=")) {
                            return valid(pair.substring(2));
                        }
                    }
                }
                String[] segments = path.split("/");
                for (int i = 0; i < segments.length - 1; i++) {
                    if (segments[i].equals("shorts") || segments[i].equals("embed")
                            || segments[i].equals("live") || segments[i].equals("v")) {
                        return valid(segments[i + 1]);
                    }
                }
            }
        } catch (IllegalArgumentException e) {
            return null;
        }
        return null;
    }

    private static String firstSegment(String path, int index) {
        String[] segments = path.split("/");
        int seen = 0;
        for (String seg : segments) {
            if (seg.isEmpty()) continue;
            if (seen++ == index) return seg;
        }
        return null;
    }

    private static String valid(String id) {
        return id != null && VIDEO_ID.matcher(id).matches() ? id : null;
    }
}
