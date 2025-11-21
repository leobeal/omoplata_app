# Classes API

Handles class schedules, bookings, and attendance management.

## Endpoints

### GET /classes

Get list of available classes.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `date`: string (YYYY-MM-DD) - Filter by specific date
- `startDate`: string (YYYY-MM-DD) - Start of date range
- `endDate`: string (YYYY-MM-DD) - End of date range
- `type`: string - Filter by class type (yoga, spinning, crossfit, etc.)
- `trainerId`: string - Filter by trainer
- `available`: boolean - Only show classes with available spots
- `page`: number (default: 1)
- `limit`: number (default: 20)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "class_001",
      "name": "Morning Yoga",
      "description": "Start your day with energizing yoga flow",
      "type": "yoga",
      "trainer": {
        "id": "trainer_001",
        "name": "Sarah Johnson",
        "avatar": "https://cdn.omoplata.com/trainers/sarah.jpg"
      },
      "location": {
        "id": "room_001",
        "name": "Studio A",
        "floor": 2
      },
      "datetime": "2024-06-21T07:00:00Z",
      "duration": 60,
      "capacity": 20,
      "spotsAvailable": 5,
      "spotsBooked": 15,
      "difficulty": "beginner",
      "equipment": ["yoga mat", "blocks"],
      "isBooked": false,
      "waitlistPosition": null,
      "cancellationDeadline": "2024-06-21T05:00:00Z"
    },
    {
      "id": "class_002",
      "name": "HIIT Circuit",
      "description": "High intensity interval training",
      "type": "hiit",
      "trainer": {
        "id": "trainer_002",
        "name": "Mike Thompson",
        "avatar": "https://cdn.omoplata.com/trainers/mike.jpg"
      },
      "location": {
        "id": "room_002",
        "name": "Main Gym Floor",
        "floor": 1
      },
      "datetime": "2024-06-21T12:00:00Z",
      "duration": 45,
      "capacity": 15,
      "spotsAvailable": 0,
      "spotsBooked": 15,
      "difficulty": "advanced",
      "equipment": ["dumbbells", "kettlebells"],
      "isBooked": true,
      "waitlistPosition": null,
      "cancellationDeadline": "2024-06-21T10:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 45
  }
}
```

---

### GET /classes/schedule

Get weekly schedule view.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `weekStart`: string (YYYY-MM-DD) - Start of week (defaults to current week)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "weekStart": "2024-06-17",
    "weekEnd": "2024-06-23",
    "schedule": {
      "2024-06-17": [
        {
          "id": "class_001",
          "name": "Morning Yoga",
          "time": "07:00",
          "duration": 60,
          "trainer": "Sarah Johnson",
          "spotsAvailable": 5
        }
      ],
      "2024-06-18": [],
      "2024-06-19": [
        {
          "id": "class_003",
          "name": "Spinning",
          "time": "18:00",
          "duration": 45,
          "trainer": "Lisa Brown",
          "spotsAvailable": 2
        }
      ]
      // ... other days
    }
  }
}
```

---

### GET /classes/:id

Get detailed class information.

**Headers:**
```
Authorization: Bearer <access_token>
```

