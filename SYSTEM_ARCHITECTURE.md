# CIT Nexus – System Architecture Specification

This document provides a comprehensive architectural breakdown of **CIT Nexus – Smart Campus Intelligence Platform**, describing component topology, datastore design, mathematical solver subsystems, AI boundaries, and security infrastructure.

---

## 1. High-Level System Architecture

```
                                  USER BROWSER / CLIENT
          (Chrome, Firefox, Safari, Edge, Mobile Responsive Viewports)
                                        │
                                        ▼ HTTPS
      ┌───────────────────────────────────────────────────────────────────┐
      │                     FRONTEND APPLICATION LAYER                    │
      │   Next.js 14 (App Router) + React 18 + Tailwind CSS + Lucide Icons│
      │                                                                   │
      │   ├── Timetable & Exams Grid (`/timetable`)                       │
      │   ├── Venue Bookings Hub & NLP Intake (`/bookings`)               │
      │   ├── Disruption Minimal-Moves Engine (`/disruptions`)            │
      │   ├── Conflict Monitoring Radar (`/conflicts`)                    │
      │   ├── Campus Intelligence Dashboard (`/analytics`)                │
      │   ├── Explainable Decisions Assistant (`/explain`)                │
      │   ├── 10 Smart Campus Management Ecosystem Pages                 │
      │   └── Dynamic Backend API Switcher Modal                          │
      └─────────────────────────────────┬─────────────────────────────────┘
                                        │ REST API / JSON / JWT Bearer
                                        ▼
      ┌───────────────────────────────────────────────────────────────────┐
      │                     BACKEND API GATEWAY LAYER                     │
      │               FastAPI (Python 3.10+) + Uvicorn ASGI               │
      │                                                                   │
      │   ├── CORS & Security Headers Middleware                          │
      │   ├── JWT Authentication & Role-Based Access Control (RBAC)       │
      │   ├── Institutional Audit Logger (`/api/admin/audit-logs`)        │
      │   └── 19 Domain-Specific Routers                                  │
      └───────┬─────────────────────────┬─────────────────────────┬───────┘
              │                         │                         │
              ▼                         ▼                         ▼
┌──────────────────────────┐ ┌──────────────────────────┐ ┌──────────────────────────┐
│   CONSTRAINT SOLVER &    │ │      RELATIONAL CORE     │ │   DOCUMENT DATASTORE     │
│    VALIDATION ENGINE     │ │      (SQLite / SQLA)     │ │        (MongoDB)         │
│                          │ │                          │ │                          │
│ ├── validator.py         │ │ ├── Rooms & Equipment    │ │ ├── Campus Navigation    │
│ │   (13 hard, 6 soft)    │ │ ├── Faculty & Leaves     │ │ ├── QR Check-In Sessions │
│ ├── solver.py            │ │ ├── Cohorts & Courses    │ │ ├── Lab Apparatus Reg    │
│ │   (OR-Tools CP-SAT)    │ │ ├── Weekly Sessions      │ │ ├── Maintenance Tickets  │
│ ├── exam_scheduler.py    │ │ ├── TimetableSlots       │ │ ├── Calendar Milestones  │
│ │   (Midsem placement)   │ │ ├── Midsem Exams         │ │ ├── Green Energy Profiles│
│ └── rescheduler.py       │ │ ├── Venue Bookings       │ │ ├── Emergency Lockdowns  │
│     (Warm-start solver)  │ │ └── System Users         │ │ └── Resilient Fallback   │
└──────────────────────────┘ └──────────────────────────┘ └──────────────────────────┘
              │                                                           ▲
              ▼                                                           │
┌─────────────────────────────────────────────────────────────────────────┴───────┐
│                           AI & LLM SERVICE LAYER                                │
│        Google Gemini 2.0 / OpenAI GPT-4o-mini + Deterministic Regex Fallback    │
│                                                                                 │
│  - Natural Language & Hinglish Booking Intake (`backend/nlp_service.py`)         │
│  - Conversational Campus Copilot (`backend/app/routers/copilot_router.py`)      │
│  - Explainable Decision Narrative Generator (`backend/explainability_service.py`)│
│  - Strict Sandbox: Zero direct DB mutation, pure-Python validator required     │
│  - Execution Logger: Appends all prompts to `prompts/llm_execution_log.jsonl`   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Frontend Layer (Next.js 14 App Router)

The frontend is built with Next.js 14 using the App Router architecture, supporting both **static export** (`next export` / GitHub Pages) and **dynamic SSR / rewrites mode** for full-stack deployments.

### 2.1 State Management & Context Architecture
1. **`AuthContext.tsx`**:
   - Manages user sessions, active JWT tokens, role claims (`admin`, `department_coordinator`, `faculty`, `club`), and quick demo role switching.
   - Houses the **Dynamic API Connection Manager**: probes `/health` endpoint, calculates round-trip latency in milliseconds, and switches between local backend (`http://localhost:8000`) and cloud backend (`https://cit-scheduling-api.onrender.com`).
