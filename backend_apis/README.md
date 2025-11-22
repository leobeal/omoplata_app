# Backend APIs Documentation

This folder contains the API design documentation for the Omoplata fitness club management application.

## Overview

The backend API follows RESTful conventions and uses JSON for request/response bodies. All endpoints require authentication except for public routes (login, register, forgot-password).

## Base URL

| Environment | URL |
|------------|-----|
| Development | `http://localhost:3000/api` |
| Staging | `https://staging-api.omoplata.com/api` |
| Production | `https://api.omoplata.com/api` |

## Authentication

All authenticated endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <access_token>
```

## Multi-Tenant Support

The API supports multiple tenants (gym brands). Include the tenant identifier in the request header:

```
X-Tenant: evolve
```

## API Modules

1. [Authentication](./AUTH.md) - Login, registration, password reset
2. [User](./USER.md) - Profile management
3. [Memberships](./MEMBERSHIPS.md) - Plans, subscriptions, pauses
4. [Classes](./CLASSES.md) - Class scheduling and booking
5. [Check-in](./CHECKIN.md) - Gym check-in system
6. [Payments](./PAYMENTS.md) - Payment methods and invoices
7. [Notifications](./NOTIFICATIONS.md) - Push notifications and settings

## Common Response Format

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is required",
    "details": { ... }
  }
}
```

## HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 422 | Validation Error |
| 500 | Internal Server Error |
