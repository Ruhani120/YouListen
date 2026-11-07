# YouListen — Feature Roadmap

Track implementation progress across all 30 core features and beyond.

## Legend
- ✅ Implemented and tested
- 🔧 Implemented, needs testing
- 🏗️ In progress
- ⏳ Planned
- 🔑 Requires API credentials
- ☁️ Requires cloud configuration
- 🚀 Requires deployment

---

## Phase 1 — Foundation (Auth, UI, Database) [Current]

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| — | Project structure | 🏗️ | Spring Boot + React + Docker |
| — | PostgreSQL schema | 🏗️ | 6 Flyway migrations |
| — | JWT authentication | 🏗️ | Register, login, logout |
| — | User registration | 🏗️ | Email + username |
| — | User login | 🏗️ | JWT token issuance |
| — | Protected routes (backend) | 🏗️ | Spring Security |
| — | Protected routes (frontend) | 🏗️ | React Router guard |
| — | Landing page | 🏗️ | Hero, features, pricing |
| — | Dashboard | 🏗️ | Stats, recent activity |
| — | All 17 page routes | 🏗️ | Navigation works |
| — | Dark UI design system | 🏗️ | Tailwind components |
| — | Docker Compose | 🏗️ | 3 services + postgres |

---

## Phase 2 — Import (Spotify CSV/JSON)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 1 | Spotify CSV import | ⏳ | Flexible column mapping |
| 2 | Spotify JSON import | ⏳ | Standard export format |
| 3 | Flexible file parsing | ⏳ | Handle format variations |
| 4 | Import preview | ⏳ | Review before saving |
| 5 | Duplicate detection | ⏳ | Within playlist and global |
| — | File validation | ⏳ | Type, size, structure |
| — | Invalid record handling | ⏳ | Highlight + skip |
| — | ISRC extraction | ⏳ | When present in export |

---

## Phase 3 — YouTube Transfer

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 6 | Automatic song matching | ⏳ | Metadata comparison |
| 7 | Matching confidence scores | ⏳ | 0–100% score display |
| 8 | Manual song correction | ⏳ | Select different candidate |
| 9 | Missing track identification | ⏳ | Unavailable on YouTube |
| 10 | Preserve playlist order | ⏳ | Position maintained |
| 11 | YouTube playlist creation | 🔑 | Needs Google OAuth |
| 12 | Bulk transfer | 🔑 | Needs YouTube Data API v3 |
| 13 | Transfer progress | ⏳ | Real-time progress UI |
| 14 | Retry failed transfers | ⏳ | Per-track retry |
| 15 | Resume incomplete transfers | ⏳ | Job state persistence |
| 16 | Transfer reports | ⏳ | Success/failure summary |
| — | Google OAuth connection | 🔑 | Requires Google Cloud project |
| — | YouTube video search | 🔑 | Requires API key |

---

## Phase 4 — Playlist Management

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 17 | Create playlists | ⏳ | Manual creation |
| 18 | Edit playlist details | ⏳ | Name, description, cover |
| 19 | Delete playlists | ⏳ | With confirmation |
| 20 | Merge playlists | ⏳ | Combine two playlists |
| 21 | Split playlists | ⏳ | Divide into two |
| 22 | Sort songs | ⏳ | By title, artist, duration |
| 23 | Search and filter | ⏳ | Within playlist |
| 24 | Bulk add/remove songs | ⏳ | Multi-select |
| 25 | Favorite playlists | ⏳ | Star/unstar |
| — | Connector interface | ⏳ | Reusable platform API |

---

## Phase 5 — Docker Optimization

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| — | Backend Dockerfile | 🔧 | Multi-stage, eclipse-temurin:21 |
| — | Frontend Dockerfile | 🔧 | Multi-stage, nginx |
| — | Docker Compose | 🔧 | 3 services + volume + healthcheck |
| — | Health checks | 🔧 | All services |
| — | Environment configuration | 🔧 | Via env vars |

---

## Phase 6 — AWS Core Services

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| — | S3 file storage | ☁️ | Uploaded playlists, exports |
| — | RDS PostgreSQL | ☁️ | Production database |
| — | SQS transfer queue | ☁️ | Async job processing |
| — | Dead-letter queue | ☁️ | Failed job handling |
| — | Async background worker | ☁️ | SQS consumer |
| — | Idempotent processing | ☁️ | Prevent duplicate transfers |

---

## Phase 7 — AWS Extended Services

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| — | ECS / Fargate | ☁️🚀 | Container orchestration |
| — | ECR | ☁️🚀 | Docker image registry |
| — | Lambda (upload trigger) | ☁️🚀 | S3 event-driven |
| — | API Gateway | ☁️🚀 | Managed API entry point |
| — | SNS notifications | ☁️🚀 | Transfer complete events |
| — | EventBridge scheduler | ☁️🚀 | Cleanup + sync jobs |
| — | VPC networking | ☁️🚀 | Public/private subnets |
| — | Secrets Manager | ☁️🚀 | API keys, DB credentials |
| — | Terraform IaC | ⏳ | infra/aws/ directory |

---

## Phase 8 — Production & Security

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| — | CloudWatch logs | ☁️🚀 | App + worker logs |
| — | CloudWatch alarms | ☁️🚀 | Error rate monitoring |
| — | IAM least-privilege | ☁️ | Task roles |
| — | Rate limiting | ⏳ | Per-user API limits |
| — | CORS hardening | 🔧 | Configured per profile |
| — | File upload size limits | ⏳ | Backend validation |
| — | SQL injection protection | 🔧 | JPA parameterized queries |
| — | OAuth token refresh | 🔑 | Google token refresh |

---

## User & Analytics Features

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 26 | Transfer history | ⏳ | Complete log |
| 27 | Playlist analytics | ⏳ | Charts + metrics |
| 28 | Song count / duration stats | ⏳ | Per playlist |
| 29 | Artist / album statistics | ⏳ | Library overview |
| 30 | Export reports | ⏳ | CSV/PDF download |

---

## Future Features (Post-Phase 9)

| Feature | Notes |
|---------|-------|
| Scheduled playlist sync | Automatic re-transfer on source change |
| Apple Music connector | Requires Apple MusicKit |
| Deezer connector | Deezer API |
| Tidal connector | Tidal API |
| Playlist backup | Export full library |
| Cross-platform comparison | Diff two platform playlists |
| Smart playlist organization | Tag-based grouping |
| Spotify OAuth (live import) | Real-time playlist reading |
| Mobile app | React Native |

---

## Phase 9 — Academic Documentation

| Document | Status |
|----------|--------|
| ARCHITECTURE.md | ⏳ |
| DATABASE_DESIGN.md | ⏳ |
| API_DOCUMENTATION.md | ⏳ |
| DOCKER_GUIDE.md | ⏳ |
| AWS_DEPLOYMENT_GUIDE.md | ⏳ |
| AZURE_COMPARISON.md | ⏳ |
| CLOUD_COMPUTING_MAPPING.md | ⏳ |
| ENVIRONMENT_SETUP.md | ⏳ |
