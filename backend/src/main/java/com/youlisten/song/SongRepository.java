package com.youlisten.song;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SongRepository extends JpaRepository<Song, Long> {

    Optional<Song> findByIsrc(String isrc);

    Optional<Song> findBySpotifyId(String spotifyId);

    Optional<Song> findByYoutubeId(String youtubeId);

    // "First" variants never throw when duplicates exist (used by the file import)
    Optional<Song> findFirstBySpotifyId(String spotifyId);

    Optional<Song> findFirstByIsrc(String isrc);

    Optional<Song> findFirstByYoutubeId(String youtubeId);

    Optional<Song> findFirstByTitleIgnoreCaseAndArtistIgnoreCase(String title, String artist);
}
