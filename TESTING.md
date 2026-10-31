# Comprehensive Testing Guide: CIT Nexus

This document details the complete testing strategy, test suites, validator execution, and quality assurance procedures for **CIT Nexus – Smart Campus Intelligence Platform**, strictly complying with the hackathon evaluation benchmarks.

---

## 1. Testing Strategy & Verification Pipeline

The CIT Nexus platform employs a multi-tiered verification architecture that guarantees mathematical correctness, deterministic constraint validation, data integrity, and frontend stability:

```
+-----------------------------------------------------------------------------------------+
|                               CIT NEXUS VERIFICATION PIPELINE                           |
+-----------------------------------------------------------------------------------------+
|                                                                                         |
|   1. FASTAPI & ENGINE UNIT/INTEGRATION TESTS (91 Tests)                                 |
|      pytest backend/tests/ -v                                                           |
|      --> Timetable solver, CP-SAT optimizer, disruption resolver, 10 ecosystem modules  |
|                                                                                         |
|   2. DETERMINISTIC HACKATHON VALIDATOR                                                  |
|      python validator.py --schedule exports/schedule.json                               |
|      python validator.py --schedule exports/schedule_after.json                         |
|      --> 0 hard violations guaranteed, soft penalty scored, minimal moves (<= 5)        |
|                                                                                         |
|   3. FRONTEND TYPE SYSTEM & PRODUCTION BUILD                                            |
|      cd frontend && npx tsc --noEmit && npm run build                                   |
|      --> Zero TypeScript errors, 20/20 static pages prerendered                         |
|                                                                                         |
+-----------------------------------------------------------------------------------------+
```

---

## 2. Test Execution Quick Reference

### Run the Full Backend Test Suite
```bash
# From workspace root
pytest backend/tests/ -v
```
**Expected Outcome**: `91 passed in ~150s` with 0 failures and 0 errors.

### Generate & Validate Official Hackathon Exports
```bash
# 1. Run pipeline script that generates exports/schedule.json and exports/schedule_after.json
python scripts/generate_exports.py

# 2. Validate clean baseline schedule
python validator.py --schedule exports/schedule.json

# 3. Validate disrupted and rescheduled schedule
python validator.py --schedule exports/schedule_after.json
```

### Run Frontend Static Typecheck and Build
```bash
cd frontend
npx tsc --noEmit
npm run build
```
**Expected Outcome**:
- `npx tsc --noEmit` exits with status 0 (no errors).
- `npm run build` compiles 20 static pages into `frontend/out/` with status 0.

---

## 3. Breakdown of Test Suites

### A. Core Timetable & Constraint Solver Suite (`backend/tests/test_timetable_pipeline.py`)
This test suite verifies the foundational Google OR-Tools CP-SAT scheduler, midsem exam generation, Spectra booking allocation, and the minimal-displacement disruption engine.

| Test Case | Scope & Description | Constraint Verified |
| :--- | :--- | :--- |
| `test_data_loader_integrity` | Verifies parser loads all 7 departments, 18 rooms, 32 faculty, 14 student groups | Dataset sanity |
| `test_hard_constraint_room_conflicts` | Asserts no two sessions occupy the same room in the same period | HC-1 (No room double-booking) |
| `test_hard_constraint_faculty_conflicts` | Asserts no instructor teaches two classes simultaneously | HC-2 (Faculty uniqueness) |
| `test_hard_constraint_student_group_conflicts` | Asserts no student group has overlapping lectures or labs | HC-3 (Student group uniqueness) |
| `test_hard_constraint_lunch_break_compliance` | Asserts periods 4 or 5 are reserved for lunch based on year | HC-4 (Mandatory lunch break) |
| `test_hard_constraint_room_capacity` | Asserts room capacity $\ge$ student group enrollment | HC-5 (Room capacity) |
| `test_hard_constraint_room_type_matching` | Asserts CS labs are assigned to Computer Labs, etc. | HC-6 (Room type match) |
| `test_midsem_exam_solver_distribution` | Validates 2 exams per day limit, 0 student clashes, proper room splits | Exam Schedule Correctness |
| `test_spectra_booking_optimization` | Asserts club bookings respect priorities and do not displace academic classes | Soft Score Maximization |
| `test_disruption_minimal_displacement` | Injects faculty leave & room closure; verifies moves $\le 5$ | Minimal-Move Engine ($\le 5$) |

### B. Smart Campus Ecosystem Modules Suite (`backend/tests/test_ecosystem_modules.py`)
This test suite validates all 10 extended ecosystem modules across the dual-database architecture (SQLite + MongoDB fallback).

