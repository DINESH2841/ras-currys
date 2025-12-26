# 🎯 Data Migration - Step-by-Step Instructions

Your data is safe! Here's exactly what to do to migrate from localStorage to MongoDB.

---

## ⏱️ Estimated Time: 10 minutes

---

## STEP 1: Install MongoDB (5 minutes)

### Option A: Local Installation (Recommended)

**Windows:**
1. Download MongoDB Community: https://www.mongodb.com/try/download/community
2. Run the installer
3. Select "Install MongoDB as a Service" (recommended)
4. Keep default settings, click "Next" until done
5. MongoDB will auto-start on port 27017

**Verify it works:**
```powershell
mongosh
# You should see: test>
# Type: exit
```

### Option B: MongoDB Atlas (Cloud - No Installation)

1. Go to https://www.mongodb.com/cloud/atlas
2. Click "Try Free"
3. Create account
4. Create M0 cluster (free forever)
5. Get connection string: `mongodb+srv://...`
6. Replace `.env` in `ras-currys-backend` folder with your string

---

## STEP 2: Start Backend Server (1 minute)

```powershell
# Open PowerShell in VS Code or new terminal
# Navigate to backend folder
cd c:\Users\Asus\Downloads\ras-currys\ras-currys-backend

# Install dependencies (first time only)
npm install

# Start server
npm start

# Expected output:
# ✓ MongoDB connected
# 🚀 Server running on http://localhost:5000
```

**KEEP THIS TERMINAL OPEN!**

---

## STEP 3: Export Your Data (1 minute)

### Option A: Automatic Export

1. Open new terminal in VS Code
2. Keep current tab at: `http://localhost:3001` (your app)
3. Press `F12` to open DevTools → Console tab
4. Copy-paste entire code from `EXPORT_DATA.js` file
5. Press Enter
6. A JSON file downloads automatically ✓

### Option B: Manual Export

```powershell
# In browser console (F12 → Console tab), paste:
const data = {
  products: JSON.parse(localStorage.getItem('ras_db_products') || '[]'),
  users: JSON.parse(localStorage.getItem('ras_db_users') || '[]'),
  orders: JSON.parse(localStorage.getItem('ras_db_orders') || '[]'),
  tickets: JSON.parse(localStorage.getItem('ras_db_tickets') || '[]')
};
console.log(JSON.stringify(data, null, 2));
# Copy output, save to file: C:\Users\Asus\Downloads\data.json
```

---

## STEP 4: Import Data (2 minutes)

### Option A: Via Web UI (Easiest)

```powershell
# In new terminal:
cd c:\Users\Asus\Downloads\ras-currys
npm run dev

# Go to: http://localhost:3001/migrate
# Click "Start Migration" button
# Wait for ✓ success message
```

### Option B: Via Command Line

```powershell
# In backend terminal (where server is running):
npm run import C:\Users\Asus\Downloads\data.json

# Or with the file you exported:
npm run import C:\path\to\downloaded-file.json
```

### Option C: Manual MongoDB Import

```powershell
# If you have the data.json file:
mongosh

# In MongoDB:
use ras_currys
db.products.insertMany([...])   # paste products from JSON
db.users.insertMany([...])      # paste users
db.orders.insertMany([...])     # paste orders
db.tickets.insertMany([...])    # paste tickets
```

---

## STEP 5: Verify Migration ✓

```powershell
# In MongoDB:
mongosh
use ras_currys

# Should see your data counts:
db.products.countDocuments()
db.users.countDocuments()
db.orders.countDocuments()
db.tickets.countDocuments()
```

---

## STEP 6: Test the App

1. Go to http://localhost:3001
2. Try to sign in with one of your old accounts
3. **Note:** Password is now `TempPassword123!` (all users reset)
4. Change your password immediately
5. Check if your products, orders, and support tickets appear ✓

---

## ✅ SUCCESS CHECKLIST

- [ ] MongoDB installed/connected
- [ ] Backend running on http://localhost:5000
- [ ] Data exported from localStorage
- [ ] Data imported to MongoDB
- [ ] Data counts verified in mongosh
- [ ] Can sign in with temp password
- [ ] Products/orders/tickets visible in app
- [ ] Password changed to permanent one

---

## ⚠️ IMPORTANT NOTES

### All Users Get Temp Password
After migration:
- **Username:** Their old email
- **Password:** `TempPassword123!`
- **What to do:** Users must change password on next login

### Data Is Safe
- Nothing is deleted from localStorage yet
- You can run migration multiple times
- Duplicates are automatically skipped

### After Migration
1. Users change passwords
2. App now uses MongoDB (persistent)
3. No more data loss on browser cache clear
4. Ready for production deployment

---

## 🆘 QUICK TROUBLESHOOTING

| Problem | Solution |
|---------|----------|
| `npm install` fails | Try `npm install --legacy-peer-deps` |
| Port 5000 in use | Kill process: `netstat -ano \| findstr :5000` then `taskkill /pid <PID>` |
| MongoDB connection error | Install MongoDB or use MongoDB Atlas |
| Migration button disabled | Make sure backend is running (npm start) |
| Can't sign in after migration | Use temp password: `TempPassword123!` |
| Data not appearing | Check MongoDB in mongosh: `db.products.find()` |

---

## 📞 Need Help?

1. **Check console errors:** Press F12 in browser
2. **Check backend logs:** Look at terminal where npm start is running
3. **Check MongoDB:** Use `mongosh` to verify data
4. **Read MIGRATION_GUIDE.md:** More detailed troubleshooting

---

## 🎉 YOU'RE DONE!

Your data is now safely stored in MongoDB instead of browser localStorage. Your app is ready for:
- Hosting on production servers
- Sharing with users (data persists)
- Scaling to handle more data
- Adding more features

**Next Steps (Optional):**
- Deploy backend to Heroku/Railway/Render
- Deploy frontend to Vercel/Netlify
- Add JWT authentication
- Add more features

---

**Time Taken:** ~10 minutes  
**Data Migrated:** All products, users, orders, support tickets  
**Status:** ✓ Ready for Production
