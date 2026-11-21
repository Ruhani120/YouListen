package com.youlisten.reverse;

import java.text.Normalizer;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Turns a YouTube video (title + channel name) into a clean song title and artist.
 * Pure string logic, no network and no Spring.
 * Handles "Artist - Title (Official Video)", auto-generated "Artist - Topic" uploads,
 * "Title - Artist" (swapped), "ft./feat." credits, and Bollywood style "Title | Movie | Singer" titles.
 */
public final class YouTubeTitleParser {

    /** title is never null/blank; artist may be null when it cannot be told; confident=false means "please review". */
    public record Parsed(String title, String artist, boolean confident) {
    }

    private static final Pattern BRACKETS = Pattern.compile("[\\(\\[\\{][^\\)\\]\\}]*[\\)\\]\\}]");
    private static final Pattern FEAT = Pattern.compile(
            "(?i)[\\(\\[]?\\b(?:feat\\.?|ft\\.?|featuring)\\s+([^()\\[\\]|]+?)\\s*[\\)\\]]?(?=\\s*(?:[\\(\\[|]|$))");
    private static final Pattern SEPARATOR = Pattern.compile("\\s+[-\u2013\u2014]\\s+");
    private static final Pattern TRAILING_DECORATION = Pattern.compile(
            "(?i)\\s+(?:official\\s+(?:music\\s+)?video|official\\s+audio|official\\s+lyric\\s+video|lyric\\s+video"
                    + "|lyrical\\s+video|lyrics|video\\s+song|full\\s+video|full\\s+song|audio|music\\s+video)\\s*$");
    private static final Pattern TOPIC = Pattern.compile("(?i)\\s*-\\s*topic\\s*$");
    private static final Pattern CHANNEL_NOISE = Pattern.compile(
            "(?i)(vevo|\\bofficial\\b|\\bmusic\\b|\\brecords\\b|\\bchannel\\b)");

    private static final Set<String> DECORATION_WORDS = new LinkedHashSet<>(Arrays.asList(
            "official", "video", "music", "audio", "lyrics", "lyric", "lyrical", "visualizer", "visualiser",
            "hd", "hq", "4k", "1080p", "mv", "m", "v", "explicit", "remastered", "remaster", "full", "song",
            "clip", "version", "new", "with", "out", "now", "premiere"));

    private YouTubeTitleParser() {
    }

    public static Parsed parse(String videoTitle, String channelTitle) {
        String raw = unescape(videoTitle == null ? "" : videoTitle).trim();
        String channel = channelTitle == null ? "" : channelTitle.trim();
        boolean topic = TOPIC.matcher(channel).find();

        // 1. drop "(Official Video)", "[Lyrics]" ... but keep "(feat. X)", "(Remix)", "(Live)" ...
        String text = removeDecorationBrackets(raw);

        // 2. pull out featured artists
        StringBuilder featured = new StringBuilder();
        Matcher f = FEAT.matcher(text);
        StringBuilder withoutFeat = new StringBuilder();
        int last = 0;
        while (f.find()) {
            withoutFeat.append(text, last, f.start()).append(' ');
            if (featured.length() > 0) featured.append(", ");
            featured.append(f.group(1).trim());
            last = f.end();
        }
        withoutFeat.append(text.substring(last));
        text = collapse(withoutFeat.toString());

        // 3. "Title | Movie | Singer": only the first part is the song
        boolean multiPart = false;
        if (text.contains("|")) {
            String[] parts = text.split("\\|");
            text = collapse(parts[0]);
            multiPart = parts.length > 1;
        }

        // 4. trailing " Official Video", " Lyrics", " Full Video" ...
        text = collapse(TRAILING_DECORATION.matcher(text).replaceFirst(""));
        text = stripQuotes(text);
        if (text.isBlank()) {
            text = stripQuotes(raw);
        }

        // 5. artist / title
        if (topic) {
            String artist = withFeatured(TOPIC.matcher(channel).replaceFirst("").trim(), featured);
            return new Parsed(text, blankToNull(artist), true);
        }

        Matcher sep = SEPARATOR.matcher(text);
        if (sep.find() && !multiPart) {
            String left = stripQuotes(collapse(text.substring(0, sep.start())));
            String right = stripQuotes(collapse(text.substring(sep.end())));
            if (!left.isBlank() && !right.isBlank()) {
                String artist = left;
                String title = right;
                // "Starboy - The Weeknd" posted by the artist's own channel: the order is swapped
                if (mentions(right, channel) && !mentions(left, channel)) {
                    artist = right;
                    title = left;
                }
                return new Parsed(title, blankToNull(withFeatured(artist, featured)), true);
            }
        }
        if (sep.find(0) && multiPart) {
            // "Artist - Title | Movie": still usable
            String left = stripQuotes(collapse(text.substring(0, sep.start())));
            String right = stripQuotes(collapse(text.substring(sep.end())));
            if (!left.isBlank() && !right.isBlank()) {
                return new Parsed(right, blankToNull(withFeatured(left, featured)), false);
            }
        }

        // no separator: the title is the song, the artist can only be guessed from the channel
        String guessed = multiPart ? null : cleanChannel(channel);
        return new Parsed(text, blankToNull(withFeatured(guessed, featured)), false);
    }

    // ───────────────────────── helpers ─────────────────────────

    private static String removeDecorationBrackets(String s) {
        Matcher m = BRACKETS.matcher(s);
        StringBuilder out = new StringBuilder();
        int last = 0;
        while (m.find()) {
            out.append(s, last, m.start()).append(' ');
            Set<String> words = words(m.group());
            boolean decorationOnly = !words.isEmpty() && DECORATION_WORDS.containsAll(words);
            if (!decorationOnly) {
                out.append(m.group());
            }
            last = m.end();
        }
        out.append(s.substring(last));
        return collapse(out.toString());
    }

    private static String cleanChannel(String channel) {
        if (channel == null) return null;
        String c = CHANNEL_NOISE.matcher(channel).replaceAll(" ");
        c = collapse(c);
        return c.isBlank() ? null : c;
    }

    /** True when the compact (letters only) form of "needle" is inside "haystack". */
    private static boolean mentions(String haystack, String needle) {
        String h = compact(haystack);
        String n = compact(cleanChannel(needle) == null ? "" : cleanChannel(needle));
        return n.length() >= 3 && h.contains(n);
    }

    private static String withFeatured(String artist, StringBuilder featured) {
        if (featured.length() == 0) return artist;
        return artist == null || artist.isBlank() ? featured.toString() : artist + ", " + featured;
    }

    private static Set<String> words(String s) {
        Set<String> out = new LinkedHashSet<>();
        for (String w : s.toLowerCase(Locale.ROOT).replaceAll("[^\\p{L}\\p{N}]+", " ").trim().split(" ")) {
            if (!w.isEmpty()) out.add(w);
        }
        return out;
    }

    private static String compact(String s) {
        String folded = Normalizer.normalize(s == null ? "" : s, Normalizer.Form.NFD).replaceAll("\\p{M}+", "");
        return folded.toLowerCase(Locale.ROOT).replaceAll("[^\\p{L}\\p{N}]+", "");
    }

    private static String stripQuotes(String s) {
        return s.replaceAll("^[\"'\u201C\u201D\u2018\u2019\\s]+|[\"'\u201C\u201D\u2018\u2019\\s]+$", "");
    }

    private static String collapse(String s) {
        return s.replaceAll("\\s+", " ").trim();
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }

    private static String unescape(String s) {
        return s.replace("&amp;", "&").replace("&quot;", "\"").replace("&#39;", "'")
                .replace("&lt;", "<").replace("&gt;", ">");
    }
}
