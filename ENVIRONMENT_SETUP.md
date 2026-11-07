# YouListen — Environment Setup

## Local Development

### Required Environment Variables

#### Backend (`backend/src/main/resources/application-local.yml`)
```yaml
# Database (Docker Compose sets these automatically)
DB_HOST: localhost
DB_PORT: 5432
DB_NAME: harmonysync
DB_USERNAME: youlisten
DB_PASSWORD: youlisten_dev

# JWT (change for production)
JWT_SECRET: youlisten-dev-jwt-secret-must-be-at-least-256-bits-long-for-hs256

# CORS
CORS_ORIGINS: http://localhost:5173,http://localhost:3000
```

#### Frontend (`frontend/.env.local`)
```env
VITE_API_BASE_URL=http://localhost:8080
```

---

## Production Environment Variables

> ⚠️ NEVER commit these to source control.
> Store production secrets in AWS Secrets Manager.

### Backend (ECS Task Environment)
```
SPRING_PROFILES_ACTIVE=prod
DB_HOST=<rds-endpoint>.rds.amazonaws.com
DB_PORT=5432
DB_NAME=harmonysync
DB_USERNAME=<from-secrets-manager>
DB_PASSWORD=<from-secrets-manager>
JWT_SECRET=<from-secrets-manager>
AWS_REGION=eu-west-1
S3_BUCKET_NAME=youlisten-uploads-prod
SQS_TRANSFER_QUEUE_URL=https://sqs.eu-west-1.amazonaws.com/<account>/youlisten-transfer-queue
CORS_ORIGINS=https://yourdomain.com
```

### YouTube API (Phase 3)
```
GOOGLE_CLIENT_ID=<from-google-cloud-console>
GOOGLE_CLIENT_SECRET=<from-secrets-manager>
GOOGLE_REDIRECT_URI=http://localhost:8080/api/oauth/google/callback
```

---

## Third-Party API Setup

### Google / YouTube Data API v3 (Phase 3)
1. Go to https://console.cloud.google.com/
2. Create a new project: "YouListen"
3. Enable: YouTube Data API v3
4. Create OAuth 2.0 credentials (Web application)
5. Add authorized redirect URI: `http://localhost:8080/api/oauth/google/callback`
6. Download `client_secret.json`
7. Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to your environment

### Spotify OAuth (Optional, Phase 4+)
1. Go to https://developer.spotify.com/dashboard
2. Create app: "YouListen"
3. Set redirect URI: `http://localhost:8080/api/oauth/spotify/callback`
4. Required scopes: `user-read-private user-read-email playlist-read-private playlist-read-collaborative`

---

## Docker Compose (Automatic)

Docker Compose injects all required environment variables for local development automatically.

```cmd
docker compose up --build
```

No manual `.env` file needed for Docker Compose local development.

---

## AWS Production (Phase 6+)

See AWS_DEPLOYMENT_GUIDE.md for complete setup instructions.

Credentials are managed via IAM Task Roles — no access keys stored in environment.
