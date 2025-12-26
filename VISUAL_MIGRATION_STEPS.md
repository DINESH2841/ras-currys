# 🎨 Visual Migration Guide

Complete step-by-step visual guide with terminal commands and expected outputs.

---

## 🟢 STEP 1: Install MongoDB (Choose ONE)

### Option A: Local MongoDB (Recommended)

```
1. Download from: https://www.mongodb.com/try/download/community
2. Run installer
3. Choose "Install MongoDB as a Service"
4. Next → Next → Install
5. MongoDB auto-starts on port 27017
```

**Test it works:**
```powershell
mongosh

OUTPUT:
─────────────────────────────────────
  Connecting to:          mongodb://127.0.0.1:27017/?directConnection=true
  Using MongoDB:          7.0.0
  Using Mongosh:          2.1.1
test>
─────────────────────────────────────

Type: exit
Press: Enter
```

### Option B: MongoDB Atlas (Cloud)

```
1. Go to: https://www.mongodb.com/cloud/atlas
2. Sign up (free forever)
3. Create M0 cluster
4. Get connection string: mongodb+srv://user:pass@cluster.mongodb.net/ras_currys
5. Go to: ras-currys-backend/.env
6. Replace: MONGODB_URI=<your-connection-string>
```

---

## 🟢 STEP 2: Start Backend Server

### Terminal 1 (Keep Open!)

```powershell
cd c:\Users\Asus\Downloads\ras-currys\ras-currys-backend

npm install

npm start
```

**Expected Output:**
```
added 60 packages in 25s

🚀 Server running on http://localhost:5000
📊 API ready for requests
🗄️  MongoDB connected

(stays running... do NOT close this terminal)
```

---

## 🟢 STEP 3: Start Frontend

### Terminal 2 (New Window)

```powershell
cd c:\Users\Asus\Downloads\ras-currys

npm run dev
```

**Expected Output:**
```
  VITE v6.0.0  ready in 234 ms

  ➜  Local:   http://localhost:3001/
  ➜  press h to show help
```

**Open browser:** Click on http://localhost:3001

---

## 🟢 STEP 4: Export Your Data

### In Browser Console

Open: http://localhost:3001

Press: `F12` (or Ctrl+Shift+I)

Click: `Console` tab

**Paste entire code from root folder:** `EXPORT_DATA.js`

```javascript
(function exportLocalStorageData() {
  // Extract data from localStorage
  const products = JSON.parse(localStorage.getItem('ras_db_products') || '[]');
  const users = JSON.parse(localStorage.getItem('ras_db_users') || '[]');
  const orders = JSON.parse(localStorage.getItem('ras_db_orders') || '[]');
  const tickets = JSON.parse(localStorage.getItem('ras_db_tickets') || '[]');

  // Build export object
  const exportData = {
    exportDate: new Date().toISOString(),
    exportVersion: '1.0',
    dataCount: {
      products: products.length,
      users: users.length,
      orders: orders.length,
      tickets: tickets.length
    },
    data: {
      products,
      users,
      orders,
      tickets
    }
  };

  // Create blob and download
  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `ras-currys-export-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  console.log('✅ Data exported successfully!');
  console.log('📊 Export summary:', exportData.dataCount);
  console.log('📁 File: ' + link.download);
})();
```

Press: `Enter`

**Expected Output:**
```console
✅ Data exported successfully!
📊 Export summary: {products: 25, users: 8, orders: 12, tickets: 3}
📁 File: ras-currys-export-1704067200000.json
```

**Check:** Downloads folder - you should see the JSON file

---

## 🟢 STEP 5: Run Migration

### Option A: Via Web UI (EASIEST)

In browser, go to: **http://localhost:3001/migrate**

```
┌─────────────────────────────────────────┐
│ Data Migration                          │
│                                         │
│ Backend Status: ✓ Online at 5000       │
│                                         │
│ Before You Start:                       │
│ 1. Start MongoDB                        │
│ 2. Start Backend (npm start)             │
│ 3. Verify Connection (green ✓)          │
│ 4. Run Migration (click button)         │
│                                         │
│ [  Start Migration  ]                   │
│                                         │
│ After Migration:                        │
│ • 25 products migrated                  │
│ • 8 users migrated                      │
│ • 12 orders migrated                    │
│ • 3 tickets migrated                    │
└─────────────────────────────────────────┘
```

Click: **"Start Migration"** button

Wait: ~10 seconds

**Expected Result:**
```
✅ All data migrated successfully!

Products: 25
Users: 8
Orders: 12
Support Tickets: 3
```

---

### Option B: Via Command Line

In Terminal 2 (while backend is running):

```powershell
cd c:\Users\Asus\Downloads\ras-currys\ras-currys-backend

npm run import C:\Users\Asus\Downloads\ras-currys-export-1704067200000.json
```

(Use the actual filename from your downloads)

**Expected Output:**
```
🔄 Starting data import from JSON...

🔗 Connecting to MongoDB...
✓ MongoDB connected

📦 Found data:
   Products: 25
   Users: 8
   Orders: 12
   Tickets: 3

📤 Importing products...
   ✓ 25/25 products imported

