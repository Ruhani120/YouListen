-- Song matching metadata table for tracking match confidence
CREATE TABLE song_matches (
    id BIGSERIAL PRIMARY KEY,
    playlist_track_id BIGINT NOT NULL REFERENCES playlist_tracks(id) ON DELETE CASCADE,
    candidate_youtube_id VARCHAR(100),
    candidate_title VARCHAR(500),
    candidate_channel VARCHAR(500),
    candidate_duration_ms BIGINT,
    confidence_score DECIMAL(5,2),
    match_method VARCHAR(100),
    is_selected BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
