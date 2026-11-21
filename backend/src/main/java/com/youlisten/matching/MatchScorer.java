package com.youlisten.matching;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Deterministic metadata scoring between a source track (from the playlist) and a YouTube video candidate.
 * Same input always gives the same score. No database, no Spring, no network.
 *
 * score = 100 * (0.45 * titleSimilarity + 0.30 * artistPresence + 0.25 * durationCloseness)
 *         + 8 when the upload is the kind the user prefers (official video, audio/Topic, or lyrics video)
 *         - 20 for a lyrics video when it was not asked for, -5 for the other of video/audio
 *         - penalty for versions the source did not ask for (live, cover, remix, karaoke, slowed...)
 */
public final class MatchScorer {

    /** At or above this the match is confirmed automatically. */
    public static final double AUTO_CONFIRM = 85.0;
    /** Between REVIEW_MIN and AUTO_CONFIRM the user is asked to look at it. Below it counts as no good match. */
    public static final double REVIEW_MIN = 60.0;
    public static final String METHOD = "metadata_v2";

    /** What kind of upload the user wants. VIDEO is the default: the original official music video. */
    public enum Preference { VIDEO, AUDIO, LYRICS }

    /** What kind of upload a YouTube result looks like. OTHER = plain "Artist - Title" upload, treated as neutral. */
    public enum Kind { VIDEO, AUDIO, LYRICS, OTHER }

    public record Candidate(String videoId, String title, String channel, Long durationMs) {
    }

    /**
     * total is 0..100 for display. raw is the same number without the 100 cap, used for ranking, so that an
     * official video (raw 108) still beats a lyric video (raw 80) even when both have a perfect title/artist/duration.
     */
    public record Score(double total, double raw, double title, double artist, double duration, double penalty, Kind kind) {
    }

    private static final Pattern DIACRITICS = Pattern.compile("\\p{M}+");
    private static final Pattern NON_ALNUM = Pattern.compile("[^\\p{L}\\p{N}]+");
    private static final Pattern BRACKETS = Pattern.compile("[\\(\\[\\{][^\\)\\]\\}]*[\\)\\]\\}]");
    private static final Pattern FEAT_SEGMENT = Pattern.compile(
            "[\\(\\[]\\s*(?:feat|ft|featuring|with|prod)\\b[^\\)\\]]*[\\)\\]]", Pattern.CASE_INSENSITIVE);
    private static final Pattern ARTIST_SPLIT = Pattern.compile(
            "\\s*(?:,|;|&|/|\\bfeat\\.?\\b|\\bfeaturing\\b|\\bft\\.?\\b|\\bwith\\b)\\s*", Pattern.CASE_INSENSITIVE);
    private static final Pattern YEAR = Pattern.compile("^(19[5-9]\\d|20[0-3]\\d)$");

    /** Words that decorate a video title but are not part of the song title. */
    private static final Set<String> VIDEO_NOISE = setOf(
            "official", "video", "audio", "lyrics", "lyric", "hd", "hq", "4k", "1080p", "visualizer", "visualiser",
            "mv", "m", "v", "music", "clip", "explicit", "remastered", "remaster", "feat", "ft", "featuring", "vevo");

    /** Words that decorate the source title (Spotify) but rarely appear in video titles. */
    private static final Set<String> SOURCE_NOISE = setOf(
            "remastered", "remaster", "version", "edit", "radio", "explicit", "single", "deluxe", "edition",
            "mono", "stereo", "bonus", "feat", "ft", "featuring", "with");

    /** Alternative versions that are normally not what the user wants. */
    private static final Set<String> UNWANTED_VERSION = setOf(
            "live", "cover", "covers", "remix", "karaoke", "reaction", "instrumental", "slowed", "reverb",
            "nightcore", "sped", "mashup", "acoustic", "demo", "tutorial", "lesson", "8d", "boosted", "loop",
            "hour", "hours", "review", "parody");

