package com.youlisten.reverse;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class YouTubeTitleParserTest {

    @Test
    void artistDashTitleWithOfficialVideoTag() {
        var p = YouTubeTitleParser.parse("M83 - Midnight City (Official Video)", "M83");
        assertEquals("Midnight City", p.title());
        assertEquals("M83", p.artist());
        assertTrue(p.confident());
    }

    @Test
    void featuredArtistsMoveIntoTheArtistField() {
        var p = YouTubeTitleParser.parse("The Weeknd - Starboy ft. Daft Punk (Official Video)", "TheWeekndVEVO");
        assertEquals("Starboy", p.title());
        assertEquals("The Weeknd, Daft Punk", p.artist());
    }

    @Test
    void bracketedFeaturingIsHandledToo() {
        var p = YouTubeTitleParser.parse("Daft Punk - Instant Crush (feat. Julian Casablancas) [Official Audio]", "Daft Punk");
        assertEquals("Instant Crush", p.title());
        assertEquals("Daft Punk, Julian Casablancas", p.artist());
    }

    @Test
    void topicChannelGivesTheArtist() {
        var p = YouTubeTitleParser.parse("Instant Crush", "Daft Punk - Topic");
        assertEquals("Instant Crush", p.title());
        assertEquals("Daft Punk", p.artist());
        assertTrue(p.confident());
    }

    @Test
    void noSeparatorFallsBackToTheChannelAndAsksForReview() {
        var p = YouTubeTitleParser.parse("Midnight City", "M83");
        assertEquals("Midnight City", p.title());
        assertEquals("M83", p.artist());
        assertFalse(p.confident());
    }

    @Test
    void bollywoodPipeTitlesKeepOnlyTheSongName() {
        var p = YouTubeTitleParser.parse("Tum Hi Ho Full Video | Aashiqui 2 | Arijit Singh | Mithoon", "T-Series");
        assertEquals("Tum Hi Ho", p.title());
        assertNull(p.artist());
        assertFalse(p.confident());
    }

    @Test
    void remasterAndOfficialTagsAreRemoved() {
        var p = YouTubeTitleParser.parse("Bohemian Rhapsody (Official Video Remastered)", "Queen Official");
        assertEquals("Bohemian Rhapsody", p.title());
        assertEquals("Queen", p.artist());
    }

    @Test
    void swappedTitleAndArtistIsDetectedFromTheChannel() {
        var p = YouTubeTitleParser.parse("Starboy - The Weeknd", "The Weeknd");
        assertEquals("Starboy", p.title());
        assertEquals("The Weeknd", p.artist());
    }

    @Test
    void lyricsTagInBracketsIsRemoved() {
        var p = YouTubeTitleParser.parse("Kavinsky - Nightcall [Lyrics]", "Lyric Vibes");
        assertEquals("Nightcall", p.title());
        assertEquals("Kavinsky", p.artist());
    }

    @Test
    void wordsThatArePartOfTheTitleSurvive() {
        var p = YouTubeTitleParser.parse("Lana Del Rey - Video Games", "Lana Del Rey");
        assertEquals("Video Games", p.title());
        assertEquals("Lana Del Rey", p.artist());
    }

    @Test
    void remixAndLiveTagsAreKept() {
        var p = YouTubeTitleParser.parse("Daft Punk - One More Time (Live at Coachella)", "Daft Punk");
        assertEquals("One More Time (Live at Coachella)", p.title());
    }

    @Test
    void htmlEntitiesAreDecoded() {
        var p = YouTubeTitleParser.parse("Guns N&#39; Roses - Sweet Child O&#39; Mine", "Guns N' Roses");
        assertEquals("Sweet Child O' Mine", p.title());
        assertEquals("Guns N' Roses", p.artist());
    }
}
