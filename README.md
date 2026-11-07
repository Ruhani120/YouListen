# YouListen 🎵

> A Cloud-Based Multi-Platform Music Playlist Management and Migration System

[![Java](https://img.shields.io/badge/Java-21-orange)](https://openjdk.org/projects/jdk/21/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.6-6DB33F)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18-61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED)](https://docs.docker.com/compose/)
[![AWS](https://img.shields.io/badge/AWS-Primary%20Cloud-FF9900)](https://aws.amazon.com/)

---

## What is YouListen?

YouListen lets you migrate your music playlists between streaming platforms. Import your Spotify playlist (via CSV or JSON export), automatically match every song on YouTube, and create a new YouTube playlist — all from one dashboard.

**Core workflow:**
```
Spotify export (CSV/JSON)
        ↓
YouListen (import & parse)
        ↓
Song matching engine (title + artist + ISRC metadata)
        ↓
YouTube Data API v3 (create playlist + add videos)
        ↓
Transfer report + history
```

---

## Quick Start (Local Development)

### Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Docker Desktop | 24+ | Run all services |
| Docker Compose | v2+ | Orchestrate containers |
| Java JDK | 21+ | Backend development |
| Node.js | 20+ | Frontend development |

### Run with Docker Compose (Recommended)

```cmd
REM Clone or navigate to project root
cd C:\Users\3910r\.gemini\antigravity\scratch\youlisten

REM Start all services (database, backend, frontend)
docker compose up --build

REM Access:
REM   Frontend:  http://localhost:3000
REM   Backend:   http://localhost:8080
REM   API Docs:  http://localhost:8080/swagger-ui.html
REM   Health:    http://localhost:8080/actuator/health
```

### Run for Development (Hot Reload)

**Terminal 1 — Start PostgreSQL only:**
```cmd
docker compose up postgres
```

**Terminal 2 — Backend (Spring Boot):**
```cmd
cd backend
mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=local
```

**Terminal 3 — Frontend (Vite):**
```cmd
cd frontend
npm run dev
```

---

## Project Structure

```
youlisten/
├── backend/                    # Spring Boot API
│   ├── src/main/java/com/youlisten/
│   │   ├── auth/               # JWT authentication
│   │   ├── user/               # User management
│   │   ├── playlist/           # Playlist CRUD
│   │   ├── song/               # Song entities
│   │   ├── platform/           # Platform connectors
│   │   ├── transfer/           # Transfer jobs
│   │   ├── notification/       # User notifications
│   │   ├── config/             # Security, CORS, JWT
│   │   └── exception/          # Error handling
│   ├── src/main/resources/
│   │   ├── application.yml     # Base config
│   │   ├── application-local.yml
│   │   ├── application-prod.yml
│   │   └── db/migration/       # Flyway SQL migrations
│   ├── Dockerfile              # Multi-stage build
│   └── pom.xml
│
├── frontend/                   # React + TypeScript + Tailwind
│   ├── src/
│   │   ├── pages/              # 17 application pages
│   │   ├── components/         # Shared components
│   │   ├── layouts/            # App shell layout
│   │   ├── store/              # Zustand state
│   │   ├── lib/                # API client
│   │   └── hooks/              # React Query hooks
│   ├── Dockerfile              # Nginx static serve
│   └── nginx.conf
│
├── infra/
│   └── aws/                    # Terraform IaC (Phase 7)
│
├── docs/                       # Documentation
├── docker-compose.yml          # Local orchestration
├── README.md
├── ARCHITECTURE.md
├── DATABASE_DESIGN.md
├── API_DOCUMENTATION.md
├── DOCKER_GUIDE.md
├── AWS_DEPLOYMENT_GUIDE.md
├── AZURE_COMPARISON.md
├── CLOUD_COMPUTING_MAPPING.md
├── FEATURE_ROADMAP.md
└── ENVIRONMENT_SETUP.md
```

---

## Technology Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| React 18 | UI framework |
| TypeScript | Type safety |
| Vite | Build tool + dev server |
| Tailwind CSS | Utility-first styling |
| React Router v6 | Client-side routing |
| TanStack Query v5 | Server state management |
| Zustand | Client state (auth) |
| Axios | HTTP client |
| Recharts | Data visualization |
| Lucide React | Icons |

### Backend
| Technology | Purpose |
|-----------|---------|
| Java 21 (LTS) | Runtime |
| Spring Boot 3.3.6 | Application framework |
| Spring Security | Authentication + authorization |
| Spring Data JPA / Hibernate | ORM |
| Flyway | Database migrations |
| JJWT 0.12.x | JWT tokens |
| SpringDoc OpenAPI | API documentation |
| Lombok | Boilerplate reduction |
| Maven | Build tool |

### Infrastructure
| Technology | Purpose |
|-----------|---------|
| PostgreSQL 16 | Primary database |
| Docker + Compose | Containerization |
| AWS (Primary) | Production cloud |
| Azure (Comparative) | Academic comparison |

---

## Environment Variables

See [ENVIRONMENT_SETUP.md](ENVIRONMENT_SETUP.md) for the full reference.

**Minimum for local dev (Docker Compose handles these):**
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=harmonysync
DB_USERNAME=youlisten
DB_PASSWORD=youlisten_dev
JWT_SECRET=<at-least-256-bit-key>
```

---

## API Documentation

After starting the backend, visit:
- **Swagger UI**: http://localhost:8080/swagger-ui.html
- **OpenAPI JSON**: http://localhost:8080/v3/api-docs

See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for the full reference.

---

## Development Phases

| Phase | Scope | Status |
|-------|-------|--------|
| Phase 1 | Architecture, Auth, UI, PostgreSQL | ✅ In Progress |
| Phase 2 | Spotify CSV/JSON import, playlist management | ⏳ Planned |
| Phase 3 | YouTube OAuth, song matching, transfer | ⏳ Planned |
| Phase 4 | Multi-platform connector architecture | ⏳ Planned |
| Phase 5 | Docker optimization | ⏳ Planned |
| Phase 6 | S3, RDS, SQS integration | ⏳ Planned |
| Phase 7 | ECS, ECR, Lambda, API Gateway | ⏳ Planned |
| Phase 8 | CloudWatch, security hardening, production | ⏳ Planned |
| Phase 9 | Azure comparison, academic docs | ⏳ Planned |

---

## License

Academic project — final-year Cloud Computing. Not for redistribution.
