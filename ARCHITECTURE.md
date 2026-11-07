# YouListen — System Architecture

## Overview

YouListen is a cloud-native, multi-tier web application. Its primary workflow allows users to import Spotify playlist exports (CSV/JSON) and transfer matched tracks to YouTube via the YouTube Data API v3.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                           USER BROWSER                          │
│              React 18 + TypeScript + Vite + Tailwind            │
│         (SPA served from Nginx or S3+CloudFront in prod)        │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS REST API calls
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API GATEWAY (Production)                      │
│         Throttling · CORS · Routing · Request logging            │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│               SPRING BOOT API SERVICE (ECS Fargate)              │
│  Auth · Playlists · Import · Transfer initiation · Notifications │
│                        Port 8080                                 │
└────────┬─────────────────┬──────────────────┬───────────────────┘
         │                 │                  │
         ▼                 ▼                  ▼
  ┌──────────┐    ┌──────────────┐    ┌──────────────┐
  │PostgreSQL│    │   AWS S3     │    │   AWS SQS    │
  │  (RDS)   │    │ File Storage │    │ Transfer Jobs│
  └──────────┘    └──────────────┘    └──────┬───────┘
                                             │
                                             ▼
                                   ┌──────────────────┐
                                   │ BACKGROUND WORKER │
                                   │  (ECS Fargate)    │
                                   │  SQS consumer     │
                                   │  YouTube API calls │
                                   └────────┬──────────┘
                                            │
                              ┌─────────────┼─────────────┐
                              ▼             ▼             ▼
                        ┌──────────┐ ┌──────────┐ ┌──────────┐
                        │PostgreSQL│ │  AWS SNS │ │CloudWatch│
                        │(update   │ │(notify   │ │  (logs)  │
                        │job status│ │completion│ │          │
                        └──────────┘ └──────────┘ └──────────┘
```

---

## Application Layers

### 1. Frontend (React SPA)

| File/Module | Responsibility |
|-------------|---------------|
| `src/App.tsx` | Route definitions + auth guards |
| `src/layouts/AppLayout.tsx` | Sidebar + header shell |
| `src/pages/` | 17 page components |
| `src/components/` | Shared UI components |
| `src/store/authStore.ts` | Auth state (Zustand + localStorage) |
| `src/lib/api.ts` | Axios instance + interceptors |
| `src/hooks/` | React Query hooks for all API calls |

**State management:**
- Server state: TanStack Query (caching, refetching, mutations)
- Client state: Zustand (JWT token, current user, UI state)

### 2. Backend API (Spring Boot)

**Package structure: `com.youlisten`**

| Package | Contents |
|---------|----------|
| `auth` | Register, login, JWT token issuance |
| `user` | User profile, password management |
| `playlist` | Playlist CRUD, track ordering |
| `song` | Song entities, playlist-track join |
| `platform` | Platform registry, connected accounts |
| `transfer` | Transfer job management, status |
| `notification` | User notification creation and retrieval |
| `config` | Security, JWT, CORS, OpenAPI |
| `exception` | Global error handling |

**Security flow:**
```
Request → JwtAuthenticationFilter → extract JWT
                                  → load UserDetails
                                  → set SecurityContext
                                  → Controller
```

### 3. Background Worker

Runs as a separate deployable unit. Shares the same codebase but activates the `worker` Spring profile.

**Transfer processing loop:**
1. Receive SQS message: `{jobId, userId, playlistId}`
2. Load playlist tracks from PostgreSQL
3. For each track: search YouTube Data API v3
4. Rank candidates by confidence score (title match + artist match + duration proximity)
5. Auto-select if confidence ≥ 85%
6. Create YouTube playlist via API
7. Add selected videos to playlist
8. Update `transfer_jobs` and `transfer_tracks` in PostgreSQL
9. Publish completion event to SNS
10. Delete SQS message (acknowledge)

---

## Database Architecture

**Database name:** `harmonysync`
**ORM:** Hibernate / Spring Data JPA
**Migration:** Flyway

### Entity Relationship Overview

```
users
  │
  ├── playlists (user_id FK)
  │       │
  │       └── playlist_tracks (playlist_id FK)
  │                   │
  │                   └── songs (song_id FK)
  │                   │
  │                   └── song_matches (playlist_track_id FK)
  │
  ├── connected_accounts (user_id FK) → platforms
  │
  ├── transfer_jobs (user_id FK) → playlists
  │       │
  │       └── transfer_tracks (transfer_job_id FK) → playlist_tracks
  │
  ├── notifications (user_id FK)
  │
  └── imported_files (user_id FK)
```

Full schema: see [DATABASE_DESIGN.md](DATABASE_DESIGN.md)

---

## Authentication Flow

```
User submits login form
        ↓
POST /api/auth/login {email, password}
        ↓
AuthService: load user by email
        ↓
BCryptPasswordEncoder.matches(raw, hash)
        ↓
JwtTokenProvider.generateToken(userDetails)
        ↓
Return { token, user }
        ↓
Frontend: store token in Zustand (persisted to localStorage)
        ↓
Every subsequent request: Authorization: Bearer <token>
        ↓
JwtAuthenticationFilter: validate + set SecurityContext
        ↓
Controller: SecurityContextHolder.getContext().getAuthentication()
```

---

## Song Matching Algorithm

No machine learning. Pure metadata comparison:

```
Input: { title, artist, album, duration_ms, isrc }

Step 1: If ISRC available → search YouTube by ISRC → if single result, confidence = 95%

Step 2: Build search query = "{artist} {title}" → YouTube search API (max 5 results)

Step 3: For each candidate:
  score = 0
  + 40 points if title match (normalized Levenshtein ≤ 2)
  + 30 points if artist match (normalized, ignore featured artists)
  + 15 points if duration within ±10 seconds
  + 10 points if album name contains album keyword
  + 5 points if title contains "official" or "lyrics"

Step 4: Select highest-scoring candidate if score ≥ 60
  - score ≥ 85: auto-approve (green)
  - score 60–84: requires user confirmation (yellow)
  - score < 60: flag for manual selection (red)

Step 5: Store top 3 candidates in song_matches table for user review
```

---

## AWS Production Architecture

```
                    ┌─────────────────────┐
                    │      Route 53        │
                    │  youlisten.example   │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Application LB     │
                    │   (Public subnet)   │
                    └──────────┬──────────┘
                               │
              ┌────────────────▼─────────────────┐
              │            VPC 10.0.0.0/16        │
              │                                   │
              │  ┌─────────────────────────────┐  │
              │  │  Private Subnet (ECS)        │  │
              │  │  ┌──────────┐ ┌──────────┐  │  │
              │  │  │ API Task │ │  Worker  │  │  │
              │  │  │ (Fargate)│ │  Task    │  │  │
              │  │  └────┬─────┘ └────┬─────┘  │  │
              │  └───────┼────────────┼─────────┘  │
              │          │            │             │
              │  ┌───────▼────────────▼─────────┐  │
              │  │  Private Subnet (Data)        │  │
              │  │  ┌──────────────────────────┐│  │
              │  │  │  RDS PostgreSQL (Multi-AZ)││  │
              │  │  └──────────────────────────┘│  │
              │  └──────────────────────────────┘  │
              └────────────────────────────────────┘
                               │
              ┌────────────────┼─────────────────────┐
              ▼                ▼                     ▼
         ┌────────┐      ┌─────────┐           ┌────────┐
         │  S3    │      │   SQS   │           │CloudW. │
         │Uploads │      │Transfer │           │Logs +  │
         │Reports │      │Queue+DLQ│           │Alarms  │
         └────────┘      └─────────┘           └────────┘
              │
         ┌────▼────┐
         │ Lambda  │
         │(S3 trig)│
         └─────────┘
```

---

## Local vs Production Configuration

| Concern | Local (Docker Compose) | Production (AWS) |
|---------|----------------------|-----------------|
| Database | Local PostgreSQL container | RDS PostgreSQL (Multi-AZ) |
| File storage | Backend local temp | S3 bucket |
| Job queue | Synchronous (direct) | SQS FIFO queue |
| Secrets | .env variables | Secrets Manager |
| Logs | Console stdout | CloudWatch Logs |
| Containers | docker compose up | ECS Fargate |
| Images | Built locally | ECR |
| Networking | Docker bridge | VPC + Security Groups |

---

## Security Architecture

| Layer | Mechanism |
|-------|-----------|
| Transport | HTTPS (TLS 1.3) via ACM certificate |
| Authentication | JWT (HS256, 24hr expiry) |
| Authorization | Spring Security + method-level @PreAuthorize |
| Data isolation | Every query filters by authenticated user_id |
| Password storage | BCrypt (strength 12) |
| Secrets | AWS Secrets Manager (never in environment variables directly) |
| Network | RDS in private subnet (not internet-routable) |
| File uploads | Validation: type, size (max 10MB), structure |
| SQL injection | JPA parameterized queries (no string concatenation) |
| CORS | Explicit origin whitelist per environment |
| Rate limiting | API Gateway throttling (100 req/s per IP) |
