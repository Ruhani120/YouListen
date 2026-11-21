package com.youlisten.imports;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * Parses Spotify-style playlist exports (Exportify CSV, generic CSV, Spotify API JSON, simple JSON arrays).
 * Pure parsing: no database and no Spring, so it is easy to unit test.
 * Throws IllegalArgumentException with a user-readable message for unusable files.
 */
public final class FileImportParser {

    public static final int MAX_TRACKS = 5000;

    public record Result(String format, List<ParsedTrack> tracks) {
    }

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final Pattern SPOTIFY_ID = Pattern.compile("^[A-Za-z0-9]{22}$");
    private static final Pattern CLOCK = Pattern.compile("^(\\d{1,3}):(\\d{2})(?::(\\d{2}))?$");

    private static final String[] TITLE_KEYS = {"trackname", "title", "name", "songname", "song", "track"};
    private static final String[] ARTIST_KEYS = {"artistnames", "artistname", "artists", "artist", "performer", "performers"};
    private static final String[] ALBUM_KEYS = {"albumname", "album"};
    private static final String[] DURATION_KEYS = {"durationms", "durationmilliseconds", "durationinms", "lengthms",
            "duration", "length", "time"};
    private static final String[] ISRC_KEYS = {"isrc"};
    private static final String[] ID_KEYS = {"trackuri", "spotifyuri", "spotifyid", "trackid", "uri", "id"};

    private FileImportParser() {
    }

    // ───────────────────────── entry point ─────────────────────────

    public static Result parse(String fileName, byte[] content) {
        if (content == null || content.length == 0) {
            throw new IllegalArgumentException("The file is empty.");
        }
        String text = new String(content, StandardCharsets.UTF_8);
        if (text.startsWith("\uFEFF")) {
            text = text.substring(1);
        }
        String trimmed = text.stripLeading();
        String name = fileName == null ? "" : fileName.toLowerCase(Locale.ROOT);

        boolean json = name.endsWith(".json")
                || (!name.endsWith(".csv") && (trimmed.startsWith("[") || trimmed.startsWith("{")));
        List<ParsedTrack> tracks = json ? parseJson(trimmed) : parseCsv(text);
        if (tracks.isEmpty()) {
            throw new IllegalArgumentException("No tracks were found in this file.");
        }
        if (tracks.size() > MAX_TRACKS) {
            throw new IllegalArgumentException("This file has more than " + MAX_TRACKS + " tracks, which is the import limit.");
        }
        return new Result(json ? "json" : "csv", tracks);
    }

    // ───────────────────────── CSV ─────────────────────────

    static List<ParsedTrack> parseCsv(String text) {
        List<List<String>> rows = readCsvRows(text);
        if (rows.size() < 2) {
            throw new IllegalArgumentException("The CSV needs a header row and at least one track.");
        }

        List<String> header = rows.get(0);
        Map<String, Integer> index = new HashMap<>();
        for (int i = 0; i < header.size(); i++) {
            index.putIfAbsent(normalizeKey(header.get(i)), i);
        }

        int titleCol = findColumn(index, TITLE_KEYS);
        int artistCol = findColumn(index, ARTIST_KEYS);
        int albumCol = findColumn(index, ALBUM_KEYS);
        int durationCol = findColumn(index, DURATION_KEYS);
        int isrcCol = findColumn(index, ISRC_KEYS);
        int idCol = findColumn(index, ID_KEYS);

        if (titleCol < 0) {
            throw new IllegalArgumentException(
                    "Could not find a track name column. Expected a header like \"Track Name\" or \"Title\".");
        }
        String durationHeader = durationCol >= 0 ? normalizeKey(header.get(durationCol)) : "";

        List<ParsedTrack> out = new ArrayList<>();
        int position = 0;
        for (int r = 1; r < rows.size(); r++) {
            List<String> row = rows.get(r);
            String title = cell(row, titleCol);
            String artist = cleanArtists(cell(row, artistCol));
            String album = cell(row, albumCol);
            Long duration = parseDuration(cell(row, durationCol), durationHeader.contains("ms"));
            String isrc = cleanIsrc(cell(row, isrcCol));
            String spotifyId = extractSpotifyId(cell(row, idCol));
            position++;
            out.add(build(position, title, artist, album, duration, isrc, spotifyId));
        }
        return out;
    }

