# 🎯 COMPREHENSIVE SYSTEM ANALYSIS: RAS CURRYS

## 1️⃣ OVERALL PROJECT STATUS

### Current Maturity: **6.5/10**

**Verdict**: Production-grade authentication foundation with significant gaps in e-commerce completeness. Authentication is logically sound but deployment-ready features are missing.

---

### ✅ WHAT IS FULLY WORKING

1. **User Registration Flow** (State: REGISTERED_NOT_VERIFIED)
   - Email normalization working
   - Password hashing with bcrypt (12 rounds, enterprise-grade)
   - OTP generation (6-digit, 10-minute expiry)
   - Email delivery via Gmail SMTP
   - Duplicate email detection at DB level (unique constraint)

2. **Email OTP Verification** (State: EMAIL_VERIFIED)
   - Correct state isolation using `updateOne` (not `save()`)
   - Password hash never touched
   - Proper expiry validation
   - Idempotency: checks if already verified

3. **Login Flow** (State: LOGGED_IN_NO_PHONE)
   - Email normalization consistent
   - Password verification via bcrypt.compare()
   - JWT issuance (24h expiry, HS256)
   - Response includes `phoneRequired` flag (server-side gating hint)
   - Email verification check enforced pre-login

4. **Phone Gating** (State: ACTIVE_USER)
   - Unique sparse index on phoneNumber (allows multiple NULLs, prevents duplicates)
   - `requirePhoneNumber` middleware returns HTTP 428 (correct status)
   - Phone is optional at signup (reduces friction)
   - Duplicate phone detection via DB unique index + explicit error handling

5. **Protected Routes**
   - `/api/auth/me` enforces `authenticateToken` + `requirePhoneNumber`
   - All auth routes validate input with express-validator
   - CORS properly configured
   - Security headers present (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection)

6. **Frontend-Backend Alignment**
   - Login component properly handles `phoneRequired` flag
   - Navbar safely accesses user data with optional chaining
   - Profile link added to navbar
   - Session expiry tracked in localStorage (24h)

---

### ⚠️ PARTIALLY WORKING

1. **Password Reset Flow** (80% working)
   - OTP generation and email delivery work
   - Password hashing correct
   - **Issue**: No validation that user is verified before issuing reset OTP (fixed in code but not tested end-to-end)

2. **User Profile Fetch** (70% working)
   - `/api/users/:id` endpoint created
   - Phone gating applied (returns 428 if missing)
   - **Issue**: Phone status tracking incomplete; `phoneVerified` defaults to false but has no verify mechanism

3. **Tickets API** (60% working)
   - Endpoint created (`GET /api/tickets`, `POST /api/tickets`)
   - User-scoped queries work
   - **Issue**: No update/delete for tickets, no admin list all, no status workflow

---

### ❌ MISSING / BROKEN

1. **Orders System** - Completely absent
   - No Order model
   - No order creation endpoint
   - No order history endpoint
   - Checkout flow references orders but they don't exist

2. **Payments Integration** - Not implemented
   - Razorpay integration missing
   - Payment status tracking absent
   - Refund workflow nonexistent

3. **Admin RBAC** - Only partially stubbed
   - No admin product CRUD enforcement
   - No order management endpoints
   - `/admin` routes reference dashboard but no backend protection

4. **PostgreSQL Migration** - Not started
   - Entire schema is MongoDB
   - No migration scripts planned
   - This is a blocker for production evaluation (brief specifies PostgreSQL)

5. **Rate Limiting** - Absent
   - No request throttling
   - Brute-force protection missing
   - OTP spam prevention missing

6. **Refresh Tokens** - Not implemented
   - Only access tokens (24h) exist
   - No refresh token rotation
   - Session fixation possible

7. **Observability** - Minimal
   - Basic console logging only
   - No structured logs (request IDs, user IDs)
   - No error monitoring (Sentry, etc.)
   - No performance metrics

8. **Deployment** - Not production-ready
   - No Docker setup for production
   - No HTTPS/SSL configuration
   - No graceful shutdown
   - No health checks beyond `/health` stub

---

## 2️⃣ END-TO-END SYSTEM FLOW