    private static final Set<String> CHANNEL_NOISE = setOf(
            "vevo", "topic", "official", "music", "records", "recordings", "channel", "tv", "entertainment");

    private MatchScorer() {
    }

    // ───────────────────────── public API ─────────────────────────

    public static Score score(String srcTitle, String srcArtist, String srcAlbum, Long srcDurationMs, Candidate c) {
        return score(srcTitle, srcArtist, srcAlbum, srcDurationMs, c, Preference.VIDEO);
    }

    public static Score score(String srcTitle, String srcArtist, String srcAlbum, Long srcDurationMs,
                              Candidate c, Preference preference) {
        String candTitle = c.title() == null ? "" : c.title();
        String candChannel = c.channel() == null ? "" : c.channel();
        Preference pref = preference == null ? Preference.VIDEO : preference;

        List<List<String>> artists = splitArtists(srcArtist);
        Set<String> artistTokens = new LinkedHashSet<>();
        artists.forEach(artistTokens::addAll);

        // ── title ──
        Set<String> srcTokens = sourceTitleTokens(srcTitle);
        Set<String> candFull = candidateTitleTokens(candTitle);
        // Drop artist names from the candidate title ("M83 - Midnight City"), unless the song title itself uses them
        Set<String> candUse = new LinkedHashSet<>(candFull);
        for (String t : artistTokens) {
            if (!srcTokens.contains(t)) {
                candUse.remove(t);
            }
        }
        double title = titleSimilarity(srcTokens, candFull, candUse);

        // ── artist ──
        Set<String> channelTokens = new LinkedHashSet<>(tokens(candChannel));
        double artist = artistPresence(artists, candFull, channelTokens, candChannel, candTitle);

        // ── duration ──
        double duration = durationCloseness(srcDurationMs, c.durationMs());

        // ── unwanted versions (live, cover, remix, karaoke, slowed...) ──
        Set<String> exempt = new LinkedHashSet<>(tokens(srcTitle));
        exempt.addAll(tokens(srcAlbum));
        double penalty = 0;
        for (String t : new LinkedHashSet<>(tokens(candTitle))) {
            if (UNWANTED_VERSION.contains(t) && !exempt.contains(t)) {
                penalty += 12;
            }
        }
        penalty = Math.min(penalty, 36);

        // ── kind of upload vs what the user prefers ──
        Kind kind = classify(candTitle, candChannel, srcTitle);
        double kindAdjustment = title >= 0.6 ? kindAdjustment(kind, pref) : 0;

        double raw = 100.0 * (0.45 * title + 0.30 * artist + 0.25 * duration) + kindAdjustment - penalty;
        if (title < 0.34) {
            raw = Math.min(raw, 45);          // probably a different song
        }
        if (!artists.isEmpty() && artist == 0.0) {
            raw = Math.min(raw, 70);          // never auto-confirm when the artist is nowhere to be found
        }
        raw = Math.max(0, raw);
        double total = Math.min(100, raw);
        return new Score(round2(total), round2(raw), round2(title), round2(artist), round2(duration), round2(penalty), kind);
    }

    /**
     * Preferred kind gets +8. Lyric videos are only wanted when asked for (-20 otherwise),
     * and when lyrics are asked for, everything else is pushed down so a lyric upload always wins if one exists.
     */
    static double kindAdjustment(Kind kind, Preference pref) {
        Kind wanted = switch (pref) {
            case VIDEO -> Kind.VIDEO;
            case AUDIO -> Kind.AUDIO;
            case LYRICS -> Kind.LYRICS;
        };
        if (kind == wanted) {
            return 8;
        }
        if (pref == Preference.LYRICS) {
            return kind == Kind.OTHER ? -10 : -20;
        }
        return switch (kind) {
            case LYRICS -> -20;
            case AUDIO, VIDEO -> -5;     // the other of video/audio: still fine as a fallback
            case OTHER -> 0;
        };
    }

