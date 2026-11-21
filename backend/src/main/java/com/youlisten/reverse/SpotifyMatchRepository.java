package com.youlisten.reverse;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.List;

@Repository
public interface SpotifyMatchRepository extends JpaRepository<SpotifyMatch, Long> {

    List<SpotifyMatch> findByPlaylistTrackId(Long playlistTrackId);

    List<SpotifyMatch> findByPlaylistTrackIdIn(Collection<Long> playlistTrackIds);

    @Modifying
    @Transactional
    @Query("delete from SpotifyMatch m where m.playlistTrackId = :playlistTrackId")
    void deleteAllForTrack(Long playlistTrackId);
}
