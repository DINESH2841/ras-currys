# 🚀 Developer Quick Start - RAS Currys Backend

## What Changed (TL;DR)

Your auth system is **100% preserved**. We added:

1. **Rate Limiting** - Prevents brute force (5 attempts/10min on login)
2. **Login Lockout** - Locks after 10 failed attempts for 15 minutes
3. **Order System** - Complete e-commerce with 6 endpoints
4. **Payments** - Razorpay integration with secure signature verification
5. **Admin Controls** - Role-based access management (RBAC)

---

## 📦 Installation (2 minutes)

```bash
cd backend
npm install
npm run dev
```

Done! Server runs on `http://localhost:5000`

---

## 🔑 Environment Variables

Create `.env` in `backend/` folder:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/ras-currys

# Auth
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=24h

# Email
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Frontend
FRONTEND_URL=http://localhost:3000

# Payments (IMPORTANT - add to test integration)
RAZORPAY_KEY=rzp_test_XXXXX
RAZORPAY_SECRET=secret_XXXXX
RAZORPAY_WEBHOOK_SECRET=secret_XXXXX
```

---

## 📚 File Structure

```
backend/
├── models/
│   ├── User.js           (MODIFIED - added loginAttempts, loginLockUntil)
│   ├── Product.js
│   ├── Ticket.js
│   └── Order.js          ✨ NEW - E-commerce orders
├── controllers/
│   ├── authController.js (MODIFIED - removed debug logs, added lockout)
│   ├── orderController.js ✨ NEW - Order CRUD operations
│   └── paymentController.js ✨ NEW - Razorpay payment handling
├── routes/
│   ├── authRoutes.js     (MODIFIED - added rate limiters)
│   ├── orderRoutes.js    ✨ NEW
│   └── paymentRoutes.js  ✨ NEW
├── middleware/
│   ├── auth.js           (MODIFIED - improved error responses)
│   ├── rateLimiter.js    ✨ NEW - Rate limiting middleware
│   └── validation.js
├── server.js             (MODIFIED - added new routes)
└── package.json          (MODIFIED - added dependencies)
```

---

## 🔥 New Features

### 1. Rate Limiting
Applied automatically to auth endpoints. Test it:

```bash
# Try logging in 6 times quickly
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"wrong"}'

# 6th request returns 429 TOO_MANY_REQUESTS
```

### 2. Login Lockout
After 10 failed login attempts, account locks for 15 minutes:

```json
{
  "success": false,
  "error": "ACCOUNT_LOCKED",
  "message": "Account is temporarily locked...",
  "lockedUntil": "2024-01-15T10:45:00.000Z"
}
```

Returns HTTP **423 LOCKED**

### 3. Orders API

#### Create Order
```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"productId":"507f1f77bcf86cd799439011","quantity":2,"price":500}],
    "paymentMethod":"razorpay"
  }'
```

#### Get My Orders
```bash
curl -X GET "http://localhost:5000/api/orders?limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Cancel Order
```bash
curl -X DELETE http://localhost:5000/api/orders/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Payments API

#### Create Payment
```bash
curl -X POST http://localhost:5000/api/payments/create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"orderId":"507f1f77bcf86cd799439011"}'
```

#### Verify Payment (After Razorpay)
```bash
curl -X POST http://localhost:5000/api/payments/verify \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId":"507f1f77bcf86cd799439011",
    "razorpayPaymentId":"pay_XXXXX",
    "razorpayOrderId":"order_XXXXX",
    "razorpaySignature":"sig_XXXXX"
  }'
```

---

## ⚡ Key Changes to Existing Code

### User Model
**Added Fields:**
```javascript
loginAttempts: { type: Number, default: 0 }
loginLockUntil: { type: Date, default: null }
```

**New Methods:**
```javascript
await UserModel.isAccountLocked(email)
await UserModel.recordFailedLogin(email)
await UserModel.resetLoginAttempts(email)
```

### Auth Controller
**Removed:**
- `[LOGIN DEBUG]` console logs

**Added:**
- Account lockout check before login attempt
- Failed attempt recording
- Lock status check returning 423

### Auth Routes
**Added Rate Limiting:**
```javascript
import { loginLimiter, emailVerificationLimiter, ... } from '../middleware/rateLimiter.js'

router.post('/login', loginLimiter, validateLogin, login)
router.post('/register', registrationLimiter, validateRegistration, register)
// ... etc
```

---

## 🧪 Testing the New Systems

### Test 1: Rate Limiting Works
```bash
# Run 6 times
for i in {1..6}; do
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}' \
    -w "\nStatus: %{http_code}\n\n"
done

# Last one should be 429
```

### Test 2: Account Lockout Works
```bash
# Run 10 times with wrong password (same user)
# 10th returns 423 LOCKED
```

### Test 3: Orders Work
```bash
# Get valid JWT token first
TOKEN=$(curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}' \
  | jq -r '.data.token')