    /**
     * Guesses the kind of upload from the video title and channel.
     * Words that are part of the song's own title ("Video Games") are ignored.
     */
    public static Kind classify(String videoTitle, String channel, String sourceTitle) {
        Set<String> own = new LinkedHashSet<>(tokens(sourceTitle));
        Set<String> t = new LinkedHashSet<>(tokens(videoTitle));
        t.removeAll(own);
        List<String> channelTokens = tokens(channel);
        String compactChannel = String.join("", channelTokens);

        if (t.contains("lyrics") || t.contains("lyric") || t.contains("lyrical")) {
            return Kind.LYRICS;
        }
        if (channelTokens.contains("topic") || t.contains("audio") || t.contains("visualizer") || t.contains("visualiser")) {
            return Kind.AUDIO;
        }
        if (t.contains("video") || t.contains("mv") || t.contains("official") || compactChannel.endsWith("vevo")) {
            return Kind.VIDEO;
        }
        return Kind.OTHER;
    }

    /** Human readable "why": shown under every candidate so the score is never a black box. */
    public static String describe(Score s) {
        String kind = switch (s.kind()) {
            case VIDEO -> "Music video";
            case AUDIO -> "Audio upload";
            case LYRICS -> "Lyrics video";
            case OTHER -> "Plain upload";
        };
        String text = "Title " + Math.round(s.title() * 100) + "% \u00b7 Artist " + Math.round(s.artist() * 100)
                + "% \u00b7 Length " + Math.round(s.duration() * 100) + "% \u00b7 " + kind;
        if (s.penalty() > 0) {
            text += " \u00b7 penalty -" + Math.round(s.penalty());
        }
        return text;
    }

    /** Search text for YouTube: primary artist + title without "(feat. ...)". */
    public static String buildQuery(String title, String artist) {
        String cleanTitle = FEAT_SEGMENT.matcher(title == null ? "" : title).replaceAll(" ").replaceAll("\\s+", " ").trim();
        String primary = "";
        if (artist != null && !artist.isBlank()) {
            String[] parts = ARTIST_SPLIT.split(artist.trim(), 2);
            primary = parts.length > 0 ? parts[0].trim() : artist.trim();
        }
        return (primary + " " + cleanTitle).trim();
    }

    // ───────────────────────── pieces ─────────────────────────

    static double titleSimilarity(Set<String> src, Set<String> candFull, Set<String> candUse) {
        if (src.isEmpty()) {
            return 0.0;
        }
        int hitsFull = 0;
        for (String t : src) {
            if (candFull.contains(t)) hitsFull++;
        }
        double recall = (double) hitsFull / src.size();

        Set<String> union = new LinkedHashSet<>(src);
        union.addAll(candUse);
        int hitsUse = 0;
        for (String t : src) {
            if (candUse.contains(t)) hitsUse++;
        }
        double jaccard = union.isEmpty() ? 0 : (double) hitsUse / union.size();
        return 0.7 * recall + 0.3 * jaccard;
    }

    static double artistPresence(List<List<String>> artists, Set<String> candTitleTokens,
                                 Set<String> channelTokens, String rawChannel, String rawTitle) {
        if (artists.isEmpty()) {
            return 0.5;     // nothing to compare, stay neutral
        }
        Set<String> hay = new LinkedHashSet<>(candTitleTokens);
        hay.addAll(tokens(rawTitle));
        hay.addAll(channelTokens);
        String compactHay = String.join("", tokens(rawTitle)) + "|" + String.join("", tokens(rawChannel));

        boolean primary = artistFound(artists.get(0), hay, compactHay);
        int others = artists.size() - 1;
        int othersFound = 0;
        for (int i = 1; i < artists.size(); i++) {
            if (artistFound(artists.get(i), hay, compactHay)) othersFound++;
        }
        if (primary) {
            return others == 0 ? 1.0 : 0.7 + 0.3 * ((double) othersFound / others);
        }
        return others == 0 ? 0.0 : 0.3 * ((double) othersFound / others);
    }

