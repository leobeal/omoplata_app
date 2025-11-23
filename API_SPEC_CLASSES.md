# Classes API Specification

This document describes the backend API endpoints required for the classes feature with pagination and filtering.

## Base URL

All endpoints should be prefixed with the base API URL (e.g., `https://api.yourapp.com/v1`)

## Endpoints

### 1. Get Classes (Paginated with Filters)

Retrieve a paginated list of upcoming classes with optional filtering.

**Endpoint:** `GET /classes`

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | integer | No | 10 | Number of classes to return per page (max: 100) |
| `offset` | integer | No | 0 | Number of classes to skip for pagination |
| `category` | string | No | - | Filter by class category (e.g., "BJJ", "Muay Thai", "MMA") |
| `level` | string | No | - | Filter by difficulty level (e.g., "Beginner", "Intermediate", "Advanced") |
| `instructor` | string | No | - | Filter by instructor name |
| `location` | string | No | - | Filter by location/room |
| `from_date` | string (ISO 8601) | No | today | Filter classes from this date onwards |
| `to_date` | string (ISO 8601) | No | - | Filter classes up to this date |

**Response:** `200 OK`

```json
{
  "data": {
    "classes": [
      {
        "id": "cls-001",
        "title": "Brazilian Jiu-Jitsu - Fundamentals",
        "instructor": "Professor Carlos Silva",
        "instructorAvatar": "https://api.yourapp.com/avatars/carlos-silva.jpg",
        "date": "2025-11-21",
        "startTime": "18:00",
        "endTime": "19:30",
        "duration": 90,
        "location": "Mat Room A",
        "capacity": 20,
        "enrolled": 12,
        "status": "confirmed",
        "description": "Learn the fundamental techniques of Brazilian Jiu-Jitsu",
        "level": "Beginner",
        "category": "BJJ"
      }
    ],
    "pagination": {
      "total": 45,
      "limit": 10,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

**Error Responses:**

- `400 Bad Request` - Invalid query parameters
- `401 Unauthorized` - Invalid or missing authentication token
- `500 Internal Server Error` - Server error

---

### 2. Get Filter Options

Retrieve available options for filtering classes (categories, levels, instructors, locations).

**Endpoint:** `GET /classes/filters`

**Response:** `200 OK`

```json
{
  "data": {
    "categories": ["BJJ", "Muay Thai", "MMA", "Boxing", "Wrestling", "Grappling", "Fitness"],
    "levels": ["Beginner", "Intermediate", "Advanced", "All Levels"],
    "instructors": [
      "Professor Carlos Silva",
      "Kru Sarah Martinez",
      "Coach Mike Johnson",
      "Coach David Brown"
    ],
    "locations": [
      "Mat Room A",
      "Mat Room B",
      "Ring Area",
      "Cage",
      "Gym Floor"
    ]
  }
}
```

---

### 3. Confirm Class Attendance

Confirm attendance for a specific class.

**Endpoint:** `POST /classes/:classId/confirm`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `classId` | string | Yes | The unique identifier of the class |

**Response:** `200 OK`

```json
{
  "data": {
    "class": {
      "id": "cls-001",
      "status": "confirmed",
      "confirmedAt": "2025-11-20T14:30:00Z"
    },
    "message": "Attendance confirmed successfully"
  }
}
```

**Error Responses:**

- `400 Bad Request` - Class is full or registration deadline passed
- `404 Not Found` - Class not found
- `409 Conflict` - Already confirmed or conflicting class time
- `401 Unauthorized` - Invalid or missing authentication token

---

### 4. Deny/Cancel Class Attendance

Deny or cancel attendance for a specific class.

**Endpoint:** `POST /classes/:classId/deny`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `classId` | string | Yes | The unique identifier of the class |

**Response:** `200 OK`

```json
{
  "data": {
    "class": {
      "id": "cls-001",
      "status": "denied",
      "deniedAt": "2025-11-20T14:35:00Z"
    },
    "message": "Attendance cancelled successfully"
  }
}
```

**Error Responses:**

- `404 Not Found` - Class not found
- `400 Bad Request` - Cancellation deadline passed
- `401 Unauthorized` - Invalid or missing authentication token

---

### 5. Get Single Class Details

Retrieve detailed information about a specific class.

**Endpoint:** `GET /classes/:classId`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `classId` | string | Yes | The unique identifier of the class |

**Response:** `200 OK`

```json
{
  "data": {
    "id": "cls-001",
    "title": "Brazilian Jiu-Jitsu - Fundamentals",
    "instructor": "Professor Carlos Silva",
    "instructorAvatar": "https://api.yourapp.com/avatars/carlos-silva.jpg",
    "instructorBio": "Black belt with 15 years of experience...",
    "date": "2025-11-21",
    "startTime": "18:00",
    "endTime": "19:30",
    "duration": 90,
    "location": "Mat Room A",
    "capacity": 20,
    "enrolled": 12,
    "waitlist": 3,
    "status": "confirmed",
    "description": "Learn the fundamental techniques of Brazilian Jiu-Jitsu",
    "level": "Beginner",
    "category": "BJJ",
    "requirements": ["Gi required", "White belt or higher"],
    "attendees": [
      {
        "userId": "user-123",
        "name": "John Doe",
        "avatar": "https://api.yourapp.com/avatars/john-doe.jpg"
      }
    ]
  }
}
```

**Error Responses:**

- `404 Not Found` - Class not found
- `401 Unauthorized` - Invalid or missing authentication token

---

## Data Models

### Class

```typescript
interface Class {
  id: string;
  title: string;
  instructor: string;
  instructorAvatar: string;
  date: string; // ISO 8601 date (YYYY-MM-DD)
  startTime: string; // HH:MM (24-hour format)
  endTime: string; // HH:MM (24-hour format)
  duration: number; // Duration in minutes
  location: string;
  capacity: number;
  enrolled: number;
  waitlist?: number;
  status: 'pending' | 'confirmed' | 'denied';
  description: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
  category?: string;
  requirements?: string[];
}
```

### Attendance Status

- `pending` - User has not yet confirmed or denied attendance
- `confirmed` - User has confirmed they will attend
- `denied` - User has declined or cancelled attendance

## Authentication

All endpoints require authentication using a Bearer token in the Authorization header:

```
Authorization: Bearer <access_token>
```

## Rate Limiting

- Rate limit: 100 requests per minute per user
- Response headers include rate limit information:
  - `X-RateLimit-Limit`: Maximum requests per minute
  - `X-RateLimit-Remaining`: Remaining requests in current window
  - `X-RateLimit-Reset`: Timestamp when the limit resets

## Error Format

All error responses follow this format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  }
}
```

## Notes for Implementation

1. **Timezone Handling**: All dates and times should be stored and returned in UTC. The client will handle timezone conversion based on the user's location.

2. **Pagination**: The `hasMore` boolean in the pagination object indicates whether there are more results available. Clients should increment `offset` by `limit` for subsequent requests.

3. **Filtering**: Multiple filters can be combined. All filters use AND logic (e.g., category=BJJ AND level=Beginner).

4. **Caching**: Consider implementing caching for the `/classes/filters` endpoint as the data changes infrequently.

5. **Real-time Updates**: For production, consider implementing WebSocket connections or Server-Sent Events for real-time class capacity and enrollment updates.

6. **Capacity Management**: The backend should enforce capacity limits and manage waitlists when classes are full.
