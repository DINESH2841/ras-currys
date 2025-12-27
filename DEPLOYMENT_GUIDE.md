# RAS Currys Backend - Deployment & Setup Guide

## 🚀 Quick Start (Development)

### 1. Install Dependencies
```bash
cd backend
npm install
```

This will install:
- `express` - Web framework
- `mongoose` - MongoDB ORM
- `bcrypt` - Password hashing
- `jsonwebtoken` - JWT authentication
- `nodemailer` - Email service
- `express-validator` - Input validation
- `express-rate-limit` - Rate limiting ⭐ NEW
- `cors` - CORS middleware
- `dotenv` - Environment variables
- `winston` - Structured logging (prepare for Phase 2)

### 2. Configure Environment Variables
Create `.env` file in backend directory:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/ras-currys
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/ras-currys

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h

# Email Service (Gmail)
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password

# Frontend URLs (CORS)
FRONTEND_URLS=http://localhost:3000,http://localhost:3001
# Or single URL:
FRONTEND_URL=http://localhost:3000

# Razorpay (⭐ NEW)
RAZORPAY_KEY=rzp_test_XXXXX_or_rzp_live_XXXXX
RAZORPAY_SECRET=secret_XXXXX
RAZORPAY_WEBHOOK_SECRET=secret_XXXXX

# Optional: Request ID prefix for logging
REQUEST_ID_PREFIX=RAS
```

### 3. Start Development Server
```bash
npm run dev
```

Output should show:
```
🚀 Starting RAS Currys Backend Server...

✅ Connected to MongoDB
✅ Email service configured
✅ Server running on http://localhost:5000
```

### 4. Test the API
```bash
# Health check
curl http://localhost:5000/health

# Test rate limiting
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass"}'
```

---

## 📦 Production Deployment

### 1. Set Production Environment Variables

```env
NODE_ENV=production
PORT=5000

# Use strong JWT secret (generate with: openssl rand -base64 32)
JWT_SECRET=<generate-strong-random-secret>
JWT_EXPIRES_IN=24h

# MongoDB Atlas (recommended for production)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ras-currys?retryWrites=true&w=majority

# SMTP (use professional email service)
SMTP_USER=noreply@currys.com
SMTP_PASS=<strong-app-password>

# Frontend (your actual domain)
FRONTEND_URLS=https://currys.com,https://www.currys.com

# Razorpay (LIVE keys - not test keys!)
RAZORPAY_KEY=rzp_live_<LIVE_KEY>
RAZORPAY_SECRET=<LIVE_SECRET>
RAZORPAY_WEBHOOK_SECRET=<WEBHOOK_SECRET>

# Optional: Sentry DSN for error tracking
SENTRY_DSN=https://key@sentry.io/project
```

### 2. Database Setup

#### Option A: MongoDB Atlas (Recommended)
1. Create account at https://www.mongodb.com/cloud/atlas
2. Create cluster
3. Create database user
4. Get connection string
5. Add IP whitelist (0.0.0.0/0 for testing, specific IPs for production)

#### Option B: Self-Hosted MongoDB
```bash
# Install MongoDB
# Start MongoDB service
mongod --dbpath /data/db

# Create database
mongo ras-currys
```

### 3. Deploy Options

#### Option A: Heroku (Simplest)
```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create app
heroku create ras-currys-backend

# Add MongoDB Atlas
heroku addons:create mongolab

# Set environment variables
heroku config:set JWT_SECRET=<secret>
heroku config:set RAZORPAY_KEY=<key>
# ... etc

# Deploy
git push heroku main
```

#### Option B: DigitalOcean / Linode / AWS EC2
```bash
# 1. SSH into server
ssh user@server-ip

# 2. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Install MongoDB (if not using Atlas)
sudo apt-get install -y mongodb

# 4. Clone repository
git clone <your-repo>
cd ras-currys/backend

# 5. Install dependencies
npm install --production

# 6. Create .env file
nano .env
# Paste environment variables

# 7. Start with PM2 (process manager)
sudo npm install -g pm2
pm2 start server.js --name "ras-currys-backend"
pm2 startup
pm2 save

# 8. Setup Nginx reverse proxy
sudo apt-get install nginx
# ... configure Nginx
```

#### Option C: Docker (For Containerization)
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 5000

ENV NODE_ENV=production

CMD ["node", "server.js"]
```

```bash
# Build image
docker build -t ras-currys-backend .

# Run container
docker run -d \
  --name ras-currys-backend \
  -p 5000:5000 \
  -e MONGODB_URI="mongodb://..." \
  -e JWT_SECRET="..." \
  ras-currys-backend
```

### 4. SSL Certificate (HTTPS)