**URL Parameters:**
- `id`: Class ID

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "class_001",
    "name": "Morning Yoga",
    "description": "Start your day with energizing yoga flow. This class focuses on building strength, flexibility, and mindfulness through a series of flowing poses.",
    "type": "yoga",
    "trainer": {
      "id": "trainer_001",
      "name": "Sarah Johnson",
      "bio": "Certified yoga instructor with 10 years of experience",
      "avatar": "https://cdn.omoplata.com/trainers/sarah.jpg",
      "specialties": ["vinyasa", "hatha", "restorative"]
    },
    "location": {
      "id": "room_001",
      "name": "Studio A",
      "floor": 2,
      "amenities": ["air conditioning", "mirrors", "sound system"]
    },
    "datetime": "2024-06-21T07:00:00Z",
    "duration": 60,
    "capacity": 20,
    "spotsAvailable": 5,
    "spotsBooked": 15,
    "waitlistCount": 3,
    "difficulty": "beginner",
    "equipment": ["yoga mat", "blocks"],
    "whatToBring": ["water bottle", "towel"],
    "requirements": ["comfortable clothing"],
    "isBooked": false,
    "waitlistPosition": null,
    "cancellationDeadline": "2024-06-21T05:00:00Z",
    "bookingOpensAt": "2024-06-14T00:00:00Z",
    "images": [
      "https://cdn.omoplata.com/classes/yoga-1.jpg"
    ]
  }
}
```

---

### POST /classes/:id/book

Book a spot in a class.

**Headers:**
```
Authorization: Bearer <access_token>
```

**URL Parameters:**
- `id`: Class ID

**Request Body:**
```json
{
  "joinWaitlist": true
}
```

**Response (201) - Booked:**
```json
{
  "success": true,
  "data": {
    "bookingId": "booking_001",
    "classId": "class_001",
    "status": "confirmed",
    "bookedAt": "2024-06-20T10:00:00Z",
    "cancellationDeadline": "2024-06-21T05:00:00Z",
    "message": "You're booked for Morning Yoga on June 21 at 7:00 AM"
  }
}
```

**Response (201) - Waitlisted:**
```json
{
  "success": true,
  "data": {
    "bookingId": "booking_002",
    "classId": "class_001",
    "status": "waitlisted",
    "waitlistPosition": 4,
    "bookedAt": "2024-06-20T10:00:00Z",
    "message": "You're #4 on the waitlist for Morning Yoga"
  }
}
```

**Error Responses:**
- `400` - Class is full and waitlist not enabled
- `409` - Already booked for this class
- `403` - Membership does not include this class type

---

### DELETE /classes/:id/cancel

Cancel a class booking.

**Headers:**
```
Authorization: Bearer <access_token>
```

**URL Parameters:**
- `id`: Class ID

**Response (200):**
```json
{
  "success": true,
  "data": {
    "bookingId": "booking_001",
    "status": "cancelled",
    "cancelledAt": "2024-06-20T12:00:00Z",
    "refunded": true,
    "message": "Booking cancelled successfully"
  }
}
```

**Late Cancellation Response:**
```json
{
  "success": true,
  "data": {
    "bookingId": "booking_001",
    "status": "cancelled",
    "cancelledAt": "2024-06-21T06:30:00Z",
    "refunded": false,
    "lateCancellationFee": true,
    "message": "Booking cancelled. Late cancellation fee applied as per policy."
  }
}
```

---

### GET /classes/my-bookings

Get user's class bookings.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `status`: string (upcoming, past, cancelled)
- `page`: number (default: 1)
- `limit`: number (default: 20)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "bookingId": "booking_001",
      "class": {
        "id": "class_001",
        "name": "Morning Yoga",
        "datetime": "2024-06-21T07:00:00Z",
        "trainer": "Sarah Johnson",
        "location": "Studio A"
      },
      "status": "confirmed",
      "bookedAt": "2024-06-20T10:00:00Z",
      "canCancel": true,
      "cancellationDeadline": "2024-06-21T05:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 5
  }
}
```

## Class Types

| Type | Description |
|------|-------------|
| `yoga` | Yoga classes (various styles) |
| `spinning` | Indoor cycling |
| `hiit` | High-intensity interval training |
| `pilates` | Pilates mat or reformer |
| `crossfit` | CrossFit training |
| `boxing` | Boxing and kickboxing |
| `dance` | Dance fitness |
| `strength` | Weight training |
| `stretching` | Flexibility and mobility |

## Booking Rules

- Bookings open 7 days in advance (configurable per gym)
- Cancellation deadline: 2 hours before class (configurable)
- Late cancellation may incur fees
- No-shows may affect future booking privileges
- Waitlist auto-promotes when spots become available
