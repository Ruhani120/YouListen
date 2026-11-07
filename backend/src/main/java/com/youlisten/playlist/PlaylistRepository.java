package com.youlisten.playlist;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PlaylistRepository extends JpaRepository<Playlist, Long> {

    List<Playlist> findByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<Playlist> findByIdAndUserId(Long id, Long userId);

    List<Playlist> findByUserIdAndIsFavoriteOrderByCreatedAtDesc(Long userId, boolean isFavorite);

    long countByUserId(Long userId);
}
