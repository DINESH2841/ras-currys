# Razorpay Webhook Setup Guide

## Quick Setup (5 minutes)

### 1. Get Webhook Secret

In Razorpay Dashboard → Settings → Webhooks:
- Copy the **Webhook Secret** (shown when you create webhook)
- Add to `.env`:

```env
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_from_dashboard
```

### 2. Register Webhook URL

In Razorpay Dashboard → Settings → Webhooks → Add New Webhook:

**Webhook URL:**
```
https://yourdomain.com/api/payments/webhook
```

**Active Events (select these):**
```
✓ payment.authorized
✓ payment.captured
✓ payment.failed
✓ order.paid
```

**Alert Email:**
```
sevennidinesh@gmail.com
```

**Active:** Yes ✓

### 3. Test Webhook

```bash
# 1. Get health check
curl http://localhost:5000/health

# 2. Verify webhook endpoint exists
curl -X POST http://localhost:5000/api/payments/webhook \
  -H "Content-Type: application/json" \
  -H "X-Razorpay-Signature: test" \
  -d '{"event":"payment.captured","payload":{"payment":{"entity":{"id":"pay_test","order_id":"order_test"}}}}'

# Should return 200 (signature validation will fail, but endpoint responds)
```

---

## Implementation Details

### Webhook Events Handled

| Event | Action | Status |
|-------|--------|--------|
| `payment.authorized` | Mark order as confirmed | ✅ |
| `payment.captured` | Mark order as confirmed | ✅ |
| `payment.failed` | Mark payment as failed | ✅ |
| `order.paid` | Fallback - ensure paid | ✅ |

### Flow

```
1. User initiates payment on frontend
2. Frontend creates order via: POST /api/payments/create
3. Frontend shows Razorpay checkout
4. User completes payment
5. Razorpay calls: POST /api/payments/webhook
6. Backend verifies signature
7. Backend updates order/payment status atomically
8. Order confirmed without frontend redirect
```

### Signature Verification

```javascript
// Request from Razorpay includes:
Header: X-Razorpay-Signature: <signature>
Body: { event, payload, ... }

// Server verifies:
expectedSig = HMAC-SHA256(body, RAZORPAY_WEBHOOK_SECRET)
if (expectedSig !== X-Razorpay-Signature) → 400 Signature Mismatch
else → process event
```

### Security

✅ **CSRF Bypass:** Webhooks bypass CSRF (signature verified)  
✅ **Signature Verification:** All payloads verified before processing  
✅ **Idempotent:** Safe to receive duplicate events  
✅ **Logging:** All events logged with request ID  
✅ **Error Handling:** Returns 200 even on error (prevents retries)

---

## Testing Webhook

### Option 1: Razorpay Test Mode

In Razorpay Dashboard:
1. Settings → Test Keys
2. Use test keys for development
3. Payment will be instant (no real charge)

### Option 2: Razorpay Webhook Simulator

In Razorpay Dashboard → Settings → Webhooks:
1. Click "Test Webhook"
2. Select event type
3. Click "Send"
4. Check logs for processing

### Option 3: Manual Test (cURL)

```bash
# 1. Generate signature
BODY='{"event":"payment.captured","payload":{"payment":{"entity":{"id":"pay_test123","order_id":"order_test456"}}}}'
SECRET="your_webhook_secret"
SIG=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "$SECRET" | cut -d' ' -f2)

# 2. Send to webhook
curl -X POST http://localhost:5000/api/payments/webhook \
  -H "Content-Type: application/json" \
  -H "X-Razorpay-Signature: $SIG" \
  -d "$BODY"

# Response should be: { "success": true, "message": "Webhook processed" }
```

---

## Webhook Logs

Logs stored in: `backend/logs/combined.log`

### View Payment Events
```bash
grep "Razorpay webhook received" backend/logs/combined.log
```

### View Payment Confirmations
```bash
grep "Payment completed via webhook" backend/logs/combined.log
```

### View Payment Failures
```bash
grep "Payment failed via webhook" backend/logs/combined.log
```

### View Signature Errors
```bash
grep "Webhook signature mismatch" backend/logs/combined.log
```