2. **`AiContext.tsx`**:
   - Manages user-supplied Google Gemini and OpenAI API keys stored securely in client-side `localStorage`.
   - Handles LLM provider selection and API key validation.

### 2.2 Navigation Hierarchy
The frontend navigation (`Navbar.tsx`) is organized into 3 multi-level dropdown menus:
1. **Timetable & Bookings**: Overview (`/`), Timetable & Exams (`/timetable`), Explain Decisions (`/explain`), Venue Bookings (`/bookings`), Conflict Monitor (`/conflicts`), Disruption Engine (`/disruptions`).
2. **Smart Operations**: Campus Navigation (`/navigation`), Smart QR Check-In (`/checkin`), Academic Calendar (`/calendar`), Lab & Equipment (`/equipment`), Events Hub (`/events`), Maintenance Hub (`/maintenance`).
3. **Command & AI**: Campus Command Centre (`/command`), AI Campus Copilot (`/copilot`), Green Analytics (`/green`), Emergency Protocols (`/emergency`), Campus Analytics (`/analytics`).

---

## 3. Backend API Gateway & Router Architecture

The backend is built with **FastAPI** (Python 3.10+), organized into 19 modular routers under `backend/app/routers/`:

| Router | Prefix | Responsibilities |
|---|---|---|
| `timetable_router.py` | `/api/timetable` | Weekly schedule generation, midsem exam generation, manual slot moves, session domain queries, exports. |
| `booking_router.py` | `/api/booking` | Venue booking intake, batch priority evaluation, alternative slot searches, immediate cancellation slot release. |
| `conflict_router.py` | `/api/conflict` | Real-time analysis of the 7 conflict classes, room risk ratings, and predictive booking risk scores. |
| `analytics_router.py` | `/api/analytics` | Room utilisation metrics, faculty workload statistics, student schedules, and CSV export generation. |
| `explain_router.py` | `/api/explain` | 5-pillar mathematical proofs for session allocations, room comparisons, and booking decisions. |
| `navigation_router.py` | `/api/navigation` | Complex directory, floor rooms query, and turn-by-turn wheelchair-accessible routing. |
| `checkin_router.py` | `/api/checkin` | Period active sessions, QR token generation, check-in verification, and authorized unused room release. |
| `equipment_router.py` | `/api/equipment` | Lab hardware registry, clash-checked apparatus reservations, and maintenance logging. |
| `events_router.py` | `/api/events` | Event proposal intake, smart venue & hardware recommendations, attendee registration, and approval workflow. |
| `maintenance_router.py`| `/api/maintenance` | Issue reporting, technician assignment, resolution, and automatic `RoomUnavailability` scheduling injection. |
| `calendar_router.py` | `/api/calendar` | Unified multi-source calendar aggregation (classes, exams, events, holidays), and clash warnings. |
| `green_router.py` | `/api/green` | Deterministic power modeling (HVAC and lighting kW), idle room waste analysis, and carbon reduction metrics. |
| `command_router.py` | `/api/command` | Consolidated executive operational pulse (occupancy, conflicts, alerts, pending approvals). |
| `emergency_router.py` | `/api/emergency` | Lockdown declarations, affected roster impact calculations, contingency relocate proposals, and admin approval. |
| `copilot_router.py` | `/api/copilot` | Natural-language query engine grounded in SQLite and MongoDB facts. |
| `ai_router.py` | `/api/ai` | Natural language and Hinglish booking request parsing, timetable Q&A, and key connectivity verification. |
| `admin_router.py` | `/api/admin` | Immutable audit logging, dynamic dataset upload replacement, and demo data factory reset. |
| `auth_router.py` | `/api/auth` | JWT token issuance, login validation, current user profile (`/me`), and demo account listings. |

---

## 4. Dual-Datastore Architecture (SQLite + MongoDB)

### 4.1 SQLite Relational Core
- **Location**: `cit_schedule.db` (locally and on persistent Render disk mount `/data/cit_schedule.db`).
- **ORM**: SQLAlchemy with declarative base models in `backend/app/models.py`.
- **Purpose**: Strictly enforces relational integrity for timetable slots, faculty constraints, exam assignments, and booking requests. Guarantees deterministic, transactional zero-hard-clash scheduling.

### 4.2 MongoDB Operational Document Datastore
- **Connection URI**: `mongodb://localhost:27017` / Database: `cit_smart_campus`.
- **Driver**: PyMongo (`MongoClient`) with connection pooling.
- **Embedded Resilient Fallback**: Implemented in `backend/app/mongodb.py` (`MongoCollectionWrapper` & `FallbackCollection`). If a live MongoDB server is not detected or drops offline, the system seamlessly redirects all document queries to an embedded, thread-safe JSON-backed datastore (`data/mongo_fallback.json`), ensuring 100% operational uptime across all environments.

---

## 5. Constraint Solving & Mathematical Optimization Layer

