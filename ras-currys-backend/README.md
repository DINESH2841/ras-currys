# RAS Currys Backend API

Express.js + MongoDB backend for RAS Currys ecommerce platform with full data migration support.

## 🚀 Quick Start

### 1. Install Dependencies
```powershell
cd ras-currys-backend
npm install
```

### 2. Configure MongoDB
Choose **ONE** option:

#### Option A: Local MongoDB
```powershell
# Download from: https://www.mongodb.com/try/download/community
# After installation, MongoDB runs on port 27017

# Test connection:
mongosh
# You should see: test>
# Type: exit
```

#### Option B: MongoDB Atlas (Cloud)
```
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account & cluster (M0)
3. Get connection string
4. Update .env: MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/ras_currys
```

### 3. Start Server
```powershell
npm start
# Expected output:
# ✓ MongoDB connected
# 🚀 Server running on http://localhost:5000
```

## 📊 Data Migration

### Quick Migration (Web UI)
1. Start frontend: `npm run dev` (port 3001)
2. Go to `http://localhost:3001/migrate`
3. Click "Start Migration" button

### CLI Migration
```powershell
# Export data from browser first (see EXPORT_DATA.js in root folder)
# Then import:
npm run import path\to\exported-data.json

# Example:
npm run import C:\Users\Asus\Downloads\ras-currys\data.json
```

## 📚 API Endpoints

### Products
```
GET    /api/products           # List all products
POST   /api/products           # Create product
PUT    /api/products/:id       # Update product
DELETE /api/products/:id       # Delete product
```

### Authentication
```
POST   /api/auth/login         # Sign in user
POST   /api/auth/signup        # Create user
```

### Users
```
GET    /api/users              # List all users
PUT    /api/users/:id/role     # Change user role
```

### Orders
```
GET    /api/orders             # List all orders
POST   /api/orders             # Create order
PUT    /api/orders/:id/status  # Update order status
```

### Support Tickets
```
GET    /api/tickets            # List all tickets
POST   /api/tickets            # Create ticket
PUT    /api/tickets/:id/status # Update ticket status
```

### Stats
```
GET    /api/stats              # Get aggregated statistics
```

## 🔐 Authentication

Users authenticate via email/password with SHA-256 hashing:
```
Password Hash = SHA256(password + "ras_salt_secret")
```

After data migration, all users have temporary password: **`TempPassword123!`**

Users must change password on first login for security.

## 📦 Data Models

### Product
```javascript
{
  _id: ObjectId,
  name: String (unique),
  price: Number,
  category: "Currys" | "Pickles",
  description: String,
  image: String (base64 or URL),
  created_at: Date
}
```

### User
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  passwordHash: String,
  role: "user" | "admin" | "superadmin",
  created_at: Date
}
```

### Order
```javascript
{
  _id: ObjectId,
  user_id: String,
  user_name: String,
  items: [{
    id: String,
    name: String,
    price: Number,
    quantity: Number,
    category: String
  }],
  total_amount: Number,
  status: "pending" | "paid" | "delivered" | "cancelled",
  gateway_order_id: String,
  payment_gateway: String,
  payment_id: String,
  created_at: Date
}
```

### Support Ticket
```javascript
{
  _id: ObjectId,
  issueSummary: String,
  urgency: "LOW" | "MEDIUM" | "HIGH",
  userContact: String,
  status: "open" | "resolved",
  created_by_user_id: String,
  created_at: Date
}
```

## 🧪 Testing Endpoints

### With curl (PowerShell)
```powershell
# Get products
Invoke-WebRequest -Uri http://localhost:5000/api/products -Method GET

# Create product
$body = @{
    name = "Sambar Powder"
    price = 299
    category = "Currys"
    description = "Premium blend"
    image = "base64-data-url-here"
} | ConvertTo-Json

Invoke-WebRequest -Uri http://localhost:5000/api/products -Method POST `
  -Headers @{"Content-Type"="application/json"} -Body $body
```

### With Postman
1. Download Postman
2. Create requests for each endpoint
3. Use the URLs above
4. Set Content-Type: application/json

## 🐛 Troubleshooting

### Connection Refused (Error 5000)
```
❌ Error: connect ECONNREFUSED 127.0.0.1:5000
```
**Solution:** Make sure server is running: `npm start`

### MongoDB Connection Failed
```
❌ Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution:** Start MongoDB:
- Windows: MongoDB Compass or `mongosh`
- Cloud: Use MongoDB Atlas connection string in .env

### Import Script Error
```
❌ Error: file not found
```
**Solution:** Provide correct file path:
```powershell
npm run import C:\full\path\to\data.json
```

### CORS Error in Frontend
```
❌ Error: Access to XMLHttpRequest blocked by CORS
```
**Solution:** Frontend is running on different port. Check server.js CORS config:
```javascript
origin: ['http://localhost:3001', 'http://localhost:3000']
```

## 🚀 Production Deployment

### Deploy to Heroku
```powershell
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create app
heroku create ras-currys-backend

# Set environment variables
heroku config:set MONGODB_URI=mongodb+srv://...

# Deploy
git push heroku main
```

### Deploy to Railway
```
1. Go to railway.app
2. Create new project
3. Connect GitHub repo
4. Add MongoDB service
5. Set MONGODB_URI environment variable
6. Deploy
```

### Deploy to Render
```
1. Go to render.com
2. Create new Web Service
3. Connect GitHub
4. Set environment variables
5. Deploy
```

## 📖 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/ras_currys` |
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `development` or `production` |

## 📝 File Structure

```
ras-currys-backend/
├── server.js          # Main Express app
├── models.js          # Mongoose schemas
├── import-data.js     # Data import script
├── package.json       # Dependencies
├── .env              # Environment config
└── README.md         # This file
```

## 🆘 Support

For issues with:
- **Frontend:** Check `/src` folder and FEATURES.md
- **Migration:** Check MIGRATION_GUIDE.md in root
- **Data Export:** Use EXPORT_DATA.js in root

## 📄 License

MIT

---

**Created:** 2024  
**Version:** 1.0.0  
**Maintained:** RAS Currys Team
