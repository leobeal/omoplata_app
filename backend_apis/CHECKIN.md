# Check-in API

Handles gym check-in functionality via QR code or manual entry.

## Endpoints

### POST /checkin

Create a new check-in record.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "method": "qr_code",
  "locationId": "loc_001",
  "qrCode": "OMOPLATA-CHECKIN-2024062110"
}
```

**Alternative - Manual check-in:**
```json
{
  "method": "manual",
  "locationId": "loc_001",
  "membershipCode": "MEM-789012"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "checkinId": "checkin_001",
    "userId": "usr_123456",
    "location": {
      "id": "loc_001",
      "name": "Downtown Gym",
      "address": "123 Main St"
    },
    "checkedInAt": "2024-06-21T07:30:00Z",
    "checkedOutAt": null,
    "membership": {
      "status": "active",
      "planName": "Premium"
    },
    "greeting": "Good morning, John! Enjoy your workout!",
    "todayVisitNumber": 1,
    "weeklyVisits": 3,
    "monthlyVisits": 12
  }
}
```

**Error Responses:**
- `400` - Invalid QR code or membership code
- `403` - Membership not active or access restricted
- `409` - Already checked in at this location
- `429` - Check-in limit reached for today

---

### POST /checkin/checkout

Record check-out from gym.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "checkinId": "checkin_001"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "checkinId": "checkin_001",
    "checkedInAt": "2024-06-21T07:30:00Z",
    "checkedOutAt": "2024-06-21T09:15:00Z",
    "duration": 105,
    "message": "Great workout! See you next time!"
  }
}
```

---

### GET /checkin/history

Get user's check-in history.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `startDate`: string (YYYY-MM-DD)
- `endDate`: string (YYYY-MM-DD)
- `locationId`: string - Filter by location
- `page`: number (default: 1)
- `limit`: number (default: 20)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "checkin_001",
      "location": {
        "id": "loc_001",
        "name": "Downtown Gym"
      },
      "checkedInAt": "2024-06-21T07:30:00Z",
      "checkedOutAt": "2024-06-21T09:15:00Z",
      "duration": 105
    },
    {
      "id": "checkin_002",
      "location": {
        "id": "loc_001",
        "name": "Downtown Gym"
      },
      "checkedInAt": "2024-06-19T18:00:00Z",
      "checkedOutAt": "2024-06-19T19:30:00Z",
      "duration": 90
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 45
  },
  "summary": {
    "totalVisits": 45,
    "totalDuration": 4230,
    "averageDuration": 94,
    "thisWeek": 3,
    "thisMonth": 12
  }
}
```

---

### GET /checkin/qr-code

Generate a QR code for member check-in.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "qrCode": "OMOPLATA-MEM-789012-2024062110-ABC123",
    "qrCodeImage": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...",
    "expiresAt": "2024-06-21T11:00:00Z",
    "validFor": 3600
  }
}
```

*Note: QR code refreshes every hour for security.*

---

### GET /checkin/stats

Get check-in statistics for the user.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `period`: string (week, month, year, all)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "period": "month",
    "startDate": "2024-06-01",
    "endDate": "2024-06-30",
    "stats": {
      "totalVisits": 15,
      "totalDuration": 1350,
      "averageDuration": 90,
      "longestSession": 145,
      "shortestSession": 45,
      "mostVisitedDay": "Monday",
      "preferredTime": "morning",
      "streak": {
        "current": 5,
        "longest": 12
      }
    },
    "byDay": {
      "Monday": 4,
      "Tuesday": 2,
      "Wednesday": 3,
      "Thursday": 2,
      "Friday": 3,
      "Saturday": 1,
      "Sunday": 0
    },
    "byTime": {
      "morning": 8,
      "afternoon": 4,
      "evening": 3
    },
    "weeklyTrend": [
      { "week": "2024-W22", "visits": 3 },
      { "week": "2024-W23", "visits": 4 },
      { "week": "2024-W24", "visits": 4 },
      { "week": "2024-W25", "visits": 4 }
    ]
  }
}
```

---

### GET /checkin/active

Check if user is currently checked in.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200) - Checked in:**
```json
{
  "success": true,
  "data": {
    "isCheckedIn": true,
    "checkin": {
      "id": "checkin_001",
      "location": {
        "id": "loc_001",
        "name": "Downtown Gym"
      },
      "checkedInAt": "2024-06-21T07:30:00Z",
      "duration": 45
    }
  }
}
```

**Response (200) - Not checked in:**
```json
{
  "success": true,
  "data": {
    "isCheckedIn": false,
    "lastCheckin": {
      "id": "checkin_000",
      "location": "Downtown Gym",
      "checkedOutAt": "2024-06-19T19:30:00Z"
    }
  }
}
```

## Check-in Methods

| Method | Description |
|--------|-------------|
| `qr_code` | Scan QR code at gym entrance |
| `manual` | Enter membership code manually |
| `nfc` | Tap NFC-enabled membership card |
| `facial` | Facial recognition (premium locations) |

## Access Rules

- Check-in validates membership status in real-time
- Some locations may have time restrictions based on plan
- Guest check-ins require host member presence
- Multiple location check-ins may be restricted
