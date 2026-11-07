package com.youlisten.playlist;

import com.youlisten.exception.ResourceNotFoundException;
import com.youlisten.playlist.dto.PlaylistRequest;
import com.youlisten.playlist.dto.PlaylistResponse;
import com.youlisten.user.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PlaylistServiceTest {

    @Mock
    private PlaylistRepository playlistRepository;

    @Mock
    private PlaylistTrackRepository playlistTrackRepository;

    @InjectMocks
    private PlaylistService playlistService;

    private User testUser;
    private Playlist testPlaylist;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L)
                .email("test@example.com")
                .username("testuser")
                .passwordHash("hash")
                .role("USER")
                .build();

        testPlaylist = Playlist.builder()
                .id(1L)
                .user(testUser)
                .name("My Playlist")
                .description("Test description")
                .build();
    }

    @Test
    void getUserPlaylists_returnsPlaylistsForUser() {
        when(playlistRepository.findByUserIdOrderByCreatedAtDesc(testUser.getId()))
                .thenReturn(List.of(testPlaylist));

        List<PlaylistResponse> result = playlistService.getUserPlaylists(testUser);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getName()).isEqualTo("My Playlist");
    }

    @Test
    void createPlaylist_savesAndReturnsResponse() {
        PlaylistRequest request = new PlaylistRequest();
        request.setName("New Playlist");
        request.setDescription("Description");

        Playlist saved = Playlist.builder()
                .id(2L)
                .user(testUser)
                .name("New Playlist")
                .description("Description")
                .build();

        when(playlistRepository.save(any(Playlist.class))).thenReturn(saved);

        PlaylistResponse result = playlistService.createPlaylist(testUser, request);

        assertThat(result.getName()).isEqualTo("New Playlist");
        assertThat(result.getId()).isEqualTo(2L);
        verify(playlistRepository, times(1)).save(any(Playlist.class));
    }

    @Test
    void getPlaylistById_withWrongUser_throwsException() {
        when(playlistRepository.findByIdAndUserId(1L, testUser.getId())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> playlistService.getPlaylistById(1L, testUser))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void toggleFavorite_flipsFavoriteStatus() {
        testPlaylist.setFavorite(false);
        when(playlistRepository.findByIdAndUserId(1L, testUser.getId())).thenReturn(Optional.of(testPlaylist));
        when(playlistRepository.save(any(Playlist.class))).thenAnswer(inv -> inv.getArgument(0));

        PlaylistResponse result = playlistService.toggleFavorite(1L, testUser);

        assertThat(result.isFavorite()).isTrue();
    }
}
