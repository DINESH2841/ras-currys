# 🐳 Docker Setup Guide - MongoDB Data Storage

Use Docker to run everything in containers! No installation needed on your machine.

---

## 🎯 What You Get with Docker

✅ **MongoDB** - Auto-installed & running
✅ **MongoDB Express** - Web UI to manage data (port 8081)
✅ **Backend API** - Running in container (port 5000)
✅ **Data Persistence** - Survives container restarts
✅ **Easy cleanup** - Remove everything in one command
✅ **Production-ready** - Same setup used in production

---

## 📋 Prerequisites

You need **Docker Desktop** installed:

### Download Docker Desktop
- **Windows:** https://www.docker.com/products/docker-desktop
- Download installer
- Run installer
- Restart computer
- Open PowerShell and verify:

```powershell
docker --version
# Output: Docker version 24.0.x
```

---

## 🚀 Quick Start (3 commands)

```powershell
cd c:\Users\Asus\Downloads\ras-currys

docker-compose up -d
```

That's it! Everything starts automatically.

---

## ✅ Verify Everything Started

```powershell
docker-compose ps
```

**Expected output:**
```
CONTAINER ID   IMAGE                  STATUS            PORTS
abc123...      mongo:7.0              Up 2 minutes      27017/tcp
def456...      mongo-express:latest   Up 2 minutes      0.0.0.0:8081->8081/tcp
ghi789...      ras-currys:backend     Up 1 minute       0.0.0.0:5000->5000/tcp
```

---

## 🌐 Access Services

| Service | URL | Purpose |
|---------|-----|---------|
| Backend API | http://localhost:5000 | REST API endpoints |
| MongoDB Express | http://localhost:8081 | Visual database manager |
| MongoDB | localhost:27017 | Direct connection (optional) |

### Test Backend
```powershell
Invoke-WebRequest -Uri http://localhost:5000/api/products
# Should return JSON list of products (empty at first)
```

### Access MongoDB Express
1. Open browser: http://localhost:8081
2. No login needed (for development)
3. Click: Databases → ras_currys
4. See all your collections

---

## 📊 Database Credentials

**For MongoDB Express (no login for dev):**
```
Username: admin
Password: admin123
```

**For backend .env** (already configured):
```
MONGODB_URI=mongodb://admin:admin123@mongodb:27017/ras_currys
```

---

## 🔄 Migration with Docker

### Step 1: Start Containers
```powershell
docker-compose up -d
```

### Step 2: Export Your Data
See EXPORT_DATA.js or QUICK_START_MIGRATION.md

### Step 3: Run Migration
```powershell
# Via web UI
npm run dev
# Go to http://localhost:3001/migrate

# Via CLI
npm run import C:\path\to\exported-data.json

# Via MongoDB Express
# Open http://localhost:8081
# Click "Import Collection"
```

### Step 4: Verify
```powershell
# Via MongoDB Express
# Open http://localhost:8081 → Databases → ras_currys

# Via CLI
docker-compose exec mongodb mongosh -u admin -p admin123
use ras_currys
db.products.find()
```

---

## 🛑 Stop & Restart

### Stop All Containers
```powershell
docker-compose down
```

### Restart All Containers
```powershell
docker-compose up -d
```

### Stop Specific Service
```powershell
docker-compose stop mongodb
docker-compose stop backend
```

### View Logs
```powershell
# All containers
docker-compose logs -f

# Specific container
docker-compose logs -f mongodb
docker-compose logs -f backend
```

---

## 🧹 Cleanup

### Remove Containers (Keep Data)
```powershell
docker-compose down
# Data persists in volumes
```

### Remove Everything (Delete All Data)
```powershell
docker-compose down -v
# -v flag removes volumes (deletes all data!)
```

### Deep Cleanup (Remove Images Too)
```powershell
docker-compose down -v --rmi all
```

---

## 🔧 Configuration

### Change MongoDB Password
Edit `docker-compose.yml`:
```yaml
environment:
  MONGO_INITDB_ROOT_USERNAME: admin
  MONGO_INITDB_ROOT_PASSWORD: your-new-password  # Change here
```

Then restart:
```powershell
docker-compose down -v
docker-compose up -d
```

### Change Port Numbers
Edit `docker-compose.yml`:
```yaml
mongodb:
  ports:
    - "27017:27017"  # Change first number

mongo-express:
  ports:
    - "8081:8081"  # Change first number

backend:
  ports:
    - "5000:5000"  # Change first number
```

