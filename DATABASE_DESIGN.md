# YouListen — PostgreSQL Database Design

## Database Configuration

- **RDBMS**: PostgreSQL 16 (Relational, ACID-compliant)
- **Database Name**: `harmonysync`
- **Migration Engine**: Flyway (versioned migrations in `src/main/resources/db/migration/`)
- **Naming Convention**: `snake_case` for tables and columns, singular table names or domain groups

---

## Entity Relationship Overview

```
                      +------------------+
                      |      users       |
                      +--------+---------+
                               |
         +---------------------+---------------------+
         | 1:N                 | 1:N                 | 1:N
+--------v---------+  +--------v---------+  +--------v---------+
|    playlists     |  |connected_accounts|  |  notifications   |
+--------+---------+  +--------+---------+  +------------------+
         |                     | N:1
         | 1:N        +--------v---------+
+--------v---------+  |    platforms     |
| playlist_tracks  |  +------------------+
+----+--------+----+
     |        |
     | N:1    | 1:N
     |        +-----------------+
     |                          |
+----v-----+           +--------v---------+
|  songs   |           |   song_matches   |
+----+-----+           +------------------+
     |
     | (referenced by)
     |
+----v-------------+
| transfer_tracks  |
+--------^---------+
         | N:1
+--------+---------+
|  transfer_jobs   |
+--------^---------+
         | N:1
         +--- users (1:N) & playlists (1:N)
```

---

## Detailed Table Schemas

### 1. `users` Table (Migration: V1)
Stores authenticated user accounts.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `BIGSERIAL` | `PRIMARY KEY` | Unique user identifier |
| `email` | `VARCHAR(255)` | `NOT NULL, UNIQUE` | User login email |
| `username` | `VARCHAR(100)` | `NOT NULL, UNIQUE` | Unique handle / profile username |
| `password_hash` | `VARCHAR(255)` | `NOT NULL` | BCrypt encrypted password hash (strength 12) |
| `display_name` | `VARCHAR(255)` | | Human-friendly display name |
| `avatar_url` | `VARCHAR(500)` | | Optional avatar URL or S3 key |
| `role` | `VARCHAR(50)` | `NOT NULL DEFAULT 'USER'` | Authority role (`USER`, `ADMIN`) |
| `is_active` | `BOOLEAN` | `NOT NULL DEFAULT TRUE` | Soft delete / account status |
| `email_verified` | `BOOLEAN` | `NOT NULL DEFAULT FALSE` | Email verification flag |
| `created_at` | `TIMESTAMP` | `NOT NULL DEFAULT NOW()` | Record creation timestamp |
| `updated_at` | `TIMESTAMP` | `NOT NULL DEFAULT NOW()` | Record update timestamp |

**Indexes:**
- `idx_users_email` ON `users(email)`
- `idx_users_username` ON `users(username)`

---

### 2. `platforms` Table (Migration: V2)
Registry of supported and future streaming platforms.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `BIGSERIAL` | `PRIMARY KEY` | Platform identifier |
| `name` | `VARCHAR(100)` | `NOT NULL, UNIQUE` | Canonical code (`spotify`, `youtube`, `apple_music`) |
| `display_name` | `VARCHAR(100)` | `NOT NULL` | Human-friendly name |
| `icon_url` | `VARCHAR(500)` | | Platform icon or logo |
| `supports_import`| `BOOLEAN` | `DEFAULT FALSE` | True if platform supports source exports |
| `supports_export`| `BOOLEAN` | `DEFAULT FALSE` | True if platform supports target creation |
| `supports_oauth` | `BOOLEAN` | `DEFAULT FALSE` | True if OAuth token flow is supported |
| `is_active` | `BOOLEAN` | `DEFAULT TRUE` | Platform availability toggle |
| `created_at` | `TIMESTAMP` | `DEFAULT NOW()` | Record creation timestamp |

---

### 3. `connected_accounts` Table (Migration: V2)
Manages user OAuth tokens and platform authorization state.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `BIGSERIAL` | `PRIMARY KEY` | Record ID |
| `user_id` | `BIGINT` | `FK -> users(id) ON DELETE CASCADE` | Account owner |
| `platform_id` | `BIGINT` | `FK -> platforms(id)` | Linked platform |
| `platform_user_id` | `VARCHAR(255)` | | Remote user ID |
| `platform_username`| `VARCHAR(255)` | | Remote profile handle |
| `platform_email` | `VARCHAR(255)` | | Remote email |
| `access_token` | `TEXT` | | Encrypted OAuth access token |
| `refresh_token`| `TEXT` | | Encrypted OAuth refresh token |
| `token_expires_at` | `TIMESTAMP` | | Expiration timestamp |
| `scope` | `VARCHAR(1000)` | | Authorized OAuth scopes |
| `is_active` | `BOOLEAN` | `DEFAULT TRUE` | Active connection flag |
| `connected_at` | `TIMESTAMP` | `DEFAULT NOW()` | Initial authorization timestamp |
| `updated_at` | `TIMESTAMP` | `DEFAULT NOW()` | Token refresh timestamp |

