-- YouTube -> Spotify direction: Spotify candidates for each playlist track
CREATE TABLE spotify_matches (
    id BIGSERIAL PRIMARY KEY,
    playlist_track_id BIGINT NOT NULL REFERENCES playlist_tracks(id) ON DELETE CASCADE,
    spotify_track_id VARCHAR(64),      -- NULL for the "searched, found nothing" placeholder row
    spotify_uri VARCHAR(100),
    title VARCHAR(500),
    artist VARCHAR(500),
    album VARCHAR(500),
    duration_ms BIGINT,
    isrc VARCHAR(20),
    cover_url VARCHAR(1000),
    confidence_score DECIMAL(5,2),
    is_selected BOOLEAN NOT NULL DEFAULT FALSE,
    confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_spotify_matches_playlist_track_id ON spotify_matches(playlist_track_id);
CREATE UNIQUE INDEX uq_spotify_matches_track_candidate
    ON spotify_matches(playlist_track_id, spotify_track_id)
    WHERE spotify_track_id IS NOT NULL;