    /** RFC 4180 style reader: quoted fields, escaped quotes, embedded commas and newlines, CRLF. */
    static List<List<String>> readCsvRows(String text) {
        char delimiter = detectDelimiter(text);
        List<List<String>> rows = new ArrayList<>();
        List<String> row = new ArrayList<>();
        StringBuilder field = new StringBuilder();
        boolean inQuotes = false;
        boolean fieldWasQuoted = false;

        for (int i = 0; i < text.length(); i++) {
            char c = text.charAt(i);
            if (inQuotes) {
                if (c == '"') {
                    if (i + 1 < text.length() && text.charAt(i + 1) == '"') {
                        field.append('"');
                        i++;
                    } else {
                        inQuotes = false;
                    }
                } else {
                    field.append(c);
                }
                continue;
            }
            if (c == '"' && field.length() == 0 && !fieldWasQuoted) {
                inQuotes = true;
                fieldWasQuoted = true;
            } else if (c == delimiter) {
                row.add(field.toString());
                field.setLength(0);
                fieldWasQuoted = false;
            } else if (c == '\n' || c == '\r') {
                if (c == '\r' && i + 1 < text.length() && text.charAt(i + 1) == '\n') {
                    i++;
                }
                row.add(field.toString());
                field.setLength(0);
                fieldWasQuoted = false;
                addRow(rows, row);
                row = new ArrayList<>();
            } else {
                field.append(c);
            }
        }
        if (field.length() > 0 || !row.isEmpty() || fieldWasQuoted) {
            row.add(field.toString());
            addRow(rows, row);
        }
        return rows;
    }

    private static void addRow(List<List<String>> rows, List<String> row) {
        boolean blank = row.stream().allMatch(s -> s == null || s.isBlank());
        if (!blank) {
            rows.add(row);
        }
    }

    private static char detectDelimiter(String text) {
        int end = text.indexOf('\n');
        String first = end < 0 ? text : text.substring(0, end);
        int commas = 0;
        int semis = 0;
        int tabs = 0;
        boolean quoted = false;
        for (char c : first.toCharArray()) {
            if (c == '"') {
                quoted = !quoted;
            } else if (!quoted) {
                if (c == ',') commas++;
                else if (c == ';') semis++;
                else if (c == '\t') tabs++;
            }
        }
        if (tabs > commas && tabs > semis) return '\t';
        if (semis > commas) return ';';
        return ',';
    }

    // ───────────────────────── JSON ─────────────────────────

    static List<ParsedTrack> parseJson(String text) {
        JsonNode root;
        try {
            root = MAPPER.readTree(text);
        } catch (Exception e) {
            throw new IllegalArgumentException("This is not valid JSON: " + shortMessage(e));
        }

        JsonNode array = findTrackArray(root);
        if (array == null) {
            throw new IllegalArgumentException(
                    "Unsupported JSON layout. Expected an array of tracks, or an object with a \"tracks\" or \"items\" array.");
        }

        List<ParsedTrack> out = new ArrayList<>();
        int position = 0;
        for (JsonNode entry : array) {
            JsonNode obj = unwrap(entry);
            position++;
            if (obj == null || !obj.isObject()) {
                out.add(build(position, null, null, null, null, null, null));
                continue;
            }
            Map<String, JsonNode> fields = normalizedFields(obj);

            String title = text(first(fields, TITLE_KEYS));
            String artist = cleanArtists(artistsFrom(first(fields, ARTIST_KEYS)));
            String album = albumFrom(first(fields, ALBUM_KEYS));
            Long duration = durationFrom(fields);
            JsonNode isrcNode = first(fields, ISRC_KEYS);
            if (isrcNode == null && fields.containsKey("externalids")) {
                isrcNode = fields.get("externalids").path("isrc");
            }
            String isrc = cleanIsrc(text(isrcNode));
            String spotifyId = null;
            for (String key : ID_KEYS) {
                JsonNode n = fields.get(key);
                spotifyId = extractSpotifyId(text(n));
                if (spotifyId != null) break;
            }
            out.add(build(position, title, artist, album, duration, isrc, spotifyId));
        }
        return out;
    }

    private static JsonNode findTrackArray(JsonNode root) {
        if (root == null) return null;
        if (root.isArray()) return root;
        if (root.isObject()) {
            for (String key : new String[]{"tracks", "items", "songs", "playlist", "data"}) {
                JsonNode n = root.get(key);
                if (n == null) continue;
                if (n.isArray()) return n;
                JsonNode nested = findTrackArray(n);   // e.g. {"tracks": {"items": [...]}}
                if (nested != null) return nested;
            }
        }
        return null;
    }

    /** Spotify API playlist items wrap the track: {"added_at": ..., "track": {...}} (or "item"). */
    private static JsonNode unwrap(JsonNode entry) {
        if (entry == null) return null;
        if (entry.isObject()) {
            if (entry.has("track") && entry.get("track").isObject()) return entry.get("track");
            if (entry.has("item") && entry.get("item").isObject()) return entry.get("item");
        }
        return entry;
    }

    private static Map<String, JsonNode> normalizedFields(JsonNode obj) {
        Map<String, JsonNode> map = new HashMap<>();
        obj.fields().forEachRemaining(e -> map.putIfAbsent(normalizeKey(e.getKey()), e.getValue()));
        return map;
    }