**Unique Constraint:** `(user_id, platform_id)`

---

### 4. `playlists` Table (Migration: V3)
Represents user playlists (imported or created).

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `BIGSERIAL` | `PRIMARY KEY` | Playlist identifier |
| `user_id` | `BIGINT` | `FK -> users(id) ON DELETE CASCADE` | Playlist owner |
| `name` | `VARCHAR(500)` | `NOT NULL` | Playlist title |
| `description` | `TEXT` | | Optional description |
| `source_platform` | `VARCHAR(100)` | | Source platform (`spotify`, `custom`) |
| `source_playlist_id`| `VARCHAR(500)` | | External playlist ID if exported |
| `cover_image_url` | `VARCHAR(1000)` | | Cover image URL |
| `is_public` | `BOOLEAN` | `DEFAULT FALSE` | Public visibility flag |
| `is_favorite` | `BOOLEAN` | `DEFAULT FALSE` | Favorited flag |
| `track_count` | `INT` | `DEFAULT 0` | Total number of tracks |
| `total_duration_ms` | `BIGINT` | `DEFAULT 0` | Total duration in milliseconds |
| `import_source` | `VARCHAR(100)` | | Import format (`csv`, `json`, `api`) |
| `imported_file_name` | `VARCHAR(500)` | | Name of user-uploaded file |
| `created_at` | `TIMESTAMP` | `DEFAULT NOW()` | Creation timestamp |
| `updated_at` | `TIMESTAMP` | `DEFAULT NOW()` | Update timestamp |

**Indexes:**
- `idx_playlists_user_id` ON `playlists(user_id)`
- `idx_playlists_source_platform` ON `playlists(source_platform)`

---

### 5. `songs` Table (Migration: V3)
Master song records identified by title, artist, album, and ISRC.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `BIGSERIAL` | `PRIMARY KEY` | Song identifier |
| `title` | `VARCHAR(500)` | `NOT NULL` | Standardized track title |
| `artist` | `VARCHAR(500)` | | Standardized primary artist |
| `album` | `VARCHAR(500)` | | Album title |
| `duration_ms` | `BIGINT` | | Track duration in milliseconds |
| `isrc` | `VARCHAR(20)` | | International Standard Recording Code |
| `spotify_id` | `VARCHAR(100)` | | Spotify track URI or ID |
| `youtube_id` | `VARCHAR(100)` | | YouTube video ID |
| `thumbnail_url` | `VARCHAR(1000)` | | Track thumbnail image |
| `created_at` | `TIMESTAMP` | `DEFAULT NOW()` | Creation timestamp |
| `updated_at` | `TIMESTAMP` | `DEFAULT NOW()` | Update timestamp |

**Indexes:**
- `idx_songs_isrc` ON `songs(isrc)`
- `idx_songs_spotify_id` ON `songs(spotify_id)`

---

### 6. `playlist_tracks` Table (Migration: V3)
Ordered join table linking playlists to songs.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `BIGSERIAL` | `PRIMARY KEY` | Join record ID |
| `playlist_id` | `BIGINT` | `FK -> playlists(id) ON DELETE CASCADE` | Parent playlist |
| `song_id` | `BIGINT` | `FK -> songs(id)` | Linked song |
| `position` | `INT` | `NOT NULL DEFAULT 0` | Sequential track index (1-based) |
| `added_at` | `TIMESTAMP` | `DEFAULT NOW()` | Date added |

**Unique Constraint:** `(playlist_id, song_id)`  
**Index:** `idx_playlist_tracks_playlist_id` ON `playlist_tracks(playlist_id)`

---

### 7. `song_matches` Table (Migration: V4)
Deterministic candidate matches from the search engine.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `BIGSERIAL` | `PRIMARY KEY` | Match record ID |
| `playlist_track_id` | `BIGINT` | `FK -> playlist_tracks(id) ON DELETE CASCADE` | Track being matched |
| `candidate_youtube_id` | `VARCHAR(100)` | | YouTube video candidate ID |
| `candidate_title` | `VARCHAR(500)` | | YouTube video title |
| `candidate_channel` | `VARCHAR(500)` | | Channel / publisher name |
| `candidate_duration_ms` | `BIGINT` | | Duration in milliseconds |
| `confidence_score` | `DECIMAL(5,2)` | | Deterministic score (0.00 to 100.00) |
| `match_method` | `VARCHAR(100)` | | `ISRC_EXACT`, `TITLE_ARTIST`, `NORMALIZED_FUZZY` |
| `is_selected` | `BOOLEAN` | `DEFAULT FALSE` | True if chosen for YouTube insertion |
| `created_at` | `TIMESTAMP` | `DEFAULT NOW()` | Creation timestamp |

