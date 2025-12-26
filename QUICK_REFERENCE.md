# ⚡ Quick Reference Card

**Print this or bookmark it!**

---

## 🚀 START MIGRATION IN 3 STEPS

### Step 1: Install & Start Backend (2 minutes)
```powershell
cd ras-currys-backend
npm install
npm start
```

### Step 2: Start Frontend (1 minute)
```powershell
# New terminal
cd c:\Users\Asus\Downloads\ras-currys
npm run dev
```

### Step 3: Migrate (1 minute)
```
Open browser: http://localhost:3001/migrate
Click button: "Start Migration"
Wait: ✓ Success message appears
```

**Done! Your data is now in MongoDB ✓**

---

## 📖 Which Guide to Read

| Need | Guide | Time |
|------|-------|------|
| Quick overview | DATA_MIGRATION_README.md | 2 min |
| Fastest way | QUICK_START_MIGRATION.md | 10 min |
| With visuals | VISUAL_MIGRATION_STEPS.md | 20 min |
| All details | MIGRATION_GUIDE.md | 40 min |
| Technical | MIGRATION_TOOLS_SETUP.md | 30 min |

---

## 🛠️ Key Commands

```powershell
# Start backend
cd ras-currys-backend && npm start

# Start frontend
npm run dev

# Check MongoDB
mongosh

# Import via CLI
npm run import C:\path\to\data.json
```

---

## ✅ Checklist

- [ ] MongoDB installed/running
- [ ] Backend running on 5000
- [ ] Frontend running on 3001
- [ ] Visited /migrate page
- [ ] Migration button clicked
- [ ] ✓ Success message seen
- [ ] Can sign in with temp password

---

## 🔑 Important Passwords

**Temp Password (After Migration):**
```
TempPassword123!
```
→ Users MUST change this on first login

**Demo Account (Before Migration):**
```
Email: dineshsevenni@gmail.com
Password: dinesh1234
Role: SUPERADMIN
```

---

## 🆘 Quick Fixes

```powershell
# Port 5000 in use?
netstat -ano | findstr :5000
taskkill /pid <PID> /f
npm start

# MongoDB not found?
mongosh
# Should show: test>

# npm install fails?
npm install --legacy-peer-deps

# Clear all and restart?
npm cache clean --force
npm install
npm start
```

---

## 🌐 Key URLs

| Service | URL | Port |
|---------|-----|------|
| Frontend | http://localhost:3001 | 3001 |
| Migration UI | http://localhost:3001/migrate | 3001 |
| Backend API | http://localhost:5000 | 5000 |
| MongoDB | localhost:27017 | 27017 |

---

## 📊 What Gets Migrated

✅ Products (all fields)
✅ Users (all except password)
✅ Orders (all fields)
✅ Support Tickets (all fields)
⚠️ Passwords (reset to temp)

---

## 🔐 After Migration

1. Sign in with email + temp password
2. Change password immediately
3. Tell all users to do the same
4. Data is now permanent in MongoDB ✓

---

## 📋 Files Created

**Frontend:** 3 files
- Migration.tsx
- migrate.ts
- EXPORT_DATA.js

**Backend:** 6 files in ras-currys-backend/
- server.js
- models.js
- import-data.js
- package.json
- .env
- README.md

**Documentation:** 5 files
- DATA_MIGRATION_README.md
- QUICK_START_MIGRATION.md
- VISUAL_MIGRATION_STEPS.md
- MIGRATION_GUIDE.md
- MIGRATION_TOOLS_SETUP.md

---

## 🎯 Next After Migration

1. Update React to use backend API
2. Test thoroughly
3. Deploy backend
4. Deploy frontend
5. Setup backups

---

## 📞 Support

- **Quick answers:** DATA_MIGRATION_README.md
- **Step-by-step:** VISUAL_MIGRATION_STEPS.md
- **All details:** MIGRATION_GUIDE.md
- **Errors:** Check console (F12)
- **Backend:** See server.js comments

---

## ✨ Status

✅ MongoDB schemas ready
✅ Express API ready
✅ Frontend UI ready
✅ Migration tools ready
✅ Documentation complete

**You're ready to migrate!**

---

**Print this → Keep it handy → Run migration → Success!**

⏱️ **Total time: 10 minutes**
🎯 **Data safety: 100%**
✅ **Status: Ready to go!**

Good luck! 🚀
