# YouListen — Docker Guide

## Overview

YouListen uses Docker for consistent local development and production deployment.

## Service Architecture

| Service | Image | Port | Description |
|---------|-------|------|-------------|
| `postgres` | postgres:16-alpine | 5432 | Database |
| `backend` | Built from `./backend` | 8080 | Spring Boot API |
| `frontend` | Built from `./frontend` | 3000 | React app (Nginx) |

---

## Quick Start

### Prerequisites
- Docker Desktop 24+ for Windows
- Enable WSL2 backend in Docker Desktop settings

### Start all services

Open Command Prompt in the project root:

```cmd
cd C:\Users\3910r\.gemini\antigravity\scratch\youlisten

REM First time (builds images + starts)
docker compose up --build

REM Subsequent starts (uses cached images)
docker compose up

REM Start in background (detached)
docker compose up -d
```

### Access the application

| URL | Service |
|-----|---------|
| http://localhost:3000 | React Frontend |
| http://localhost:8080 | Spring Boot API |
| http://localhost:8080/swagger-ui.html | API Documentation |
| http://localhost:8080/actuator/health | Health check |

### Stop services

```cmd
REM Stop and remove containers (keeps database volume)
docker compose down

REM Stop and remove everything including database data
docker compose down -v
```

---

## Individual Service Commands

### Start database only (for local backend development)

```cmd
docker compose up postgres -d
```

### Rebuild a specific service

```cmd
REM Rebuild and restart backend only
docker compose up --build backend

REM Rebuild and restart frontend only
docker compose up --build frontend
```

### View logs

```cmd
REM All services
docker compose logs -f

REM Backend only
docker compose logs -f backend

REM Last 50 lines
docker compose logs --tail=50 backend
```

---

## Development Workflow (Hot Reload)

For active development, run the database in Docker but backend/frontend natively:

**Step 1 — Start database**
```cmd
docker compose up postgres -d
```

**Step 2 — Start backend** (open new CMD window)
```cmd
cd backend
mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=local
```

**Step 3 — Start frontend** (open new CMD window)
```cmd
cd frontend
npm run dev
```

Frontend runs at http://localhost:5173 with hot module replacement.
Backend runs at http://localhost:8080 with Spring DevTools restart.

---

## Dockerfile Details

### Backend (Multi-stage)

```
Stage 1 (builder): eclipse-temurin:21-jdk-alpine
  → Download Maven dependencies
  → Compile + package JAR

Stage 2 (runtime): eclipse-temurin:21-jre-alpine
  → Copy JAR only (smaller image, ~200MB vs ~600MB)
  → Run as non-root user 'youlisten'
  → Expose port 8080
```

### Frontend (Multi-stage)

```
Stage 1 (builder): node:22-alpine
  → npm ci (clean install)
  → npm run build (Vite production build)
  → Output: /app/dist/

Stage 2 (runtime): nginx:alpine
  → Copy dist/ to /usr/share/nginx/html
  → nginx.conf: SPA routing (all routes → index.html)
  → Expose port 80
```

---

## Environment Variables

All environment variables are set in `docker-compose.yml` for local development. No `.env` file needed.

| Variable | Default | Service |
|----------|---------|---------|
| `DB_HOST` | postgres | backend |
| `DB_PORT` | 5432 | backend |
| `DB_NAME` | harmonysync | backend |
| `DB_USERNAME` | youlisten | backend |
| `DB_PASSWORD` | youlisten_dev | backend |
| `JWT_SECRET` | (long dev key) | backend |
| `SPRING_PROFILES_ACTIVE` | local | backend |
| `VITE_API_BASE_URL` | http://localhost:8080 | frontend (build arg) |

---

## Health Checks

All services have health checks configured:

```cmd
REM Check service status
docker compose ps

REM Manual health check
curl http://localhost:8080/actuator/health
```

Backend waits for postgres to be healthy before starting (using `depends_on: condition: service_healthy`).

---

## Production Path

```
Local Development
      ↓
docker compose up --build          (test locally)
      ↓
docker build -t youlisten-backend  (build production image)
      ↓
aws ecr get-login-password | docker login ...
      ↓
docker tag youlisten-backend <account>.dkr.ecr.<region>.amazonaws.com/youlisten-backend
      ↓
docker push <account>.dkr.ecr.<region>.amazonaws.com/youlisten-backend
      ↓
ECS service update (uses new image from ECR)
```

See [AWS_DEPLOYMENT_GUIDE.md](AWS_DEPLOYMENT_GUIDE.md) for the complete production deployment guide.

---

## Common Issues

### Port already in use
```cmd
REM Find what's using port 8080
netstat -ano | findstr :8080

REM Kill the process (replace PID)
taskkill /PID <PID> /F
```

### Database connection refused
```cmd
REM Check postgres is healthy
docker compose ps postgres

REM Check postgres logs
docker compose logs postgres
```

### Backend fails to start (Flyway migration error)
```cmd
REM Reset the database completely
docker compose down -v
docker compose up --build
```

### Frontend build fails
```cmd
cd frontend
npm install
npm run build
```
