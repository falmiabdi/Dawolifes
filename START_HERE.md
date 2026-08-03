# 🚀 DawoLife - Quick Start Guide

## 📋 Prerequisites
- **Node.js** v20+ installed
- **pnpm** package manager installed
- **PostgreSQL** database (Neon) configured

---

## ⚡ Quick Start (Easiest Way)

### **Option 1: Double-Click Batch File (Windows)**
Simply double-click: **`start.bat`**

This will open two terminal windows:
- 🔵 **Backend** on http://localhost:4000
- 🟢 **Frontend** on http://localhost:3000

### **Option 2: Single Command**
```bash
pnpm dev:all
```

### **Option 3: Manual Start (Separate Terminals)**

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd web
pnpm dev
```

---

## 🛑 Stopping the Servers

### **Option 1: Stop Batch File**
Double-click: **`stop.bat`**

### **Option 2: Manual Stop**
- Press `Ctrl+C` in each terminal window

---

## 🌐 Access the Application

Once running, open your browser:

- **Frontend (Web App):** http://localhost:3000
- **Backend API:** http://localhost:4000
- **Health Check:** http://localhost:4000/api/health

---

## 🔑 Test Credentials

**Admin Account:**
- Email: `admin@dawolife.com`
- Password: `Admin1234!`

**Or register a new user via the frontend**

---

## 📦 Available Scripts

### Root Directory:
```bash
pnpm dev:all           # Start both frontend & backend
pnpm dev:server        # Start backend only
pnpm dev:web           # Start frontend only
pnpm build:server      # Build backend
pnpm build:web         # Build frontend
pnpm start:server      # Start backend (production)
pnpm start:web         # Start frontend (production)
```

### Backend (server/):
```bash
npm run dev            # Development mode with hot reload
npm run build          # Build TypeScript to JavaScript
npm start              # Production mode
npm run db:migrate     # Run database migrations
```

### Frontend (web/):
```bash
pnpm dev               # Development mode with hot reload
pnpm build             # Build for production
pnpm start             # Production mode
pnpm lint              # Run ESLint
pnpm typecheck         # Check TypeScript types
```

---

## 🗂️ Project Structure

```
Dawolifes/
├── server/              # Backend (Express + Sequelize)
│   ├── src/
│   │   ├── routes/      # API endpoints
│   │   ├── models/      # Database models
│   │   ├── middleware/  # Auth, error handlers
│   │   ├── services/    # Business logic
│   │   └── utils/       # Helper functions
│   └── .env             # Environment variables
│
├── web/                 # Frontend (Next.js)
│   ├── app/             # Pages (App Router)
│   ├── components/      # React components
│   ├── lib/             # Utilities & hooks
│   └── .env.local       # Environment variables
│
├── start.bat            # ⚡ Quick start script
├── stop.bat             # 🛑 Stop servers
└── START_HERE.md        # 📖 This file
```

---

## 🔧 Environment Setup

### Backend (.env):
```env
DATABASE_URL=postgresql://...
PORT=4000
JWT_SECRET=your_secret
JWT_REFRESH_SECRET=your_refresh_secret
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

### Frontend (.env.local):
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:4000
```

---

## 🐛 Troubleshooting

### Port Already in Use:
```bash
# Run stop.bat or manually kill processes:
# Port 4000 (Backend)
netstat -ano | findstr :4000
taskkill /F /PID <PID>

# Port 3000 (Frontend)
netstat -ano | findstr :3000
taskkill /F /PID <PID>
```

### Database Connection Error:
1. Check DATABASE_URL in `server/.env`
2. Verify Neon database is accessible
3. Check SSL settings in `server/src/config/database.ts`

### Dependencies Issues:
```bash
# Backend
cd server
npm install

# Frontend
cd web
pnpm install
```

---

## 📚 API Endpoints

### Authentication:
- `POST /api/auth/register` - Register agent
- `POST /api/auth/register-buyer` - Register buyer
- `POST /api/auth/signin` - Login
- `POST /api/auth/signout` - Logout
- `GET /api/auth/session` - Get current session

### Properties:
- `GET /api/properties` - List all properties
- `POST /api/properties` - Create property (agent)
- `GET /api/properties/:id` - Get property details
- `PATCH /api/properties/:id` - Update property
- `DELETE /api/properties/:id` - Delete property

### Vehicles:
- `GET /api/vehicles` - List all vehicles
- `POST /api/vehicles` - Create vehicle (agent)
- Similar CRUD operations...

### Payments:
- `POST /api/chapa/initialize` - Initialize Chapa payment
- `GET /api/chapa/verify?txRef=...` - Verify payment
- `POST /api/telebirr/create-order` - TeleBirr payment
- `GET /api/telebirr/status?merchOrderId=...` - Check status

### Messages, Notifications, Favorites, Admin, etc.
See `http://localhost:4000/` for full endpoint list.

---

## 🚀 Deployment

### Backend (Render.com):
1. Push code to GitHub
2. Connect repository in Render
3. Set root directory: `server`
4. Build command: `npm install && npm run build`
5. Start command: `npm start`
6. Add environment variables

### Frontend (Vercel):
1. Connect GitHub repository
2. Set root directory: `web`
3. Build command: `pnpm build`
4. Output directory: `.next`
5. Add environment variables

---

## 📝 Notes

- Backend runs on **Node.js 20+**
- Frontend uses **Next.js 16** with Turbopack
- Database: **PostgreSQL** (Neon)
- ORM: **Sequelize**
- Package Manager: **pnpm** (frontend), **npm** (backend)

---

## 💡 Tips

1. **First time setup?** Run `pnpm install` in root directory
2. **Database changes?** Run `npm run db:migrate` in server/
3. **Code changes auto-reload** with hot module replacement
4. **Check logs** in the terminal windows for errors
5. **API testing:** Use http://localhost:4000/api/health

---

## 🆘 Need Help?

- Check terminal logs for error messages
- Verify environment variables are set
- Ensure ports 3000 and 4000 are available
- Check database connection

---

**Happy Coding! 🎉**