---

## Environment Variables

### Required
```env
RAZORPAY_KEY=rzp_live_xxxxx          # From dashboard
RAZORPAY_SECRET=xxxxx                # From dashboard  
RAZORPAY_WEBHOOK_SECRET=xxxxx        # Generated in webhook settings
```

### Optional
```env
LOG_LEVEL=info                       # Logging verbosity
NODE_ENV=production                  # Environment mode
```

---

## Troubleshooting

### Webhook Not Being Called

**Check:**
1. Webhook is **Active** in Razorpay Dashboard (toggle on)
2. URL is publicly accessible (HTTPS required in production)
3. Domain is correct (not localhost:5000)
4. Payment actually completed (check Razorpay dashboard)

**Fix:**
```bash
# Test endpoint is reachable
curl -i https://yourdomain.com/api/payments/webhook

# Should return 400 (no body) or 200 (with body)
# NOT: Connection refused or 404
```

### Signature Verification Failed

**Check:**
1. `RAZORPAY_WEBHOOK_SECRET` is correct (copy from dashboard)
2. Webhook secret hasn't changed (dashboard shows current secret)
3. Not using test secret for live payments

**Fix:**
1. Verify secret in Razorpay Dashboard
2. Update `.env`
3. Restart server
4. Check logs: `grep "Webhook signature mismatch" backend/logs/combined.log`

### Orders Not Updating

**Check:**
1. Order exists in database with matching `razorpayOrderId`
2. Order belongs to user (ownership check)
3. Payment status can transition (not already paid)

**Fix:**
1. Check logs for errors: `grep "Webhook processing error" backend/logs/error.log`
2. Verify order was created: Check MongoDB
3. Verify order ID matches: `db.orders.find({razorpayOrderId: "order_xxx"})`

### Test Events Show in Dashboard But Not Processing

**Check:**
1. Server is running and listening on port 5000
2. Firewall allows Razorpay webhook requests
3. No errors in application logs

**Fix:**
```bash
# Check server is running
curl -s http://localhost:5000/health

# Check for errors
tail -f backend/logs/error.log

# Manually test webhook
node test-webhook.js
```

---

## Production Checklist

- [ ] `RAZORPAY_KEY` set (live key, not test)
- [ ] `RAZORPAY_SECRET` set (live secret)
- [ ] `RAZORPAY_WEBHOOK_SECRET` set and matches dashboard
- [ ] Webhook URL is HTTPS
- [ ] Webhook URL points to production domain
- [ ] Webhook is **Active** in Razorpay Dashboard
- [ ] Payment events selected in Razorpay Dashboard
- [ ] Test payment completes successfully
- [ ] Order status updates after payment
- [ ] Logs show webhook processing
- [ ] Alert email configured (sevennidinesh@gmail.com)

---

## Event Payloads Reference

### payment.captured Event

```json
{
  "event": "payment.captured",
  "payload": {
    "payment": {
      "entity": {
        "id": "pay_abc123",
        "order_id": "order_xyz789",
        "amount": 50000,
        "currency": "INR",
        "status": "captured",
        "method": "card",
        "email": "user@example.com",
        "contact": "+919876543210"
      }
    }
  }
}
```

### payment.failed Event

```json
{
  "event": "payment.failed",
  "payload": {
    "payment": {
      "entity": {
        "id": "pay_failed123",
        "order_id": "order_xyz789",
        "amount": 50000,
        "status": "failed",
        "error_code": "BAD_REQUEST_ERROR",
        "error_reason": "Card declined"
      }
    }
  }
}
```

---

## Support

**For webhook issues:**
1. Check `backend/logs/combined.log` for event receipt
2. Check `backend/logs/error.log` for processing errors
3. Verify `RAZORPAY_WEBHOOK_SECRET` in `.env`
4. Test with Razorpay webhook simulator

**Razorpay Docs:**
- https://razorpay.com/docs/webhooks/setup/

**Your Backend:**
- Webhook endpoint: `POST /api/payments/webhook`
- Signature header: `X-Razorpay-Signature`
- Events: `payment.authorized`, `payment.captured`, `payment.failed`, `order.paid`
