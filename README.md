# 🏠 DawoLife

Real-estate / vehicle listing platform for Ethiopia.

---

## 🚀 **QUICK START** (Choose One Method)

### **Method 1: Double-Click (Easiest)**
Double-click **`start.bat`** → Opens 2 terminal windows

### **Method 2: Single Command**
```bash
pnpm dev:all
```

### **Method 3: Manual (Separate Terminals)**
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd web
pnpm dev
```

**Then open:** http://localhost:3000

---

## 🛑 **STOP SERVERS**
- Double-click **`stop.bat`**
- OR press `Ctrl+C` in each terminal

---

## 📖 **Full Documentation**
- **[QUICK_START.txt](./QUICK_START.txt)** - Quick reference
- **[START_HERE.md](./START_HERE.md)** - Complete guide

---

## 📦 Layout

| Path | What it is |
| --- | --- |
| `server/` | Express API (PostgreSQL + Sequelize + Neon) |
| `web/` | Next.js 16 website (App Router) |
| `mobile-app` branch | Capacitor mobile app (Android/iOS) |
| **`start.bat`** | **Quick start script** ⚡ |
| **`stop.bat`** | **Stop servers script** 🛑 |

---

## 🛠️ Tech Stack

**Backend:**
- Node.js + Express
- PostgreSQL (Neon)
- Sequelize ORM
- JWT Auth
- WebSocket

**Frontend:**
- Next.js 16 (React 19)
- TailwindCSS
- Zustand
- React Hook Form + Zod

**Integrations:**
- Chapa & TeleBirr Payments
- Cloudinary (Images)
- Leaflet (Maps)

---

## 🔑 Test Credentials

**Admin Account:**
- Email: `admin@dawolife.com`
- Password: `Admin1234!`

---

## 🌐 URLs

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- Health Check: http://localhost:4000/api/health

---

## 📝 Available Commands

```bash
# Root directory
pnpm dev:all           # Start both servers
pnpm dev:server        # Backend only
pnpm dev:web           # Frontend only
pnpm build:server      # Build backend
pnpm build:web         # Build frontend

# Backend (server/)
npm run dev            # Development
npm run build          # Build
npm start              # Production

# Frontend (web/)
pnpm dev               # Development
pnpm build             # Build
pnpm start             # Production
```

---

## 🚀 Deployment

- **Backend:** Local server (see `start.bat` / `pnpm dev:all`)
- **Frontend:** Local server (see `start.bat` / `pnpm dev:all`)
- **Database:** Neon PostgreSQL

---

## 🐛 Troubleshooting

**Port in use?**
```bash
# Run stop.bat or manually:
netstat -ano | findstr :4000
taskkill /F /PID <PID>
```

**Dependencies issue?**
```bash
cd server && npm install
cd web && pnpm install
```

---

**📚 For detailed setup, see [START_HERE.md](./START_HERE.md)**
