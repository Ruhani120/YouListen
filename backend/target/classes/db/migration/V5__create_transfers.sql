CREATE TABLE transfer_jobs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    source_playlist_id BIGINT NOT NULL REFERENCES playlists(id),
    destination_platform VARCHAR(100) NOT NULL,
    destination_playlist_id VARCHAR(500),
    destination_playlist_name VARCHAR(500),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    total_tracks INT NOT NULL DEFAULT 0,
    matched_tracks INT NOT NULL DEFAULT 0,
    transferred_tracks INT NOT NULL DEFAULT 0,
    failed_tracks INT NOT NULL DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE transfer_tracks (
    id BIGSERIAL PRIMARY KEY,
    transfer_job_id BIGINT NOT NULL REFERENCES transfer_jobs(id) ON DELETE CASCADE,
    playlist_track_id BIGINT NOT NULL REFERENCES playlist_tracks(id),
    youtube_video_id VARCHAR(100),
    youtube_video_title VARCHAR(500),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    confidence_score DECIMAL(5,2),
    error_message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transfer_jobs_user_id ON transfer_jobs(user_id);
CREATE INDEX idx_transfer_jobs_status ON transfer_jobs(status);
CREATE INDEX idx_transfer_tracks_job_id ON transfer_tracks(transfer_job_id);