| Module | Test Case | Functional Scope |
| :--- | :--- | :--- |
| **Navigation** | `test_campus_navigation_routing` | Dijkstra/A* pathfinding between buildings; ADA-compliant accessible paths |
| **Navigation** | `test_room_and_building_locator` | Room search by room number, department, floor, and equipment |
| **Check-In** | `test_qr_checkin_flow` | Token generation, geofenced QR check-in, attendee log creation |
| **Check-In** | `test_actual_utilisation_metrics` | Computed actual vs booked occupancy percentage |
| **Calendar** | `test_unified_academic_calendar` | Consolidated feed of classes, exams, holidays, and registered events |
| **Equipment** | `test_equipment_checkout_lifecycle` | Projector/mic reservation, inventory decrement, return verification |
| **Green Campus** | `test_energy_monitoring_metrics` | kWh usage computation, idle room detection, automated turn-off suggestions |
| **Maintenance** | `test_maintenance_lifecycle` | Problem report submission, status transition (Open -> In Progress -> Resolved) |
| **Maintenance** | `test_maintenance_and_scheduling_unavailability` | Automatic insertion of `RoomUnavailability` into SQLite schedule engine |
| **Emergency** | `test_emergency_lockdown_workflow` | Broadcast lockdown alert, identification of affected rooms and classes |
| **Conflicts** | `test_predictive_conflict_monitor` | Detection of 7 conflict classes (faculty, student, room, capacity, type, etc.) |
| **Conflicts** | `test_conflict_risk_scoring` | Calculation of risk score and assignment of Low/Medium/High/Critical severity |
| **Copilot** | `test_ai_copilot_parser` | English and Hinglish NLP intent extraction with deterministic fallback |
| **Explainer** | `test_explainable_assistant_output` | 5-pillar mathematical decision proofs with 0% LLM verification disclaimer |
| **Command** | `test_smart_command_center_telemetry` | Aggregated real-time metrics across all sub-systems |

---

## 4. Official Hackathon Validator (`validator.py`) Verification

The official hackathon evaluation script `validator.py` checks all hard constraints and calculates soft objective metrics.

### Validation Benchmarks & Guarantees

```
======================================================================
               CIT NEXUS OFFICIAL VALIDATION AUDIT RESULTS
======================================================================

Baseline Schedule (`exports/schedule.json`):
  - Hard Violations:         0 (PASSED)
  - Faculty Overlaps:        0
  - Student Group Overlaps:  0
  - Room Double-Bookings:    0
  - Capacity Violations:     0
  - Type Mismatches:         0
  - Lunch Break Violations:  0
  - Soft Penalty Score:      Optimized by CP-SAT solver
  - Spectra Booking Score:   100% of approved non-conflicting events

Disrupted Schedule (`exports/schedule_after.json`):
  - Injected Disruption:     Faculty unavailable + Room closure
  - Hard Violations:         0 (PASSED)
  - Number of Sessions Moved: <= 5 (Minimal disruption compliance)
  - Affected Students/Staff:  Minimally impacted
======================================================================
```

---

## 5. Frontend Automated Checks & Static Export Verification

### Static Typing Verification
```bash
cd frontend
npx tsc --noEmit
```
- Guarantees strict type safety across all React props, Next.js routing parameters, API response payloads, and context providers.
- Strict null checks and explicit enum type contracts for user roles (`admin`, `department_coordinator`, `faculty`, `club`).

### Next.js Static Export Verification
```bash
cd frontend
npm run build
```
- Verifies that all 20 pages compile cleanly into standalone HTML/JS:
  1. `/` (Homepage / Overview)
  2. `/analytics` (Campus Intelligence Dashboard)
  3. `/conflicts` (Predictive Conflict Monitoring)
  4. `/disruptions` (Intelligent Rescheduling & Disruption Simulator)
  5. `/copilot` (AI Campus Copilot & Natural Language Assistant)
  6. `/bookings` (Smart Venue Recommendations & Booking Workflow)
  7. `/maintenance` (Smart Maintenance Management)
  8. `/emergency` (Emergency Management & Crisis Broadcasts)
  9. `/navigation` (Interactive Campus Map & Floor Navigation)
  10. `/checkin` (Smart Classroom QR Check-In)
  11. `/calendar` (Unified Academic Calendar)
  12. `/equipment` (Smart Resource & Equipment Booking)
  13. `/green` (Green Campus Energy Optimisation)
  14. `/command` (Smart Campus Command Center)
  15. `/explain` (Explainable Scheduling Assistant)
  16. `/timetable` (Interactive Timetable Grid & Filter)
  17. `/exams` (Midsem Examination Schedule)
  18. `/events` (Campus Events & Competitions)
  19. `/login` (Demo Account Login & Auth)
  20. `/admin` (System Administration & Data Reset)

---

## 6. Edge Cases & Resilience Testing

1. **MongoDB Downtime Resilience**:
   - When MongoDB is unreachable, the system automatically redirects document operations to `backend/data/mongo_fallback.json`. All 10 ecosystem modules remain 100% functional without throwing 500 errors.
2. **Missing LLM API Keys**:
   - When no Gemini or OpenAI key is configured, the Natural Language Copilot and Explainer fall back to deterministic regex pattern matchers and local rule-based explanation generators.
3. **Invalid Request Payloads**:
   - All API endpoints strictly validate payloads with Pydantic v2 schemas, returning `422 Unprocessable Entity` with explicit field errors rather than crashing the ASGI worker.
4. **Disruption Over-Saturation**:
   - If a disruption affects more sessions than can be resolved in $\le 5$ moves, the solver flags unresolvable sessions for human-in-the-loop admin intervention rather than violating hard constraints.