# Create order
curl -X POST http://localhost:5000/api/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"productId":"507f1f77bcf86cd799439011","quantity":1,"price":100}],
    "paymentMethod":"razorpay"
  }'
```

---

## 🚨 Common Issues & Fixes

### "Port 5000 already in use"
```bash
# Windows
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process

# Mac/Linux
kill -9 $(lsof -t -i:5000)

# Or change PORT in .env
PORT=5001
```

### "ECONNREFUSED - MongoDB connection failed"
```bash
# Check MongoDB is running
# Start it: mongod
# Or use MongoDB Atlas with connection string
```

### "Rate limiting not working"
```bash
# Check middleware is applied in authRoutes.js
# Check express-rate-limit is installed
npm list express-rate-limit

# For testing, set NODE_ENV=test to skip limits
NODE_ENV=test npm run dev
```

### "Email service failing"
```bash
# Check Gmail app password
# Must enable 2FA first
# Use app-specific password, not account password

# Test:
node -e "const nodemailer = require('nodemailer');
const t = nodemailer.createTransport({service:'gmail',auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASS}});
t.verify((e,s) => console.log(e || s));"
```

---

## 📊 Database Schema Changes

### User Model (Added)
```javascript
loginAttempts: Number       // Failed login count
loginLockUntil: Date        // When lock expires
```

### Order Model (New)
```javascript
{
  orderId: String,              // ORD-{timestamp}-{random}
  userId: ObjectId,             // ref User
  items: [{productId, quantity, price}],
  totalAmount: Number,
  orderStatus: String,          // pending|confirmed|shipped|delivered|cancelled
  paymentStatus: String,        // pending|completed|failed
  paymentMethod: String,        // razorpay|credit_card|...
  paymentId: String,
  razorpayOrderId: String,
  razorpayPaymentId: String,
  shippingAddress: Object,
  trackingNumber: String,
  createdAt, updatedAt
}
```

---

## 🔐 Security Checklist

Before deploying:

- [ ] Change JWT_SECRET to something strong (32+ chars)
- [ ] Setup Razorpay test account and get keys
- [ ] Configure MongoDB (Atlas recommended)
- [ ] Setup email service (Gmail or SendGrid)
- [ ] Test payment verification works
- [ ] Enable HTTPS (production only)
- [ ] Set CORS origins correctly
- [ ] Test rate limiting
- [ ] Verify account lockout works
- [ ] Check no debug logs in console

---

## 🚀 Next Steps (If Continuing Development)

1. **Implement Refresh Token System**
   - Currently: Single 24h token
   - Better: 15min access + 7day refresh in httpOnly cookie
   - File: Need to create `/api/auth/refresh` endpoint

2. **Hash OTPs Before Storing**
   - Currently: Plain text in DB
   - Better: HMAC-SHA256 hash before storage

3. **Add CSRF Protection**
   - Currently: No CSRF protection
   - Better: Add express-csurf middleware

4. **Structured Logging**
   - Currently: Console logs only
   - Better: Winston logger with file rotation

5. **PostgreSQL Migration**
   - Currently: MongoDB
   - Better: PostgreSQL for transaction support in payments

---

## 📞 API Endpoints (Quick Reference)

### Auth (Existing - Preserved)
```
POST   /api/auth/register
POST   /api/auth/verify-email
POST   /api/auth/login
POST   /api/auth/add-phone
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
GET    /api/auth/me
```

### Orders (New)
```
POST   /api/orders                    (create)
GET    /api/orders                    (my orders)
GET    /api/orders/:id                (details)
PUT    /api/orders/:id                (admin: update status)
DELETE /api/orders/:id                (cancel)
GET    /api/orders/admin/all          (admin: all orders)
```

### Payments (New)
```
POST   /api/payments/create           (init payment)
POST   /api/payments/verify           (verify after payment)
POST   /api/payments/webhook          (from Razorpay)
```

---

## 💡 Architecture Notes

### State Machine (Preserved)
```
User Registration
    ↓
Email Verification (OTP)
    ↓
Email Verified
    ↓
Add Phone Number
    ↓
Full User
```

### Payment Flow (New)
```
Order Created (pending/pending)
    ↓
Client → Razorpay
    ↓
Server Verifies Signature
    ↓
Order Status → Confirmed
Payment Status → Completed
```

---

## 🎯 You're All Set!

✅ All critical security fixes implemented
✅ Orders system ready
✅ Payments integrated
✅ Admin controls enforced
✅ Fully documented

Start the server and start building! 🚀

```bash
npm run dev
```

Questions? Check:
1. API_REFERENCE.md
2. DEPLOYMENT_GUIDE.md
3. PRODUCTION_HARDENING_SUMMARY.md
