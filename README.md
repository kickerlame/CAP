# VPPT — Vendor & Procurement Performance Tracker

VPPT is an enterprise-grade Procurement & Vendor Management Command Center. It provides real-time KPI tracking, vendor scorecards, purchase requisition & purchase order lifecycle management, hardware inventory tracking with automated stock risk calculations, and budget monitoring.

---

## 🚀 Quick Deploy to Railway (Step-by-Step)

This repository is pre-configured for **instant single-service deployment on Railway** (monorepo Express API + React SPA frontend + automated MySQL migrations).

### Step 1: Push This Folder to a New GitHub Repository
1. Open PowerShell or Terminal in this folder (`CAP-railway`):
   ```bash
   git init
   git add .
   git commit -m "feat: initial commit ready for Railway deployment"
   ```
2. Create a new empty repository on [GitHub](https://github.com/new).
3. Connect and push your code:
   ```bash
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
   git push -u origin main
   ```

---

### Step 2: Deploy on Railway
1. Go to [railway.app](https://railway.app) and sign in.
2. Click **New Project** → Select **Deploy from GitHub repo**.
3. Choose the repository you just pushed.
4. Click **Deploy Now**.

---

### Step 3: Add MySQL Database to Your Railway Project
1. In your Railway project canvas, click **+ Create** (or **+ New**).
2. Select **Database** → **Add MySQL**.
3. Once the MySQL service starts, Railway **automatically links** the database environment variables (`MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE`, `MYSQL_URL`) to your web service!

---

### Step 4: Add Environment Variables (In Railway Dashboard)
In your web service's **Variables** tab on Railway, ensure the following are added:
- `NODE_ENV` = `production`
- `JWT_SECRET` = *(Generate a strong random string)*
- `JWT_REFRESH_SECRET` = *(Generate a second strong random string)*

> [!TIP]
> On the first deployment, Railway automatically runs `npm run db:setup` via `railway.json` / `Procfile`, which executes all MySQL schema migrations and initial seed data.

---

### Step 5: Generate a Public Domain
1. In your web service settings on Railway, go to **Settings** → **Networking** → **Generate Domain**.
2. Click the generated URL (e.g. `https://vppt-production.up.railway.app`) to access the live portal!

---

## 🔑 Default Login Accounts

All accounts come pre-seeded with the password `Password@123`:

| Role | Username | Email | Permissions |
| :--- | :--- | :--- | :--- |
| **System Administrator** | `admin.sys` | `admin@vppt.my` | Full system access, all modules & settings |
| **Procurement Manager** | `procmgr` | `procmgr@vppt.my` | PR & PO management, vendors, approvals |
| **Procurement Officer** | `amirah.hassan` | `amirah.hassan@vppt.my` | PR/PO workflow, vendor performance |
| **Inventory Officer** | `hafiz.rosli` | `hafiz.rosli@vppt.my` | Stock management, transaction logging |

---

## 🛠️ Architecture & Monorepo Structure

- **Backend**: Node.js & Express (`/src`)
  - RESTful endpoints at `/api/v1/*`
  - MySQL2 connection pool with automatic Railway credentials detection
  - Production static file serving for React SPA with client-side fallback
- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS (`/frontend`)
  - Built during Railway build step (`npm run build`) into `frontend/dist`
  - Served directly from Express in production with zero CORS latency
- **Database**: MySQL 8.0+ (`/database`)
  - `database/schema/`: Idempotent DDL schemas (00 through 08)
  - `database/seeds/`: Ground-truth mock dataset (01 through 05)

---

## 💻 Local Development (Optional)

If running locally:
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Install dependencies:
   ```bash
   npm install
   npm run postinstall
   ```
3. Run migrations & seeds:
   ```bash
   npm run db:setup
   ```
4. Start development servers:
   - Backend: `npm run dev` (runs on `http://localhost:5000`)
   - Frontend: `npm run dev --prefix frontend` (runs on `http://localhost:5173`)