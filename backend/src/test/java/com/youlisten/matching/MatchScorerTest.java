package com.youlisten.matching;

import com.youlisten.matching.MatchScorer.Candidate;
import com.youlisten.matching.MatchScorer.Kind;
import com.youlisten.matching.MatchScorer.Preference;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class MatchScorerTest {

    private static double score(String title, String artist, String album, Long durationMs,
                                String videoTitle, String channel, Long videoDurationMs) {
        return MatchScorer.score(title, artist, album, durationMs,
                new Candidate("id", videoTitle, channel, videoDurationMs)).total();
    }

    @Test
    void officialUploadIsAutoConfirmed() {
        double s = score("Midnight City", "M83", "Hurry Up, We're Dreaming", 243000L,
                "M83 - Midnight City (Official Video)", "M83", 244000L);
        assertTrue(s >= MatchScorer.AUTO_CONFIRM, "score was " + s);
    }

    @Test
    void featuredArtistsAndVevoChannelStillConfirm() {
        double s = score("Starboy", "The Weeknd, Daft Punk", "Starboy", 230000L,
                "The Weeknd - Starboy ft. Daft Punk (Official Video)", "TheWeekndVEVO", 231000L);
        assertTrue(s >= MatchScorer.AUTO_CONFIRM, "score was " + s);
    }

    @Test
    void topicChannelUploadScoresVeryHigh() {
        double s = score("Instant Crush", "Daft Punk, Julian Casablancas", "RAM", 337000L,
                "Instant Crush (feat. Julian Casablancas)", "Daft Punk - Topic", 337000L);
        assertTrue(s >= 90, "score was " + s);
    }

    @Test
    void remasterTagsAndAccentsAreHandled() {
        assertTrue(score("Bohemian Rhapsody - Remastered 2011", "Queen", "A Night at the Opera", 354000L,
                "Queen - Bohemian Rhapsody (Official Video Remastered)", "Queen Official", 359000L) >= MatchScorer.AUTO_CONFIRM);
        assertTrue(score("D\u00e9j\u00e0 Vu", "Beyonc\u00e9", "x", 200000L,
                "Beyonce - Deja Vu ft. Jay-Z", "BeyonceVEVO", 200000L) >= MatchScorer.AUTO_CONFIRM);
    }

    @Test
    void liveCoverAndDifferentSongsAreNotAutoConfirmed() {
        double official = score("Midnight City", "M83", "Hurry Up", 243000L,
                "M83 - Midnight City (Official Video)", "M83", 244000L);
        double live = score("Midnight City", "M83", "Hurry Up", 243000L,
                "M83 - Midnight City (Live at Coachella)", "M83", 300000L);
        double cover = score("Midnight City", "M83", "Hurry Up", 243000L,
                "Midnight City cover by Some Guy", "Some Guy", 243000L);
        double wrong = score("Midnight City", "M83", "Hurry Up", 243000L,
                "Daft Punk - Get Lucky", "Daft Punk", 248000L);

        assertTrue(live < MatchScorer.AUTO_CONFIRM && live < official, "live was " + live);
        assertTrue(cover < 70, "cover was " + cover);
        assertTrue(wrong < 45, "wrong song was " + wrong);
    }

    @Test
    void scoringIsDeterministic() {
        double a = score("Resonance", "HOME", "Odyssey", 212000L, "HOME - Resonance", "Electronic Gems", 212000L);
        double b = score("Resonance", "HOME", "Odyssey", 212000L, "HOME - Resonance", "Electronic Gems", 212000L);
        assertEquals(a, b);
        assertTrue(a >= MatchScorer.AUTO_CONFIRM);
    }

    @Test
    void searchQueryUsesPrimaryArtistAndDropsFeaturing() {
        assertEquals("The Weeknd Starboy", MatchScorer.buildQuery("Starboy (feat. Daft Punk)", "The Weeknd, Daft Punk"));
        assertEquals("Song", MatchScorer.buildQuery("Song", null));
    }

    // ───────────── listening preference: music video / audio / lyrics ─────────────

    private static MatchScorer.Score forPreference(String videoTitle, String channel, Preference pref) {
        return MatchScorer.score("Midnight City", "M83", "Hurry Up", 243000L,
                new Candidate("id", videoTitle, channel, 243000L), pref);
    }

    @Test
    void officialVideoBeatsLyricVideoByDefaultAndLyricsAreNotAutoConfirmed() {
        var mv = forPreference("M83 - Midnight City (Official Video)", "M83", Preference.VIDEO);
        var lyrics = forPreference("M83 - Midnight City (Lyrics)", "Lyric Vibes", Preference.VIDEO);
        assertEquals(Kind.VIDEO, mv.kind());
        assertEquals(Kind.LYRICS, lyrics.kind());
        assertTrue(mv.raw() > lyrics.raw(), "mv " + mv.raw() + " lyrics " + lyrics.raw());
        assertTrue(mv.total() >= MatchScorer.AUTO_CONFIRM);
        assertTrue(lyrics.total() < MatchScorer.AUTO_CONFIRM, "lyrics total was " + lyrics.total());
    }

    @Test
    void perfectScoresStillRankByRawSoTheOriginalWinsEvenWhenBothShow100() {
        var mv = forPreference("M83 - Midnight City (Official Video)", "M83", Preference.VIDEO);
        var plain = forPreference("M83 - Midnight City", "M83", Preference.VIDEO);
        assertEquals(100.0, mv.total());
        assertEquals(100.0, plain.total());
        assertTrue(mv.raw() > plain.raw());
    }

    @Test
    void audioPreferenceChoosesTopicUploadOverTheMusicVideo() {
        var topic = forPreference("Midnight City", "M83 - Topic", Preference.AUDIO);
        var mv = forPreference("M83 - Midnight City (Official Video)", "M83", Preference.AUDIO);
        assertEquals(Kind.AUDIO, topic.kind());
        assertTrue(topic.raw() > mv.raw());
        assertTrue(mv.total() >= MatchScorer.AUTO_CONFIRM, "the video is still an acceptable fallback");
    }

    @Test
    void lyricsPreferenceChoosesTheLyricVideo() {
        var lyrics = forPreference("M83 - Midnight City (Official Lyric Video)", "M83", Preference.LYRICS);
        var mv = forPreference("M83 - Midnight City (Official Video)", "M83", Preference.LYRICS);
        assertTrue(lyrics.raw() > mv.raw());
        assertTrue(mv.total() < MatchScorer.AUTO_CONFIRM, "without lyrics available the user should review it");
    }

    @Test
    void wordsThatArePartOfTheSongTitleAreNotTreatedAsUploadKind() {
        assertEquals(Kind.OTHER, MatchScorer.classify("Lana Del Rey - Video Games", "Lana Del Rey", "Video Games"));
        assertEquals(Kind.AUDIO, MatchScorer.classify("Instant Crush", "Daft Punk - Topic", "Instant Crush"));
        assertEquals(Kind.VIDEO, MatchScorer.classify("The Weeknd - Starboy", "TheWeekndVEVO", "Starboy"));
    }

    @Test
    void everyScoreComesWithAReadableExplanation() {
        var s = forPreference("M83 - Midnight City (Official Video)", "M83", Preference.VIDEO);
        String text = MatchScorer.describe(s);
        assertTrue(text.contains("Music video"), text);
        assertTrue(text.contains("Title 100%") && text.contains("Artist 100%"), text);

        var lyrics = forPreference("M83 - Midnight City (Lyrics)", "Lyric Vibes", Preference.VIDEO);
        assertTrue(MatchScorer.describe(lyrics).contains("Lyrics video"));
    }
}
