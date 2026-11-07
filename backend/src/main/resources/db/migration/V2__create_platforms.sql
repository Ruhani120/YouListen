CREATE TABLE platforms (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    icon_url VARCHAR(500),
    supports_import BOOLEAN NOT NULL DEFAULT FALSE,
    supports_export BOOLEAN NOT NULL DEFAULT FALSE,
    supports_oauth BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE connected_accounts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform_id BIGINT NOT NULL REFERENCES platforms(id),
    platform_user_id VARCHAR(255),
    platform_username VARCHAR(255),
    platform_email VARCHAR(255),
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP,
    scope VARCHAR(1000),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    connected_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, platform_id)
);

INSERT INTO platforms (name, display_name, supports_import, supports_export, supports_oauth, is_active) VALUES
('spotify', 'Spotify', TRUE, FALSE, TRUE, TRUE),
('youtube', 'YouTube', FALSE, TRUE, TRUE, TRUE),
('apple_music', 'Apple Music', FALSE, FALSE, FALSE, FALSE),
('deezer', 'Deezer', FALSE, FALSE, FALSE, FALSE),
('tidal', 'Tidal', FALSE, FALSE, FALSE, FALSE);
