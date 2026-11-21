package com.youlisten.playlist;

import com.youlisten.song.PlaylistTrack;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PlaylistTrackRepository extends JpaRepository<PlaylistTrack, Long> {

    List<PlaylistTrack> findByPlaylistIdOrderByPosition(Long playlistId);

    /** Tracks with their song already loaded, so it is safe to read song fields outside a transaction. */
    @Query("select pt from PlaylistTrack pt join fetch pt.song "
            + "where pt.playlist.id = :playlistId order by pt.position asc")
    List<PlaylistTrack> findWithSongByPlaylistId(Long playlistId);

    @Query("select pt from PlaylistTrack pt join fetch pt.song where pt.id = :id")
    Optional<PlaylistTrack> findWithSongById(Long id);

    boolean existsByIdAndPlaylistUserId(Long id, Long userId);

    @Query("select pt.song.id from PlaylistTrack pt where pt.id = :id")
    Optional<Long> findSongIdById(Long id);

    @Query("select pt.playlist.id from PlaylistTrack pt where pt.id = :id")
    Optional<Long> findPlaylistIdById(Long id);
}
