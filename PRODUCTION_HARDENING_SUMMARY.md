# RAS Currys Production Hardening - Implementation Summary

## ✅ PHASE 0 (CRITICAL FIXES) - COMPLETED

### 1. Removed Unsafe Debug Logs
- ✅ Removed `[LOGIN DEBUG]` console logs from `authController.js`
- ✅ Verified no other debug logs remain in auth flow
- ✅ All sensitive operations are now silent except for errors

### 2. Fixed Unsafe `.save()` Patterns
- ✅ All password, OTP, and phone number updates use `updateOne(..., { runValidators: false })`
- ✅ No `.save()` methods introduced in critical paths
- ✅ Verified in User model: `verifyOTP`, `resetPassword`, `addPhoneNumber`, `generatePasswordResetOTP`, `resendOTP`

### 3. Implemented Rate Limiting
**File Created:** `middleware/rateLimiter.js`

#### Limits Applied:
| Endpoint | Limit | Window |
|----------|-------|--------|
| `/auth/login` | 5 attempts | 10 minutes per IP |
| `/auth/verify-email` | 5 attempts | 10 minutes per email |
| `/auth/forgot-password` | 3 requests | 1 hour per email |
| `/auth/register` | 3 requests | 24 hours per email |
| General API | 100 requests | 15 minutes per IP |

**Response Format (429):**
```json
{
  "success": false,
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Too many login attempts. Please try again in 10 minutes.",
  "retryAfter": 1672531200000
}
```

**Integration:** All limiters applied to `authRoutes.js`

### 4. Implemented Login Attempt Lockout
**Added to User Schema:**
- `loginAttempts` (Number, default: 0)
- `loginLockUntil` (Date, default: null)

**New Methods Added to UserModel:**
- `isAccountLocked(email)` - Check if account is locked
- `recordFailedLogin(email)` - Increment failed attempts, lock after 10 failures
- `resetLoginAttempts(email)` - Clear counters on successful login

**Lockout Rules:**
- After 10 failed login attempts → Account locked for 15 minutes
- Returns **HTTP 423 LOCKED** when locked
- Resets counters on successful login

**Integration:** `authController.js` login() now checks lockout status

---

## ✅ PHASE 1 (CORE SYSTEMS) - COMPLETED

### 5. Orders System (Complete)
**File Created:** `models/Order.js`

**Order Schema:**
```javascript
{
  orderId: String (unique, auto-generated),
  userId: ObjectId (ref User),
  items: [{ productId, quantity, price }],
  totalAmount: Number,
  orderStatus: enum[pending|confirmed|shipped|delivered|cancelled],
  paymentStatus: enum[pending|completed|failed],
  paymentMethod: enum[razorpay|credit_card|debit_card|upi|net_banking],
  paymentId: String,
  razorpayOrderId: String,
  razorpayPaymentId: String,
  shippingAddress: Object,
  trackingNumber: String,
  notes: String,
  createdAt, updatedAt
}
```

**Model Methods:**
- `create()` - Create new order
- `findById()` - Fetch with user details
- `findByOrderId()` - Fetch by custom order ID
- `findByUserId()` - User's orders with pagination
- `findAll()` - Admin: all orders
- `updateOrderStatus()` - Admin: update status
- `updatePaymentStatus()` - Update payment state
- `updateRazorpayDetails()` - Store Razorpay IDs
- `cancelOrder()` - Cancel with state change
- `addTrackingNumber()` - Add shipping tracking

**File Created:** `controllers/orderController.js`

