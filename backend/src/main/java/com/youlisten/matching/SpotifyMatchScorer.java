package com.youlisten.matching;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * Scores a Spotify search result against a source track (usually one imported from YouTube).
 * Deterministic and dependency-free, like {@link MatchScorer}, and it reuses the same text helpers.
 *
 * score = 100 * (0.50 * title + 0.35 * artist + 0.15 * duration) - penalty for unwanted versions
 *
 * Duration counts less and is more forgiving than in the YouTube direction: a music video often has an
 * intro or outro that the album track does not.
 */
public final class SpotifyMatchScorer {

    public record Candidate(String trackId, String uri, String title, List<String> artists,
                            String album, Long durationMs, String isrc, String coverUrl) {
    }

    public record Score(double total, double title, double artist, double duration, double penalty) {
    }

    private SpotifyMatchScorer() {
    }

    public static Score score(String srcTitle, String srcArtist, String srcAlbum, Long srcDurationMs, Candidate c) {
        String candTitle = c.title() == null ? "" : c.title();
        String candArtists = c.artists() == null ? "" : String.join(" ", c.artists());

        // ── title: same normalisation on both sides, so "- Remastered 2011" / "(feat. X)" do not hurt ──
        Set<String> src = MatchScorer.sourceTitleTokens(srcTitle);
        Set<String> cand = MatchScorer.sourceTitleTokens(candTitle);
        double title = MatchScorer.titleSimilarity(src, cand, cand);

        // ── artist: is the source artist among the Spotify artists (or in the title)? ──
        List<List<String>> artists = MatchScorer.splitArtists(srcArtist);
        Set<String> candArtistTokens = new LinkedHashSet<>(MatchScorer.tokens(candArtists));
        double artist = MatchScorer.artistPresence(artists, cand, candArtistTokens, candArtists, candTitle);

        // ── duration ──
        double duration = durationCloseness(srcDurationMs, c.durationMs());

        // ── live / remix / karaoke ... that the source did not ask for ──
        Set<String> wantedWords = new LinkedHashSet<>(MatchScorer.tokens(srcTitle));
        wantedWords.addAll(MatchScorer.tokens(srcAlbum));
        double penalty = 0;
        Set<String> candWords = new LinkedHashSet<>(MatchScorer.tokens(candTitle));
        candWords.addAll(MatchScorer.tokens(c.album()));
        for (String w : candWords) {
            if (MatchScorer.unwantedVersionWords().contains(w) && !wantedWords.contains(w)) {
                penalty += 12;
            }
        }
        penalty = Math.min(penalty, 36);

        double total = 100.0 * (0.50 * title + 0.35 * artist + 0.15 * duration) - penalty;
        if (title < 0.34) {
            total = Math.min(total, 45);
        }
        if (!artists.isEmpty() && artist == 0.0) {
            total = Math.min(total, 70);
        }
        total = Math.max(0, Math.min(100, total));
        return new Score(round2(total), round2(title), round2(artist), round2(duration), round2(penalty));
    }

    static double durationCloseness(Long srcMs, Long candMs) {
        if (srcMs == null || candMs == null || srcMs <= 0 || candMs <= 0) {
            return 0.5;
        }
        double diff = Math.abs(srcMs - candMs) / 1000.0;
        if (diff <= 3) return 1.0;
        if (diff <= 8) return 0.9;
        if (diff <= 15) return 0.75;
        if (diff <= 30) return 0.5;
        if (diff <= 60) return 0.25;
        return 0.0;
    }

    /** Spotify search query: field filters first (precise), plain words as the fallback. */
    public static String filteredQuery(String title, String artist) {
        String t = clean(title);
        String a = clean(firstArtist(artist));
        return a.isEmpty() ? t : "track:" + t + " artist:" + a;
    }

    public static String plainQuery(String title, String artist) {
        return (clean(firstArtist(artist)) + " " + clean(title)).trim();
    }

    private static String firstArtist(String artist) {
        if (artist == null) return "";
        String[] parts = artist.split("\\s*(?:,|;|&|/|\\bfeat\\.?\\b|\\bft\\.?\\b)\\s*", 2);
        return parts.length == 0 ? "" : parts[0];
    }

    private static String clean(String s) {
        return s == null ? "" : s.replaceAll("[\"“”]", " ").replaceAll("\\s+", " ").trim();
    }

    private static double round2(double v) {
        return Math.round(v * 100.0) / 100.0;
    }
}
