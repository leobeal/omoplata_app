# Notifications API

Handles push notifications, in-app notifications, and notification preferences.

## Endpoints

### GET /notifications

Get user's notifications.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `unreadOnly`: boolean (default: false)
- `type`: string (system, booking, payment, marketing)
- `page`: number (default: 1)
- `limit`: number (default: 20)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "notif_001",
      "type": "booking",
      "title": "Class Reminder",
      "body": "Your Morning Yoga class starts in 1 hour",
      "data": {
        "classId": "class_001",
        "action": "view_booking"
      },
      "isRead": false,
      "createdAt": "2024-06-21T06:00:00Z"
    },
    {
      "id": "notif_002",
      "type": "payment",
      "title": "Payment Successful",
      "body": "Your monthly membership payment of €49.99 was processed",
      "data": {
        "invoiceId": "inv_001",
        "action": "view_invoice"
      },
      "isRead": true,
      "createdAt": "2024-06-15T08:30:00Z"
    },
    {
      "id": "notif_003",
      "type": "system",
      "title": "Welcome to Evolve!",
      "body": "Your account has been created. Start exploring your new gym!",
      "data": {
        "action": "onboarding"
      },
      "isRead": true,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "unreadCount": 3
  }
}
```

---

### PUT /notifications/:id/read

Mark a notification as read.

**Headers:**
```
Authorization: Bearer <access_token>
```

**URL Parameters:**
- `id`: Notification ID

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "notif_001",
    "isRead": true,
    "readAt": "2024-06-21T06:30:00Z"
  }
}
```

---

### PUT /notifications/read-all

Mark all notifications as read.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "markedCount": 3,
    "unreadCount": 0
  }
}
```

---

### DELETE /notifications/:id

Delete a notification.

**Headers:**
```
Authorization: Bearer <access_token>
```

**URL Parameters:**
- `id`: Notification ID

**Response (200):**
```json
{
  "success": true,
  "message": "Notification deleted"
}
```

---

### GET /notifications/settings

Get notification preferences.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "push": {
      "enabled": true,
      "classReminders": true,
      "classReminderTime": 60,
      "paymentAlerts": true,
      "promotions": false,
      "newClasses": true,
      "waitlistUpdates": true
    },
    "email": {
      "enabled": true,
      "invoices": true,
      "weeklyDigest": true,
      "promotions": false,
      "newsletter": false
    },
    "sms": {
      "enabled": false,
      "urgentOnly": true
    },
    "quietHours": {
      "enabled": true,
      "start": "22:00",
      "end": "07:00"
    }
  }
}
```

---

### PUT /notifications/settings

Update notification preferences.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "push": {
    "enabled": true,
    "classReminders": true,
    "classReminderTime": 30,
    "paymentAlerts": true,
    "promotions": true,
    "newClasses": false
  },
  "email": {
    "weeklyDigest": false
  },
  "quietHours": {
    "enabled": true,
    "start": "23:00",
    "end": "08:00"
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    // Full updated settings object
  }
}
```

---

### POST /notifications/register-device

Register device for push notifications.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "platform": "ios",
  "deviceName": "John's iPhone"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "deviceId": "device_001",
    "registered": true
  }
}
```

---

### DELETE /notifications/unregister-device

Unregister device from push notifications.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Device unregistered"
}
```

## Notification Types

| Type | Description | Examples |
|------|-------------|----------|
| `system` | System notifications | Account created, password changed |
| `booking` | Class booking related | Reminder, confirmation, cancellation |
| `payment` | Payment related | Success, failure, upcoming charge |
| `membership` | Membership updates | Renewal, expiring soon, paused |
| `marketing` | Promotional content | New classes, special offers |
| `social` | Social features | Friend activity, achievements |

## Push Notification Triggers

| Event | Timing | Content |
|-------|--------|---------|
| Class reminder | 1hr/30min before | "Your {class} starts in {time}" |
| Booking confirmed | Immediate | "You're booked for {class}" |
| Waitlist promoted | Immediate | "A spot opened up in {class}!" |
| Payment success | Immediate | "Payment of €{amount} processed" |
| Payment failed | Immediate | "Payment failed - action needed" |
| Membership expiring | 7 days before | "Membership expires on {date}" |
| New class available | When published | "{trainer} added a new {class}" |

## Quiet Hours

When quiet hours are enabled:
- Push notifications are queued and delivered after quiet hours end
- Urgent notifications (payment failures, account security) bypass quiet hours
- Email and SMS follow regular schedules
