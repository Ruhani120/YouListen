package com.youlisten.matching;

import com.youlisten.google.YouTubeApiClient;
import com.youlisten.matching.MatchScorer.Preference;
import com.youlisten.song.PlaylistTrack;
import com.youlisten.song.Song;
import com.youlisten.song.SongRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/** Finds, scores and stores YouTube matches for ONE playlist track. Also re-ranks stored candidates for free. */
@Component
@RequiredArgsConstructor
public class TrackMatcher {

    public enum Outcome { CACHED, MATCHED, NO_RESULT }

    /** Most search results are kept (12), so the preference can be changed later without spending quota. */
    private static final int MAX_CANDIDATES = 12;

    private final YouTubeApiClient youTube;
    private final SongMatchRepository matchRepository;
    private final SongRepository songRepository;

    /**
     * @param track  a playlist track whose song is already loaded (join fetch)
     * @param accessTokenOrNull user's Google token; may be null when an API key does the searching
     */
    public Outcome matchTrack(PlaylistTrack track, String accessTokenOrNull, Preference preference) {
        Song song = track.getSong();
        Preference pref = preference == null ? Preference.VIDEO : preference;

        // 1. Reuse a confirmed match for the same song, but only if it is the kind the user wants (saves 101 quota units)
        for (SongMatch c : matchRepository.findConfirmedForSong(song.getId(), PageRequest.of(0, 5))) {
            MatchScorer.Kind kind = MatchScorer.classify(c.getCandidateTitle(), c.getCandidateChannel(), song.getTitle());
            if (kindAcceptable(kind, pref)) {
                matchRepository.save(SongMatch.builder()
                        .playlistTrackId(track.getId())
                        .candidateYoutubeId(c.getCandidateYoutubeId())
                        .candidateTitle(c.getCandidateTitle())
                        .candidateChannel(c.getCandidateChannel())
                        .candidateDurationMs(c.getCandidateDurationMs())
                        .confidenceScore(c.getConfidenceScore())
                        .matchMethod("cache")
                        .selected(true)
                        .confirmed(true)
                        .build());
                return Outcome.CACHED;
            }
        }

        // 2. Search YouTube
        String query = MatchScorer.buildQuery(song.getTitle(), song.getArtist());
        List<MatchScorer.Candidate> found = youTube.searchMusicVideos(query, accessTokenOrNull);
        if (found.isEmpty()) {
            matchRepository.save(SongMatch.builder()
                    .playlistTrackId(track.getId())
                    .matchMethod("NO_RESULT")
                    .confidenceScore(BigDecimal.ZERO)
                    .build());
            return Outcome.NO_RESULT;
        }

        // 3. Store all candidates, then score them for the chosen preference
        List<SongMatch> rows = new ArrayList<>();
        for (MatchScorer.Candidate c : found.stream().limit(MAX_CANDIDATES).toList()) {
            rows.add(SongMatch.builder()
                    .playlistTrackId(track.getId())
                    .candidateYoutubeId(c.videoId())
                    .candidateTitle(trunc(c.title(), 500))
                    .candidateChannel(trunc(c.channel(), 500))
                    .candidateDurationMs(c.durationMs())
                    .confidenceScore(BigDecimal.ZERO)
                    .matchMethod(MatchScorer.METHOD)
                    .build());
        }
        rescore(song, rows, pref);
        matchRepository.saveAll(rows);
        return Outcome.MATCHED;
    }

    /**
     * Re-scores already stored candidates for a preference and picks the best one. No YouTube calls.
     * Mutates the rows; the caller saves them.
     */
    public void rescore(Song song, List<SongMatch> rows, Preference preference) {
        Preference pref = preference == null ? Preference.VIDEO : preference;
        record Scored(SongMatch row, MatchScorer.Score score) {
        }
        List<Scored> scored = new ArrayList<>();
        for (SongMatch r : rows) {
            if (r.getCandidateYoutubeId() == null) {
                continue;
            }
            var candidate = new MatchScorer.Candidate(
                    r.getCandidateYoutubeId(), r.getCandidateTitle(), r.getCandidateChannel(), r.getCandidateDurationMs());
            scored.add(new Scored(r, MatchScorer.score(
                    song.getTitle(), song.getArtist(), song.getAlbum(), song.getDurationMs(), candidate, pref)));
        }
        scored.sort(Comparator.comparingDouble((Scored s) -> s.score().raw()).reversed());

        for (int i = 0; i < scored.size(); i++) {
            SongMatch r = scored.get(i).row();
            double total = scored.get(i).score().total();
            boolean best = i == 0;
            r.setConfidenceScore(BigDecimal.valueOf(total));
            r.setMatchMethod(MatchScorer.METHOD + ":" + pref.name());
            r.setSelected(best && total >= MatchScorer.REVIEW_MIN);
            r.setConfirmed(best && total >= MatchScorer.AUTO_CONFIRM);
        }
    }

    /** A cached match is reused when it is the wanted kind, or a plain upload we cannot classify. */
    private static boolean kindAcceptable(MatchScorer.Kind kind, Preference pref) {
        return switch (pref) {
            case VIDEO -> kind == MatchScorer.Kind.VIDEO || kind == MatchScorer.Kind.OTHER;
            case AUDIO -> kind == MatchScorer.Kind.AUDIO || kind == MatchScorer.Kind.OTHER;
            case LYRICS -> kind == MatchScorer.Kind.LYRICS;
        };
    }

    private static String trunc(String s, int max) {
        return s == null || s.length() <= max ? s : s.substring(0, max);
    }
}