👥 Importing users...
   ✓ 8/8 users imported
   ⚠️  All users set to temporary password: TempPassword123!

📦 Importing orders...
   ✓ 12/12 orders imported

🎫 Importing support tickets...
   ✓ 3/3 tickets imported

✅ Data import complete!
```

---

## 🟢 STEP 6: Verify Migration

In new PowerShell window:

```powershell
mongosh

use ras_currys

db.products.countDocuments()
db.users.countDocuments()
db.orders.countDocuments()
db.tickets.countDocuments()
```

**Expected Output:**
```
test> use ras_currys
switched to db ras_currys
ras_currys> db.products.countDocuments()
25
ras_currys> db.users.countDocuments()
8
ras_currys> db.orders.countDocuments()
12
ras_currys> db.tickets.countDocuments()
3
ras_currys>
```

Perfect! ✓ All data in MongoDB

---

## 🟢 STEP 7: Test the App

In browser: http://localhost:3001

1. **Sign In**
   - Email: One of your old user emails
   - Password: `TempPassword123!`
   - Click: "Sign In"

2. **Check Data**
   - Homepage: See your products ✓
   - Orders page: See your orders ✓
   - My Support: See your tickets ✓

3. **Change Password**
   - Click: User menu → Settings (or re-login)
   - Change password to something permanent
   - Save

4. **Test Creating New Data**
   - Add product to cart ✓
   - Create support ticket ✓
   - Place order ✓

---

## 📊 Verification Checklist

```
Terminal 1: Backend running?
├─ Check: "✓ MongoDB connected" message
└─ Check: Port 5000 accepting requests

Terminal 2: Frontend running?
├─ Check: "Local: http://localhost:3001/"
└─ Check: Browser loads without errors

MongoDB: Data present?
├─ Check: mongosh shows correct counts
└─ Check: All collections populated

App: Data visible?
├─ Check: Products display
├─ Check: Orders display
├─ Check: Tickets display
└─ Check: Can create new data

✅ ALL CHECKS PASSED: Migration successful!
```

---

## 🎯 Success Indicators

| What | Should See | If Not | Fix |
|------|-----------|--------|-----|
| Backend starts | No errors, "MongoDB connected" | Error message | Check MongoDB is running |
| Frontend loads | App appears on 3001 | Blank page/error | Check npm run dev ran successfully |
| Export works | JSON file downloads | Nothing happens | Check browser console (F12) |
| Import completes | "✓ Data import complete" message | Error message | Check file path is correct |
| Data in MongoDB | Numbers > 0 in countDocuments | Zero counts | Check import actually ran |
| Can sign in | Dashboard loads | "Invalid credentials" | Check using temp password |
| Can see data | Products/orders/tickets visible | Nothing shows | Wait 1-2 seconds for load |

---

## 🚨 Common Issues & Quick Fixes

### Issue: "MongoDB connection failed"
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Fix:** Start MongoDB
```powershell
mongosh
# Should show: test>
```

### Issue: "Port 5000 already in use"
```
Error: listen EADDRINUSE :::5000
```
**Fix:** Kill the process
```powershell
netstat -ano | findstr :5000
taskkill /pid <PID> /f
npm start
```

### Issue: "Backend not online" (migration button disabled)
```
❌ Backend not running
```
**Fix:** Make sure Terminal 1 shows "✓ MongoDB connected"

### Issue: "Cannot find module 'express'"
```
Error: Cannot find module 'express'
```
**Fix:** Install dependencies
```powershell
cd ras-currys-backend
npm install
```

### Issue: Export button does nothing
**Fix:** Check console for errors
```
F12 → Console tab → Look for red errors
```

### Issue: Import says "Invalid credentials" after migration
**Fix:** Use the temp password
```
Password: TempPassword123!
```

---

## ⏱️ Time Tracking

| Step | Time | Total |
|------|------|-------|
| Install MongoDB | 3 min | 3 min |
| npm install backend | 1 min | 4 min |
| npm start backend | 0.5 min | 4.5 min |
| npm run dev frontend | 0.5 min | 5 min |
| Export data | 1 min | 6 min |
| Run migration | 1 min | 7 min |
| Verify in MongoDB | 1 min | 8 min |
| Test app | 2 min | 10 min |
| **TOTAL** | | **~10 min** |

---

## ✅ Final Checklist

- [ ] MongoDB installed/running
- [ ] Backend running on port 5000 (Terminal 1)
- [ ] Frontend running on port 3001 (Terminal 2)
- [ ] Data exported to JSON file
- [ ] Migration completed successfully
- [ ] Data verified in mongosh
- [ ] Can sign in with temp password
- [ ] Products/orders/tickets visible
- [ ] Password changed to permanent one

---

## 🎉 Congratulations!

Your data is now safely stored in MongoDB! 

```
Before:  localStorage → Lost on cache clear ❌
After:   MongoDB → Persistent storage ✓

Ready for: Production, users, scaling ✓
```

**Next Step:** Update React components to use backend API (coming next)

---

**Questions?** Check MIGRATION_GUIDE.md for detailed troubleshooting
