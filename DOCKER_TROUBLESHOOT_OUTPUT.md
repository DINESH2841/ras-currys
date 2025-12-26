# 🐳 DOCKER START - Quick Setup Checklist

**Problem:** Can't see output? Let's fix it! Follow these steps.

---

## 🔍 Why You Can't See Output

Possible reasons:
1. ❌ Docker Desktop not installed
2. ❌ Docker Desktop not running
3. ❌ Port already in use
4. ❌ MongoDB Atlas connection string (you have MongoDB Atlas!)
5. ❌ Missing configuration

---

## ✅ STEP-BY-STEP FIX

### Step 1: Check If Docker Desktop Is Installed

```powershell
docker --version
```

**Expected:**
```
Docker version 24.0.x
```

**If error "docker is not recognized":**
- Download: https://www.docker.com/products/docker-desktop
- Install it
- Restart computer
- Try again

---

### Step 2: Check If Docker Desktop Is Running

Look at system tray (bottom right of screen):
- ✅ Docker icon visible? Running!
- ❌ Not visible? Click start button and launch Docker Desktop

Or in PowerShell:
```powershell
docker ps
```

**Should return list of containers (even if empty)**

**If error "Cannot connect to Docker daemon":**
1. Open Docker Desktop (from Start menu)
2. Wait for it to fully load (30 seconds)
3. Try again

---

### Step 3: Check Your MongoDB Connection

You have **MongoDB Atlas** configured! That's good!

Current `.env`:
```
MONGODB_URI=mongodb+srv://sevennidinesh_db_user:AWvBzaJgMlhuUe0q@cluster0.fx57aiu.mongodb.net/ras_currys
```

This connects to **cloud MongoDB** (not Docker local)

### Two Options:

#### Option A: Use MongoDB Atlas (Cloud) ✅ RECOMMENDED
Your `.env` is already set up for this!

1. Make sure `.env` has:
```
MONGODB_URI=mongodb+srv://sevennidinesh_db_user:AWvBzaJgMlhuUe0q@cluster0.fx57aiu.mongodb.net/ras_currys
PORT=5000
NODE_ENV=development
```

2. Start containers:
```powershell
cd c:\Users\Asus\Downloads\ras-currys
docker-compose up -d
```

3. Check status:
```powershell
docker-compose ps
```

4. See logs:
```powershell
docker-compose logs -f
```

#### Option B: Use Local MongoDB (Docker) 🐳
Use MongoDB running in Docker container:

1. Update `.env`:
```
MONGODB_URI=mongodb://admin:admin123@mongodb:27017/ras_currys
PORT=5000
NODE_ENV=development
```

2. Start all services:
```powershell
docker-compose up -d
```

3. Check status:
```powershell
docker-compose ps
```

---

### Step 4: Verify Everything Works

```powershell
# Check containers running
docker-compose ps

# View logs (should see no errors)
docker-compose logs

# Test backend API
Invoke-WebRequest -Uri http://localhost:5000/api/products

# MongoDB Express (if using local Docker)
# Open: http://localhost:8081
```

---

## 🚨 Troubleshooting - Common Issues

### Issue: "Cannot find docker-compose.yml"
```
Error: no such file or directory
```

**Fix:**
```powershell
# Make sure you're in correct folder
cd c:\Users\Asus\Downloads\ras-currys

# Check file exists
ls docker-compose.yml

# Then try again
docker-compose up -d
```

---

### Issue: "Port 5000 already in use"
```
Error: Bind for 0.0.0.0:5000 failed: port is already allocated
```

**Fix:**
```powershell
# Stop all containers
docker-compose down

# Or change port in docker-compose.yml
# Change: ports: - "5000:5000"
# To:     ports: - "5001:5000"

# Then restart
docker-compose up -d
```

---

### Issue: "Cannot connect to MongoDB"
```
Error: connect ECONNREFUSED
```

**Fix:**

If using **MongoDB Atlas**:
- Check internet connection
- Verify connection string in `.env`
- Check IP whitelist on MongoDB Atlas

If using **local Docker MongoDB**:
- Wait 10 seconds for MongoDB to start
- Check: `docker-compose logs mongodb`

---

### Issue: "See output but backend won't start"

```powershell
# View detailed logs
docker-compose logs -f backend

# Rebuild and restart
docker-compose down
docker-compose up -d --build
```

---

## 🎯 3-Minute Quick Start

```powershell
# 1. Make sure in correct folder
cd c:\Users\Asus\Downloads\ras-currys

# 2. Start all containers
docker-compose up -d

# 3. Check they're running
docker-compose ps

# 4. View output
docker-compose logs -f
# Press Ctrl+C to stop viewing logs
```

**That's it!** Your Docker setup is running! 🎉

---

## 📊 Understanding Your Setup

### You Have MongoDB Atlas (Cloud)
```
Your App (Docker)
    ↓ (via internet)
MongoDB Atlas (Cloud)
    ↓
Your Data (in cloud)
```

**Benefits:**
- Data backed up automatically
- Accessible from anywhere
- No local MongoDB installation needed
- Professional cloud database

### Alternative: Local Docker MongoDB
```
Your App (Docker)
    ↓ (local network)
MongoDB in Docker Container
    ↓
Docker Volume (persistent storage)
```

**Benefits:**
- No internet needed
- Faster for development
- Everything local
- Easy to reset

---

## ✅ FINAL CHECKLIST

- [ ] Docker Desktop installed
- [ ] Docker Desktop running
- [ ] In correct folder: `c:\Users\Asus\Downloads\ras-currys`
- [ ] `.env` file has MONGODB_URI set
- [ ] Run: `docker-compose up -d`
- [ ] Run: `docker-compose ps` (see 2-3 containers)
- [ ] Run: `docker-compose logs` (see no errors)
- [ ] Frontend: `npm run dev` in new terminal
- [ ] Open: http://localhost:3001 (see your app!)

---

## 📞 Still Can't See Output?

Run this in PowerShell:

```powershell
# Check Docker is working
docker --version

# Check docker-compose works
docker-compose --version

# Check if docker.yml exists
ls docker-compose.yml

# Try to start and see detailed errors
docker-compose up
# (don't use -d, so you see output)
```

**Share the output you see** and we'll help!

---

## 🌟 Quick Commands

```powershell
# Start everything (background)
docker-compose up -d

# Start everything (foreground - see all output)
docker-compose up

# Stop everything
docker-compose down

# See what's running
docker-compose ps

# View logs (live)
docker-compose logs -f

# View logs for specific service
docker-compose logs -f backend

# Stop viewing logs
Ctrl + C
```

---

**Ready to see output now?** Run:

```powershell
cd c:\Users\Asus\Downloads\ras-currys
docker-compose up
```

You'll see all output on screen! 🚀

Press `Ctrl+C` when done.

---

**Need help?** Reply with the output you're seeing, and we'll debug it together!