### Add MongoDB to Backend .env
```env
MONGODB_URI=mongodb://admin:admin123@mongodb:27017/ras_currys
```

The `mongodb` hostname works because they're on the same Docker network!

---

## 📈 Docker Architecture

```
┌─────────────────────────────────────────────┐
│         Docker Container Network             │
│                                              │
│  ┌─────────────┐   ┌──────────────────┐   │
│  │  MongoDB    │   │  Mongo Express   │   │
│  │  Port 27017 │   │  Port 8081       │   │
│  └─────────────┘   └──────────────────┘   │
│         ▲                                    │
│         │ (talks to)                        │
│  ┌─────────────┐                           │
│  │  Backend    │                           │
│  │  Port 5000  │                           │
│  └─────────────┘                           │
│                                              │
└─────────────────────────────────────────────┘
         ▲
         │ (HTTP requests from browser)
         │
    [Your Browser]
    http://localhost:5000
    http://localhost:8081
```

---

## 🚨 Troubleshooting

### "Docker daemon is not running"
```powershell
# Start Docker Desktop
# Or in PowerShell (Windows):
Start-Service Docker
```

### "Port 5000 already in use"
```powershell
# Either change the port in docker-compose.yml
# Or stop the other service:
docker-compose down
```

### "MongoDB connection refused"
```powershell
# Wait for MongoDB to start (takes 10-15 seconds)
docker-compose logs mongodb
# Look for: "Connection accepted"
```

### Container keeps restarting
```powershell
# Check logs
docker-compose logs -f backend

# Rebuild the image
docker-compose down
docker-compose up -d --build
```

### Want to reset everything
```powershell
# Stop and remove everything including data
docker-compose down -v

# Start fresh
docker-compose up -d
```

---

## 📦 Volume Persistence

Your data is stored in Docker volumes:
- `mongodb_data` - MongoDB databases (survives restarts)
- `mongodb_config` - MongoDB config

**Important:** 
- Data persists even if containers stop
- Data is deleted only with `docker-compose down -v`
- Volumes are stored on your computer

---

## 🔒 Security Notes

**For Development (Current Setup):**
- Simple username/password
- No SSL/TLS encryption
- MongoDB Express accessible without login
- Works great for development!

**For Production:**
- Use strong passwords
- Enable authentication
- Setup SSL/TLS
- Use MongoDB Atlas instead
- Don't expose ports publicly

---

## 🚀 Advanced: Building Custom Image

If you modify the backend code:

```powershell
# Rebuild the image
docker-compose up -d --build

# Or rebuild specific service
docker-compose up -d --build backend
```

---

## 📊 Monitoring

### Check Container Status
```powershell
docker-compose ps
```

### View Real-time Logs
```powershell
docker-compose logs -f

# Follow specific service
docker-compose logs -f mongodb
```

### Check Resource Usage
```powershell
docker stats
```

---

## 🎯 Next Steps

1. **Start containers:** `docker-compose up -d`
2. **Verify:** `docker-compose ps` (should show 3 containers)
3. **Export data:** EXPORT_DATA.js from browser
4. **Migrate:** Go to http://localhost:3001/migrate
5. **Verify:** Open http://localhost:8081 (MongoDB Express)
6. **Celebrate:** Your data is in MongoDB! 🎉

---

## 📞 Quick Help

| Issue | Solution |
|-------|----------|
| Containers won't start | Run: `docker-compose logs` |
| Can't access MongoDB Express | Wait 10 seconds, refresh page |
| Backend API not responding | Check: `docker-compose logs backend` |
| Data not persisting | Don't use `-v` flag when stopping |
| Want fresh start | Run: `docker-compose down -v` |

---

## ✨ Benefits Over Local Installation

| Local Installation | Docker |
|-------------------|--------|
| Complex setup | One command: `docker-compose up` |
| Version conflicts | Same version everywhere |
| Manual updates | Auto-pulled latest |
| Takes disk space | Efficient containerization |
| Hard to clean | One `docker-compose down` |
| Sharing setup | `docker-compose.yml` shared easily |

---

## 🎉 Summary

Docker makes it super easy:

✅ **Start:** `docker-compose up -d`
✅ **Stop:** `docker-compose down`
✅ **Monitor:** `docker-compose logs`
✅ **Data Persists:** Automatically in volumes
✅ **Clean:** One command removes everything

**No more complicated installations!**

---

**Ready to use Docker?** Run: `docker-compose up -d`

Everything starts automatically! 🚀