### 5.1 Google OR-Tools CP-SAT Solver (`backend/solver.py`)
- Employs Integer Linear Programming and Constraint Programming with SAT techniques.
- Precomputes domains for 189 sessions based on room types, student sizes, faculty avoid times, and accessibility.
- Stage 1 finds a feasible schedule satisfying all 13 hard rules in $< 10$ seconds.
- Stage 2 minimizes soft penalty weights (P9 period avoidance, cohort idle gap elimination, faculty avoid times, and underutilised room penalties).

### 5.2 Deterministic Validator (`backend/validator.py`)
- Independent, standalone pure-Python validation module (0% LLM).
- Verifies every proposed schedule against the 13 institutional hard constraint rules.
- Rejects any illegal move with exact rule violation codes and clashing entity IDs.

### 5.3 Minimal-Displacement Disruption Engine (`backend/rescheduler.py`)
- Solves emergency faculty sick leaves and room maintenance closures.
- Formulates a warm-start CP-SAT model with an objective penalty of $2000 \times \text{moved\_sessions}$, ensuring $\le 5$ moved sessions with zero hard violations.

---

## 6. AI & Copilot Layer Architecture

### 6.1 Strict Zero-Hallucination Sandbox
- All AI operations route through `backend/app/ai_service.py` and `backend/nlp_service.py`.
- **The LLM is strictly prohibited from verifying schedule validity**.
- All parsed booking forms and proposed relocations are fed into `backend/validator.py` and `backend/booking_engine.py` before presenting to the user.
- No database write can occur without explicit user confirmation and valid JWT authentication.

### 6.2 Prompt & Execution Auditing
- Every execution of an LLM prompt is logged to `prompts/llm_execution_log.jsonl` with timestamps, model name, prompt text, parsed response, and latency.

---

## 7. Security, Authentication & Role-Based Access Control (RBAC)

```
+-----------------------------------------------------------------------------------------+
|                                CIT NEXUS AUTHENTICATION FLOW                            |
+-----------------------------------------------------------------------------------------+
|                                                                                         |
|   Client Frontend (Next.js)                                                             |
|         |                                                                               |
|         +---> [Slide-In AuthDrawer] (Sign In / Register / Password Recovery)            |
|         |           |                                                                   |
|         |           v                                                                   |
|         |     POST /api/auth/register (Enforces non-admin role restriction)             |
|         |     POST /api/auth/login    (Bcrypt verification)                             |
|         |           |                                                                   |
|         |           v                                                                   |
|         |     Issues Signed JWT Bearer Token (24h expiry, email + role claims)          |
|         |                                                                               |
|         v                                                                               |
|   Protected API Requests (`Authorization: Bearer <token>`)                              |
|         |                                                                               |
|         v                                                                               |
|   [FastAPI RBAC Middleware: `require_role([...])`]                                      |
|         |                                                                               |
|   +-----+---------------------------------------------------------------+               |
|   |                                                                     |               |
|   |-- Admin: Full campus management, timetable solves, user directory   |               |
|   |-- Faculty: Personal teaching schedule, venue booking fast-track     |               |
|   |-- Student: Cohort timetable, room locator, QR lecture check-in      |               |
|   |-- Coordinator: Venue requests, quota meter, campus events hub       |               |
|   |                                                                     |               |
|   +---------------------------------------------------------------------+               |
|         |                                                                               |
|         v                                                                               |
|   [Immutable Security Audit Log: `AuditLog` table] (Record login, role updates, etc.)  |
|                                                                                         |
+-----------------------------------------------------------------------------------------+
```

1. **Password Encryption & Storage**: All passwords hashed using Bcrypt with cryptographic salting via `passlib[bcrypt]`. Passwords are never stored in plaintext or logged.
2. **Session Security & Stateless JWT**: Stateless JSON Web Tokens carrying `sub` (email), `role`, `name`, and `exp` claims signed via HMAC-SHA256 (`JWT_SECRET`). 24-hour expiration (`ACCESS_TOKEN_EXPIRE_MINUTES = 1440`).
3. **Anti-Privilege Escalation Safeguard**: Public registration endpoints strictly forbid self-assigning the `admin` role (`HTTP 403 Forbidden`). Only authenticated Administrators can manage role permissions and promote users via `PATCH /api/auth/users/{user_id}/role`.
4. **Password Recovery Workflow**: Secure 32-character hexadecimal reset tokens with 30-minute expiration persisted in SQLite `password_reset_tokens` table.
5. **Role-Based Access Control (RBAC)**:
   - `admin`: Complete campus control, solve timetable, approve disruptions, lock down buildings, manage registered users and permissions.
   - `faculty`: View personal teaching schedule, request guest lectures, reserve lab apparatus, report maintenance defects.
   - `student`: View cohort class schedules, room locator with accessible routing, lecture QR check-in, exam dates.
   - `coordinator` / `club`: Submit auditorium/seminar hall booking requests, track weekly quota limits, event proposals.
6. **Immutable Audit Trail**: Security actions (`USER_LOGIN`, `USER_REGISTER`, `PASSWORD_RESET_REQUESTED`, `USER_ROLE_UPDATED`, `USER_DELETED`, `USER_LOGOUT`) are permanently committed to the `audit_logs` table.
