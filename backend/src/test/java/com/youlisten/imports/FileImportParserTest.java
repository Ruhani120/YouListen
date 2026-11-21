package com.youlisten.imports;

import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class FileImportParserTest {

    private static FileImportParser.Result parse(String name, String content) {
        return FileImportParser.parse(name, content.getBytes(StandardCharsets.UTF_8));
    }

    @Test
    void parsesExportifyCsvWithBomQuotesAndCrlf() {
        String csv = "\uFEFF\"Track URI\",\"Track Name\",\"Album Name\",\"Artist Name(s)\",\"Release Date\",\"Duration (ms)\"\r\n"
                + "\"spotify:track:6rqhFgbbKwnb9MLmUQDhG6\",\"Midnight City\",\"Hurry Up, We're Dreaming\",\"M83\",\"2011\",\"243000\"\r\n"
                + "\"spotify:track:0VjIjW4GlUZAMYd2vXMi3b\",\"Say \"\"Hello\"\", World\",\"After Hours\",\"The Weeknd;Daft Punk\",\"2020\",\"200040\"\r\n"
                + ",,,,,\r\n"
                + "\"x\",\"\",\"A\",\"Nobody\",\"2020\",\"1000\"\r\n";

        var result = parse("playlist.csv", csv);

        assertEquals("csv", result.format());
        assertEquals(3, result.tracks().size());            // the blank line is skipped
        var first = result.tracks().get(0);
        assertEquals("Midnight City", first.title());
        assertEquals("M83", first.artist());
        assertEquals("Hurry Up, We're Dreaming", first.album());
        assertEquals(243000L, first.durationMs());
        assertEquals("6rqhFgbbKwnb9MLmUQDhG6", first.spotifyId());
        assertEquals("Say \"Hello\", World", result.tracks().get(1).title());
        assertEquals("The Weeknd, Daft Punk", result.tracks().get(1).artist());
        assertFalse(result.tracks().get(2).valid());
        assertEquals("Missing track name", result.tracks().get(2).issue());
    }

    @Test
    void parsesSemicolonCsvWithClockDurationAndIsrc() {
        var result = parse("x.csv", "Title;Artist;Duration;ISRC\nNightcall;Kavinsky;4:19;fr-01a-1000850\n");
        var t = result.tracks().get(0);
        assertEquals(259000L, t.durationMs());
        assertEquals("FR01A1000850", t.isrc());
    }

    @Test
    void parsesFlatJsonArray() {
        var result = parse("a.json",
                "[{\"name\":\"Starboy\",\"artist\":\"The Weeknd\",\"album\":\"Starboy\",\"duration_ms\":230000,\"isrc\":\"USUG11601728\"}]");
        assertEquals("json", result.format());
        var t = result.tracks().get(0);
        assertEquals("Starboy", t.title());
        assertEquals(230000L, t.durationMs());
        assertEquals("USUG11601728", t.isrc());
    }

    @Test
    void parsesSpotifyApiShapedJson() {
        String api = "{\"items\":[{\"added_at\":\"2020\",\"track\":{\"id\":\"6rqhFgbbKwnb9MLmUQDhG6\",\"name\":\"Midnight City\","
                + "\"artists\":[{\"name\":\"M83\"}],\"album\":{\"name\":\"Hurry Up\"},\"duration_ms\":243000,"
                + "\"external_ids\":{\"isrc\":\"FR6V81100650\"}}},{\"track\":null}]}";
        var result = parse("b.json", api);
        assertEquals(2, result.tracks().size());
        var t = result.tracks().get(0);
        assertEquals("M83", t.artist());
        assertEquals("Hurry Up", t.album());
        assertEquals("FR6V81100650", t.isrc());
        assertNotNull(t.spotifyId());
        assertTrue(t.valid());
        assertFalse(result.tracks().get(1).valid());
    }

    @Test
    void rejectsUnusableFilesWithAReadableMessage() {
        assertThrows(IllegalArgumentException.class, () -> parse("e.csv", ""));
        assertThrows(IllegalArgumentException.class, () -> parse("e.csv", "Foo,Bar\n1,2\n"));
        assertThrows(IllegalArgumentException.class, () -> parse("e.json", "{not json"));
        assertThrows(IllegalArgumentException.class, () -> parse("e.json", "{\"hello\":1}"));
    }
}