---

### 8. `transfer_jobs` Table (Migration: V5)
Tracks asynchronous batch migration jobs executed by workers.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `BIGSERIAL` | `PRIMARY KEY` | Transfer job ID |
| `user_id` | `BIGINT` | `FK -> users(id) ON DELETE CASCADE` | Job initiator |
| `source_playlist_id` | `BIGINT` | `FK -> playlists(id)` | Source playlist |
| `destination_platform` | `VARCHAR(100)` | `NOT NULL` | Target platform (`youtube`) |
| `destination_playlist_id` | `VARCHAR(500)` | | Created external playlist ID |
| `destination_playlist_name` | `VARCHAR(500)` | | Title on destination |
| `status` | `VARCHAR(50)` | `DEFAULT 'PENDING'` | `PENDING`, `IN_PROGRESS`, `COMPLETED`, `FAILED`, `CANCELLED` |
| `total_tracks` | `INT` | `DEFAULT 0` | Total tracks in job |
| `matched_tracks` | `INT` | `DEFAULT 0` | Successfully matched tracks |
| `transferred_tracks`| `INT` | `DEFAULT 0` | Successfully inserted tracks |
| `failed_tracks` | `INT` | `DEFAULT 0` | Failed track count |
| `error_message` | `TEXT` | | Failure description if aborted |
| `started_at` | `TIMESTAMP` | | Worker processing start timestamp |
| `completed_at` | `TIMESTAMP` | | Worker processing completion timestamp |
| `created_at` | `TIMESTAMP` | `DEFAULT NOW()` | Job creation timestamp |
| `updated_at` | `TIMESTAMP` | `DEFAULT NOW()` | Job update timestamp |

**Indexes:**
- `idx_transfer_jobs_user_id` ON `transfer_jobs(user_id)`
- `idx_transfer_jobs_status` ON `transfer_jobs(status)`

---

### 9. `transfer_tracks` Table (Migration: V5)
Audit log of individual track transfer outcomes within a job.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `BIGSERIAL` | `PRIMARY KEY` | Transfer track ID |
| `transfer_job_id` | `BIGINT` | `FK -> transfer_jobs(id) ON DELETE CASCADE` | Parent transfer job |
| `playlist_track_id` | `BIGINT` | `FK -> playlist_tracks(id)` | Original track |
| `youtube_video_id` | `VARCHAR(100)` | | Target video ID inserted |
| `youtube_video_title` | `VARCHAR(500)` | | Target video title |
| `status` | `VARCHAR(50)` | `DEFAULT 'PENDING'` | `PENDING`, `TRANSFERRED`, `FAILED`, `SKIPPED` |
| `confidence_score` | `DECIMAL(5,2)` | | Match confidence at transfer time |
| `error_message` | `TEXT` | | Error details if insertion failed |
| `created_at` | `TIMESTAMP` | `DEFAULT NOW()` | Record creation timestamp |
| `updated_at` | `TIMESTAMP` | `DEFAULT NOW()` | Record update timestamp |

**Index:** `idx_transfer_tracks_job_id` ON `transfer_tracks(transfer_job_id)`

---

### 10. `notifications` Table (Migration: V6)
Stores user notifications regarding transfers, matching, and system events.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `BIGSERIAL` | `PRIMARY KEY` | Notification identifier |
| `user_id` | `BIGINT` | `FK -> users(id) ON DELETE CASCADE` | Target user |
| `title` | `VARCHAR(255)` | `NOT NULL` | Alert headline |
| `message` | `TEXT` | `NOT NULL` | Detailed description |
| `type` | `VARCHAR(50)` | `DEFAULT 'INFO'` | `INFO`, `SUCCESS`, `WARNING`, `ERROR` |
| `is_read` | `BOOLEAN` | `DEFAULT FALSE` | Read status |
| `action_url` | `VARCHAR(500)` | | Optional internal link |
| `created_at` | `TIMESTAMP` | `DEFAULT NOW()` | Timestamp |

**Indexes:**
- `idx_notifications_user_id` ON `notifications(user_id)`
- `idx_notifications_is_read` ON `notifications(is_read)`
