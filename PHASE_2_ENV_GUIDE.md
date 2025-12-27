# Phase 2: Environment Variables Guide

## Overview

Phase 2 introduces enhanced security features including OTP hashing, CSRF protection, and structured logging. This guide documents all environment variables required for these features.

## Core Environment Variables (Phase 0-1)

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/ras-currys

# Frontend URLs (comma-separated)
FRONTEND_URL=https://yourdomain.com
FRONTEND_URLS=https://yourdomain.com,https://www.yourdomain.com

# JWT Secret (32+ characters recommended)
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Email Service (Gmail)
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Razorpay Payment Gateway
RAZORPAY_KEY=your-razorpay-key-id
RAZORPAY_SECRET=your-razorpay-secret-key
RAZORPAY_WEBHOOK_SECRET=your-webhook-secret
```

## Phase 2 Additions

### 1. OTP Hashing Security

**Environment Variable:** `OTP_HASH_SECRET`

```env
# OTP_HASH_SECRET - HMAC-SHA256 secret for OTP hashing
# Used to hash OTPs before storing in database
# If not provided, falls back to "default-otp-secret-change-in-production"
# REQUIRED for production (must be 32+ characters)
OTP_HASH_SECRET=your-otp-hash-secret-32-chars-minimum
```

**Why This Matters:**
- All OTP codes are hashed with HMAC-SHA256 before storage
- Plain text OTPs never touch the database
- Even if database is compromised, OTPs cannot be recovered
- Hash comparison uses constant-time comparison to prevent timing attacks

**How It Works:**
```
User Registration Flow:
1. System generates 6-digit OTP (e.g., "123456")
2. OTP is hashed: HMAC-SHA256(OTP, OTP_HASH_SECRET) → otpCodeHash
3. otpCodeHash is stored in database
4. Plain OTP sent to user via email
5. User provides OTP for verification
6. System hashes provided OTP and compares with stored otpCodeHash
```

**Example Values:**
```env
# Development (can be simple)
OTP_HASH_SECRET=dev-otp-secret-for-testing-only

# Production (must be cryptographically strong)
OTP_HASH_SECRET=aB7$kL9mQ2@xY4vW6sN1pR3tU5eH8dF0jG
```

### 2. Structured Logging Configuration

**Environment Variable:** `LOG_LEVEL`

```env
# LOG_LEVEL - Controls Winston logging verbosity
# Options: error, warn, info, http, debug, verbose
# Default: debug
# Recommended for Production: info or warn
LOG_LEVEL=info
```

**Log Levels Explained:**
- `error` - Only errors (STDERR level)
- `warn` - Warnings and errors
- `info` - General info, warnings, errors (recommended for production)
- `http` - HTTP requests + all above
- `debug` - Everything (development only)
- `verbose` - All details (very noisy)

**Log Files Created:**
```
backend/logs/
├── error.log        - Only errors (always created)
├── combined.log     - All levels (always created)
└── http.log         - HTTP requests only (created if LOG_LEVEL includes http)
```

**Example Configuration:**
```env
# Development
LOG_LEVEL=debug

# Staging
LOG_LEVEL=http

# Production
LOG_LEVEL=info
```

### 3. Request Tracking (No Configuration Required)

**How It Works:**
- Each request gets a unique UUID in `X-Request-ID` header
- All logs for that request include the request ID
- Helps trace requests across services for debugging
- Automatically returned to client in response headers

**Example Log Entry:**
```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "level": "info",
  "message": "User registered successfully",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "user123",
  "email": "user@example.com"
}
```

## Complete .env Template for Phase 2

```env
# ==================== SERVER CONFIG ====================
NODE_ENV=production
PORT=5000

# ==================== DATABASE ====================
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/ras-currys

# ==================== FRONTEND ====================
FRONTEND_URL=https://yourdomain.com
FRONTEND_URLS=https://yourdomain.com,https://www.yourdomain.com

# ==================== AUTHENTICATION ====================
JWT_SECRET=your-super-secret-jwt-key-32-chars-minimum

# ==================== EMAIL SERVICE ====================
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password-16-chars

# ==================== PAYMENT GATEWAY ====================
RAZORPAY_KEY=rzp_live_xxxxxxxxxxxxx
RAZORPAY_SECRET=your-razorpay-secret-key
RAZORPAY_WEBHOOK_SECRET=your-webhook-secret

# ==================== PHASE 2 SECURITY ====================
# OTP Security - HMAC-SHA256 hashing
OTP_HASH_SECRET=your-otp-hash-secret-32-chars-minimum

