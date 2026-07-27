# Phase 1 — DelaHarme Migration Analysis Report

## 1. All API Routes Under `app/api`

| Route Path | Method(s) | Purpose | Backend Equivalent |
|------------|-----------|---------|-------------------|
| `/api/auth/[...nextauth]` | GET, POST | NextAuth stub | Not needed (replace with JWT) |
| `/api/auth/signin` | POST | Login with email/password | `POST /api/auth/signin` |
| `/api/auth/session` | GET | Get current session | `GET /api/auth/session` |
| `/api/auth/signout` | POST | Logout | `POST /api/auth/signout` |
| `/api/register` | POST | Register new agent | `POST /api/register` |
| `/api/properties` | GET, POST | List/create properties | `GET/POST /api/properties` |
| `/api/properties/[id]` | GET, PATCH, DELETE | Property detail/update/delete | `GET/PATCH/DELETE /api/properties/:id` |
| `/api/upload` | POST | Cloudinary upload (general) | `POST /api/upload` |
| `/api/agent/upload` | POST | Cloudinary upload (agent) | `POST /api/agent/upload` |
| `/api/agent/profile` | PUT | Update profile photo | `PUT /api/agent/profile` |
| `/api/agent/onboarding` | POST | Save onboarding step | `POST /api/agent/onboarding` |
| `/api/payments` | GET | List payments with stats | `GET /api/payments` |
| `/api/chapa/initialize` | POST | Initialize Chapa payment | `POST /api/chapa/initialize` |
| `/api/chapa/verify` | GET | Verify Chapa payment status | `GET /api/chapa/verify` |
| `/api/chapa/webhook` | POST | Chapa webhook callback | `POST /api/chapa/webhook` |
| `/api/telebirr/create-order` | POST | Create Telebirr order | `POST /api/telebirr/create-order` |
| `/api/telebirr/status` | GET | Get Telebirr payment status | `GET /api/telebirr/status` |
| `/api/telebirr/notify` | POST | Telebirr webhook callback | `POST /api/telebirr/notify` |
| `/api/messages` | GET, POST, PATCH | Messaging CRUD | `GET/POST/PATCH /api/messages` |
| `/api/notifications` | GET, POST, PATCH | Notifications CRUD | `GET/POST/PATCH /api/notifications` |
| `/api/admin/agents` | GET, POST | List/manage agents | `GET/POST /api/admin/agents` |

## 2. Server Actions

**None found.** The project uses API routes exclusively. No React Server Actions are defined.

## 3. Database Access

### Mongoose Models (`lib/models/`)
- **User.ts** — Agent/user schema with onboarding fields, documents, education, professional info
- **Property.ts** — Real estate listings with location, features, images, status workflow
- **Payment.ts** — Payment transactions with Chapa/Telebirr tracking
- **Message.ts** — Buyer-agent messaging per property
- **Notification.ts** — In-app notifications with read/unread state

### Direct DB Calls in Server Components
These pages directly import Mongoose models and call the database:
- `app/admin/page.tsx` — `connectToDatabase()`, `UserModel.countDocuments()`, `PropertyModel.countDocuments()`, `PaymentModel.aggregate()`, `UserModel.find()`, `PropertyModel.find()`, `PaymentModel.find()`
- `app/agent/page.tsx` — `connectToDatabase()`, `PropertyModel.countDocuments()`
- `app/agent/properties/page.tsx` — `connectToDatabase()`, `PropertyModel.find()`
- `app/agent/profile/page.tsx` — `connectToDatabase()`, `UserModel.findById()`
- `app/agent/onboarding/page.tsx` — Client component, calls `/api/agent/onboarding`
- `app/listings/[id]/page.tsx` — `connectToDatabase()`, `PropertyModel.findById()`, `PropertyModel.find()`
- `app/admin/users/page.tsx` — `connectToDatabase()`, `UserModel.find()`

## 4. Authentication Logic

### Current Implementation
- **Custom session cookie** (`dawolife-session`) — HMAC-signed cookie containing userId, email, role, status
- **Session utilities** (`lib/session-cookie.ts`) — `createSessionCookie()`, `readSessionCookie()` using WebCrypto HMAC-SHA256
- **Auth store** (`lib/auth-store.ts`) — Password hashing (scrypt), user lookup, registration, agent management
- **Auth session** (`lib/auth-session.ts`) — `getServerSession()`, `getSessionFromRequest()` using Next.js cookies API
- **Middleware** (`proxy.ts`) — Route protection based on `dawolife-session` cookie:
  - `/admin/*` → admin role required
  - `/agent/*` → agent role required
  - `/post` → authenticated required
  - Public routes: `/`, `/login`, `/register`, `/listings`, `/pay`

### Migration Target
- Replace custom cookie with **JWT tokens** (access token in HttpOnly cookie + refresh token)
- Move password hashing and user lookup to backend
- Backend validates token on every protected request
- Frontend sends token via cookie or Authorization header

## 5. Payment Logic

### Chapa Integration (`lib/chapa-service.ts`, `lib/chapa-config.ts`)
- `initializeTransaction()` — Creates payment, returns checkout URL
- `verifyTransaction()` — Checks payment status via Chapa API
- `createTxRef()` — Generates unique transaction reference
- Config: secret key, API URL, webhook URL, return URL

### Telebirr Integration (`lib/telebirr-service.ts`, `lib/telebirr-config.ts`, `lib/telebirr-utils.ts`)
- `createOrder()` — Creates pre-order, applies fabric token, signs request with RSA
- Config: base URL, fabric app ID/secret, merchant code/app ID, RSA keys, notify/redirect URLs
- Utils: `signRequestObject()`, `verifySignature()`, `buildNotifySignString()`