### **USER STATE MACHINE**

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  REGISTERED_NOT_VERIFIED                                    │
│  (email: ✓, password: ✓, emailVerified: false,             │
│   phoneNumber: null, otpCode: "XXXXX", otpExpiry: T+10m)  │
│                              ↓                              │
│                    [POST /api/auth/verify-email]            │
│                    [UserModel.verifyOTP(email, otp)]        │
│                    [User.updateOne({ emailVerified: true }) │
│                              ↓                              │
│  EMAIL_VERIFIED                                             │
│  (email: ✓, emailVerified: true, phoneNumber: null,        │
│   otpCode: null, otpExpiry: null)                          │
│                              ↓                              │
│                    [POST /api/auth/login]                   │
│                    [bcrypt.compare(pwd, hash) ✓]            │
│                    [generateToken(userId, email, role)]     │
│                              ↓                              │
│  LOGGED_IN_NO_PHONE                                         │
│  (token: JWT, phoneRequired: true, phoneNumber: null)      │
│                              ↓                              │
│                    [POST /api/auth/add-phone]               │
│                    [User.updateOne({ phoneNumber: "10d" })  │
│                              ↓                              │
│  ACTIVE_USER                                                │
│  (phoneNumber: "10d", phoneVerified: false, can access /me) │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### **DETAILED FLOW BREAKDOWN**

#### **FLOW 1: REGISTRATION → VERIFICATION → LOGIN → PHONE GATING**

```
USER: Submits (fullName, email, password) → Signup Form
      ↓
FRONTEND: apiClient.signup(name, email, password, phone: OPTIONAL)
      ↓
BACKEND: POST /api/auth/register
│
├─ Input Validation (express-validator)
│  ├─ fullName: 2-255 chars ✓
│  ├─ email: valid format ✓
│  ├─ password: 8+ chars, 1 upper, 1 lower, 1 digit, 1 special ✓
│  └─ phone: OPTIONAL (6.5/10 score), if present: 10 digits ✓
│
├─ UserModel.create({ fullName, email, phoneNumber, password })
│  │
│  ├─ bcrypt.hash(password, 12 rounds) → passwordHash
│  ├─ crypto.randomInt(100000, 999999) → otpCode
│  ├─ new Date(now + 10 mins) → otpExpiry
│  │
│  └─ User.create({
│      fullName,
│      email: email.toLowerCase().trim(),
│      phoneNumber: phoneNumber || undefined,
│      passwordHash,
│      otpCode,
│      otpExpiry,
│      emailVerified: false,
│      phoneVerified: false,
│      role: 'user'
│    })
│
└─ sendSignupOTP(email, fullName, otp)
   └─ Gmail SMTP: "Your OTP is XXXXXX"

RESPONSE 201: {
  success: true,
  message: "Registration successful. Please check your email for OTP verification.",
  data: {
    userId: "64b7...",
    email: "user@example.com",
    fullName: "John Doe",
    emailSent: true
  }
}

═════════════════════════════════════════════════════════════════

USER: Checks email, enters OTP in /verify-email form
      ↓
FRONTEND: navigate('/verify-email', { state: { email } })
FRONTEND: apiClient.verifyEmail(email, otp)
      ↓
BACKEND: POST /api/auth/verify-email
│
├─ Input Validation
│  ├─ email: valid format ✓
│  └─ otp: 6 digits ✓
│
├─ UserModel.verifyOTP(email, otp)
│  │
│  ├─ User.findOne({ email: email.toLowerCase().trim() })
│  │
│  ├─ Checks:
│  │  ├─ User exists? → No → throw "User not found"
│  │  ├─ emailVerified already? → Yes → throw "Email already verified"
│  │  ├─ otpCode matches? → No → throw "Invalid OTP"
│  │  └─ otpExpiry passed? → Yes → throw "OTP expired"
│  │
│  └─ User.updateOne(
│      { _id: userId },
│      { $set: { emailVerified: true, otpCode: null, otpExpiry: null } },
│      { runValidators: false }  ← CRITICAL: No fullName validation re-triggered
│    )
│
├─ UserModel.findByEmail(email) → Get full user data
│
├─ generateToken({ id, email, role })
│  └─ jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' })
│
└─ sendWelcomeEmail(email, fullName)

RESPONSE 200: {
  success: true,
  message: "Email verified successfully. Welcome to RAS Currys!",
  data: {
    token: "eyJhbGciOiJIUzI1NiIs...",
    user: {
      id: "64b7...",
      fullName: "John Doe",
      email: "user@example.com",
      phoneNumber: null,
      phoneVerified: false,
      phoneRequired: true,  ← KEY FLAG
      role: "user",
      emailVerified: true
    }
  }
}

FRONTEND: {
  ├─ localStorage.setItem('token', token)
  ├─ authContext.setUser(user)
  └─ navigate('/') or redirect to phone modal
}

═════════════════════════════════════════════════════════════════

USER: Logs in with (email, password)
      ↓
FRONTEND: apiClient.login(email, password)
      ↓
BACKEND: POST /api/auth/login
│
├─ Input Validation
│  ├─ email: valid format ✓
│  └─ password: not empty ✓
│
├─ UserModel.findByEmail(email.toLowerCase().trim())
│  └─ Returns user doc or null
│
├─ Check:
│  ├─ User found? → No → 401 "Invalid credentials"
│  ├─ emailVerified === false && role === 'user' → 403 "Email not verified"
│  │                                                (return needsVerification: true)
│  │
│  └─ bcrypt.compare(password, user.passwordHash)
│     ├─ Match? → Yes → Continue
│     └─ Match? → No → 401 "Invalid credentials"
│
├─ generateToken({ id: user._id, email: user.email, role: user.role })
│
└─ Response 200: {
    success: true,
    message: "Login successful",
    data: {
      token: "eyJhbGciOiJIUzI1NiIs...",
      user: {
        id: "64b7...",
        fullName: "John Doe",
        email: "user@example.com",
        phoneNumber: null,
        phoneVerified: false,
        phoneRequired: true,  ← BLOCKING FLAG
        role: "user",
        emailVerified: true
      }
    }
  }

FRONTEND: {
  ├─ if (user.phoneRequired === true):
  │  └─ Show blocking modal "Add phone to continue"
  │  └─ Disable navigation
  │  └─ Only options: Add phone | Logout
  │
  └─ else:
     └─ Normal app access
}

═════════════════════════════════════════════════════════════════

USER: Enters phone number "9876543210" in add-phone modal
      ↓
FRONTEND: apiClient.addPhoneNumber(phoneNumber)
      ↓
BACKEND: POST /api/auth/add-phone
│        (requires: authenticateToken middleware)
│
├─ Input Validation
│  └─ phoneNumber: exactly 10 digits ✓
│
├─ UserModel.addPhoneNumber(req.user.userId, phoneNumber)
│  │
│  ├─ Validate format: /^[0-9]{10}$/ → Pass
│  │
│  ├─ User.findById(userId)
│  │
│  ├─ If already same number? → return early (idempotent)
│  │
│  └─ User.updateOne(
│      { _id: userId },
│      { $set: { phoneNumber: "9876543210", phoneVerified: false } },
│      { runValidators: false }
│    )
│    
│    ├─ ON DUPLICATE (error.code === 11000):
│    │  └─ throw new Error('PHONE_EXISTS') → 409 response
│    │
│    └─ ON SUCCESS:
│       └─ Returns { phoneNumber, phoneVerified: false }
│
└─ Response 200: {
    success: true,
    message: "Phone number added",
    data: {
      phoneNumber: "9876543210",
      phoneVerified: false,
      phoneRequired: false  ← UNBLOCKS ACCESS
    }
  }

FRONTEND: {
  ├─ Close modal
  ├─ Update localStorage.ras_user.phoneRequired = false
  └─ Enable navigation / Show app
}

═════════════════════════════════════════════════════════════════

USER: Tries to access /api/auth/me or /profile
      ↓
FRONTEND: apiClient.getProfile() → GET /api/auth/me
      ↓
BACKEND: GET /api/auth/me
│        (requires: authenticateToken + requirePhoneNumber)
│
├─ authenticateToken middleware:
│  ├─ Get JWT from Authorization header
│  ├─ jwt.verify(token, JWT_SECRET)
│  ├─ Set req.user = { userId, email, role }
│  └─ next()
│
├─ requirePhoneNumber middleware:
│  │
│  ├─ User.findById(req.user.userId)
│  │
│  ├─ IF phoneNumber IS NULL:
│  │  └─ Return 428 {
│  │     error: "PHONE_REQUIRED",
│  │     message: "Phone number must be added to continue"
│  │    }
│  │
│  └─ ELSE: next()
│
├─ getCurrentUser controller:
│  │
│  └─ User.findById(req.user.userId).select('-passwordHash -otpCode -otpExpiry')
│
└─ Response 200: {
    success: true,
    data: {
      user: {
        id, fullName, email, phoneNumber, phoneVerified,
        phoneRequired: false,
        role, emailVerified, createdAt
      }
    }
  }
```

---

#### **FLOW 2: PASSWORD RESET (Forgot Password → OTP → New Password)**

```
USER: Clicks "Forgot password" on login page
      ↓
FRONTEND: Login.tsx isForgotPassword = true
      ├─ Shows: email input + "Send OTP" button
      ├─ Hides: password field
      └─ Display: "Enter email to reset password"

USER: Enters email → clicks "Send OTP"
      ↓
FRONTEND: apiClient.forgotPassword(email)
      ↓
BACKEND: POST /api/auth/forgot-password
│
├─ Input Validation
│  └─ email: valid format ✓
│
├─ UserModel.generatePasswordResetOTP(email)
│  │
│  ├─ User.findOne({ email: email.toLowerCase().trim() })
│  │
│  ├─ Checks:
│  │  ├─ User exists? → No → throw "Email not registered"
│  │  └─ emailVerified === true? → No → throw "Please verify your email first"
│  │
│  ├─ otpCode = crypto.randomInt(100000, 999999).toString()
│  ├─ otpExpiry = now + 10 mins
│  │
│  └─ User.updateOne(
│      { _id: userId },
│      { $set: { otpCode, otpExpiry } },
│      { runValidators: false }
│    )
│
└─ sendPasswordResetOTP(email, fullName, otp)
   └─ Gmail SMTP: "Password reset OTP: XXXXXX"

RESPONSE 200: {
  success: true,
  message: "Password reset OTP sent to your email. Valid for 10 minutes.",
  data: { email, emailSent: true }
}

FRONTEND: {
  ├─ setOtpSent(true)
  ├─ Show: OTP input + new password input + "Reset Password" button
  └─ Display: "Enter OTP and new password"
}

═════════════════════════════════════════════════════════════════

USER: Checks email, enters OTP + new password
      ↓
FRONTEND: apiClient.resetPassword(email, otp, newPassword)
      ↓
BACKEND: POST /api/auth/reset-password
│
├─ Input Validation
│  ├─ email: valid format ✓
│  ├─ otp: 6 digits ✓
│  └─ newPassword: 8+ chars, 1 upper, 1 lower, 1 digit, 1 special ✓
│
├─ UserModel.resetPassword(email, otp, newPassword)
│  │
│  ├─ User.findOne({ email: email.toLowerCase().trim() })
│  │
│  ├─ Checks:
│  │  ├─ User exists? → No → throw "User not found"
│  │  ├─ otpCode matches? → No → throw "Invalid OTP"
│  │  └─ otpExpiry passed? → Yes → throw "OTP expired"
│  │
│  ├─ passwordHash = bcrypt.hash(newPassword, 12 rounds)
│  │
│  └─ User.updateOne(
│      { _id: userId },
│      { $set: { passwordHash, otpCode: null, otpExpiry: null } },
│      { runValidators: false }
│    )
│
└─ Response 200: {
    success: true,
    message: "Password reset successful. Please login with your new password.",
    data: { email, passwordReset: true }
  }

FRONTEND: {
  ├─ setSuccess("Password reset successfully!")
  ├─ setTimeout 1500ms
  ├─ Reset forms
  └─ navigate('/login') OR show login form
}
```

---

## 3️⃣ FUNCTION-LEVEL BREAKDOWN

### **KEY FUNCTIONS**

#### **A. UserModel.create()**

| Aspect | Detail |
|--------|--------|
| **Input** | `{ fullName, email, phoneNumber, password, role='user' }` |
| **Output** | `{ user: {...}, otp: "XXXXXX" }` |
| **DB Fields Changed** | `email`, `passwordHash`, `phoneNumber`, `otpCode`, `otpExpiry`, `emailVerified=false`, `role`, `createdAt`, `updatedAt` |
| **Must NOT Touch** | Nothing; creation is pure |
| **If Broken** | Duplicate email → throw (caught & 400); password not hashed → plaintext in DB (🔴 CRITICAL); missing OTP → no verification flow |
| **State Result** | REGISTERED_NOT_VERIFIED |

---

#### **B. UserModel.verifyOTP(email, otp)**

| Aspect | Detail |
|--------|--------|
| **Input** | `email` (string), `otp` (6-digit string) |
| **Output** | `{ id, fullName, email }` |
| **DB Fields Changed** | `emailVerified = true`, `otpCode = null`, `otpExpiry = null` |
| **Must NOT Touch** | `passwordHash`, `fullName`, `phoneNumber`, any other fields |
| **Implementation** | `User.updateOne({ _id }, { $set: {...} }, { runValidators: false })` |
| **If Broken** | Old code used `user.save()` → triggers validation → fails on missing fullName → 400; Correct: uses updateOne with runValidators: false |
| **State Result** | EMAIL_VERIFIED |
| **Critical Note** | **Never mutate in-memory user object**. Use updateOne directly. |

---

#### **C. UserModel.addPhoneNumber(userId, phoneNumber)**

| Aspect | Detail |
|--------|--------|
| **Input** | `userId` (ObjectId), `phoneNumber` (string, 10 digits) |
| **Output** | `{ phoneNumber, phoneVerified: false }` OR throw `'PHONE_EXISTS'` |
| **DB Fields Changed** | `phoneNumber`, `phoneVerified = false` |
| **DB Enforcement** | Unique sparse index on `phoneNumber` |
| **Must NOT Touch** | `passwordHash`, `email`, `emailVerified` |
| **Implementation** | `User.updateOne({ _id }, { $set: {...} }, { runValidators: false })` |
| **Error Handling** | Catch `error.code === 11000` → throw "PHONE_EXISTS" → 409 response |
| **If Broken** | Used `user.save()` → could trigger validation on other fields; Race condition on duplicate → no unique index → multiple users same phone |
| **State Result** | phoneRequired = false (unblocks access) |

---

#### **D. authController.login()**

| Aspect | Detail |
|--------|--------|
| **Input** | `{ email, password }` |
| **Checks** | User exists? emailVerified? password correct? |
| **Output** | `{ token: JWT, user: {...}, phoneRequired: bool }` OR `{ error, statusCode }` |
| **Email Normalization** | `.toLowerCase().trim()` before findByEmail |
| **Password Verification** | `bcrypt.compare(plainPassword, hash)` |
| **If Wrong Password** | 401 "Invalid credentials" (don't reveal user exists) |
| **If Not Verified** | 403 "Email not verified" + `needsVerification: true` |
| **Token Payload** | `{ userId, email, role }` (NOT password or OTP) |
| **Debug Logging** | `[LOGIN DEBUG]` console.log (remove after testing) |

---

#### **E. authController.verifyEmail()**

| Aspect | Detail |
|--------|--------|
| **Input** | `{ email, otp }` |
| **Process** | `UserModel.verifyOTP()` → `UserModel.findByEmail()` → `generateToken()` → `sendWelcomeEmail()` |
| **Output** | `{ token: JWT, user: {...}, phoneRequired: true }` |
| **User Returned** | Has null-safe `phoneNumber` (falls back to null), `phoneRequired` flag |
| **If Broken** | Verify OTP fails (old validation errors) → 400; findByEmail after verify → mismatches if normalization skipped |

---

#### **F. requirePhoneNumber middleware**

```javascript
export const requirePhoneNumber = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const user = await User.findById(userId).select('phoneNumber');
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!user.phoneNumber) {
      return res.status(428).json({  // HTTP 428: Precondition Required
        error: 'PHONE_REQUIRED',
        message: 'Phone number must be added to continue'
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};
```

| Aspect | Detail |
|--------|--------|
| **Logic** | JWT valid? → Yes → Check phone → Null? → 428 : next() |
| **Status Code** | 428 (Precondition Required) = "Missing prerequisite, not auth/permission failure" |
| **Applied To** | `/api/auth/me`, extendable to `/api/orders`, `/api/checkout`, etc. |

---

## 4️⃣ AUTH & SECURITY ANALYSIS

### ✅ WHAT IS SECURE

| Component | Implementation | Status |
|-----------|-----------------|--------|
| **Password Hashing** | bcrypt, 12 rounds (SALT_ROUNDS=12) | ✅ CORRECT |
| **Password Comparison** | bcrypt.compare(plain, hash) | ✅ CORRECT |
| **Email Unique** | Unique constraint + lowercase normalization | ✅ CORRECT |
| **Phone Unique** | Sparse unique index (allows NULLs) | ✅ CORRECT |
| **OTP Expiry** | 10 minutes, server-side validation | ✅ CORRECT |
| **JWT Secret** | Loaded from .env (assumed strong) | ✅ CORRECT |
| **JWT Payload** | No password, OTP, or sensitive data | ✅ CORRECT |
| **Email Normalization** | `.toLowerCase().trim()` everywhere | ✅ CORRECT |
| **Duplicate Detection** | DB constraints, not app logic | ✅ CORRECT |
| **Phone Gating** | Server-side 428 middleware, not frontend only | ✅ CORRECT |
| **State Isolation** | updateOne used instead of save() | ✅ CORRECT |

---

### ⚠️ WHAT IS UNSAFE / WEAK

| Issue | Severity | Details | Fix |
|-------|----------|---------|-----|
| **No Refresh Tokens** | 🔴 HIGH | Only 24h access token. Long TTL = long compromise window. No token revocation. | Implement refresh token rotation + logout token blacklist |
| **No Rate Limiting** | 🔴 HIGH | Brute-force OTP: 6 digits = 10^6 possibilities. No throttling. | Add rate limiter: max 5 OTP attempts per email per 10min |
| **No OTP Hash** | 🟠 MEDIUM | OTP stored plaintext in DB. DB breach = OTP exposed. | Hash OTP with HMAC-SHA256 before storage |
| **No Brute-Force Protection** | 🟠 MEDIUM | Login can be brute-forced. No lockout after N failures. | Add login attempt counter + temporary account lock |
| **Phone Not Verified** | 🟠 MEDIUM | Phone collected but never verified. Spoof risk. | (Optional for Phase 2): Add SMS OTP verification |
| **No HTTPS Enforcement** | 🟠 MEDIUM | Frontend localStorage stores JWT. HTTP = exposed. | Production: HTTPS only + httpOnly cookies |
| **Session in localStorage** | 🟠 MEDIUM | JWT in localStorage vulnerable to XSS. | Use httpOnly + Secure cookies in production |
| **No CSRF Protection** | 🟠 MEDIUM | No CSRF token on state-changing endpoints. | Add CSRF token middleware |
| **No Input Sanitization** | 🟡 LOW | express-validator validates format but no HTML/SQL injection protection. | Use mongo sanitize for NoSQL injection prevention |

---

### 🔴 WHAT IS MISSING

1. **No API Key Authentication** - Public endpoints unprotected
2. **No Admin RBAC** - Only role field, no permission checks
3. **No Session Revocation** - Can't logout other devices
4. **No Audit Logging** - No login history
5. **No Email Verification Resend Limit** - Spam risk
6. **No Password Change Endpoint** - Users can't self-service change password
7. **No Two-Factor Authentication** - No TOTP/SMS MFA
8. **No Account Recovery Questions** - Only email-based recovery

---

## 5️⃣ BUGS & CORRECTIONS REQUIRED

### **CRITICAL ISSUES (Block Production)**

#### **ISSUE 1: Old save() Pattern Could Still Break**

**File**: `backend/models/User.js` (lines 205, 236, 292)

**Problem**:
```javascript
// ❌ OLD PATTERN (if reintroduced):
user.phoneNumber = normalized;
user.phoneVerified = false;
await user.save({ validateModifiedOnly: true });  // ← Still triggers validation!
```

Mongoose's `validateModifiedOnly: true` re-validates only modified fields, BUT if fullName/passwordHash are required and missing, it fails.

**Why**:
- `.save()` invokes pre-save hooks and schema validation
- Legacy users created before fullName was required might be missing it
- One broken user blocks the entire operation

**Current Code** (✅ Correct):
```javascript
await User.updateOne(
  { _id: userId },
  { $set: { phoneNumber: normalized, phoneVerified: false } },
  { runValidators: false }  // ← Bypasses schema validation entirely
);
```

**Verdict**: ✅ **FIXED** - All save() calls replaced with updateOne

---

#### **ISSUE 2: Phone Gating Not Applied Everywhere**

**File**: `backend/routes/productRoutes.js`, `backend/routes/ticketRoutes.js` (missing middleware)

**Problem**:
- Only `/api/auth/me` enforces `requirePhoneNumber`
- Accessing `/api/products` with phoneNumber=null doesn't fail
- User can browse products without adding phone

**Fix**:
```javascript
// In productRoutes.js (after line 1):
import { authenticateToken, requirePhoneNumber } from '../middleware/auth.js';

// Apply to mutation endpoints:
router.post('/', authenticateToken, requirePhoneNumber, createProduct);
router.put('/:id', authenticateToken, requirePhoneNumber, updateProduct);
router.delete('/:id', authenticateToken, requirePhoneNumber, deleteProduct);

// GET can stay public or protected—depends on business rules
```

**Current Status**: ⚠️ **PARTIALLY APPLIED** - Only read endpoints exposed, writes not available anyway

---

#### **ISSUE 3: Email Normalization Inconsistent in One Spot**

**File**: `backend/controllers/authController.js` (line 214 approx.)

**Problem**:
```javascript
// In login():
const user = await UserModel.findByEmail(email);  // ← findByEmail normalizes
// But in verifyEmail():
const fullUser = await UserModel.findByEmail(email);  // ← Also normalizes
```

Both normalize, so this is actually ✅ **CORRECT**.

**Verdict**: ✅ **No issue** - Email normalization applied consistently

---

### **HIGH PRIORITY ISSUES**

#### **ISSUE 4: No Refresh Token Rotation**

**Severity**: 🔴 HIGH

**Details**:
- JWT TTL = 24h (line 5, authContext.tsx)
- Compromise of one token = access for full day
- No way to revoke tokens on logout

**Fix**:
```javascript
// 1. Split tokens:
// Access Token: Short-lived (15 min), stored in memory
// Refresh Token: Long-lived (7 days), stored in httpOnly cookie

// 2. Add endpoint:
POST /api/auth/refresh
├─ Check refreshToken from cookie
├─ Verify it's not blacklisted
├─ Issue new accessToken
└─ Return 401 if refresh token invalid

// 3. On logout:
POST /api/auth/logout
├─ Add refreshToken to blacklist (DB or Redis)
└─ Return 200

// 4. Frontend:
├─ Store accessToken in memory (cleared on page reload)
├─ Store refreshToken in httpOnly cookie (auto-sent with requests)
└─ On 401: Call /api/auth/refresh, retry original request
```

---

#### **ISSUE 5: No OTP Rate Limiting**

**Severity**: 🔴 HIGH

**Details**:
- OTP is 6 digits = 10^6 possibilities
- No throttling on `/api/auth/verify-email`
- Attacker can brute-force: `for otp in range(100000, 1000000)`

**Fix**:
```javascript
// Use redis-based rate limiter:
import rateLimit from 'express-rate-limit';

const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,  // 10 minutes
  max: 5,                    // Max 5 attempts
  keyGenerator: (req) => req.body.email,  // Per email
  handler: (req, res) => {
    res.status(429).json({
      error: 'TOO_MANY_ATTEMPTS',
      message: 'Too many OTP attempts. Please try again after 10 minutes.',
      retryAfter: '10 minutes'
    });
  }
});

router.post('/verify-email', otpLimiter, validateOTP, verifyEmail);
router.post('/login', loginLimiter, validateLogin, login);  // Also limit login
```

---

#### **ISSUE 6: Reset Password Allows Unverified Users (FIXED)**

**File**: `backend/models/User.js` line 240

**Previous Problem**:
```javascript
// ❌ OLD:
const user = await this.findByEmail(email);
if (!user.emailVerified) {
  throw new Error('Please verify your email first');
}
```

But this was missing in earlier code. Now it's ✅ **PRESENT**.

**Current Code**:
```javascript
if (!user.emailVerified) {
  throw new Error('Please verify your email first');
}
```

**Verdict**: ✅ **CORRECT**

---

### **MEDIUM PRIORITY ISSUES**

#### **ISSUE 7: No Login Attempt Counter**

**Severity**: 🟠 MEDIUM

**Problem**: After 10 failed logins, account should lock for 15 minutes

**Fix**:
```javascript
// Add to User schema:
loginAttempts: { type: Number, default: 0 },
loginLockUntil: { type: Date, default: null },

// In login controller:
if (user.loginLockUntil && Date.now() < user.loginLockUntil) {
  return res.status(423).json({ error: 'Account temporarily locked' });
}

if (!isValidPassword) {
  user.loginAttempts++;
  if (user.loginAttempts >= 10) {
    user.loginLockUntil = new Date(Date.now() + 15 * 60 * 1000);
  }
  await user.save();
  return 401;
}

// Reset on success:
user.loginAttempts = 0;
user.loginLockUntil = null;
await user.save();
```

---

#### **ISSUE 8: phoneVerified Field Unused**

**Severity**: 🟠 MEDIUM

**Problem**:
- Field exists in schema (default: false)
- Set to false when phone is added
- Never verified or updated

**Fix**:
```javascript
// For Phase 2 (optional):
POST /api/auth/verify-phone
├─ Input: phoneNumber, smsOtp
├─ Send SMS OTP to phoneNumber
├─ User enters OTP
├─ Verify OTP
└─ Update: phoneVerified = true

// Until then: Remove field or document as "Reserved for Future Use"
```

---

## 6️⃣ DATABASE SCHEMA REVIEW

### **User Schema Analysis**

```javascript
userSchema = {
  fullName: String (required),           // ✅ Correct
  email: String (unique, lowercase),     // ✅ Correct
  phoneNumber: String (unique sparse),   // ✅ Correct (nullable, unique)
  phoneVerified: Boolean (default: false), // ⚠️ Unused but harmless
  passwordHash: String (required),       // ✅ Correct (never plaintext)
  role: String (enum: user/admin/superadmin), // ✅ Correct
  emailVerified: Boolean (default: false),    // ✅ Correct
  otpCode: String (default: null),           // ✅ Correct
  otpExpiry: Date (default: null),           // ✅ Correct
  createdAt, updatedAt (timestamps)          // ✅ Correct
}

Indexes:
├─ { email: 1 }                         // ✅ For findByEmail speed
├─ { phoneNumber: 1, unique: true, sparse: true }  // ✅ Prevents duplicates
├─ { otpCode: 1 }                       // ✅ For findByOtp (if needed)
└─ { emailVerified: 1 }                 // ✅ For filtering unverified users
```

**Schema Verdict**: ✅ **CORRECT**

**Legacy User Compatibility**: ✅ **HANDLED**
- phoneNumber is nullable ✓
- fullName is required, but old users might have it
- If old users missing fullName: use `updateOne` with `runValidators: false` (done ✓)

---

## 7️⃣ API CONTRACT REVIEW

### **HTTP Status Codes**

| Endpoint | Method | Success | Invalid Input | Auth | Phone | Other |
|----------|--------|---------|----------------|------|-------|-------|
| /auth/register | POST | 201 | 400 | N/A | N/A | 500 (email fail) |
| /auth/verify-email | POST | 200 | 400 | N/A | N/A | 400 (OTP invalid/expired) |
| /auth/login | POST | 200 | 400 | 401 (creds) | N/A | 403 (not verified) |
| /auth/add-phone | POST | 200 | 400 | 401 | N/A | 409 (duplicate) |
| /auth/me | GET | 200 | N/A | 401 | 428 | 404 (user missing) |
| /auth/forgot-password | POST | 200 | 400 | N/A | N/A | 400 (not verified) |
| /auth/reset-password | POST | 200 | 400 | N/A | N/A | 400 (OTP invalid) |
| /users/:id | GET | 200 | N/A | 401 | 428 | 404 |
| /products | GET | 200 | N/A | N/A | N/A | 500 |
| /tickets | GET | 200 | N/A | 401 | N/A | 500 |

**Verdict**: ✅ **MOSTLY CORRECT** - 428 for phone gating is correct HTTP semantics

---

### **Error Response Format**

**Current Format**:
```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human-readable message"
}
```

**Issues**:
- Inconsistent between endpoints
- Some use `error` (string), others omit
- Frontend expects `message` field

**Should Be Standardized**:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_OTP",
    "message": "OTP is invalid or expired"
  }
}
```

---

## 8️⃣ WHAT IS NOT IMPLEMENTED (PHASE 2+)

### **ORDERS SYSTEM** (0% - Completely Missing)

```
MISSING:
├─ Order model (no fields, no schema)
├─ POST /api/orders (create)
├─ GET /api/orders (list user's orders)
├─ GET /api/orders/:id (get single order)
├─ PUT /api/orders/:id (update status)
├─ DELETE /api/orders/:id (cancel)
└─ POST /api/orders/:id/payment (payment link)

EXPECTED FIELDS:
├─ orderId: String (unique, auto-generated)
├─ userId: ObjectId (ref User)
├─ items: [{ productId, quantity, price }]
├─ totalAmount: Number
├─ status: enum [pending, confirmed, shipped, delivered, cancelled]
├─ shippingAddress: String
├─ paymentStatus: enum [pending, completed, failed]
├─ paymentMethod: String (UPI, card, etc.)
├─ trackingId: String (optional)
└─ createdAt, updatedAt: timestamps
```

**Blocking Issue**: Checkout page references orders but endpoint doesn't exist

---

### **PAYMENTS** (0% - Completely Missing)

```
MISSING:
├─ Razorpay API integration
├─ POST /api/payments/create (create order in Razorpay)
├─ POST /api/payments/verify (verify payment signature)
├─ Payment status webhook handler
└─ Refund workflow

EXPECTED:
├─ Razorpay key_id & key_secret in .env
├─ Client: Load Razorpay SDK
├─ Flow: Create order → Get razorpay_order_id → Open payment modal → Verify signature
└─ On success: Update Order.paymentStatus = 'completed'
```

---

### **ADMIN RBAC** (10% - Stubbed Only)

```
MISSING:
├─ Admin product create/update/delete (routes exist, no auth)
├─ Admin order management
├─ Admin user management
├─ Admin ticket triage
└─ Admin reports/analytics

CURRENT:
└─ Role field in User schema (not enforced)

FIX:
├─ Add adminOnlyMiddleware:
│  if (req.user.role !== 'admin' && role !== 'superadmin') return 403
├─ Apply to /api/products POST/PUT/DELETE
├─ Apply to /api/orders (admin endpoints)
└─ Apply to /api/users (admin endpoints)
```

---

### **POSTGRESQL MIGRATION** (0% - Not Started)

**Brief Requirement**: PostgreSQL + Next.js

**Current Stack**: MongoDB + React (Vite) + Express

**This is a 🔴 BLOCKER for evaluation**

**What's needed**:
1. Rewrite User schema as PostgreSQL table
2. Rewrite all Mongoose queries as SQL/ORM (Prisma/Sequelize)
3. Migrate 3 collections (users, products, orders) to relational schema
4. Update all routes to use new ORM
5. Migrate frontend to Next.js (SSR, API routes, etc.)

**Estimate**: 40-60 hours of work

---

### **RATE LIMITING** (0% - Absent)

```
MISSING:
├─ Login attempts: max 5 per IP per 10 min
├─ OTP verification: max 5 per email per 10 min
├─ API general: 100 requests per IP per hour
└─ Signup: 3 accounts per email per day

FIX: Use express-rate-limit middleware
```

---

### **OBSERVABILITY** (5% - Basic Only)

```
CURRENT:
├─ console.log() for request logging (line 49, server.js)
├─ /health endpoint (status only)
└─ console.error() for exceptions

MISSING:
├─ Structured logging (winston, bunyan)
├─ Request ID tracing
├─ User action audit log
├─ Error monitoring (Sentry)
├─ Performance metrics (DataDog, New Relic)
├─ Database query logging
└─ Response time tracking
```

---

## 9️⃣ WHAT WORKS vs WHAT'S BROKEN

### **Summary Table**

| Component | Status | Severity | Notes |
|-----------|--------|----------|-------|
| **Registration** | ✅ Works | - | Email normalization, OTP generation, bcrypt hashing correct |
| **Email Verification** | ✅ Works | - | updateOne pattern correct, no validation re-trigger |
| **Login** | ✅ Works* | 🟠 MEDIUM | Works but needs rate limiting; debug logging should be removed |
| **Phone Gating** | ✅ Works | - | Server-side 428 enforcement, DB unique index correct |
| **Add Phone** | ✅ Works | - | Duplicate detection via index, updateOne prevents validation issues |
| **Password Reset** | ✅ Works | 🟠 MEDIUM | Works but needs rate limiting on OTP attempts |
| **JWT Issuance** | ✅ Works | 🔴 HIGH | Works but needs refresh tokens + token revocation |
| **Protected Routes** | ✅ Works* | - | Works but phone gating only on /me, should extend |
| **User Profile** | ✅ Works | - | Phone requirement enforced via middleware |
| **Tickets API** | ✅ Works* | 🟠 MEDIUM | Read/create works, no update/delete/list-all |
| **Products API** | ✅ Works | - | GET works, mutations not protected by phone gating |
| **Frontend Auth** | ✅ Works* | 🟠 MEDIUM | Handles phone modal, but navbar issue fixed; needs error boundary |
| **Orders System** | ❌ Missing | 🔴 HIGH | Completely absent, checkout page references it |
| **Payments** | ❌ Missing | 🔴 HIGH | No Razorpay integration |
| **Admin RBAC** | ❌ Missing | 🔴 HIGH | Role field exists, no enforcement |
| **PostgreSQL** | ❌ Missing | 🔴 CRITICAL | Brief specifies PostgreSQL; currently MongoDB |
| **Rate Limiting** | ❌ Missing | 🔴 HIGH | Brute-force risk |
| **Refresh Tokens** | ❌ Missing | 🔴 HIGH | 24h access token = long compromise window |
| **Session Revocation** | ❌ Missing | 🔴 HIGH | No logout revocation |
| **Audit Logging** | ❌ Missing | 🟠 MEDIUM | No login history, no action trail |

---

## 🔟 NEXT STEPS TO REACH PRODUCTION

### **PHASE 0: IMMEDIATE (Must Block Release)**

Priority | Task | Est. Time | Blocker
---------|------|-----------|--------
🔴 | Implement refresh token rotation | 4 hours | Token compromise window
🔴 | Add rate limiting (OTP, login, signup) | 3 hours | Brute-force risk
🔴 | Remove debug logging (`[LOGIN DEBUG]`) | 0.5 hours | Leaks sensitive info
🔴 | Add login attempt lockout | 3 hours | Account security
🔴 | Verify all updateOne patterns (no save) | 1 hour | Validation bypass risk
🔴 | Extend phone gating to /products, /orders | 2 hours | State machine enforcement
🟠 | Add CSRF token middleware | 2 hours | State-changing endpoint protection

**Time**: 15.5 hours

---

### **PHASE 1: CRITICAL (Core Features)**

Priority | Task | Est. Time | Blocker
---------|------|-----------|--------
🔴 | Implement Orders model & CRUD | 6 hours | Checkout doesn't work
🔴 | Implement Razorpay integration | 8 hours | No payments
🔴 | Add admin RBAC middleware | 2 hours | No admin protection
🟠 | Implement OTP hash (HMAC-SHA256) | 2 hours | OTP security
🟠 | Add password change endpoint | 2 hours | User self-service
🟠 | Add resend OTP rate limiting | 2 hours | OTP spam prevention

**Time**: 22 hours

---

### **PHASE 2: HIGH (Production Readiness)**

Priority | Task | Est. Time | Blocker
---------|------|-----------|--------
🔴 | Migrate to PostgreSQL + Prisma/Sequelize | 50 hours | Spec requirement
🟠 | Add structured logging (Winston) | 4 hours | Observability
🟠 | Add request ID middleware | 2 hours | Traceability
🟠 | Implement graceful shutdown | 1 hour | Deployment
🟠 | Add error monitoring (Sentry) | 2 hours | Production debugging
🟠 | HTTPS + httpOnly cookies | 2 hours | Security

**Time**: 61 hours

---

### **PHASE 3: OPTIONAL (Polish)**

- SMS OTP for phone verification
- Email templates (HTML, branded)
- Admin analytics dashboard
- Audit logging to separate table
- Webhook retry logic
- API versioning (/api/v1/)

---

## FINAL VERDICT

### **MATURITY: 6.5/10**

**Strength**: Authentication system is well-architected, state machine is clean, security practices are solid where implemented.

**Weakness**: Core e-commerce flows (orders, payments) are absent. PostgreSQL requirement not addressed. Token management is weak. Rate limiting is critical missing.

**Recommendation**:
1. ✅ Deploy auth system as-is for beta testing (internal only)
2. ⚠️ Do NOT put in production without rate limiting + refresh tokens
3. 🔴 Do NOT ship without Orders + Payments
4. 🔴 Do NOT claim PostgreSQL readiness without migration

**If fixing in order of impact**:
1. Orders + Payments (enables sales)
2. Rate limiting (blocks attacks)
3. Refresh tokens (fixes session security)
4. PostgreSQL migration (meets spec)
5. Admin RBAC (operational safety)