# Logging
LOG_LEVEL=info
```

## Setup Instructions

### Step 1: Copy Template
```bash
cp backend/.env.example backend/.env
```

### Step 2: Generate Strong Secrets

**For JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**For OTP_HASH_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**For RAZORPAY_WEBHOOK_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 3: Fill in Values
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://...
FRONTEND_URL=https://yourapp.com
JWT_SECRET=<output-from-step-2>
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
RAZORPAY_KEY=rzp_live_...
RAZORPAY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=<output-from-step-2>
OTP_HASH_SECRET=<output-from-step-2>
LOG_LEVEL=info
```

## Phase 2 Security Features

### 1. OTP Hashing

**Status:** ✅ Implemented
- All OTPs hashed with HMAC-SHA256 before database storage
- Constant-time comparison prevents timing attacks
- Methods updated:
  - `User.create()` - Hashes OTP on registration
  - `User.verifyOTP()` - Verifies hashed OTP
  - `User.generatePasswordResetOTP()` - Hashes reset OTP
  - `User.resetPassword()` - Verifies hashed reset OTP
  - `User.resendOTP()` - Hashes resent OTP

**Code Location:** `backend/utils/otpHelper.js`

### 2. CSRF Protection

**Status:** ✅ Implemented
- Token-based CSRF protection for POST/PUT/DELETE/PATCH
- New tokens generated on each verification (rotation)
- Per-session token store (in-memory)
- Returns HTTP 403 on verification failure

**Header:** `X-CSRF-Token`
**Code Location:** `backend/middleware/csrf.js`

### 3. Structured Logging

**Status:** ✅ Implemented
- Winston logger with 4 transports
- Request ID propagation
- Structured JSON output
- Color-coded console output
- Separate log files for errors and combined logs

**Code Location:** `backend/config/logger.js`

### 4. Request ID Tracking

**Status:** ✅ Implemented
- UUID generation or header-based ID
- Propagated through all requests
- Added to all log entries
- Returned in `X-Request-ID` response header

**Code Location:** `backend/middleware/requestLogger.js`

## Verification Checklist

After setting environment variables, verify:

```bash
# 1. Check logs directory is created on startup
ls -la backend/logs/

# 2. Verify OTP_HASH_SECRET is loaded
node -e "require('dotenv').config(); console.log('OTP_HASH_SECRET set:', !!process.env.OTP_HASH_SECRET)"

# 3. Test registration with OTP hashing
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test@123"}'

# 4. Check logs for request ID
tail -f backend/logs/combined.log

# 5. Verify CSRF token in response
curl -X GET http://localhost:5000/health \
  -v 2>&1 | grep X-CSRF-Token
```

## Deployment Notes

### For AWS/Heroku/Railway

Set environment variables in platform dashboard:
```
NODE_ENV=production
OTP_HASH_SECRET=<strong-random-secret>
LOG_LEVEL=info
... (other variables)
```

### For Docker

Update `docker-compose.yml`:
```yaml
environment:
  - NODE_ENV=production
  - OTP_HASH_SECRET=<strong-random-secret>
  - LOG_LEVEL=info
```

### For Kubernetes

Use secrets:
```bash
kubectl create secret generic ras-currys-secrets \
  --from-literal=OTP_HASH_SECRET=<value> \
  --from-literal=JWT_SECRET=<value>
```

## Troubleshooting

### Issue: OTP hash not working
**Check:**
- `OTP_HASH_SECRET` is set in `.env`
- Restart server after changing `.env`
- Check logs for OTP hashing errors

### Issue: CSRF token missing
**Check:**
- Browser allowing `X-CSRF-Token` header (check CORS settings)
- Frontend sending token in headers for state-changing requests
- Check console for 403 CSRF errors

### Issue: Logs not created
**Check:**
- `backend/logs/` directory writable
- `LOG_LEVEL` is set (not empty)
- Check stdout for logger initialization messages

## Next Steps

1. ✅ Set all Phase 2 environment variables
2. ✅ Run tests to verify OTP hashing
3. ✅ Test CSRF protection on admin endpoints
4. ✅ Monitor logs for request tracking
5. ⏳ Phase 3: Database migration to PostgreSQL (optional)

## Support

For issues or questions about Phase 2 security features, refer to:
- `PHASE_2_IMPLEMENTATION.md` - Technical details
- `backend/config/logger.js` - Logger configuration
- `backend/utils/otpHelper.js` - OTP hashing implementation
- `backend/middleware/csrf.js` - CSRF protection implementation
