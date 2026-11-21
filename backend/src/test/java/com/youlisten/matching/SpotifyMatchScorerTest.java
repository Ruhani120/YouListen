package com.youlisten.matching;

import com.youlisten.matching.SpotifyMatchScorer.Candidate;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SpotifyMatchScorerTest {

    private static Candidate track(String title, List<String> artists, String album, Long durationMs) {
        return new Candidate("id", "spotify:track:id", title, artists, album, durationMs, null, null);
    }

    private static double score(String title, String artist, Long duration, Candidate c) {
        return SpotifyMatchScorer.score(title, artist, null, duration, c).total();
    }

    @Test
    void exactTrackIsAutoConfirmed() {
        double s = score("Midnight City", "M83", 243000L,
                track("Midnight City", List.of("M83"), "Hurry Up, We're Dreaming", 243000L));
        assertTrue(s >= MatchScorer.AUTO_CONFIRM, "score was " + s);
    }

    @Test
    void remasteredSpotifyTitleAndFeaturedArtistsStillMatch() {
        assertTrue(score("Bohemian Rhapsody", "Queen", 355000L,
                track("Bohemian Rhapsody - Remastered 2011", List.of("Queen"), "A Night At The Opera", 354000L)) >= MatchScorer.AUTO_CONFIRM);
        assertTrue(score("Starboy", "The Weeknd, Daft Punk", 230000L,
                track("Starboy", List.of("The Weeknd", "Daft Punk"), "Starboy", 230000L)) >= MatchScorer.AUTO_CONFIRM);
    }

    @Test
    void musicVideoIntroLengthDifferenceDoesNotBreakAMatch() {
        double s = score("Nightcall", "Kavinsky", 280000L,
                track("Nightcall", List.of("Kavinsky"), "OutRun", 259000L));
        assertTrue(s >= MatchScorer.AUTO_CONFIRM, "score was " + s);
    }

    @Test
    void sameTitleByAnotherArtistIsNotAutoConfirmed() {
        double s = score("Bohemian Rhapsody", "Queen", 354000L,
                track("Bohemian Rhapsody", List.of("Panic! At The Disco"), "Live", 351000L));
        assertTrue(s < MatchScorer.AUTO_CONFIRM && s <= 70, "score was " + s);
    }

    @Test
    void liveVersionIsRankedBelowTheStudioVersion() {
        double studio = score("Midnight City", "M83", 243000L,
                track("Midnight City", List.of("M83"), "Hurry Up, We're Dreaming", 243000L));
        double live = score("Midnight City", "M83", 243000L,
                track("Midnight City - Live", List.of("M83"), "Live at Coachella", 260000L));
        assertTrue(live < studio, "live " + live + " studio " + studio);
    }

    @Test
    void unknownArtistNeverAutoConfirms() {
        double s = score("Tum Hi Ho", null, 262000L,
                track("Tum Hi Ho", List.of("Arijit Singh"), "Aashiqui 2", 262000L));
        assertTrue(s < MatchScorer.AUTO_CONFIRM && s >= MatchScorer.REVIEW_MIN, "score was " + s);
    }

    @Test
    void queriesUseFieldFiltersWithPlainFallback() {
        assertEquals("track:Starboy artist:The Weeknd", SpotifyMatchScorer.filteredQuery("Starboy", "The Weeknd, Daft Punk"));
        assertEquals("The Weeknd Starboy", SpotifyMatchScorer.plainQuery("Starboy", "The Weeknd, Daft Punk"));
        assertEquals("Tum Hi Ho", SpotifyMatchScorer.filteredQuery("Tum Hi Ho", null));
    }
}