#### Using Let's Encrypt (Free)
```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Generate certificate
sudo certbot certonly --standalone -d api.currys.com

# Auto-renew
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

#### Configure Nginx for HTTPS
```nginx
server {
    listen 443 ssl;
    server_name api.currys.com;

    ssl_certificate /etc/letsencrypt/live/api.currys.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.currys.com/privkey.pem;

    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 5. Database Backups

#### MongoDB Atlas (Automatic)
- Automatic daily backups included
- 35-day backup retention
- Restore from backup in Atlas UI

#### Self-Hosted MongoDB
```bash
# Weekly backup script
#!/bin/bash
BACKUP_DIR="/backups/mongodb"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mongodump --out "$BACKUP_DIR/backup_$TIMESTAMP"

# Keep only last 30 days
find "$BACKUP_DIR" -type d -mtime +30 -exec rm -rf {} \;
```

---

## 🔍 Monitoring & Health Checks

### Health Endpoint
```bash
curl http://localhost:5000/health

Response:
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "service": "RAS Currys Authentication API",
  "version": "1.0.0"
}
```

### Monitor Error Logs
```bash
# View logs (development)
npm run dev

# View logs (production with PM2)
pm2 logs ras-currys-backend

# View logs (Docker)
docker logs ras-currys-backend

# Setup log rotation
sudo apt-get install logrotate
# Configure in /etc/logrotate.d/
```

### Setup Monitoring Alerts
```bash
# Install PM2 monitoring
pm2 install pm2-logrotate
pm2 install pm2-auto-pull

# Setup external monitoring (e.g., UptimeRobot)
# Monitor: http://api.currys.com/health
# Alert if down for > 5 minutes
```

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Find process on port 5000
lsof -i :5000

# Kill it
kill -9 <PID>

# Or change PORT in .env
PORT=5001
```

### MongoDB Connection Failed
```bash
# Check MongoDB is running
ps aux | grep mongod

# Check connection string
# Format: mongodb://user:pass@host:port/database?options

# Common issues:
# - User/password incorrect
# - IP not whitelisted (MongoDB Atlas)
# - Database name wrong
```

### Email Service Not Working
```bash
# Check SMTP settings
# Gmail: https://support.google.com/accounts/answer/185833
# - Enable 2FA
# - Generate app-specific password
# - Use app-specific password in .env

# Test SMTP
node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});
transporter.verify((err, success) => {
  console.log(err || 'Email configured: ' + success);
});
"
```

### Rate Limiting Not Working
```bash
# Check rate-limit middleware is installed
npm list express-rate-limit

# Check middleware is applied in server.js
# Check in authRoutes.js

# For testing, set NODE_ENV=test to skip limits
NODE_ENV=test npm run dev
```

### Razorpay Payment Failing
```bash
# Check keys are correct
echo $RAZORPAY_KEY

# Verify signature mismatch error? → Check webhook secret
# Verify order creation worked? → Check payment.create endpoint
# Verify webhook receiving? → Check logs for webhook hits

# Test webhook signature manually:
node -e "
const crypto = require('crypto');
const body = 'order_123|pay_123';
const sig = crypto.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
  .update(body)
  .digest('hex');
console.log('Generated signature:', sig);
"
```

---

## 📊 Performance Tuning

### Database Optimization
```javascript
// Add indexes for frequently queried fields
// User model - already has:
// - email index
// - phoneNumber unique sparse index
// - otpCode index
// - emailVerified index

// Order model - already has:
// - userId + createdAt index
// - orderStatus index
// - paymentStatus index
```

### Caching (Phase 3)
```javascript
// Add Redis for:
// - Rate limit tracking (faster than in-memory)
// - Session storage
// - Product catalog caching
// - OTP caching

// Install: npm install redis
```

### Load Balancing (Phase 4)
```bash
# For multiple backend instances:
# - Use Nginx round-robin
# - Use sticky sessions for auth
# - Use shared Redis for rate limits
```

---

## 🔐 Security Checklist

- [ ] JWT_SECRET is strong (32+ random characters)
- [ ] HTTPS enforced (redirect HTTP → HTTPS)
- [ ] CORS origins restricted (no * in production)
- [ ] MongoDB authentication enabled
- [ ] Rate limiting active
- [ ] Input validation working
- [ ] Email verification required
- [ ] Password hashing working (bcrypt 12 rounds)
- [ ] Razorpay webhook signature verified
- [ ] Sensitive data not logged
- [ ] Error messages don't leak info
- [ ] CORS credentials allowed correctly

---

## 📚 Useful Commands

```bash
# Start server
npm start                    # Production
npm run dev                  # Development

# Stop PM2 service
pm2 stop all
pm2 delete all

# Check running processes
pm2 list
pm2 status

# View logs
pm2 logs
pm2 logs --lines 100

# Restart after code changes
pm2 restart ras-currys-backend

# Monitor resources
pm2 monit
```

---

## 🆘 Getting Help

If something breaks:

1. **Check Logs First**
   ```bash
   pm2 logs ras-currys-backend
   ```

2. **Test Database Connection**
   ```bash
   mongo "mongodb+srv://..."
   ```

3. **Test Email Service**
   ```bash
   npm run test:email
   ```

4. **Check Rate Limiting**
   - Count requests in last 10 minutes
   - Check loginAttempts in User collection

5. **Review Error Response**
   ```json
   {
     "success": false,
     "error": {
       "code": "ERROR_CODE",
       "message": "What went wrong"
     }
   }
   ```

6. **Contact Support**
   - Include error logs
   - Include NODE_ENV
   - Include which endpoint failed
   - Include request body (no passwords!)
