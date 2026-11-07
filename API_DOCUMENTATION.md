# YouListen — REST API Documentation

## Overview

The YouListen backend is built with Spring Boot 3.3.6 running on port 8080.
Interactive Swagger UI is available at: `http://localhost:8080/swagger-ui.html`
OpenAPI JSON specification is available at: `http://localhost:8080/v3/api-docs`

Base URL: `http://localhost:8080/api`

---

## Authentication & Headers

Protected endpoints require a Bearer token in the HTTP Authorization header:
```http
Authorization: Bearer <jwt-token>
```

All requests containing a JSON payload must include:
```http
Content-Type: application/json
```

---

## Standard Error Response Format

```json
{
  "timestamp": "2026-11-07T10:15:00.000",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed: email must be a valid email address",
  "path": "/api/auth/register"
}
```

---

## Endpoints

### 1. Authentication (`/api/auth`)

#### Register New User
- **Method**: `POST`
- **Path**: `/api/auth/register`
- **Access**: Public
- **Request Body**:
```json
{
  "displayName": "Alex Rivera",
  "username": "alexr",
  "email": "alex@example.com",
  "password": "SecurePassword123!"
}
```
- **Response**: `200 OK`
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": 1,
    "email": "alex@example.com",
    "username": "alexr",
    "displayName": "Alex Rivera",
    "avatarUrl": null,
    "role": "USER"
  }
}
```

#### User Login
- **Method**: `POST`
- **Path**: `/api/auth/login`
- **Access**: Public
- **Request Body**:
```json
{
  "email": "alex@example.com",
  "password": "SecurePassword123!"
}
```
- **Response**: `200 OK` (returns JWT token and User object)

#### User Logout
- **Method**: `POST`
- **Path**: `/api/auth/logout`
- **Access**: Authenticated
- **Response**: `200 OK`

#### Get Current Authenticated User
- **Method**: `GET`
- **Path**: `/api/auth/me`
- **Access**: Authenticated
- **Response**: `200 OK` (returns current user profile and role)

---

### 2. User Profile (`/api/users`)

#### Get Profile
- **Method**: `GET`
- **Path**: `/api/users/me`
- **Access**: Authenticated
- **Response**: `200 OK`

#### Update Profile
- **Method**: `PUT`
- **Path**: `/api/users/me`
- **Access**: Authenticated
- **Request Body**:
```json
{
  "displayName": "Alex R. Rivera",
  "username": "alexrivera"
}
```
- **Response**: `200 OK`

---

### 3. Playlists (`/api/playlists`)

#### List User Playlists
- **Method**: `GET`
- **Path**: `/api/playlists`
- **Access**: Authenticated
- **Response**: `200 OK` (Array of Playlist objects owned by the authenticated user)

#### Create Playlist
- **Method**: `POST`
- **Path**: `/api/playlists`
- **Access**: Authenticated
- **Request Body**:
```json
{
  "name": "Synthwave Night Drives",
  "description": "Chill retro beats",
  "source": "spotify",
  "isPublic": true
}
```
- **Response**: `201 Created`

#### Get Playlist by ID
- **Method**: `GET`
- **Path**: `/api/playlists/{id}`
- **Access**: Authenticated (owner check enforced)
- **Response**: `200 OK`

#### Update Playlist
- **Method**: `PUT`
- **Path**: `/api/playlists/{id}`
- **Access**: Authenticated (owner check enforced)
- **Response**: `200 OK`

#### Delete Playlist
- **Method**: `DELETE`
- **Path**: `/api/playlists/{id}`
- **Access**: Authenticated (owner check enforced)
- **Response**: `204 No Content`

#### Toggle Favorite
- **Method**: `PUT`
- **Path**: `/api/playlists/{id}/favorite`
- **Access**: Authenticated
- **Response**: `200 OK`

#### Get Playlist Tracks
- **Method**: `GET`
- **Path**: `/api/playlists/{id}/tracks`
- **Access**: Authenticated
- **Response**: `200 OK` (Array of ordered track objects)

---

### 4. Transfer Jobs (`/api/transfers`)

#### List User Transfers
- **Method**: `GET`
- **Path**: `/api/transfers`
- **Access**: Authenticated
- **Response**: `200 OK` (Array of TransferJob summaries)

#### Get Transfer Job Status
- **Method**: `GET`
- **Path**: `/api/transfers/{id}`
- **Access**: Authenticated
- **Response**: `200 OK` (Detailed progress, track statistics, error messages)

---

### 5. Notifications (`/api/notifications`)

#### Get Notifications
- **Method**: `GET`
- **Path**: `/api/notifications`
- **Access**: Authenticated
- **Response**: `200 OK`

#### Mark Single Notification as Read
- **Method**: `PUT`
- **Path**: `/api/notifications/{id}/read`
- **Access**: Authenticated
- **Response**: `200 OK`

#### Mark All Notifications as Read
- **Method**: `PUT`
- **Path**: `/api/notifications/read-all`
- **Access**: Authenticated
- **Response**: `200 OK`

---

### 6. Health & Actuator (`/actuator`)

#### Health Check
- **Method**: `GET`
- **Path**: `/actuator/health`
- **Access**: Public
- **Response**: `{"status": "UP"}`
