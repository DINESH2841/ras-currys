# 🟢 START DOCKER - See Your Output!

**Docker and Docker Compose ARE installed!** ✅

Now let's start everything and see the output.

---

## 🚀 START Docker Services (See Output on Screen)

```powershell
cd c:\Users\Asus\Downloads\ras-currys

# Start and WATCH output in real-time
docker-compose up
```

**You'll see:**
```
 Container ras-currys-mongo  Creating
 Container ras-currys-mongo  Created
 Container ras-currys-mongo  Starting
 Container ras-currys-mongo  Started
 Container ras-currys-mongo-express  Creating
 Container ras-currys-backend  Building
 ...
```

**Wait for:**
```
✓ MongoDB connected
🚀 Server running on http://localhost:5000
```

Then press `Ctrl+C` to stop viewing (containers keep running in background)

---

## 🛑 Or START in Background (Silent)

```powershell
docker-compose up -d
```

Then check status:
```powershell
docker-compose ps
```

See logs anytime:
```powershell
docker-compose logs -f
```

---

## 🌐 Access Your Services

After containers start:

### MongoDB Express (See Your Data!)
```
http://localhost:8081
```
Click: Databases → ras_currys → See your collections

### Backend API
```
http://localhost:5000/api/products
```
Should return JSON (empty at first)

### Frontend App
```powershell
# New terminal
npm run dev

# Then open: http://localhost:3001
```

---

## ✅ Verification

```powershell
# Check containers running
docker-compose ps

# Should show:
# CONTAINER ID   IMAGE           STATUS
# xxx...         mongo:7.0       Up 10 seconds
# yyy...         mongo-express   Up 8 seconds
# zzz...         ras-currys-backend  Up 5 seconds
```

---

## 🎯 Next: Migrate Your Data

1. **Export data** from browser (see EXPORT_DATA.js)
2. **Import to MongoDB**:
   - Via http://localhost:3001/migrate
   - Or: `npm run import C:\path\to\data.json`
3. **Verify** at http://localhost:8081

---

## 🛑 Stop When Done

```powershell
# Stop (keep data)
docker-compose down

# Stop and DELETE data
docker-compose down -v
```

---

## 📊 What's Running

| Service | Port | Purpose |
|---------|------|---------|
| MongoDB | 27017 | Database |
| MongoDB Express | 8081 | Web UI |
| Backend API | 5000 | REST API |

---

**Ready? Run:**
```powershell
docker-compose up
```

You'll see all output on your screen! 🎉

Press Ctrl+C when done (containers keep running).

---

**Next:** Open http://localhost:8081 to see MongoDB! 🐳
