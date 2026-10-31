# CIT Nexus – Step-by-Step Installation & Execution Guide

Complete guide for setting up, running, configuring, and deploying **CIT Nexus – Smart Campus Intelligence Platform** in local development, containerized environments, and cloud infrastructure.

---

## 1. System Prerequisites

| Requirement | Supported Versions | Verification Command | Notes |
|---|---|---|---|
| **Python** | 3.10, 3.11, 3.12 | `python --version` | Required for FastAPI, SQLAlchemy, and OR-Tools |
| **Node.js** | 18.x, 20.x, 22.x | `node --version` | Required for Next.js 14 frontend |
| **npm** | 9.x, 10.x | `npm --version` | Frontend package manager |
| **Git** | 2.x+ | `git --version` | Version control & deployment |
| **MongoDB** | 6.x, 7.x *(Optional)*| `mongod --version` | Live document store (fallback active if absent) |

---

## 2. Repository Cloning & Structure

```powershell
# Clone the repository
git clone https://github.com/Kanchan-ai05/Web-Hackathon-IIT-BBSR.git
cd Web-Hackathon-IIT-BBSR
```

### Directory Structure
```
Web-Hackathon-IIT-BBSR/
├── backend/                  # FastAPI backend server
│   ├── app/                  # Application code (main, routers, models, mongodb, auth)
│   ├── tests/                # 91 pytest integration tests
│   ├── Dockerfile            # Container definition
│   └── requirements.txt      # Python dependencies
├── frontend/                 # Next.js 14 App Router UI
│   ├── src/app/              # 20 frontend pages (analytics, bookings, copilot, etc.)
│   ├── src/components/       # Navigation bar & shared components
│   └── src/context/          # Auth and AI settings contexts
├── data/                     # cit_public.json dataset and CSV registers
├── exports/                  # Generated schedule.json & schedule_after.json
├── scripts/                  # generate_exports.py validation pipeline
├── prompts/                  # Prompt templates and llm_execution_log.jsonl
└── validator.py              # Pure Python 100% deterministic validator
```

---

## 3. Backend Setup & Startup

### Step 3.1: Create & Activate Python Virtual Environment
```powershell
# Windows (PowerShell)
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1

# Linux / macOS (bash / zsh)
cd backend
python3 -m venv venv
source venv/bin/activate
```

### Step 3.2: Install Python Dependencies
```powershell
pip install --upgrade pip
pip install -r requirements.txt
```

### Step 3.3: Environment Configuration (`backend/.env`)
Create a `.env` file in `backend/` (or copy from `.env.example`):
```ini
# Security & JWT Configuration
SECRET_KEY=cit-secret-key-change-in-production-2026
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Database Configuration
DATABASE_URL=sqlite:///./cit_schedule.db
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB_NAME=cit_smart_campus

# Optional Generative AI API Keys
GEMINI_API_KEY=
OPENAI_API_KEY=
```

### Step 3.4: Launch FastAPI Server
```powershell
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
- **Console Confirmation**:
  ```text
  INFO:     Started server process
  INFO:     Waiting for application startup.
  [Database] Seeded 27 rooms, 40 faculty, 189 sessions, 41 midsem exams, and 4 demo accounts.
  [MongoDB] Connected or using embedded fallback.
  INFO:     Application startup complete.
  INFO:     Uvicorn running on http://0.0.0.0:8000
  ```
- **Live Health Endpoint**: `http://localhost:8000/health`
- **Interactive Swagger Docs**: `http://localhost:8000/docs`

---

## 4. Frontend Setup & Startup

### Step 4.1: Install Node Dependencies
Open a second terminal window:
```powershell
cd frontend
npm install
```

### Step 4.2: Frontend Environment Configuration (`frontend/.env.local`)
Create `.env.local` in `frontend/`:
```ini
# Point to your running FastAPI backend
NEXT_PUBLIC_API_URL=http://localhost:8000
BACKEND_PROXY_URL=http://localhost:8000
```

### Step 4.3: Launch Next.js Development Server
```powershell
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your web browser.

### Step 4.4: In-App API Switcher Verification
Click the **API Connection Pill** in the top navigation bar to confirm live connectivity. If running local backend, select `💻 Localhost (8000)`. If testing without local backend, click `🌐 Cloud API` to connect directly to the live Render backend.

---

## 5. MongoDB Setup (Optional)

CIT Nexus includes an **intelligent fallback datastore**. If MongoDB is offline, all 10 ecosystem modules function seamlessly using `data/mongo_fallback.json`.

To run with live MongoDB:
1. **Windows**: Start MongoDB Windows Service or run `mongod --dbpath C:\data\db`.
2. **macOS / Linux**: `brew services start mongodb-community` or `sudo systemctl start mongod`.
3. **Docker**: `docker run -d -p 27017:27017 --name cit-mongo mongo:latest`.
The backend will automatically detect the active daemon and log `[MongoDB] Successfully connected to live MongoDB at mongodb://localhost:27017`.

---

## 6. Docker Deployment

### 6.1 Run Backend via Docker
```powershell
docker build -t cit-nexus-backend -f backend/Dockerfile .
docker run -d -p 8000:8000 -v cit_data:/data --name cit-api cit-nexus-backend
```

### 6.2 Health Check in Container
```powershell
curl http://localhost:8000/health
# Returns: {"status":"healthy","dataset":"cit-public-v1"}
```

---

## 7. Cloud Deployment Configurations

### 7.1 GitHub Pages Deployment (Frontend)
Automated by `.github/workflows/deploy.yml` on every push to `main`:
1. Sets `GITHUB_PAGES=true`.
2. Runs `npm run build` exporting static HTML into `frontend/out/`.
3. Deploys artifact to GitHub Pages at: `https://kanchan-ai05.github.io/Web-Hackathon-IIT-BBSR/`.

### 7.2 Render Cloud Deployment (Backend)
Configured via `render.yaml`:
- **Build Command**: `pip install -r backend/requirements.txt`
- **Start Command**: `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`
- **Disk Mount**: Persistent disk at `/data` mounted to `cit_schedule.db` ensuring data persists across deploys.

### 7.3 Vercel Cloud Deployment (Frontend)
Configured via `vercel.json` with API rewrite rules to Render.
- Deploy with 1-click by linking the GitHub repository in the Vercel dashboard.

---

## 8. Verification & Sanity Checks

Run these commands to confirm complete operational readiness:

```powershell
# 1. Run all 91 pytest tests
pytest backend/tests/ -v

# 2. Run the official validator on exported schedules
python scripts/generate_exports.py
python validator.py --schedule exports/schedule.json
python validator.py --schedule exports/schedule_after.json

# 3. Type check frontend
cd frontend
npx tsc --noEmit

# 4. Compile frontend production build
npm run build
```
All commands should exit cleanly with return code 0.
