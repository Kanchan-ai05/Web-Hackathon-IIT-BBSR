# CIT Nexus – Smart Campus Intelligence Platform

An advanced, intelligent institutional management and scheduling ecosystem engineered for **Chilika Institute of Technology (CIT)**. Powered by a **dual-datastore architecture (SQLite + MongoDB)**, an **OR-Tools CP-SAT mathematical optimization solver**, a **100% deterministic pure-Python validator (0% LLM)**, and a modern **Next.js 14 App Router** frontend.

---

## 🌐 Live Deployed Platform & Links

- 🖥️ **Live Web Platform (GitHub Pages)**: [https://kanchan-ai05.github.io/Web-Hackathon-IIT-BBSR/](https://kanchan-ai05.github.io/Web-Hackathon-IIT-BBSR/)
- ⚡ **Live Web Platform (Vercel)**: [https://web-hackathon-iit-bbsr.vercel.app](https://web-hackathon-iit-bbsr.vercel.app)
- 🚀 **Live Backend API (Render)**: [https://cit-scheduling-api.onrender.com](https://cit-scheduling-api.onrender.com)
- 📖 **Interactive Swagger API Docs**: [https://cit-scheduling-api.onrender.com/docs](https://cit-scheduling-api.onrender.com/docs)
- 💻 **GitHub Repository**: [https://github.com/Kanchan-ai05/Web-Hackathon-IIT-BBSR](https://github.com/Kanchan-ai05/Web-Hackathon-IIT-BBSR)

---

## 🏛️ System Architecture

```
                             CIT Nexus Unified Platform
                                        │
        ┌───────────────────────────────┴───────────────────────────────┐
        ▼                                                               ▼
┌──────────────────────────────┐                         ┌──────────────────────────────┐
│    Next.js 14 + Tailwind UI  │                         │       FastAPI Backend        │
│  - 20 Static / Dynamic Pages │                         │  - 19 Specialized Routers    │
│  - Categorized Nav Dropdowns │                         │  - RBAC & JWT Middleware     │
│  - Live API Switcher Modal   │                         │  - Audit Logging System      │
└───────────────┬──────────────┘                         └──────────────┬───────────────┘
                │                                                       │
                │ REST API / JWT Authentication                         │
                └───────────────────────────────┬───────────────────────┘
                                                │
                ┌───────────────────────────────┴───────────────────────────────┐
                ▼                                                               ▼
┌──────────────────────────────────────────────┐         ┌──────────────────────────────────────────────┐
│          Relational Core (SQLite)            │         │        Document Datastore (MongoDB)          │
│  - Rooms, Faculty, Cohorts, Courses          │         │  - 2D Spatial Nodes & Navigation             │
│  - Sessions, TimetableSlots, Exams           │         │  - QR Check-In & Headcount Records           │
│  - Bookings, Unavailabilities, AuditLogs     │         │  - Specialized Lab Hardware Registry         │
└──────────────────────┬───────────────────────┘         │  - Maintenance Tickets & Green Energy        │
                       │                                 │  - Emergency Lockdowns & Contingency Plans   │
                       ▼                                 │  - Resilient File Fallback (`fallback.json`) │
┌──────────────────────────────────────────────┐         └──────────────────────────────────────────────┘
│    Google OR-Tools CP-SAT Solver             │
│  - Stage 1: Feasible Slot Placement          │
│  - Stage 2: Soft Penalty Minimisation        │
│  - Warm-Start Minimal-Moves Rescheduling     │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│     Deterministic Validator (0% LLM)         │
│  - 13 Hard Constraint Rules                  │
│  - 6 Soft Penalty Functions                  │
│  - Priority Order Enforcement                │
└──────────────────────────────────────────────┘
```

---

## 🚀 Core Platform Modules

### 1. Campus Intelligence Dashboard (`/analytics`)
- **Room Utilisation Analytics**: Total campus room hours, available vs occupied distribution, utilisation percentages, high-demand vs underutilised venues.
- **Faculty Workload Statistics**: Teaching hours per professor, daily workload distribution, overload/underload indicators.
- **Course & Cohort Schedules**: Weekly academic load across student groups and departments.
- **Booking Reports & Exports**: Status distribution (Approved, Alternative, Rejected, Cancelled) with 1-click **CSV exports**.

### 2. Predictive Conflict Monitoring (`/conflicts`)
- **7 Conflict Detection Classes**: Real-time detection of faculty overlaps, student group clashes, room overlaps, capacity violations, room-type mismatches, faculty leave conflicts, and room maintenance conflicts.
- **Deterministic Risk Scoring**: Categorised as **Low**, **Medium**, **High**, or **Critical**.
- **Root Cause & Alternative Recommendations**: Explains the exact reason behind every detected conflict and proposes concrete clash-free alternative venues and time slots.

### 3. Intelligent Rescheduling (`/disruptions`)
- **Disruption Recovery**: Handles faculty leave and emergency room maintenance with a warm-start CP-SAT solver.
- **Minimal Displacement**: Constrained with displacement penalties ($2000 \times \text{moved\_sessions}$) guaranteeing $\le 5$ moved sessions with 0 hard clashes.
- **Side-by-Side Diff View**: Visualises before-and-after timetable comparison with highlighted changes.
- **Mandatory Admin Sign-Off**: Requires authorized Dean/Admin approval before committing or publishing schedule alterations.

### 4. AI Campus Copilot (`/copilot`)
- **Bilingual Natural-Language Intake**: Accepts user queries in **English** and **Hinglish** (e.g. *"Spectra fest ke liye Room 01 chahiye Wednesday P10-P11 100 students"*).
- **Fact-Grounded Querying**: Answers questions on room allocations, teacher schedules, lab availability, and campus facilities.
- **Zero-Hallucination Boundary**: All scheduling and booking suggestions must pass pure-Python deterministic validation (`validator.py`). An LLM is **never allowed** to verify correctness or write directly to the database.

### 5. Smart Venue Recommendations (`/events`, `/bookings`)
- **Multi-Factor Matching**: Recommends optimal venues based on attendance size, room type, feature requirements, wheelchair accessibility, and zero-clash timetable windows.
- **Capacity Tightness Ranking**: Ranks venues by smallest sufficient capacity to eliminate empty seat waste.

### 6. Smart Maintenance Management (`/maintenance`)
- **Defect Reporting**: Reports infrastructure issues across HVAC, Electrical, AV / Projector, Structural, and Plumbing.
- **Automated Scheduling Sync**: When room closure is required, **automatically registers `RoomUnavailability` in the database**, blocking the venue in the scheduler; upon repair completion, automatically restores the room.

### 7. Emergency Campus Management (`/emergency`)
- **Lockdown Protocol**: Declares whole-building or room-specific emergency closures (weather alerts, power cuts, hazardous repairs).
- **Impact Analysis**: Identifies all affected classes, student cohorts, and faculty members.
- **Automated Contingency Relocation**: Generates safe alternative placements in unaffected venues of matching capacity.
- **Strict Approval Gate**: Requires authorized Dean/Admin sign-off before committing contingency schedules to the live timetable.

### 8. Additional Ecosystem Capabilities
- **Smart Campus Navigation (`/navigation`)**: Interactive vector SVG 2D campus map, 4-floor switcher, wheelchair-accessible route generator.
- **Smart Classroom Check-In (`/checkin`)**: QR code attendance simulator, real-time headcount vs capacity tracking, 15-minute grace-period monitor, and authorized unused room release.
- **Academic Calendar (`/calendar`)**: Unified multi-source calendar (classes, midsem exams, club events, holidays) with departmental filters and clash warnings.
- **Lab & Equipment Management (`/equipment`)**: Apparatus catalog (NVIDIA DGX A100 AI rigs, 1GHz oscilloscopes, 3D printers, CNCs) with timetable clash prevention.
- **Green Campus Analytics (`/green`)**: Hourly power draw modeling ($0.035\text{ kW/seat}$ HVAC, $0.008\text{ kW/seat}$ lights), empty classroom waste calculation, carbon emissions ($0.72\text{ kg CO}_2\text{/kWh}$), and automated eco-directives.
- **Campus Command Centre (`/command`)**: Executive console providing live occupancy rate, active conflict summary, pending approvals queue, and emergency alert ticker.
- **Explainable Decisions Assistant (`/explain`)**: 5-pillar mathematical and constraint proofs for why any room/slot was chosen or rejected.

---

## 👥 Demo Accounts (Pre-Seeded)

The platform includes 4 pre-seeded role accounts accessible via the 1-click role switcher in the UI:

| Role | Email | Password | Permissions |
|---|---|---|---|
| **Dean's Office (Admin)** | `admin@cit.edu` | `Admin@123` | Full access: generate timetable, approve disruptions, lock down buildings, reset data, upload datasets. |
| **Dept Coordinator (CSE)** | `coordinator@cit.edu` | `Coord@123` | Approve department bookings & events, move classes with validator check, view audit logs. |
| **Dr. Rohit Sahoo (Faculty)** | `faculty@cit.edu` | `Faculty@123` | Request guest lectures, view teaching workload, reserve lab apparatus, QR check-in. |
| **Spectra Tech Fest (Club Rep)**| `club@cit.edu` | `Club@123` | Request club events, propose hackathons, view venue recommendations. |

---

## 🛠️ Installation & Setup Guide

### Prerequisites
- Python 3.10+
- Node.js 18+ (tested with v22 LTS)
- MongoDB (Optional – embedded fallback activates automatically if MongoDB is offline)

### 1. Backend Setup
```powershell
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1   # Windows PowerShell
# source venv/bin/activate    # Linux / macOS

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server on port 8000
uvicorn app.main:app --reload --port 8000
```
Backend API will be accessible at: `http://localhost:8000`  
Interactive Swagger API documentation: `http://localhost:8000/docs`

### 2. Frontend Setup
```powershell
# Navigate to frontend directory
cd frontend

# Install npm dependencies
npm install

# Start Next.js development server
npm run dev
```
Frontend will be accessible at: `http://localhost:3000`

### 3. Running with MongoDB
By default, the platform connects to `mongodb://localhost:27017/cit_smart_campus`. If a local MongoDB instance is running, it connects automatically. If MongoDB is not installed, the platform automatically uses the persistent JSON datastore at `data/mongo_fallback.json` with 100% feature availability.

---

## 🧪 Testing & Verification

### Run Full Pytest Suite (91 Tests)
```powershell
pytest backend/tests/ -v
```
All **91 tests pass with 100% green status**, covering:
- CP-SAT timetable generation (189 sessions, 0 hard violations)
- Midsem exam solver (41 exams, halved capacity)
- Rescheduling minimal moves benchmark ($\le 5$ moves)
- 7 Conflict monitor classes & predictive risk ratings
- 5-Pillar explainable scheduling proofs
- 20 Tricky NLP prompt safety and anti-bypass tests
- 11 Smart campus ecosystem module integration tests

### Run Official Validator
```powershell
python scripts/generate_exports.py
python validator.py --schedule exports/schedule.json
python validator.py --schedule exports/schedule_after.json
```
Both outputs verify **0 hard violations**, clean booking priority order, and optimal soft penalties.

### TypeScript & Static Export Compilation
```powershell
cd frontend
npx tsc --noEmit
npm run build
```
Type checks report **0 errors** and Next.js builds **20/20 static pages cleanly**.

---

## 📚 Complete Documentation Suite

For comprehensive technical documentation, refer to:
- [`PROJECT_DOCUMENTATION.md`](file:///c:/Users/KANCHAN%20SHAW/Antigravity/PROJECT_DOCUMENTATION.md) – Detailed project explanation, problem statement, optimization formulation, and feature walk-through.
- [`SYSTEM_ARCHITECTURE.md`](file:///c:/Users/KANCHAN%20SHAW/Antigravity/SYSTEM_ARCHITECTURE.md) – Architectural diagrams, dual-datastore design, CP-SAT solver internals, and security boundary.
- [`API_DOCUMENTATION.md`](file:///c:/Users/KANCHAN%20SHAW/Antigravity/API_DOCUMENTATION.md) – Complete reference of all 19 backend routers, request/response schemas, and status codes.
- [`DATABASE_SCHEMA.md`](file:///c:/Users/KANCHAN%20SHAW/Antigravity/DATABASE_SCHEMA.md) – Relational SQLite tables, MongoDB collections, entity relationships, and indexes.
- [`INSTALLATION_GUIDE.md`](file:///c:/Users/KANCHAN%20SHAW/Antigravity/INSTALLATION_GUIDE.md) – Step-by-step local, Docker, and cloud deployment instructions.
- [`AI_USAGE.md`](file:///c:/Users/KANCHAN%20SHAW/Antigravity/AI_USAGE.md) – AI usage declaration, supported LLM providers, zero-hallucination validation boundary, and prompt execution logs.
- [`THIRD_PARTY.md`](file:///c:/Users/KANCHAN%20SHAW/Antigravity/THIRD_PARTY.md) – Full inventory of backend and frontend libraries, versions, and licenses.
- [`TESTING.md`](file:///c:/Users/KANCHAN%20SHAW/Antigravity/TESTING.md) – Test plan, test cases, automated test commands, validation results, and edge case coverage.

---

## 📄 License
This project is developed for the Chilika Institute of Technology (CIT) Campus Scheduling Challenge. All domain logic, constraint models, solvers, and UI components are original implementations.
