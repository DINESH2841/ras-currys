# 🐳 Docker Quick Commands

Copy these commands. Use whenever you need to manage Docker.

---

## 🚀 START / STOP

```powershell
# Start all containers
docker-compose up -d

# Stop all containers
docker-compose down

# Restart all containers
docker-compose restart

# Stop specific service
docker-compose stop mongodb
docker-compose stop backend
```

---

## 📊 MONITOR

```powershell
# See all containers running
docker-compose ps

# View logs (live stream)
docker-compose logs -f

# View logs for specific service
docker-compose logs -f mongodb
docker-compose logs -f backend

# View container resource usage
docker stats

# Check network connectivity
docker-compose exec backend ping mongodb
```

---

## 🔄 REBUILD

```powershell
# Rebuild images
docker-compose up -d --build

# Rebuild specific service
docker-compose up -d --build backend

# Remove and rebuild from scratch
docker-compose down -v
docker-compose up -d --build
```

---

## 🧹 CLEANUP

```powershell
# Stop containers (keep data)
docker-compose down

# Stop containers (DELETE data!)
docker-compose down -v

# Remove containers, volumes, and images
docker-compose down -v --rmi all

# Clean up unused images
docker image prune

# Clean up all unused resources
docker system prune
```

---

## 🔍 INSPECT

```powershell
# See container details
docker-compose ps

# View environment variables
docker-compose config

# Check volume status
docker volume ls

# Inspect specific volume
docker volume inspect ras-currys-backend_mongodb_data
```

---

## 💾 DATABASE

```powershell
# Connect to MongoDB inside container
docker-compose exec mongodb mongosh -u admin -p admin123

# Then in MongoDB:
use ras_currys
db.products.find()
db.users.find()
db.orders.find()
db.tickets.find()

# Exit MongoDB
exit
```

---

## 🌐 ACCESS SERVICES

```
MongoDB Express (Web UI):
http://localhost:8081

Backend API:
http://localhost:5000

Test Backend:
curl http://localhost:5000/api/products
Invoke-WebRequest -Uri http://localhost:5000/api/products
```

---

## 🆘 EMERGENCY COMMANDS

```powershell
# Stop immediately
docker-compose kill

# Stop and remove everything
docker-compose down -v

# View what went wrong
docker-compose logs --tail=50

# Rebuild from scratch
docker system prune -a
docker-compose up -d --build
```

---

## 📋 SETUP WORKFLOW

```powershell
# 1. Initial setup
cd c:\Users\Asus\Downloads\ras-currys
docker-compose up -d

# 2. Verify it works
docker-compose ps
# (should see 3 running containers)

# 3. Access services
# http://localhost:8081 → MongoDB Express
# http://localhost:5000 → Backend API

# 4. Stop when done
docker-compose down
```

---

**Save this file → Reference as needed → Copy-paste commands!**

📌 Most common: `docker-compose up -d` and `docker-compose down`
