# User API

Handles user profile management and account settings.

## Endpoints

### GET /user/profile

Get the current user's profile.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "usr_123456",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890",
    "avatar": "https://cdn.omoplata.com/avatars/usr_123456.jpg",
    "dateOfBirth": "1990-05-15",
    "gender": "male",
    "emergencyContact": {
      "name": "Jane Doe",
      "phone": "+0987654321",
      "relationship": "spouse"
    },
    "medicalInfo": {
      "conditions": ["asthma"],
      "medications": [],
      "allergies": ["peanuts"]
    },
    "preferences": {
      "notifications": true,
      "newsletter": false,
      "language": "en"
    },
    "membership": {
      "id": "mem_789012",
      "planName": "Premium",
      "status": "active",
      "expiresAt": "2025-01-15T00:00:00Z"
    },
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-06-20T08:15:00Z"
  }
}
```

---

### PUT /user/profile

Update the current user's profile.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "dateOfBirth": "1990-05-15",
  "gender": "male",
  "emergencyContact": {
    "name": "Jane Doe",
    "phone": "+0987654321",
    "relationship": "spouse"
  },
  "medicalInfo": {
    "conditions": ["asthma"],
    "medications": [],
    "allergies": ["peanuts"]
  },
  "preferences": {
    "notifications": true,
    "newsletter": false,
    "language": "en"
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "usr_123456",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    // ... full updated profile
  }
}
```

**Validation Rules:**
- `firstName`: Min 2 characters
- `lastName`: Min 2 characters
- `phone`: Valid phone format
- `dateOfBirth`: Valid date, must be in past
- `gender`: One of: male, female, other, prefer_not_to_say

---

### POST /user/change-password

Change the user's password.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newSecurePassword456"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Error Responses:**
- `400` - Current password is incorrect
- `422` - New password validation failed

---

### POST /user/avatar

Upload or update user avatar.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Request Body:**
```
avatar: <binary file data>
```

**Constraints:**
- Max file size: 5MB
- Allowed formats: JPEG, PNG, WebP
- Image will be resized to 400x400px

**Response (200):**
```json
{
  "success": true,
  "data": {
    "avatar": "https://cdn.omoplata.com/avatars/usr_123456.jpg"
  }
}
```

---

### DELETE /user/avatar

Remove user avatar.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Avatar removed successfully"
}
```

---

### DELETE /user/account

Delete user account (soft delete with 30-day grace period).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "password": "currentPassword123",
  "reason": "No longer using the service"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Account scheduled for deletion",
  "data": {
    "deletionDate": "2024-07-20T00:00:00Z"
  }
}
```

*Note: User can reactivate within 30 days by logging in.*