    private static JsonNode first(Map<String, JsonNode> fields, String[] keys) {
        for (String k : keys) {
            JsonNode n = fields.get(k);
            if (n != null && !n.isNull() && !n.isMissingNode()) return n;
        }
        return null;
    }

    private static String artistsFrom(JsonNode n) {
        if (n == null) return null;
        if (n.isArray()) {
            List<String> names = new ArrayList<>();
            for (JsonNode a : n) {
                String v = a.isObject() ? text(a.get("name")) : text(a);
                if (v != null) names.add(v);
            }
            return String.join(", ", names);
        }
        if (n.isObject()) return text(n.get("name"));
        return text(n);
    }

    private static String albumFrom(JsonNode n) {
        if (n == null) return null;
        if (n.isObject()) return text(n.get("name"));
        return text(n);
    }

    private static Long durationFrom(Map<String, JsonNode> fields) {
        for (String key : DURATION_KEYS) {
            JsonNode n = fields.get(key);
            if (n == null || n.isNull()) continue;
            boolean msKey = key.contains("ms") || key.contains("milliseconds");
            if (n.isNumber()) {
                return numberToMs(n.asDouble(), msKey);
            }
            Long parsed = parseDuration(text(n), msKey);
            if (parsed != null) return parsed;
        }
        return null;
    }

    // ───────────────────────── shared helpers ─────────────────────────

    private static ParsedTrack build(int position, String title, String artist, String album,
                                     Long duration, String isrc, String spotifyId) {
        String issue = null;
        if (title == null || title.isBlank()) {
            issue = "Missing track name";
        } else if (artist == null || artist.isBlank()) {
            issue = "Missing artist";
        }
        return new ParsedTrack(
                position,
                limit(blankToNull(title), 500),
                limit(blankToNull(artist), 500),
                limit(blankToNull(album), 500),
                duration,
                isrc,
                spotifyId,
                issue == null,
                issue);
    }

    static String normalizeKey(String s) {
        return s == null ? "" : s.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]", "");
    }

    private static int findColumn(Map<String, Integer> index, String[] keys) {
        for (String k : keys) {
            Integer i = index.get(k);
            if (i != null) return i;
        }
        return -1;
    }

    private static String cell(List<String> row, int col) {
        if (col < 0 || col >= row.size()) return null;
        String v = row.get(col);
        return v == null || v.isBlank() ? null : v.trim();
    }

    /** Exportify separates multiple artists with ';'. */
    static String cleanArtists(String raw) {
        if (raw == null) return null;
        String v = raw.replaceAll("\\s*;\\s*", ", ").trim();
        return v.isEmpty() ? null : v;
    }

    static String cleanIsrc(String raw) {
        if (raw == null) return null;
        String v = raw.replaceAll("[\\s-]", "").toUpperCase(Locale.ROOT);
        return v.matches("^[A-Z]{2}[A-Z0-9]{3}\\d{7}$") ? v : null;
    }

    static String extractSpotifyId(String raw) {
        if (raw == null) return null;
        String v = raw.trim();
        if (v.startsWith("spotify:track:")) {
            v = v.substring("spotify:track:".length());
        } else if (v.contains("open.spotify.com/track/")) {
            v = v.substring(v.indexOf("/track/") + 7);
            int cut = v.indexOf('?');
            if (cut >= 0) v = v.substring(0, cut);
        }
        return SPOTIFY_ID.matcher(v).matches() ? v : null;
    }

    static Long parseDuration(String raw, boolean headerSaysMs) {
        if (raw == null || raw.isBlank()) return null;
        String v = raw.trim();
        var clock = CLOCK.matcher(v);
        if (clock.matches()) {
            long a = Long.parseLong(clock.group(1));
            long b = Long.parseLong(clock.group(2));
            if (clock.group(3) == null) {
                return (a * 60 + b) * 1000;
            }
            return (a * 3600 + b * 60 + Long.parseLong(clock.group(3))) * 1000;
        }
        try {
            return numberToMs(Double.parseDouble(v), headerSaysMs);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    /** Header says ms -> milliseconds. Otherwise a value under 10,000 is treated as seconds. */
    private static Long numberToMs(double value, boolean isMs) {
        if (value <= 0) return null;
        if (isMs || value >= 10_000) return Math.round(value);
        return Math.round(value * 1000);
    }

    private static String text(JsonNode n) {
        if (n == null || n.isNull() || n.isMissingNode()) return null;
        if (n.isContainerNode()) return null;
        String v = n.asText();
        return v == null || v.isBlank() ? null : v.trim();
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }

    private static String limit(String s, int max) {
        return s == null || s.length() <= max ? s : s.substring(0, max);
    }

    private static String shortMessage(Exception e) {
        String m = e.getMessage();
        if (m == null) return "could not be parsed";
        int nl = m.indexOf('\n');
        return nl > 0 ? m.substring(0, nl) : m;
    }
}
