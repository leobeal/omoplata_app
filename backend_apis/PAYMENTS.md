# Payments API

Handles payment methods, invoices, and transaction management.

## Endpoints

### GET /payments/methods

Get user's saved payment methods.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "pm_001",
      "type": "card",
      "brand": "visa",
      "last4": "4242",
      "expiryMonth": 12,
      "expiryYear": 2025,
      "isDefault": true,
      "createdAt": "2024-01-15T10:30:00Z"
    },
    {
      "id": "pm_002",
      "type": "sepa_debit",
      "bankName": "Deutsche Bank",
      "last4": "1234",
      "country": "DE",
      "isDefault": false,
      "createdAt": "2024-03-20T14:00:00Z"
    }
  ]
}
```

---

### POST /payments/methods

Add a new payment method.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body - Card:**
```json
{
  "type": "card",
  "token": "tok_visa_4242",
  "setDefault": true
}
```

**Request Body - SEPA:**
```json
{
  "type": "sepa_debit",
  "iban": "DE89370400440532013000",
  "accountHolderName": "John Doe",
  "setDefault": false
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "pm_003",
    "type": "card",
    "brand": "mastercard",
    "last4": "5555",
    "expiryMonth": 6,
    "expiryYear": 2026,
    "isDefault": true,
    "createdAt": "2024-06-21T10:00:00Z"
  }
}
```

**Error Responses:**
- `400` - Invalid payment details
- `422` - Card declined or IBAN validation failed

---

### DELETE /payments/methods/:id

Remove a payment method.

**Headers:**
```
Authorization: Bearer <access_token>
```

**URL Parameters:**
- `id`: Payment method ID

**Response (200):**
```json
{
  "success": true,
  "message": "Payment method removed successfully"
}
```

**Error Responses:**
- `400` - Cannot delete default payment method while subscription active
- `404` - Payment method not found

---

### PUT /payments/methods/:id/default

Set a payment method as default.

**Headers:**
```
Authorization: Bearer <access_token>
```

**URL Parameters:**
- `id`: Payment method ID

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "pm_002",
    "isDefault": true
  }
}
```

---

### GET /payments/invoices

Get user's invoices.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `status`: string (pending, paid, failed, refunded)
- `startDate`: string (YYYY-MM-DD)
- `endDate`: string (YYYY-MM-DD)
- `page`: number (default: 1)
- `limit`: number (default: 20)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "inv_001",
      "number": "INV-2024-0001",
      "description": "Monthly membership - Premium",
      "amount": 49.99,
      "currency": "EUR",
      "status": "paid",
      "dueDate": "2024-06-15T00:00:00Z",
      "paidAt": "2024-06-15T08:30:00Z",
      "paymentMethod": {
        "type": "card",
        "last4": "4242"
      },
      "items": [
        {
          "description": "Premium Membership (Jun 2024)",
          "quantity": 1,
          "unitPrice": 49.99,
          "total": 49.99
        }
      ],
      "downloadUrl": "https://cdn.omoplata.com/invoices/inv_001.pdf",
      "createdAt": "2024-06-01T00:00:00Z"
    },
    {
      "id": "inv_002",
      "number": "INV-2024-0002",
      "description": "Personal training session",
      "amount": 75.00,
      "currency": "EUR",
      "status": "pending",
      "dueDate": "2024-06-25T00:00:00Z",
      "paidAt": null,
      "items": [
        {
          "description": "1-on-1 PT Session (60 min)",
          "quantity": 1,
          "unitPrice": 75.00,
          "total": 75.00
        }
      ],
      "createdAt": "2024-06-20T14:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 12
  },
  "summary": {
    "totalPaid": 549.89,
    "totalPending": 75.00,
    "totalFailed": 0
  }
}
```

---

### GET /payments/invoices/:id

Get invoice details.

**Headers:**
```
Authorization: Bearer <access_token>
```

**URL Parameters:**
- `id`: Invoice ID

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "inv_001",
    "number": "INV-2024-0001",
    "status": "paid",
    "billingDetails": {
      "name": "John Doe",
      "email": "john@example.com",
      "address": {
        "line1": "123 Main Street",
        "city": "Berlin",
        "postalCode": "10115",
        "country": "DE"
      }
    },
    "items": [
      {
        "description": "Premium Membership (Jun 2024)",
        "quantity": 1,
        "unitPrice": 49.99,
        "total": 49.99
      }
    ],
    "subtotal": 49.99,
    "tax": 0,
    "discount": 0,
    "total": 49.99,
    "currency": "EUR",
    "dueDate": "2024-06-15T00:00:00Z",
    "paidAt": "2024-06-15T08:30:00Z",
    "paymentMethod": {
      "type": "card",
      "brand": "visa",
      "last4": "4242"
    },
    "downloadUrl": "https://cdn.omoplata.com/invoices/inv_001.pdf",
    "createdAt": "2024-06-01T00:00:00Z"
  }
}
```

---

### POST /payments/invoices/:id/pay

Pay a pending invoice.

**Headers:**
```
Authorization: Bearer <access_token>
```

**URL Parameters:**
- `id`: Invoice ID

**Request Body:**
```json
{
  "paymentMethodId": "pm_001"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "invoiceId": "inv_002",
    "status": "paid",
    "paidAt": "2024-06-21T10:30:00Z",
    "transactionId": "txn_001",
    "receiptUrl": "https://cdn.omoplata.com/receipts/txn_001.pdf"
  }
}
```

**Error Responses:**
- `400` - Invoice already paid
- `402` - Payment failed
- `404` - Invoice not found

---

### POST /payments/invoices/:id/retry

Retry a failed payment.

**Headers:**
```
Authorization: Bearer <access_token>
```

**URL Parameters:**
- `id`: Invoice ID

**Request Body:**
```json
{
  "paymentMethodId": "pm_002"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "invoiceId": "inv_003",
    "status": "paid",
    "paidAt": "2024-06-21T11:00:00Z",
    "message": "Payment successful"
  }
}
```

## Invoice Statuses

| Status | Description |
|--------|-------------|
| `draft` | Invoice created but not finalized |
| `pending` | Awaiting payment |
| `paid` | Successfully paid |
| `failed` | Payment attempt failed |
| `refunded` | Payment was refunded |
| `cancelled` | Invoice was cancelled |

## Payment Method Types

| Type | Description |
|------|-------------|
| `card` | Credit/Debit card |
| `sepa_debit` | SEPA Direct Debit |
| `ideal` | iDEAL (Netherlands) |
| `sofort` | Sofort (Germany) |
| `bancontact` | Bancontact (Belgium) |

## Retry Policy

Failed payments are automatically retried:
1. First retry: 1 day after failure
2. Second retry: 3 days after failure
3. Third retry: 7 days after failure
4. After 3 failures: Membership suspended, manual action required
