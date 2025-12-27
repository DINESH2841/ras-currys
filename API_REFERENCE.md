# RAS Currys API - Quick Reference Guide

## Authentication Endpoints

### Register
```
POST /api/auth/register
Body: { "fullName", "email", "phoneNumber?", "password" }
Response: { "userId", "email", "fullName" }
Rate Limit: 3 per 24h per email
```

### Verify Email
```
POST /api/auth/verify-email
Body: { "email", "otp" }
Response: { "token", "user" }
Rate Limit: 5 per 10min per email
```

### Login
```
POST /api/auth/login
Body: { "email", "password" }
Response: { "token", "user" }
Rate Limit: 5 per 10min per IP
Returns 423 if account locked (10 failed attempts = 15min lock)
```

### Add Phone
```
POST /api/auth/add-phone
Headers: { "Authorization": "Bearer TOKEN" }
Body: { "phoneNumber" }
Response: { "phoneNumber", "phoneVerified" }
```

### Get Current User
```
GET /api/auth/me
Headers: { "Authorization": "Bearer TOKEN" }
Requires: Phone number set (returns 428 if missing)
Response: { "user": { ...all user data } }
```

### Forgot Password
```
POST /api/auth/forgot-password
Body: { "email" }
Response: { "email", "emailSent": true }
Rate Limit: 3 per hour per email
```

### Reset Password
```
POST /api/auth/reset-password
Body: { "email", "otp", "newPassword" }
Response: { "email", "passwordReset": true }
```

### Resend OTP
```
POST /api/auth/resend-otp
Body: { "email" }
Response: { "email", "emailSent": true }
Rate Limit: 5 per 10min per email
```

---

## Order Endpoints

### Create Order
```
POST /api/orders
Headers: { "Authorization": "Bearer TOKEN" }
Requires: Phone number (428 if missing)
Body: {
  "items": [
    { "productId": "507f...", "quantity": 2, "price": 500 }
  ],
  "paymentMethod": "razorpay"
}
Response: { "orderId", "_id", "totalAmount", "orderStatus", "paymentStatus" }
```

### Get My Orders
```
GET /api/orders?limit=10&skip=0
Headers: { "Authorization": "Bearer TOKEN" }
Response: { "orders": [...], "count": 5 }
```

### Get Order Details
```
GET /api/orders/:id
Headers: { "Authorization": "Bearer TOKEN" }
Response: { "order": {...with user details} }
```

### Get All Orders (Admin)
```
GET /api/orders/admin/all?limit=20&skip=0
Headers: { "Authorization": "Bearer TOKEN" }
Requires: Admin role
Response: { "orders": [...], "count": 50 }
```

### Update Order Status (Admin)
```
PUT /api/orders/:id
Headers: { "Authorization": "Bearer TOKEN" }
Requires: Admin role
Body: { "orderStatus": "shipped", "trackingNumber": "TRK123" }
Allowed statuses: pending|confirmed|shipped|delivered|cancelled
Response: { "order": {...updated} }
```

### Cancel Order
```
DELETE /api/orders/:id
Headers: { "Authorization": "Bearer TOKEN" }
Only: pending and confirmed orders can be cancelled
Response: { "orderId", "orderStatus": "cancelled" }
```

---

## Payment Endpoints

### Create Payment Order
```
POST /api/payments/create
Headers: { "Authorization": "Bearer TOKEN" }
Requires: Phone number
Body: { "orderId": "507f..." }
Response: {
  "orderId",
  "amount",
  "currency": "INR",
  "razorpayKeyId": "key_XXXXX",
  "receipt": "ORD-..."
}
```

### Verify Payment (After Razorpay Success)
```
POST /api/payments/verify
Headers: { "Authorization": "Bearer TOKEN" }
Body: {
  "orderId": "...",
  "razorpayPaymentId": "pay_XXXXX",
  "razorpayOrderId": "order_XXXXX",
  "razorpaySignature": "sig..."
}
Response: { "paymentStatus": "completed", "orderStatus": "confirmed" }
Error 400: If signature doesn't match (fraud attempt)
```

### Webhook (Razorpay → Backend)
```
POST /api/payments/webhook
Headers: { "x-razorpay-signature": "..." }
Public endpoint (signature verified)
Handles: payment.authorized, payment.captured, payment.failed
```

---

## Error Response Format

### Standard Error
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

### Common Error Codes
| Code | Status | Meaning |
|------|--------|---------|
| `INVALID_CREDENTIALS` | 401 | Email/password wrong |
| `EMAIL_NOT_VERIFIED` | 403 | Email verification required |
| `ACCOUNT_LOCKED` | 423 | 10 failed logins (15min timeout) |
| `PHONE_REQUIRED` | 428 | Phone number required to continue |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `FORBIDDEN` | 403 | Insufficient permissions (not admin) |
| `TOKEN_REQUIRED` | 401 | Authorization header missing |
| `INVALID_TOKEN` | 403 | Token expired or malformed |
| `SIGNATURE_MISMATCH` | 400 | Razorpay signature verification failed |

---

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/auth/login` | 5 | 10 minutes per IP |
| `/auth/register` | 3 | 24 hours per email |
| `/auth/verify-email` | 5 | 10 minutes per email |
| `/auth/forgot-password` | 3 | 1 hour per email |
| `/auth/resend-otp` | 5 | 10 minutes per email |
| General API | 100 | 15 minutes per IP |

Response on limit exceeded:
```json
{
  "success": false,
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Too many requests...",
  "retryAfter": 1672531200000
}
```

---

## Authentication Headers

All protected endpoints require:
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

Token structure (JWT HS256):
```javascript
{
  "userId": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "role": "user" // or "admin", "superadmin"
}
```

Token expiry: **24 hours**

---

## User Roles & Permissions

### User (default)
- [ ] Create orders
- [ ] View own orders
- [ ] Verify email
- [ ] Add phone number

### Admin
- [x] View all orders
- [x] Update order status
- [x] View all users
- [x] Manage products

### Superadmin
- [x] All admin permissions
- [x] Manage admins
- [x] System settings

---

## Testing Commands

### Test Login Rate Limiting
```bash
# Run 6 times in quick succession - 6th should fail
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrong"}'
```

### Test Account Lockout
```bash
# Run 10 times with wrong password
# 10th attempt locks account for 15 minutes
```

### Test Order Creation
```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"productId":"507f1f77bcf86cd799439011","quantity":1,"price":500}],
    "paymentMethod":"razorpay"
  }'
```

### Test Payment Verification
```bash
curl -X POST http://localhost:5000/api/payments/verify \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId":"507f1f77bcf86cd799439011",
    "razorpayPaymentId":"pay_1234567890",
    "razorpayOrderId":"order_1234567890",
    "razorpaySignature":"sig123..."
  }'
```

---

## Important Security Notes

1. **Server-Side Payment Verification:** Never trust `razorpaySignature` from frontend. Always verify on server using HMAC-SHA256.

2. **Refresh Tokens:** Currently using single 24h token. For production, use 2-token system (15min access + 7day refresh).

3. **OTP Security:** OTP currently stored in plain text. Hash with HMAC-SHA256 before production.

4. **Phone Requirement:** Returns HTTP 428 when phone number is required. Frontend must prompt user to add phone.

5. **Account Lockout:** After 10 failed logins, account is locked for 15 minutes. Users cannot login during this period.

6. **Password Reset:** Requires OTP verification. Never reset password without OTP validation.
