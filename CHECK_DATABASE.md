# 🔍 How to Check if Data is Stored in MongoDB

## ✅ Method 1: Using Browser API Calls (Easiest)

**Backend must be running on port 5000**

Open browser console (F12) and paste these commands:

### Check Products:
```javascript
fetch('http://localhost:5000/api/products')
  .then(r => r.json())
  .then(data => {
    console.log('📦 Products:', data.products.length, 'items');
    console.table(data.products.slice(0, 5));
  });
```

### Check Users:
```javascript
fetch('http://localhost:5000/api/users')
  .then(r => r.json())
  .then(data => {
    console.log('👥 Users:', data.length, 'accounts');
    console.table(data.slice(0, 5));
  });
```

### Check Orders:
```javascript
fetch('http://localhost:5000/api/orders')
  .then(r => r.json())
  .then(data => {
    console.log('🛒 Orders:', data.orders.length, 'orders');
    console.table(data.orders.slice(0, 5));
  });
```

### Check Support Tickets:
```javascript
fetch('http://localhost:5000/api/tickets')
  .then(r => r.json())
  .then(data => {
    console.log('🎫 Tickets:', data.length, 'tickets');
    console.table(data.slice(0, 5));
  });
```

### Check All at Once:
```javascript
Promise.all([
  fetch('http://localhost:5000/api/products').then(r => r.json()),
  fetch('http://localhost:5000/api/users').then(r => r.json()),
  fetch('http://localhost:5000/api/orders').then(r => r.json()),
  fetch('http://localhost:5000/api/tickets').then(r => r.json())
]).then(([products, users, orders, tickets]) => {
  console.log('📊 DATABASE SUMMARY:');
  console.log('═══════════════════════════════════');
  console.log('📦 Products:', products.products.length);
  console.log('👥 Users:', users.length);
  console.log('🛒 Orders:', orders.orders.length);
  console.log('🎫 Tickets:', tickets.length);
  console.log('═══════════════════════════════════');
  console.log('Total:', products.products.length + users.length + orders.orders.length + tickets.length, 'records');
});
```

---

## ✅ Method 2: Open Browser Directly

**Backend must be running on port 5000**

Open these URLs in your browser:

- **Products**: http://localhost:5000/api/products
- **Users**: http://localhost:5000/api/users  
- **Orders**: http://localhost:5000/api/orders
- **Tickets**: http://localhost:5000/api/tickets
- **Stats**: http://localhost:5000/api/stats

---

## ✅ Method 3: Via Frontend (After Login)

1. Start backend: `cd ras-currys-backend && npm start`
2. Start frontend: `cd ras-currys && npm run dev`
3. Open: http://localhost:3000
4. Login as admin:
   - Email: `admin@rascurrys.com`
   - Password: `admin123`
5. Go to Dashboard - you'll see data counts

---

## ✅ Method 4: Command Line (Run Script)

```powershell
cd C:\Users\Asus\Downloads\ras-currys-backend
node check-data.js
```

---

## 🚨 If Port 5000 Already in Use

Find and kill the process:

```powershell
# Find process using port 5000
netstat -ano | findstr :5000

# Kill the process (replace PID with actual number)
taskkill /PID <PID> /F

# Then start backend
npm start
```

---

## 📊 Expected Results

### If Database is EMPTY:
```
📦 Products: 0
👥 Users: 0
🛒 Orders: 0
🎫 Tickets: 0
```

### If Database has data:
```
📦 Products: 25
👥 Users: 8
🛒 Orders: 12
🎫 Tickets: 3
```

---

## 🎯 Quick Test (Copy-Paste Ready)

**1. Kill any existing backend:**
```powershell
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
```

**2. Start backend:**
```powershell
cd C:\Users\Asus\Downloads\ras-currys-backend
npm start
```

**3. Check data (new terminal):**
```powershell
curl http://localhost:5000/api/stats
```

Or open browser: http://localhost:5000/api/stats