    private static boolean artistFound(List<String> artistTokens, Set<String> hay, String compactHay) {
        if (artistTokens.isEmpty()) {
            return false;
        }
        if (hay.containsAll(artistTokens)) {
            return true;
        }
        String compact = String.join("", artistTokens);
        return compact.length() >= 5 && compactHay.contains(compact);   // "daftpunk" inside "daftpunkvevo"
    }

    static double durationCloseness(Long srcMs, Long candMs) {
        if (srcMs == null || candMs == null || srcMs <= 0 || candMs <= 0) {
            return 0.5;     // unknown, neutral
        }
        double diff = Math.abs(srcMs - candMs) / 1000.0;
        if (diff <= 2) return 1.0;
        if (diff <= 5) return 0.9;
        if (diff <= 10) return 0.7;
        if (diff <= 20) return 0.4;
        if (diff <= 40) return 0.15;
        return 0.0;
    }

    // ───────────────────────── tokenising ─────────────────────────

    static Set<String> sourceTitleTokens(String title) {
        String t = title == null ? "" : title;
        boolean remaster = t.toLowerCase(Locale.ROOT).contains("remaster");
        t = FEAT_SEGMENT.matcher(t).replaceAll(" ");
        Set<String> out = new LinkedHashSet<>();
        for (String tok : tokens(t)) {
            if (SOURCE_NOISE.contains(tok)) continue;
            if (remaster && YEAR.matcher(tok).matches()) continue;
            out.add(tok);
        }
        return out;
    }

    static Set<String> candidateTitleTokens(String title) {
        String t = title == null ? "" : title;
        // Brackets that contain only decoration, e.g. "(Official Video)", "[Lyrics]", are dropped completely
        StringBuilder kept = new StringBuilder();
        int last = 0;
        var m = BRACKETS.matcher(t);
        while (m.find()) {
            kept.append(t, last, m.start()).append(' ');
            List<String> inner = tokens(m.group());
            boolean decorationOnly = !inner.isEmpty() && inner.stream().allMatch(VIDEO_NOISE::contains);
            if (!decorationOnly) {
                kept.append(m.group());
            }
            last = m.end();
        }
        kept.append(t.substring(last));

        Set<String> out = new LinkedHashSet<>();
        for (String tok : tokens(kept.toString())) {
            if (!VIDEO_NOISE.contains(tok)) {
                out.add(tok);
            }
        }
        return out;
    }

    static List<List<String>> splitArtists(String artist) {
        List<List<String>> out = new ArrayList<>();
        if (artist == null || artist.isBlank()) {
            return out;
        }
        for (String part : ARTIST_SPLIT.split(artist.trim())) {
            List<String> toks = tokens(part);
            if (!toks.isEmpty()) {
                out.add(toks);
            }
        }
        return out;
    }

    static List<String> tokens(String s) {
        if (s == null || s.isBlank()) {
            return List.of();
        }
        String folded = DIACRITICS.matcher(Normalizer.normalize(s, Normalizer.Form.NFD)).replaceAll("")
                .toLowerCase(Locale.ROOT);
        String cleaned = NON_ALNUM.matcher(folded).replaceAll(" ").trim();
        if (cleaned.isEmpty()) {
            return List.of();
        }
        return Arrays.asList(cleaned.split(" "));
    }

    /** Versions the user normally does not want (live, remix, karaoke...). Shared with the Spotify-side scorer. */
    static Set<String> unwantedVersionWords() {
        return UNWANTED_VERSION;
    }

    private static Set<String> setOf(String... values) {
        return new LinkedHashSet<>(Arrays.asList(values));
    }

    private static double round2(double v) {
        return Math.round(v * 100.0) / 100.0;
    }
}
