package com.youlisten.imports;

import com.youlisten.exception.BadRequestException;
import com.youlisten.imports.dto.ImportDtos.ConfirmRequest;
import com.youlisten.imports.dto.ImportDtos.ConfirmResponse;
import com.youlisten.imports.dto.ImportDtos.PreviewResponse;
import com.youlisten.imports.dto.ImportDtos.TrackInput;
import com.youlisten.playlist.Playlist;
import com.youlisten.playlist.PlaylistRepository;
import com.youlisten.playlist.PlaylistTrackRepository;
import com.youlisten.song.PlaylistTrack;
import com.youlisten.song.Song;
import com.youlisten.song.SongRepository;
import com.youlisten.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ImportService {

    private static final long SAME_SONG_TOLERANCE_MS = 5_000;

    private final PlaylistRepository playlistRepository;
    private final PlaylistTrackRepository playlistTrackRepository;
    private final SongRepository songRepository;
    private final TransactionTemplate transactionTemplate;

    /** Parses the file and reports what was found. Nothing is saved. */
    public PreviewResponse preview(String fileName, byte[] content) {
        FileImportParser.Result result;
        try {
            result = FileImportParser.parse(fileName, content);
        } catch (IllegalArgumentException e) {
            throw new BadRequestException(e.getMessage());
        }
        List<ParsedTrack> tracks = result.tracks();
        int valid = (int) tracks.stream().filter(ParsedTrack::valid).count();
        int isrc = (int) tracks.stream().filter(t -> t.valid() && t.isrc() != null).count();
        return new PreviewResponse(fileName, result.format(), tracks.size(), valid, tracks.size() - valid, isrc, tracks);
    }

    /** Saves the (previewed) file tracks as a new playlist owned by the user. */
    public ConfirmResponse confirm(User user, ConfirmRequest request) {
        List<ImportedTrack> usable = request.tracks().stream()
                .filter(t -> t != null && t.title() != null && !t.title().isBlank())
                .map(t -> new ImportedTrack(t.title(), t.artist(), t.album(), t.durationMs(), t.isrc(), t.spotifyId(), null))
                .toList();
        if (usable.isEmpty()) {
            throw new BadRequestException("There are no valid tracks to import.");
        }
        String format = request.format() == null ? "file" : request.format().toLowerCase();
        int skippedBlank = request.tracks().size() - usable.size();

        ConfirmResponse saved = saveNewPlaylist(user, request.name().trim(), "file", null, format,
                request.fileName(), null, null, usable);
        return new ConfirmResponse(saved.playlistId(), saved.name(), saved.trackCount(), saved.skippedCount() + skippedBlank);
    }

    /**
     * Saves tracks as a new playlist. Used by the file import and by the YouTube import.
     * Songs are de-duplicated (Spotify id, ISRC, YouTube id, then title + artist), and the same song
     * appearing twice in one playlist is stored once (playlist_tracks is unique per playlist and song).
     */
    public ConfirmResponse saveNewPlaylist(User user, String name, String sourcePlatform, String sourcePlaylistId,
                                           String importSource, String fileName, String coverUrl, String description,
                                           List<ImportedTrack> tracks) {
        return transactionTemplate.execute(status -> {
            Playlist playlist = playlistRepository.save(Playlist.builder()
                    .user(user)
                    .name(trunc(name, 500))
                    .description(description)
                    .sourcePlatform(sourcePlatform)
                    .sourcePlaylistId(sourcePlaylistId)
                    .coverImageUrl(trunc(coverUrl, 1000))
                    .importSource(importSource)
                    .importedFileName(fileName)
                    .isPublic(false)
                    .build());

            Set<Long> seen = new HashSet<>();
            int position = 0;
            int skipped = 0;
            long totalDuration = 0;

            for (ImportedTrack input : tracks) {
                Song song = findOrCreateSong(input);
                if (!seen.add(song.getId())) {
                    skipped++;
                    continue;
                }
                playlistTrackRepository.save(PlaylistTrack.builder()
                        .playlist(playlist)
                        .song(song)
                        .position(position++)
                        .build());
                totalDuration += song.getDurationMs() == null ? 0 : song.getDurationMs();
            }

            playlist.setTrackCount(position);
            playlist.setTotalDurationMs(totalDuration);
            playlistRepository.save(playlist);
            return new ConfirmResponse(playlist.getId(), playlist.getName(), position, skipped);
        });
    }

    // ───────────────────────── helpers ─────────────────────────

    private Song findOrCreateSong(ImportedTrack t) {
        Optional<Song> existing = Optional.empty();
        if (notBlank(t.spotifyId())) {
            existing = songRepository.findFirstBySpotifyId(t.spotifyId());
        }
        if (existing.isEmpty() && notBlank(t.isrc())) {
            existing = songRepository.findFirstByIsrc(t.isrc());
        }
        if (existing.isEmpty() && notBlank(t.youtubeId())) {
            existing = songRepository.findFirstByYoutubeId(t.youtubeId());
        }
        if (existing.isEmpty() && notBlank(t.artist())) {
            existing = songRepository.findFirstByTitleIgnoreCaseAndArtistIgnoreCase(t.title().trim(), t.artist().trim())
                    .filter(s -> sameLength(s.getDurationMs(), t.durationMs()));
        }
        if (existing.isPresent()) {
            return existing.get();
        }
        return songRepository.save(Song.builder()
                .title(trunc(t.title().trim(), 500))
                .artist(trunc(blankToNull(t.artist()), 500))
                .album(trunc(blankToNull(t.album()), 500))
                .durationMs(t.durationMs() != null && t.durationMs() > 0 ? t.durationMs() : null)
                .isrc(blankToNull(t.isrc()))
                .spotifyId(blankToNull(t.spotifyId()))
                .youtubeId(blankToNull(t.youtubeId()))
                .build());
    }

    /** Different versions (live, extended) of one song have different lengths, so they stay separate rows. */
    private static boolean sameLength(Long a, Long b) {
        if (a == null || b == null) {
            return true;
        }
        return Math.abs(a - b) <= SAME_SONG_TOLERANCE_MS;
    }

    private static boolean notBlank(String s) {
        return s != null && !s.isBlank();
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }

    private static String trunc(String s, int max) {
        return s == null || s.length() <= max ? s : s.substring(0, max);
    }
}
