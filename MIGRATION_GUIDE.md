# 🚀 Data Migration Guide: localStorage → MongoDB

You have existing data in browser localStorage that needs to be migrated to MongoDB before switching to the new backend.

## 📋 Step-by-Step Instructions

### Step 1: Install MongoDB
Choose **ONE** option:

#### Option A: Local MongoDB (Recommended for development)
```powershell
# Download MongoDB Community Edition
# Go to: https://www.mongodb.com/try/download/community

# After installation, MongoDB will run on port 27017 by default
# Test connection in PowerShell:
mongosh
# You should see: test>
# Type: exit
```

#### Option B: MongoDB Atlas (Cloud - No installation needed)
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create a cluster (M0 free tier)
4. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/ras_currys`
5. Update `.env` in `ras-currys-backend/` with your connection string

---

### Step 2: Start the Backend Server

```powershell
# Navigate to backend folder
cd ras-currys-backend

# Install dependencies (first time only)
npm install

# Start the server
npm start

# Expected output:
# ✓ MongoDB connected
# Server running on http://localhost:5000
```

**Keep this terminal open!** The backend must stay running for migration.

---

### Step 3: Run the Migration

#### Option A: Via Web UI (Easiest)
1. In VS Code terminal (different from backend terminal):
   ```powershell
   cd c:\Users\Asus\Downloads\ras-currys
   npm run dev
   ```
2. Open browser: http://localhost:3001
3. Click navbar → go to `/migrate`
4. Wait for migration to complete ✓

#### Option B: Via Browser Console
1. Open http://localhost:3001
2. Open DevTools: `F12` → Console tab
3. Paste this:
   ```javascript
   import('./src/utils/migrate.ts')
     .then(m => m.default())
     .then(r => console.log('✓ Done!', r))
     .catch(e => console.error('Error:', e));
   ```
4. Press Enter and wait

#### Option C: Manual Export/Import
1. Export from browser console:
   ```javascript
   const data = {
     products: JSON.parse(localStorage.getItem('ras_db_products') || '[]'),
     users: JSON.parse(localStorage.getItem('ras_db_users') || '[]'),
     orders: JSON.parse(localStorage.getItem('ras_db_orders') || '[]'),
     tickets: JSON.parse(localStorage.getItem('ras_db_tickets') || '[]')
   };
   console.log(JSON.stringify(data));
   // Copy the output to a file: data.json
   ```

2. Import via MongoDB Compass or shell:
   ```powershell
   mongosh
   > use ras_currys
   > db.products.insertMany([...])  // paste products array
   > db.users.insertMany([...])     // paste users array
   > db.orders.insertMany([...])    // paste orders array
   > db.tickets.insertMany([...])   // paste tickets array
   ```

---

### Step 4: Verify Migration

1. **Check data in MongoDB:**
   ```powershell
   mongosh
   > use ras_currys
   > db.products.countDocuments()     # Should see your product count
   > db.users.countDocuments()        # Should see your user count
   > db.orders.countDocuments()       # Should see your order count
   > db.tickets.countDocuments()      # Should see your ticket count
   ```

2. **Test the app:**
   - Sign in with your old credentials
   - **Note:** Password is now `TempPassword123!` (security reset)
   - Change password immediately
   - Check if your products, orders, tickets appear

---

## ⚠️ Important Notes

### User Passwords Reset
- After migration, all users have temporary password: **`TempPassword123!`**
- Each user should log in and change their password
- This is intentional for security (we can't recover old password hashes)

### Data Validation
- Products: ✓ All fields preserved
- Users: ✓ Name, email preserved (password reset required)
- Orders: ✓ All details preserved
- Tickets: ✓ All support tickets preserved

### After Migration
1. **Update React components** to use MongoDB (via backend API)
2. **Clear localStorage** when done: `localStorage.clear()`
3. **Test thoroughly** before sharing with users

---

## 🆘 Troubleshooting

### Backend won't connect
```powershell
# Check if MongoDB is running
mongosh

# If error: Try starting MongoDB again
# Windows: MongoDB Compass (GUI) → Connect
# Terminal: mongosh
```

### Migration button disabled
- Make sure backend is running on http://localhost:5000
- Check console for errors (F12)

### Connection refused errors
```
❌ Error: connect ECONNREFUSED 127.0.0.1:5000
```
→ **Solution:** Start backend: `npm start` in `ras-currys-backend/` folder

### Duplicate data issues
- Migration is safe to run multiple times
- It will skip duplicates automatically
- Already migrated products won't be re-added

---

## 📊 What Gets Migrated?

| Data | Source | Destination | Status |
|------|--------|-------------|--------|
| Products | localStorage | MongoDB | ✓ All fields |
| Users | localStorage | MongoDB | ⚠️ Password reset |
| Orders | localStorage | MongoDB | ✓ All fields |
| Tickets | localStorage | MongoDB | ✓ All fields |
| Cart Items | localStorage | ❌ Not migrated | (Session-only) |

---

## ✅ Success Checklist

- [ ] MongoDB installed or Atlas account created
- [ ] Backend running on port 5000
- [ ] Migration completed (✓ message shown)
- [ ] Data verified in MongoDB
- [ ] Users can sign in with temp password
- [ ] Products, orders, tickets visible in app
- [ ] localStorage cleared

---

## 🎯 Next Steps After Migration

1. **Update React to use Backend API:**
   - Components will switch from mockDatabase → apiClient automatically
   - Data will now come from MongoDB instead of localStorage

2. **Security Improvements:**
   - Implement JWT tokens (coming soon)
   - Add HTTPS for production
   - Enable CORS restrictions

3. **Deployment:**
   - Deploy backend to Heroku/Railway/Render
   - Deploy frontend to Vercel/Netlify
   - Update API_BASE_URL for production

---

Need help? Check the console errors (F12) or create a support ticket via /contact page.

**Estimated time:** 5-10 minutes total ⏱️
