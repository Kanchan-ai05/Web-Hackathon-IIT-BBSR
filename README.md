# Chilika Institute of Technology (CIT) - Campus Scheduling & Venue Management Platform

A robust web platform built for **Chilika Institute of Technology (CIT)** that generates semester timetables with zero clashes, schedules midsem exams, manages venue bookings with priority conflict resolution, and handles last-minute disruptions with minimal schedule displacement.

---

## 🌐 Live Deployed Links

- 🖥️ **Live Web Platform (GitHub Pages)**: [https://kanchan-ai05.github.io/Web-Hackathon-IIT-BBSR/](https://kanchan-ai05.github.io/Web-Hackathon-IIT-BBSR/)
- ⚡ **Live Web Platform (Vercel)**: [https://web-hackathon-iit-bbsr.vercel.app](https://web-hackathon-iit-bbsr.vercel.app)
- 🚀 **Live Backend API (Render)**: [https://cit-scheduling-api.onrender.com](https://cit-scheduling-api.onrender.com)
- 📖 **Interactive Swagger API Docs**: [https://cit-scheduling-api.onrender.com/docs](https://cit-scheduling-api.onrender.com/docs)
- 💻 **GitHub Repository**: [https://github.com/Kanchan-ai05/Web-Hackathon-IIT-BBSR](https://github.com/Kanchan-ai05/Web-Hackathon-IIT-BBSR)

---

## 🏛️ System Architecture

```
                  ┌──────────────────────────────────────────────┐
                  │            Next.js + Tailwind UI             │
                  │  (Timetable Grid, Bookings, Admin Dashboard)  │
                  └──────────────────────┬───────────────────────┘
                                         │ REST API / JWT
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │               FastAPI Backend                │
                  │  - RBAC Middleware (Admin, Coord, Faculty,   │
                  │    Club Rep)                                 │
                  │  - Audit Logger                              │
                  │  - Dynamic Dataset Loader & Reset            │
                  └──────┬───────────────────────────────┬───────┘
                         │                               │
                         ▼                               ▼
       ┌──────────────────────────────────┐   ┌──────────────────────────────┐
       │   backend/validator.py           │   │    OR-Tools CP-SAT Solver    │
       │   (Pure Python, 0% LLM)          │   │  (Timetable, Exam & Booking  │
       │   - 13 Hard Constraint Rules     │   │   Optimizer)                 │
       │   - 6 Soft Penalty Functions     │   └──────────────────────────────┘
       │   - Booking Priority Checker     │
       └─────────────────┬────────────────┘
                         ▼
       ┌──────────────────────────────────┐
       │     SQLite Relational Database   │
       │   (cit_schedule.db / SQLAlchemy) │
       └──────────────────────────────────┘
```

---

## 🚀 Tech Stack

- **Frontend**: Next.js 14+ (App Router), React, Tailwind CSS, Lucide Icons
- **Backend**: FastAPI (Python 3.10+), Pydantic v2, SQLAlchemy ORM
- **Constraint Solver**: Google OR-Tools (CP-SAT)
- **Database**: SQLite (`cit_schedule.db`)
- **Security & RBAC**: JWT (HMAC-SHA256) + bcrypt password hashing

---

## 🔑 Demo Accounts

The system comes pre-seeded with 4 role-based demo accounts:

| Role | Email | Password | Access & Capabilities |
| :--- | :--- | :--- | :--- |
| **Admin (Dean's Office)** | `admin@cit.edu` | `Admin@123` | Full control: generate timetables, upload dataset, reset demo data, approve timetable changes, view audit logs. |
| **Department Coordinator** | `coordinator@cit.edu` | `Coord@123` | Request session changes for department, book departmental venues, approve lab bookings. |
| **Faculty** | `faculty@cit.edu` | `Faculty@123` | View personal timetable, mark unavailability, submit rescheduling requests. |
| **Club Representative** | `club@cit.edu` | `Club@123` | Submit & cancel venue booking requests for tech fest (Spectra '27) & club activities. |

---

## 📋 Hard Constraints Enforced (Zero Tolerance)

All schedules and bookings are validated strictly by `backend/validator.py`:
1. **No Faculty Clash**: A faculty member cannot be in two places simultaneously.
2. **No Student Group Clash**: A student group cannot attend two classes simultaneously (combined lectures count for all enrolled groups; sessions in the same elective basket slot run concurrently without mutual clash).
3. **No Room Clash**: A room cannot hold two sessions or bookings concurrently.
4. **Room Capacity**: Session size $\le$ room capacity. **Exam room capacity is halved** ($\lfloor \text{capacity}/2 \rfloor$).
5. **Room Type Matching**: Lab sessions only scheduled in matching lab facilities (`lab_cs`, `lab_elec`, `lab_phy`, `workshop`, `lab_civil`).
6. **Faculty Unavailability**: Scheduled sessions strictly respect faculty unavailability windows.
7. **Room Unavailability**: Scheduled sessions strictly respect room maintenance windows (e.g., LH-4 Thursday ceiling repair).
8. **Lunch Break**: No classes can cross lunch (13:00–14:00, between P5 and P6).
9. **3-Hour Lab Restriction**: 3-hour labs only allowed in `P2–P4` (09:00–12:00) or `P6–P8` (14:00–17:00).
10. **Accessibility Compliance**: Sessions requiring accessibility (e.g. ME-2 or Dr. Abhishek Rout) must be assigned wheelchair-accessible rooms.
11. **Elective Basket Alignment**: All elective sessions for the same basket (e.g. `OEB-1`, `OEB-2`, `OEB-3`) run at the exact same day and period.
12. **Faculty Daily Teaching Cap**: Maximum 4 teaching hours per faculty per day.
13. **Fixed Slot Integrity**: Sessions with predefined fixed slots remain locked to those slots.
14. **Booking Integrity**: Approved venue bookings cannot overlap with academic classes or other bookings in the same room.

---

## 🛠️ Setup & Running Locally

### 1. Backend Setup
```powershell
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python -m app.loader
uvicorn app.main:app --reload --port 8000
```
API Documentation will be live at: `http://localhost:8000/docs`

### 2. Frontend Setup
```powershell
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## ⚡ Generating Schedule Exports & Official Validation

To run the complete end-to-end pipeline (data ingestion $\rightarrow$ CP-SAT timetable generation $\rightarrow$ midsem exam scheduling $\rightarrow$ Spectra venue booking resolution $\rightarrow$ sample disruption rescheduling $\rightarrow$ official validation) without any hand editing:

```powershell
python scripts/generate_exports.py
```

### Official Python Validator CLI
You can run the official pure-Python validator independently on any generated file:

```powershell
# Validate base schedule (189 sessions, 41 exams, 25 bookings)
python validator.py exports/schedule.json data/cit_public.json

# Validate disrupted schedule (with minimal moves <= 5)
python validator.py exports/schedule_after.json data/cit_public.json data/sample_disruption.json
```

Validator Output:
```
============================================================
   CIT OFFICIAL TIMETABLE & VENUE VALIDATOR (PURE PYTHON)   
============================================================
Target File:      exports/schedule.json
Schedule Valid:   True
Hard Violations:  0
Soft Penalty:     1300
Booking Score:    136
============================================================
```

---

## 🧪 Running Automated Tests

Run the complete backend test suite (55 test cases across 7 test modules):
```powershell
$env:PYTHONPATH="."
pytest backend/tests -v
```
All 55 tests pass 100%:
- `test_auth.py`: 6 test cases (JWT login for all 4 roles, invalid password rejection, RBAC enforcement).
- `test_loader.py`: 3 test cases (database loading counts, admin dataset upload, admin demo reset).
- `test_validator.py`: 16 test cases (all 13 hard constraints, elective basket synchronization, soft penalty metrics).
- `test_solver.py`: 3 test cases (189 sessions + 41 midsem exams placement, exports/schedule.json verification, manual assignment clash rejection).
- `test_booking_engine.py`: 4 test cases (priority conflict resolution, quota caps, self-approval prevention, batch evaluation).
- `test_rescheduler.py`: 2 test cases (minimal moves <= 5 on sample disruption, exports/schedule_after.json generation).
- `test_nlp_safety.py`: 21 test cases (20 tricky English & Hinglish prompts, prompt injection neutralization, anti-bypass role enforcement).

---

## ☁️ Production Cloud Deployment

### 1. Render Blueprint (Recommended)
This repository includes a pre-configured `render.yaml` blueprint defining:
- **Backend API**: Python 3.10 with Uvicorn ASGI server and a persistent 1 GB SQLite disk mount (`/data/cit_schedule.db`).
- **Frontend UI**: Node 20 Next.js 14 production service.

To deploy:
1. Connect this repository to [Render.com](https://render.com).
2. Choose **New > Blueprint** and select the repository.
3. Render automatically provisions both services with zero configuration.

### 2. Docker Deployment
A standalone `Dockerfile` is provided for containerized cloud hosts (AWS ECS, Google Cloud Run, Railway, DigitalOcean):
```powershell
# Build container image
docker build -t cit-scheduling-api .

# Run container on port 8000
docker run -p 8000:8000 -e JWT_SECRET="your-production-secret" cit-scheduling-api
```

### 3. Vercel Frontend Deployment
1. Import the `/frontend` directory to [Vercel](https://vercel.com).
2. Set the Environment Variable:
   - `NEXT_PUBLIC_API_URL`: `https://your-backend-api-url.onrender.com`
3. Click Deploy.

### 4. Cold-Start Prevention & Health Checks
Free-tier cloud hosts (e.g., Render free web service) sleep after 15 minutes of inactivity.
- **Healthcheck URLs**: `GET /health` and `GET /api/health` return HTTP 200:
  ```json
  {"status": "healthy", "service": "cit-scheduling-backend", "institute": "Chilika Institute of Technology"}
  ```
- **Keep-Alive**: Set up a free 10-minute ping using [UptimeRobot](https://uptimerobot.com) or GitHub Actions cron to ping `https://<backend-url>/health` to eliminate cold-start delays during evaluation.

---

## 📁 Generated Exports
The platform generates and exports valid schedules conforming to the official competition specification:
- `exports/schedule.json`: Contains 189 weekly sessions + 41 midsem exams with **0 hard violations**.
- `exports/schedule_after.json`: Generated upon disruption rescheduling with **minimal moves ($\le 5$)** and **0 hard violations**.

---

## ⚠️ Known Limitations & Design Decisions
- The academic timetable covers recurring weekly sessions across Mon–Fri (P1–P9) and evening event slots (P10–P13).
- SQLite is utilized for self-contained, reproducible, zero-setup local execution. For multi-datacenter deployments, PostgreSQL with row-level locks is recommended.
- Visiting faculty (Prof. Vikram Rao, F08) teaches 3 lectures of CS204 and is on campus exclusively on Tuesday and Thursday; the course daily repeat is minimized via soft penalty objective (+10) to permit clash-free feasibility.


