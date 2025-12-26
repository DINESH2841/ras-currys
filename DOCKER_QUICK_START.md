# ⚡ Docker Quick Start - 3 Minutes to Running

Copy-paste these commands. That's it!

---

## 🟢 STEP 1: Install Docker (First Time Only)

Download Docker Desktop: https://www.docker.com/products/docker-desktop

Install and restart your computer.

Verify it works:
```powershell
docker --version
# Output: Docker version 24.x.x
```

---

## 🟢 STEP 2: Start Everything (1 command!)

```powershell
cd c:\Users\Asus\Downloads\ras-currys

docker-compose up -d
```

**Wait 10-15 seconds for everything to start...**

---

## 🟢 STEP 3: Verify Running

```powershell
docker-compose ps
```

**Should show 3 containers:**
```
CONTAINER ID   IMAGE               STATUS           PORTS
abc...         mongo:7.0           Up 10 seconds    27017/tcp
def...         mongo-express       Up 8 seconds     0.0.0.0:8081->8081/tcp
ghi...         ras-currys-backend  Up 5 seconds     0.0.0.0:5000->5000/tcp
```

---

## 🌐 STEP 4: Access Services

### MongoDB Express (See Your Data!)
```
Open browser: http://localhost:8081
```

You'll see all your collections (products, users, orders, tickets)

### Backend API
```
http://localhost:5000/api/products
```

Should return JSON list (empty if first run)

### Frontend with Migration UI
```powershell
# New terminal
cd c:\Users\Asus\Downloads\ras-currys
npm run dev

# Then open: http://localhost:3001/migrate
```

---

## 📊 STEP 5: Migrate Your Data

**Option A: Via Web UI (Easiest)**
1. Open: http://localhost:3001/migrate
2. Click: "Start Migration"
3. Wait: ~10 seconds
4. See: ✓ Success message

**Option B: Via CLI**
```powershell
# First export your data (see EXPORT_DATA.js)
npm run import C:\path\to\exported-data.json
```

---

## ✅ STEP 6: Verify Migration

```
Open: http://localhost:8081 (MongoDB Express)
Click: Databases → ras_currys
See: Your products, users, orders, tickets!
```

---

## 🛑 STOP CONTAINERS

```powershell
# Stop (keep data)
docker-compose down

# Stop and delete everything (CAREFUL!)
docker-compose down -v
```

---

## 🆘 QUICK FIXES

| Problem | Fix |
|---------|-----|
| Containers won't start | `docker-compose logs` |
| Can't access http://localhost:8081 | Wait 15 seconds, try again |
| Port 5000 in use | `docker-compose down` |
| Need to see logs | `docker-compose logs -f` |

---

## 🎯 Your Data is Safe!

✓ MongoDB running in container (port 27017)
✓ Data stored in volumes (survives restarts)
✓ MongoDB Express UI (manage data visually)
✓ Backend API (port 5000)
✓ Frontend (port 3001)

**All running with one command!** 🚀

---

## 📚 More Info

- Full guide: **DOCKER_SETUP.md**
- All commands: **DOCKER_COMMANDS.md**
- Comparison: **DOCKER_VS_TRADITIONAL.md**

---

**That's it! Docker is handling everything!** 🐳

Stop wasting time with manual installations. Use Docker! ✅
