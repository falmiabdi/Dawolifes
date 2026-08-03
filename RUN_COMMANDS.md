# 🎯 DawoLife - Run Commands Reference

Quick reference for starting and managing the DawoLife application.

---

## 🚀 START THE APPLICATION

### **✅ RECOMMENDED: Use Start Script**

#### **Windows (CMD/PowerShell):**
```bash
# Method 1: Double-click
start.bat

# Method 2: From terminal
.\start.bat

# Method 3: PowerShell
.\start.ps1
```

#### **Cross-Platform (Any OS):**
```bash
pnpm dev:all
```

This will start:
- 🔵 **Backend** on http://localhost:4000
- 🟢 **Frontend** on http://localhost:3000

---

## 🛑 STOP THE APPLICATION

### **Windows:**
```bash
# Method 1: Double-click
stop.bat

# Method 2: From terminal
.\stop.bat

# Method 3: Press Ctrl+C in both terminal windows
```

### **Cross-Platform:**
```bash
# Press Ctrl+C in the terminal running pnpm dev:all
```

---

## 📋 ALL AVAILABLE COMMANDS

### **Root Directory Commands:**

| Command | Description |
|---------|-------------|
| `pnpm dev:all` | Start both backend & frontend |
| `pnpm dev:server` | Start backend only |
| `pnpm dev:web` | Start frontend only |
| `pnpm build:server` | Build backend for production |
| `pnpm build:web` | Build frontend for production |
| `pnpm start:server` | Run backend in production mode |
| `pnpm start:web` | Run frontend in production mode |

---

### **Backend Commands (server/):**

```bash
cd server

# Development
npm run dev          # Start with hot reload
npm run build        # Compile TypeScript
npm start            # Run production build

# Database
npm run db:migrate   # Run migrations
npm run db:seed      # Seed database
```

---

### **Frontend Commands (web/):**

```bash
cd web

# Development
pnpm dev             # Start with hot reload
pnpm build           # Build for production
pnpm start           # Run production build

# Code Quality
pnpm lint            # Run ESLint
pnpm typecheck       # Check TypeScript types
```

---

## 🔍 CHECK IF SERVERS ARE RUNNING

### **Windows:**
```powershell
# Check backend (port 4000)
netstat -ano | findstr :4000

# Check frontend (port 3000)
netstat -ano | findstr :3000
```

### **Cross-Platform:**
```bash
# Test backend
curl http://localhost:4000/api/health

# Test frontend
curl http://localhost:3000
```

---

## 🔄 RESTART SERVERS

### **Quick Restart:**
```bash
# Stop servers
.\stop.bat

# Wait 2 seconds

# Start servers
.\start.bat
```

### **Or from terminal:**
```bash
# Press Ctrl+C to stop
# Then run again:
pnpm dev:all
```

---

## 🐛 TROUBLESHOOTING COMMANDS

### **Port Already in Use:**
```powershell
# Kill process on port 4000 (backend)
netstat -ano | findstr :4000
taskkill /F /PID <PID>

# Kill process on port 3000 (frontend)
netstat -ano | findstr :3000
taskkill /F /PID <PID>

# Or use stop.bat
.\stop.bat
```

### **Reinstall Dependencies:**
```bash
# Backend
cd server
rm -rf node_modules
npm install

# Frontend
cd web
rm -rf node_modules
pnpm install
```

### **Clear Build Cache:**
```bash
# Backend
cd server
rm -rf dist
npm run build

# Frontend
cd web
rm -rf .next
pnpm build
```

---

## 📊 VIEW LOGS

### **Backend Logs:**
```bash
cd server
# Logs are in the terminal running npm run dev
# Or check server/server.log if configured
```

### **Frontend Logs:**
```bash
cd web
# Logs are in the terminal running pnpm dev
# Browser console for client-side logs
```

---

## 🔑 FIRST TIME SETUP

```bash
# 1. Install dependencies
pnpm install

# 2. Setup environment files
# Copy server/.env.example to server/.env
# Copy web/.env.example to web/.env.local
# Fill in your database credentials

# 3. Run migrations
cd server
npm run db:migrate

# 4. Start the app
cd ..
pnpm dev:all
```

---

## 💡 TIPS

1. **Always start from root directory** when using `pnpm dev:all`
2. **Check `.env` files** if you get connection errors
3. **Both servers must run** for the app to work fully
4. **Backend must start first** for database connection
5. **Use start.bat** for easiest startup experience

---

## 📞 Quick Reference

| Action | Command |
|--------|---------|
| Start Everything | `start.bat` or `pnpm dev:all` |
| Stop Everything | `stop.bat` or `Ctrl+C` |
| Restart | `stop.bat` then `start.bat` |
| Backend Only | `cd server && npm run dev` |
| Frontend Only | `cd web && pnpm dev` |
| Check Health | `curl http://localhost:4000/api/health` |

---

**🎉 Happy Coding!**
