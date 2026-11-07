package com.youlisten.playlist;

import com.youlisten.exception.ResourceNotFoundException;
import com.youlisten.playlist.dto.PlaylistRequest;
import com.youlisten.playlist.dto.PlaylistResponse;
import com.youlisten.song.PlaylistTrack;
import com.youlisten.song.SongRepository;
import com.youlisten.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PlaylistService {

    private final PlaylistRepository playlistRepository;
    private final PlaylistTrackRepository playlistTrackRepository;

    public List<PlaylistResponse> getUserPlaylists(User user) {
        return playlistRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public PlaylistResponse createPlaylist(User user, PlaylistRequest request) {
        Playlist playlist = Playlist.builder()
                .user(user)
                .name(request.getName())
                .description(request.getDescription())
                .sourcePlatform(request.getSourcePlatform())
                .sourcePlaylistId(request.getSourcePlaylistId())
                .coverImageUrl(request.getCoverImageUrl())
                .isPublic(request.isPublic())
                .build();
        return toResponse(playlistRepository.save(playlist));
    }

    public PlaylistResponse getPlaylistById(Long id, User user) {
        Playlist playlist = findPlaylistByIdAndUser(id, user.getId());
        return toResponse(playlist);
    }

    @Transactional
    public PlaylistResponse updatePlaylist(Long id, User user, PlaylistRequest request) {
        Playlist playlist = findPlaylistByIdAndUser(id, user.getId());
        playlist.setName(request.getName());
        playlist.setDescription(request.getDescription());
        playlist.setCoverImageUrl(request.getCoverImageUrl());
        playlist.setPublic(request.isPublic());
        return toResponse(playlistRepository.save(playlist));
    }

    @Transactional
    public void deletePlaylist(Long id, User user) {
        Playlist playlist = findPlaylistByIdAndUser(id, user.getId());
        playlistRepository.delete(playlist);
    }

    @Transactional
    public PlaylistResponse toggleFavorite(Long id, User user) {
        Playlist playlist = findPlaylistByIdAndUser(id, user.getId());
        playlist.setFavorite(!playlist.isFavorite());
        return toResponse(playlistRepository.save(playlist));
    }

    public List<PlaylistTrack> getPlaylistTracks(Long id, User user) {
        findPlaylistByIdAndUser(id, user.getId());
        return playlistTrackRepository.findByPlaylistIdOrderByPosition(id);
    }

    private Playlist findPlaylistByIdAndUser(Long id, Long userId) {
        return playlistRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Playlist", "id", id));
    }

    public PlaylistResponse toResponse(Playlist playlist) {
        return PlaylistResponse.builder()
                .id(playlist.getId())
                .userId(playlist.getUser().getId())
                .name(playlist.getName())
                .description(playlist.getDescription())
                .sourcePlatform(playlist.getSourcePlatform())
                .sourcePlaylistId(playlist.getSourcePlaylistId())
                .coverImageUrl(playlist.getCoverImageUrl())
                .isPublic(playlist.isPublic())
                .isFavorite(playlist.isFavorite())
                .trackCount(playlist.getTrackCount())
                .totalDurationMs(playlist.getTotalDurationMs())
                .importSource(playlist.getImportSource())
                .importedFileName(playlist.getImportedFileName())
                .createdAt(playlist.getCreatedAt())
                .updatedAt(playlist.getUpdatedAt())
                .build();
    }
}
