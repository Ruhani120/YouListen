package com.youlisten.matching;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.List;

@Repository
public interface SongMatchRepository extends JpaRepository<SongMatch, Long> {

    List<SongMatch> findByPlaylistTrackId(Long playlistTrackId);

    List<SongMatch> findByPlaylistTrackIdIn(Collection<Long> playlistTrackIds);

    @Modifying
    @Transactional
    @Query("delete from SongMatch m where m.playlistTrackId = :playlistTrackId")
    void deleteAllForTrack(Long playlistTrackId);

    /** Reuse: a confirmed match for the same song in any playlist saves YouTube quota. */
    @Query("select m from SongMatch m where m.selected = true and m.confirmed = true "
            + "and m.candidateYoutubeId is not null "
            + "and m.playlistTrackId in (select pt.id from PlaylistTrack pt where pt.song.id = :songId) "
            + "order by m.createdAt desc")
    List<SongMatch> findConfirmedForSong(Long songId, Pageable pageable);
}
