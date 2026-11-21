package com.youlisten.reverse;

import com.youlisten.exception.BadRequestException;
import com.youlisten.google.GoogleService;
import com.youlisten.google.YouTubeApiClient;
import com.youlisten.google.YouTubeApiClient.PlaylistInfo;
import com.youlisten.google.YouTubeApiClient.PlaylistItem;
import com.youlisten.imports.ImportService;
import com.youlisten.imports.ImportedTrack;
import com.youlisten.imports.dto.ImportDtos.ConfirmResponse;
import com.youlisten.playlist.Playlist;
import com.youlisten.playlist.PlaylistRepository;
import com.youlisten.reverse.dto.ReverseDtos.YouTubeImportResult;
import com.youlisten.reverse.dto.ReverseDtos.YouTubePlaylistDto;
import com.youlisten.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Pattern;

/** Reads a YouTube / YouTube Music playlist and saves it as a YouListen playlist. Costs about 1 quota unit per 50 tracks. */
@Service
@RequiredArgsConstructor
public class YouTubeImportService {

    private static final String PLATFORM = "youtube";
    private static final Pattern PLAYLIST_ID = Pattern.compile("^[A-Za-z0-9_-]{2,64}$");

    private final GoogleService googleService;
    private final YouTubeApiClient youTube;
    private final ImportService importService;
    private final PlaylistRepository playlistRepository;

    public List<YouTubePlaylistDto> listPlaylists(User user) {
        String token = googleService.accessToken(user.getId());
        Map<String, Long> imported = new java.util.HashMap<>();
        for (Playlist p : playlistRepository.findByUserIdAndSourcePlatform(user.getId(), PLATFORM)) {
            if (p.getSourcePlaylistId() != null) {
                imported.put(p.getSourcePlaylistId(), p.getId());
            }
        }
        List<YouTubePlaylistDto> out = new ArrayList<>();
        for (PlaylistInfo p : youTube.listMyPlaylists(token)) {
            Long importedId = imported.get(p.id());
            out.add(new YouTubePlaylistDto(p.id(), p.title(), p.thumbnail(), p.itemCount(), p.privacy(),
                    importedId != null, importedId));
        }
        return out;
    }

    public YouTubeImportResult importPlaylist(User user, String youtubePlaylistId) {
        if (youtubePlaylistId == null || !PLAYLIST_ID.matcher(youtubePlaylistId).matches()) {
            throw new BadRequestException("Invalid YouTube playlist id");
        }

        Optional<Playlist> existing = playlistRepository
                .findFirstByUserIdAndSourcePlatformAndSourcePlaylistId(user.getId(), PLATFORM, youtubePlaylistId);
        if (existing.isPresent()) {
            Playlist p = existing.get();
            return new YouTubeImportResult(p.getId(), p.getName(), p.getTrackCount(), 0, 0, true);
        }

        String token = googleService.accessToken(user.getId());
        PlaylistInfo info = youTube.getPlaylist(token, youtubePlaylistId);
        List<PlaylistItem> items = youTube.listPlaylistItems(token, youtubePlaylistId);

        // Deleted / private videos have no usable data
        List<PlaylistItem> usable = new ArrayList<>();
        int skipped = 0;
        for (PlaylistItem item : items) {
            boolean gone = item.videoId() == null
                    || item.title().equalsIgnoreCase("Deleted video")
                    || item.title().equalsIgnoreCase("Private video");
            if (gone) {
                skipped++;
            } else {
                usable.add(item);
            }
        }
        if (usable.isEmpty()) {
            throw new BadRequestException("That playlist has no videos YouListen can read.");
        }

        Map<String, Long> durations = youTube.getDurations(token, usable.stream().map(PlaylistItem::videoId).toList());

        List<ImportedTrack> tracks = new ArrayList<>();
        int lowConfidence = 0;
        for (PlaylistItem item : usable) {
            YouTubeTitleParser.Parsed parsed = YouTubeTitleParser.parse(item.title(), item.channel());
            if (!parsed.confident()) {
                lowConfidence++;
            }
            tracks.add(new ImportedTrack(parsed.title(), parsed.artist(), null,
                    durations.get(item.videoId()), null, null, item.videoId()));
        }

        ConfirmResponse saved = importService.saveNewPlaylist(user, info.title(), PLATFORM, youtubePlaylistId,
                "youtube", null, info.thumbnail(), null, tracks);
        return new YouTubeImportResult(saved.playlistId(), saved.name(), saved.trackCount(),
                skipped + saved.skippedCount(), lowConfidence, false);
    }
}
