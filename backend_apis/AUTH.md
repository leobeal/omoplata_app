# Authentication API

Handles user authentication, registration, and password management.

## Endpoints

### POST /auth/login

Authenticate a user and receive access tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_123456",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+1234567890",
      "avatar": "https://cdn.omoplata.com/avatars/usr_123456.jpg",
      "membershipId": "mem_789012",
      "createdAt": "2024-01-15T10:30:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 3600
  }
}
```

**Error Responses:**
- `401` - Invalid credentials
- `422` - Validation error
- `429` - Too many login attempts

---

### POST /auth/register

Register a new user account.

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "securePassword123",
  "firstName": "Jane",
  "lastName": "Smith",
  "phone": "+1234567890"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_789012",
      "email": "newuser@example.com",
      "firstName": "Jane",
      "lastName": "Smith",
      "phone": "+1234567890",
      "createdAt": "2024-01-20T14:00:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 3600
  }
}
```

**Validation Rules:**
- `email`: Required, valid email format, unique
- `password`: Required, min 8 characters, must contain letter and number
- `firstName`: Required, min 2 characters
- `lastName`: Required, min 2 characters
- `phone`: Optional, valid phone format

---

### POST /auth/logout

Invalidate the current access token.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### POST /auth/refresh

Refresh the access token using a refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 3600
  }
}
```

---

### POST /auth/forgot-password

Request a password reset email.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

*Note: Always returns success to prevent email enumeration attacks.*

---

### POST /auth/reset-password

Reset password using the token from the reset email.

**Request Body:**
```json
{
  "token": "reset_token_from_email",
  "password": "newSecurePassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

**Error Responses:**
- `400` - Invalid or expired token
- `422` - Password validation failed

---

### POST /auth/verify-email

Verify email address using the token from verification email.

**Request Body:**
```json
{
  "token": "verification_token_from_email"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

## Token Specifications

- **Access Token**: JWT, expires in 1 hour
- **Refresh Token**: JWT, expires in 30 days
- **Reset Token**: Random string, expires in 1 hour
- **Verification Token**: Random string, expires in 24 hours