**Endpoints Implemented:**
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/orders` | ✓ Phone | Create order |
| GET | `/api/orders` | ✓ Phone | User's orders |
| GET | `/api/orders/admin/all` | ✓ Admin | All orders |
| GET | `/api/orders/:id` | ✓ Phone | Order details |
| PUT | `/api/orders/:id` | ✓ Admin | Update status |
| DELETE | `/api/orders/:id` | ✓ Phone | Cancel order |

**File Created:** `routes/orderRoutes.js`

### 6. Razorpay Payments Integration
**File Created:** `controllers/paymentController.js`

**Endpoints Implemented:**

#### 1. Create Payment Order
**POST** `/api/payments/create`
```json
Request: { "orderId": "507f1f77bcf86cd799439011" }
Response: {
  "success": true,
  "data": {
    "orderId": "507f1f77bcf86cd799439011",
    "amount": 5000,
    "currency": "INR",
    "razorpayKeyId": "key_XXXXX",
    "receipt": "ORD-1672531200-abc123"
  }
}
```

#### 2. Verify Payment (Server-Side Signature Verification)
**POST** `/api/payments/verify`
```json
Request: {
  "orderId": "...",
  "razorpayPaymentId": "pay_XXXXX",
  "razorpayOrderId": "order_XXXXX",
  "razorpaySignature": "sig..."
}
Response: { "success": true, "data": { "paymentStatus": "completed" } }
```

**CRITICAL SECURITY:** 
- ✅ Server-side HMAC-SHA256 signature verification
- ✅ Never trusts frontend payment status
- ✅ Updates order only after verified signature
- ✅ 400 response on signature mismatch

#### 3. Webhook Handler
**POST** `/api/payments/webhook`
- Verifies webhook signature
- Handles `payment.authorized`, `payment.captured`, `payment.failed` events
- Updates order state atomically
- Returns 200 immediately (prevents retry loops)

**Environment Variables Required:**
```
RAZORPAY_KEY=key_XXXXX
RAZORPAY_SECRET=secret_XXXXX
RAZORPAY_WEBHOOK_SECRET=secret_XXXXX
```

**File Created:** `routes/paymentRoutes.js`

---

## ✅ SECURITY ENHANCEMENTS - COMPLETED

### 7. Improved Error Response Format
**Standardized Format:** All error responses now use consistent structure:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

**Updated in:**
- ✅ `middleware/auth.js` - All auth errors
- ✅ `controllers/authController.js` - All auth operations
- ✅ `controllers/orderController.js` - All order operations
- ✅ `controllers/paymentController.js` - All payment operations

### 8. HTTP Status Codes Properly Applied
- **400 Bad Request** - Invalid input
- **401 Unauthorized** - Token missing/invalid
- **403 Forbidden** - Insufficient permissions
- **423 Locked** - Account locked (new)
- **428 Precondition Required** - Phone number required
- **429 Too Many Requests** - Rate limit exceeded

---

## ⚠️ NEXT STEPS (NOT YET IMPLEMENTED)

### TODO 1: Refresh Token Architecture
Currently using single 24h token. Needed:
- Implement 15-minute access tokens (in-memory, frontend)
- Implement 7-day refresh tokens (httpOnly cookies)
- `POST /api/auth/refresh` endpoint
- Refresh token rotation on each use
- `POST /api/auth/logout` endpoint with token revocation

### TODO 2: OTP Hashing
Current: Plain text OTP storage
Needed:
- Hash OTP with HMAC-SHA256 before storing
- Compare hashed values only during verification
- Add `otpCodeHash` field to schema

### TODO 3: CSRF Protection
Needed:
- Add CSRF middleware (express-csurf or similar)
- Protect all state-changing endpoints:
  - `/auth/*`
  - `/orders`
  - `/payments`
- Cookie-based CSRF tokens

### TODO 4: Structured Logging (Winston)
Current: Console logs
Needed:
- Winston logger with daily file rotation
- Structured JSON logging format
- Request ID middleware for tracing
- Error logging with stack traces
- Access logs with response times

### TODO 5: Database Migration (PostgreSQL)
Current: MongoDB
Needs:
- Migrate to PostgreSQL with Prisma or Sequelize
- User, Product, Order, Ticket schemas
- Preserve all auth logic exactly
- Transaction support for payment operations

---

## 🔧 INSTALLATION & TESTING

### Install Dependencies
```bash
cd backend
npm install
```

New packages added:
- `express-rate-limit` ^7.1.5 - Rate limiting
- `winston` ^3.11.0 - Structured logging

### Environment Variables
```env
# Existing
MONGODB_URI=mongodb://...
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# New (Razorpay)
RAZORPAY_KEY=key_XXXXX
RAZORPAY_SECRET=secret_XXXXX
RAZORPAY_WEBHOOK_SECRET=secret_XXXXX

# Node Environment
NODE_ENV=production
FRONTEND_URL=https://your-frontend.com
```

### Start Server
```bash
npm start         # Production
npm run dev       # Development with nodemon
```

### Test Rate Limiting
```bash
# Should succeed
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass123"}'

# After 5 attempts in 10 minutes → 429 response
```

### Test Login Lockout
```bash
# After 10 failed login attempts → 423 response
{
  "success": false,
  "error": "ACCOUNT_LOCKED",
  "message": "Account is temporarily locked..."
}
```

---

## 📊 FILES MODIFIED/CREATED

### Created Files:
1. ✅ `middleware/rateLimiter.js` - Rate limiting middleware
2. ✅ `models/Order.js` - Order model with methods
3. ✅ `controllers/orderController.js` - Order operations
4. ✅ `routes/orderRoutes.js` - Order endpoints
5. ✅ `controllers/paymentController.js` - Payment operations
6. ✅ `routes/paymentRoutes.js` - Payment endpoints

### Modified Files:
1. ✅ `package.json` - Added dependencies
2. ✅ `backend/models/User.js` - Added loginAttempts, loginLockUntil fields
3. ✅ `backend/controllers/authController.js` - Removed debug logs, added lockout logic
4. ✅ `backend/routes/authRoutes.js` - Added rate limiters
5. ✅ `backend/middleware/auth.js` - Improved error responses
6. ✅ `backend/server.js` - Added order and payment routes

---

## ✅ VERIFICATION CHECKLIST

- [x] No debug logs in production code
- [x] All password/OTP updates use updateOne with runValidators: false
- [x] Rate limiting on all auth endpoints
- [x] Login lockout after 10 failed attempts (15 min)
- [x] Order model with all required fields
- [x] Order CRUD endpoints with auth
- [x] Razorpay signature verification (server-side)
- [x] Webhook handler for payment events
- [x] Admin RBAC applied to order updates
- [x] Phone number requirement enforced (428 response)
- [x] Consistent error response format
- [x] Proper HTTP status codes

---

## 🚀 ARCHITECTURE NOTES

### Auth Flow (State Machine - PRESERVED)
```
REGISTERED_NOT_VERIFIED
  ↓ (verify email via OTP)
EMAIL_VERIFIED
  ↓ (add phone number)
LOGGED_IN_NO_PHONE
  ↓ (phone number added)
ACTIVE_USER
```

### Payment Flow
```
Order Created (pending)
  ↓
Client initiates Razorpay
  ↓
Payment Verified (server-side)
  ↓
Order Status → confirmed
Payment Status → completed
```

### Security Stack
- ✅ bcrypt 12-round password hashing
- ✅ JWT HS256 with 24h expiry
- ✅ Email OTP (10 min expiry)
- ✅ Rate limiting on critical endpoints
- ✅ Login attempt lockout
- ✅ HMAC-SHA256 Razorpay signature verification
- ✅ Phone gating with 428 response
- ✅ Admin RBAC enforcement

---

## 📝 NOTES FOR NEXT DEVELOPER

1. **Refresh Token Implementation:** The system currently uses a single 24-hour token. For production, implement a 2-token system (15min access + 7day refresh in httpOnly cookie).

2. **OTP Hashing:** Currently storing OTP in plain text. Before production, implement HMAC-SHA256 hashing.

3. **CSRF Protection:** Add CSRF middleware to all state-changing endpoints (especially /orders and /payments).

4. **Logging:** Implement Winston structured logging with request IDs for debugging production issues.

5. **PostgreSQL Migration:** Migrate from MongoDB to PostgreSQL using Prisma for better transaction support in payment processing.

6. **Testing:** Create test suite for:
   - Rate limiting enforcement
   - Login lockout mechanism
   - Order creation and payment verification
   - Admin permission checks

7. **Monitoring:** Set up alerts for:
   - Failed payments
   - Locked accounts
   - Rate limit abuse
   - Failed OTP verifications