### Payment Model
- Fields: orderId, merchOrderId, txRef, status, amount, method, buyer info, notification data
- Statuses: Pending, Completed, Failed, Refunded, Expired
- Payment types: service_charge, listing_fee, commission, subscription

## 6. Upload Logic

### Cloudinary Upload
- **Routes**: `/api/upload` (general), `/api/agent/upload` (agent-specific)
- **Process**: Generate SHA1 signature from timestamp + API secret, send multipart form with file buffer
- **Frontend**: File input → FormData → POST to upload route → receives URL → saves to property/user

### Uploaded File Types
- Property images and videos
- Profile photos
- Identity documents (Fayda ID, passport)
- Education certificates
- Business licenses
- Location documents

## 7. WebSocket Implementation

### Current (`websocket-server.js`)
- **Standalone Node.js server** on port 8080
- **Library**: `ws` (not Socket.io)
- **Protocol**: Raw JSON messages
- **Events**:
  - `notification` — Real-time notification broadcast
  - `unread_count` — Unread notification count updates
  - `mark_read` — Client marks all notifications as read
  - `mark_single_read` — Client marks single notification as read
  - `send_notification` — Admin sends notification to specific user
- **Connection**: `ws://localhost:8080?userId=<id>`
- **Persistence**: MongoDB via Mongoose (same models as REST API)
- **Fallback**: Mock notifications when DB is unavailable or for anonymous users

### Frontend Usage (`app/agent/notifications/page.tsx`)
- Connects to WebSocket on mount
- Polls `/api/notifications` for initial data
- Auto-reconnects with exponential backoff (max 10 attempts)
- Shows connection status indicator

## 8. Environment Variables

### Client-Exposed (NEXT_PUBLIC_*)
- `NEXT_PUBLIC_API_URL` — Server base URL (needs to be added)
- `NEXT_PUBLIC_WS_DOMAIN` — WebSocket domain for production

### Server-Only Secrets
- `MONGODB_URI` — Database connection
- `JWT_SECRET` — JWT signing key
- `SESSION_SECRET` — Legacy session signing
- `CLOUDINARY_*` — Cloud storage credentials
- `CHAPA_*` — Payment gateway credentials
- `TELEBIRR_*` — Payment gateway credentials and RSA keys
- `ADMIN_EMAILS` — Comma-separated admin email list

## 9. Middleware

### proxy.ts (Next.js Middleware)
- **Route protection** based on `dawolife-session` cookie
- **Public routes**: `/`, `/login`, `/register`, `/listings`, `/pay`
- **Admin routes**: `/admin/*` — requires admin role
- **Agent routes**: `/agent/*` — requires agent role
- **Protected routes**: All other routes require authentication
- **Matcher**: `/admin/:path*`, `/agent/:path*`, and all other non-API/non-static routes

## 10. Protected Routes

### Admin Routes (Server Components)
- `app/admin/page.tsx` — Dashboard with stats, charts, recent activity
- `app/admin/agents/page.tsx` — Agent verification management
- `app/admin/properties/page.tsx` — Property review queue
- `app/admin/payments/page.tsx` — Payment dashboard with CSV export
- `app/admin/users/page.tsx` — User catalog management
- `app/admin/settings/page.tsx` — Admin password change

### Agent Routes (Mixed Server/Client)
- `app/agent/page.tsx` — Agent dashboard (server component)
- `app/agent/post/page.tsx` — Post new property (client component)
- `app/agent/properties/page.tsx` — My properties (server component)
- `app/agent/properties/[id]/edit/page.tsx` — Edit property (client component)
- `app/agent/profile/page.tsx` — Profile view (server component)
- `app/agent/onboarding/page.tsx` — Onboarding wizard (client component)
- `app/agent/messages/page.tsx` — Messages (client component)
- `app/agent/notifications/page.tsx` — Notifications (client component)
- `app/agent/payments/page.tsx` — Payments (client component)
- `app/agent/settings/page.tsx` — Settings (client component)

### Public Routes
- `app/page.tsx` — Homepage
- `app/login/page.tsx` — Login
- `app/register/page.tsx` — Registration
- `app/listings/[id]/page.tsx` — Property detail (server component with DB access)
- `app/pay/page.tsx` — Payment page
- `app/payment-success/page.tsx` — Payment success

## 11. Server Components (Direct DB Access)

These Next.js server components directly import and execute Mongoose queries:

| File | DB Operations |
|------|--------------|
| `app/admin/page.tsx` | `UserModel.countDocuments()`, `PropertyModel.countDocuments()`, `PaymentModel.aggregate()`, `UserModel.find()`, `PropertyModel.find()`, `PaymentModel.find()` |
| `app/agent/page.tsx` | `PropertyModel.countDocuments()` |
| `app/agent/properties/page.tsx` | `PropertyModel.find()` |
| `app/agent/profile/page.tsx` | `UserModel.findById()` |
| `app/listings/[id]/page.tsx` | `PropertyModel.findById()`, `PropertyModel.find()` |
| `app/admin/users/page.tsx` | `UserModel.find()` |

## Migration Recommendations

### Frontend Code (Keep in Next.js)
- All UI components, pages, layouts
- Client-side state management (Zustand, React Hook Form)
- Map components (Leaflet)
- Chart components (Recharts)
- Form validation (Zod)
- All `use client` components

### Backend Code (Move to Express Server)
- All Mongoose models
- All authentication logic (password hashing, JWT issuance, validation)
- All API route handlers
- All payment service integrations (Chapa, Telebirr)
- All file upload handlers (Cloudinary)
- WebSocket server
- Database connection management

### Shared Code (Copy to Both)
- TypeScript interfaces/types for User, Property, Payment, Message, Notification
- Validation schemas (Zod)
