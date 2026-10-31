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

Run the backend test suite:
```powershell
pytest backend/tests/test_loader.py -v
pytest backend/tests/test_validator.py -v
pytest backend/tests/test_auth.py -v
```

---

## ⚠️ Known Limitations
- The current implementation targets single-week recurring timetables with event-only evening slots (P10–P13).
- SQLite is utilized for self-contained, zero-setup testing. For high concurrency, PostgreSQL is recommended.
