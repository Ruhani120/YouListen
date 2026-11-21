-- Song matching: a match can be auto-confirmed (high confidence) or confirmed by the user
ALTER TABLE song_matches ADD COLUMN confirmed BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_song_matches_playlist_track_id ON song_matches(playlist_track_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_song_matches_track_video
    ON song_matches(playlist_track_id, candidate_youtube_id)
    WHERE candidate_youtube_id IS NOT NULL;

-- Transfers: remember the privacy chosen for the YouTube playlist (needed when a job is resumed)
ALTER TABLE transfer_jobs ADD COLUMN destination_privacy VARCHAR(20) NOT NULL DEFAULT 'private';
