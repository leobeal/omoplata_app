# Memberships API

Handles membership plans, subscriptions, and related operations.

## Endpoints

### GET /memberships

Get the current user's membership details.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "mem_789012",
    "userId": "usr_123456",
    "plan": {
      "id": "plan_001",
      "name": "Premium",
      "description": "Full access to all facilities and classes",
      "price": 49.99,
      "currency": "EUR",
      "billingCycle": "monthly",
      "features": [
        "Unlimited gym access",
        "All group classes",
        "Personal trainer consultation",
        "Sauna & spa access",
        "Guest passes (2/month)"
      ]
    },
    "status": "active",
    "startDate": "2024-01-15T00:00:00Z",
    "nextBillingDate": "2024-07-15T00:00:00Z",
    "expiresAt": null,
    "cancelledAt": null,
    "pausedAt": null,
    "pauseEndsAt": null,
    "paymentMethod": {
      "id": "pm_123",
      "type": "card",
      "last4": "4242",
      "brand": "visa"
    },
    "contract": {
      "id": "contract_001",
      "minimumTerm": 12,
      "signedAt": "2024-01-15T10:30:00Z",
      "endsAt": "2025-01-15T00:00:00Z"
    },
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

---

### GET /memberships/plans

Get all available membership plans.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `active_only`: boolean (default: true)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "plan_001",
      "name": "Basic",
      "description": "Essential gym access",
      "price": 29.99,
      "currency": "EUR",
      "billingCycle": "monthly",
      "signUpFee": 49.00,
      "minimumTerm": 1,
      "features": [
        "Gym access (6am-10pm)",
        "Basic equipment"
      ],
      "popular": false
    },
    {
      "id": "plan_002",
      "name": "Premium",
      "description": "Full access to all facilities",
      "price": 49.99,
      "currency": "EUR",
      "billingCycle": "monthly",
      "signUpFee": 0,
      "minimumTerm": 12,
      "features": [
        "24/7 gym access",
        "All group classes",
        "Personal trainer consultation",
        "Sauna & spa access"
      ],
      "popular": true
    },
    {
      "id": "plan_003",
      "name": "Annual Premium",
      "description": "Best value - 2 months free",
      "price": 499.99,
      "currency": "EUR",
      "billingCycle": "yearly",
      "signUpFee": 0,
      "minimumTerm": 12,
      "features": [
        "All Premium features",
        "2 months free",
        "Priority booking"
      ],
      "popular": false,
      "discount": {
        "type": "percentage",
        "value": 17,
        "label": "Save 17%"
      }
    }
  ]
}
```

---

### POST /memberships/subscribe

Subscribe to a membership plan.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "planId": "plan_002",
  "paymentMethodId": "pm_123",
  "startDate": "2024-07-01",
  "promoCode": "SUMMER2024"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "membership": {
      "id": "mem_new123",
      "planId": "plan_002",
      "status": "active",
      "startDate": "2024-07-01T00:00:00Z",
      "nextBillingDate": "2024-08-01T00:00:00Z"
    },
    "invoice": {
      "id": "inv_001",
      "amount": 49.99,
      "status": "paid",
      "paidAt": "2024-06-20T14:30:00Z"
    }
  }
}
```

---

### POST /memberships/:id/cancel

Cancel a membership.

**Headers:**
```
Authorization: Bearer <access_token>
```

**URL Parameters:**
- `id`: Membership ID

**Request Body:**
```json
{
  "reason": "Moving to another city",
  "feedback": "Great gym, would recommend!",
  "cancelImmediately": false
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "mem_789012",
    "status": "cancelled",
    "cancelledAt": "2024-06-20T14:30:00Z",
    "activeUntil": "2024-07-15T00:00:00Z",
    "message": "Your membership will remain active until July 15, 2024"
  }
}
```

*Note: If under contract, early termination fees may apply.*

---

### POST /memberships/:id/pause

Pause a membership temporarily.

**Headers:**
```
Authorization: Bearer <access_token>
```

**URL Parameters:**
- `id`: Membership ID

**Request Body:**
```json
{
  "reason": "medical",
  "pauseStartDate": "2024-07-01",
  "pauseEndDate": "2024-08-01",
  "documentation": "https://cdn.omoplata.com/docs/medical_note.pdf"
}
```

**Constraints:**
- Minimum pause: 7 days
- Maximum pause: 90 days
- Maximum pauses per year: 2
- Some plans may not allow pausing

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "mem_789012",
    "status": "paused",
    "pausedAt": "2024-07-01T00:00:00Z",
    "pauseEndsAt": "2024-08-01T00:00:00Z",
    "remainingPauses": 1
  }
}
```

---

### POST /memberships/:id/resume

Resume a paused membership early.

**Headers:**
```
Authorization: Bearer <access_token>
```

**URL Parameters:**
- `id`: Membership ID

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "mem_789012",
    "status": "active",
    "resumedAt": "2024-07-15T10:00:00Z",
    "nextBillingDate": "2024-08-15T00:00:00Z"
  }
}
```

---

### GET /memberships/:id/history

Get membership billing and activity history.

**Headers:**
```
Authorization: Bearer <access_token>
```

**URL Parameters:**
- `id`: Membership ID

**Query Parameters:**
- `page`: number (default: 1)
- `limit`: number (default: 20)
- `type`: string (invoices, pauses, changes)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "type": "invoice",
      "date": "2024-06-15T00:00:00Z",
      "description": "Monthly membership - Premium",
      "amount": 49.99,
      "status": "paid"
    },
    {
      "type": "pause",
      "date": "2024-05-01T00:00:00Z",
      "description": "Membership paused",
      "details": {
        "reason": "vacation",
        "duration": "14 days"
      }
    },
    {
      "type": "plan_change",
      "date": "2024-03-01T00:00:00Z",
      "description": "Upgraded from Basic to Premium",
      "details": {
        "previousPlan": "Basic",
        "newPlan": "Premium"
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 15
  }
}
```

## Membership Statuses

| Status | Description |
|--------|-------------|
| `pending` | Awaiting payment or activation |
| `active` | Currently active membership |
| `paused` | Temporarily paused |
| `cancelled` | Cancelled but still active until period end |
| `expired` | Membership has ended |
| `suspended` | Suspended due to payment failure |
