# Chilika Institute of Technology (CIT) - Campus Scheduling & Venue Management Platform

A robust web platform built for **Chilika Institute of Technology (CIT)** that generates semester timetables with zero clashes, schedules midsem exams, manages venue bookings with priority conflict resolution, and handles last-minute disruptions with minimal schedule displacement.

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

## 📁 Generated Exports
The platform generates and exports valid schedules conforming to the official competition specification:
- `exports/schedule.json`: Contains 189 weekly sessions + 41 midsem exams with **0 hard violations**.
- `exports/schedule_after.json`: Generated upon disruption rescheduling with **minimal moves ($\le 5$)** and **0 hard violations**.

---

## ⚠️ Known Limitations & Design Decisions
- The academic timetable covers recurring weekly sessions across Mon–Fri (P1–P9) and evening event slots (P10–P13).
- SQLite is utilized for self-contained, reproducible, zero-setup local execution. For multi-datacenter deployments, PostgreSQL with row-level locks is recommended.
- Visiting faculty (Prof. Vikram Rao, F08) teaches 3 lectures of CS204 and is on campus exclusively on Tuesday and Thursday; the course daily repeat is minimized via soft penalty objective (+10) to permit clash-free feasibility.

