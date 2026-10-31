# CIT Nexus – Complete Project Documentation

## 1. Executive Summary & Mission

**CIT Nexus** is an advanced institutional intelligence and operations platform designed for **Chilika Institute of Technology (CIT)**. The platform solves the multi-dimensional, NP-hard academic scheduling challenge, handles live venue reservations, manages last-minute disruptions with minimal schedule displacement, and integrates 10 comprehensive smart campus operational modules—all backed by a **dual-datastore architecture (SQLite + MongoDB)**.

A foundational principle of CIT Nexus is **Deterministic Algorithmic Governance**:
> **Core Principle**: All scheduling, booking, exam, and conflict decisions are governed strictly by deterministic mathematical algorithms and pure Python constraint validators. Generative AI is strictly constrained to natural-language parsing, narrative synthesis, and conversational assistance. An LLM is never permitted to determine schedule validity or mutate the institutional database directly.

---

## 2. Institutional Problem Statement & Constraints

### 2.1 Campus Profile & Scale
- **Academic Population**: 14 student cohorts across Years 1 to 4 across Computer Science, Electronics & Communication, Mechanical, and Civil Engineering.
- **Teaching Faculty**: 40 faculty members with specialized subject expertise, contractual teaching limits, and scheduled leave windows.
- **Campus Facilities**: 27 rooms categorized into Lecture Halls (LH-1 to LH-6), Standard Classrooms (CR-101 to CR-205), Specialized Laboratories (CS-LAB-1, CS-LAB-2, ELEC-LAB-1, ELEC-LAB-2, PHY-LAB, MECH-WS, CIVIL-LAB), Seminar Halls (SH-1, SH-2), Open Air Theatre (OAT), and the Main Institute Auditorium (AUD).
- **Academic Load**:
  - **189 Weekly Teaching Sessions**: Lectures (1 hour), tutorials (1 hour), and intensive practical blocks (2 hours).
  - **41 Midsem Examinations**: Spread across a dedicated 6-day examination week (Monday to Saturday, AM and PM sessions).
  - **25 Venue Booking Requests**: Competing for popular campus facilities during evening and weekend slots.

### 2.2 Academic Calendar & Period Structure
The academic timetable runs from Monday through Friday across 9 standard daytime teaching periods, plus 4 evening event periods:

| Period | Time Slot | Type | Restrictions |
|---|---|---|---|
| **P1** | 08:00 – 09:00 | Teaching | Standard lecture / tutorial slot |
| **P2** | 09:00 – 10:00 | Teaching | Authorized start period for morning 2-hour lab blocks |
| **P3** | 10:00 – 11:00 | Teaching | Standard lecture / tutorial slot |
| **P4** | 11:00 – 12:00 | Teaching | Standard lecture / tutorial slot |
| **P5** | 12:00 – 13:00 | Teaching | Must not cross into Lunch Break |
| **LUNCH** | 13:00 – 14:00 | Mandatory Break | **Zero classes or events allowed across the entire campus** |
| **P6** | 14:00 – 15:00 | Teaching | Authorized start period for afternoon 2-hour lab blocks |
| **P7** | 15:00 – 16:00 | Teaching | Standard lecture / tutorial slot |
| **P8** | 16:00 – 17:00 | Teaching | Standard lecture / tutorial slot |
| **P9** | 17:00 – 18:00 | Teaching | Soft penalty slot (avoid scheduling unless necessary) |
| **P10–P13** | 18:00 – 22:00 | Evening Events | Reserved exclusively for club events, guest lectures, and symposia |

---

## 3. Mathematical Optimization Formulation (OR-Tools CP-SAT)

The core timetable solver (`backend/solver.py`) is formulated as a Constraint Satisfaction and Integer Linear Programming model using Google OR-Tools CP-SAT.

### 3.1 Decision Variables
For each session $s \in S$:
- $\text{day}[s] \in \{0, 1, 2, 3, 4\}$ (Monday to Friday)
- $\text{start}[s] \in \{1, \dots, 9 - \text{dur}[s] + 1\}$
- $\text{room}[s] \in R_s$ (where $R_s$ is the precomputed domain of valid rooms matching session type, capacity, and accessibility)
- Boolean indicator variables: $x_{s, d, p, r} \in \{0, 1\}$ denoting that session $s$ occupies room $r$ on day $d$ starting at period $p$.

### 3.2 Hard Constraints (Must Satisfy 100%)
1. **No Room Overlap**: For any room $r$ and time coordinate $(d, p)$, at most one session can occupy the room:
   $$\sum_{s \in S : (d, p) \text{ overlaps } s} x_{s, d, p, r} \le 1, \quad \forall r, d, p$$
   *(Exception: Sessions in the exact same elective basket sharing the same room if combined capacity permits).*
2. **No Faculty Overlap**: A faculty member $f$ can teach at most one session at any $(d, p)$:
   $$\sum_{s \in S_f : (d, p) \text{ overlaps } s} x_{s, d, p} \le 1, \quad \forall f, d, p$$
3. **No Student Group Clash**: A student cohort $g$ can attend at most one class at any $(d, p)$:
   $$\sum_{s \in S_g : (d, p) \text{ overlaps } s} x_{s, d, p} \le 1, \quad \forall g, d, p$$
4. **Room Capacity**: $\text{capacity}(\text{room}[s]) \ge \text{size}(s)$.
5. **Room Type Compatibility**: $\text{type}(\text{room}[s]) \in \text{allowed\_types}(s)$.
6. **Mandatory Lunch Break**: No session may overlap with the 13:00–14:00 window (P5 ends strictly at 13:00; P6 starts strictly at 14:00).
7. **Lab Slot Restrictions**: 2-hour laboratory blocks ($dur = 2$) must start strictly at P2 (09:00) or P6 (14:00).
8. **Faculty Daily Teaching Limit**: A faculty member cannot exceed 6 teaching hours in a single calendar day:
   $$\sum_{s \in S_f : \text{day}[s] = d} \text{dur}[s] \le 6, \quad \forall f, d$$
9. **Faculty Unavailability & Leave**: If faculty $f$ is on leave on day $d$ at period $p$, no session of $f$ may overlap $(d, p)$.
10. **Room Unavailability & Maintenance**: If room $r$ is closed for maintenance on day $d$ at period $p$, no session may be assigned to $r$ at $(d, p)$.
11. **Wheelchair Accessibility**: If $\text{needs\_accessible}(s) = \text{True}$, $\text{accessible}(\text{room}[s]) = \text{True}$.
12. **Synchronized Elective Baskets**: Sessions belonging to the same basket slot (e.g., `OEB-1`, `OEB-2`, `OEB-3`) must run concurrently at the exact same day and start period:
    $$\text{day}[s_1] = \text{day}[s_2] \quad \text{and} \quad \text{start}[s_1] = \text{start}[s_2], \quad \forall s_1, s_2 \in \text{Basket}_k$$
13. **Exam Half-Capacity**: For all 41 midsem exams, room capacity is halved: $\lfloor \text{capacity}(r) / 2 \rfloor \ge \text{size}(\text{exam})$.

### 3.3 Two-Stage Solver Pipeline
- **Stage 1 (Feasibility)**: The solver finds any valid configuration satisfying all 13 hard rules within a 60-second timeout.
- **Stage 2 (Soft Penalty Minimisation)**: Starting from the Stage 1 feasible assignment, the solver minimizes the total soft penalty objective:
  $$\min \sum \text{penalties} = w_1 \cdot \text{late\_period\_P9} + w_2 \cdot \text{student\_idle\_gaps} + w_3 \cdot \text{underutilized\_rooms} + w_4 \cdot \text{faculty\_avoid\_times}$$
  - P9 avoidance weight: $+10$ pts per session scheduled at P9.
  - Idle gap penalty: $+5$ pts per empty period between classes for a cohort.
  - Underutilised room penalty: $+15$ pts if room capacity utilization is under 40%.
  - Faculty avoid-time penalty: $+20$ pts per preferred non-teaching slot violated.

---

## 4. Rule-Based Venue Booking Priority Engine

The booking engine (`backend/booking_engine.py`) enforces strict institutional priority without LLM ambiguity:

### 4.1 Priority Hierarchy
$$\text{Exams} > \text{Regular Classes} > \text{Institute Events} > \text{Guest Lectures} > \text{Department Events} > \text{Club Events}$$

### 4.2 Role Quotas & Demotion Rules
- **Admin**: May request up to `institute_event`.
- **Coordinator**: May request up to `department_event`.
- **Faculty**: May request up to `guest_lecture`.
- **Club Representative**: Restricted to `club_event`.
- **Automatic Demotion**: If a user submits a category exceeding their role cap, the engine automatically demotes the request to their maximum allowable category before priority evaluation.

### 4.3 Deterministic Clash Resolution & Dynamic Slot Release
- Evaluates booking requests against scheduled classes, midsem exams, and previously approved higher-priority bookings.
- Detects group commitments for mandatory cohorts.
- If a clash occurs, the engine explores alternative venues and dates, returning ranked alternative options.
- When an approved booking is cancelled, the engine immediately frees the room in the database, allowing lower-priority requests in the waitlist to be approved.

---

## 5. Intelligent Rescheduling & Disruption Recovery

The disruption engine (`backend/rescheduler.py`) manages unforeseen events such as emergency faculty sick leave or infrastructure failures (e.g., HVAC failure in Lecture Hall 1):

### 5.1 Warm-Start Minimal-Moves Formulation
Rather than recomputing the schedule from scratch (which would cause chaos across campus), the rescheduler locks unaffected sessions in place and adds a heavy displacement penalty:
$$\text{Displacement Penalty} = 2000 \times \sum_{s \in S} \mathbb{I}(\text{slot}[s] \ne \text{original\_slot}[s])$$
This mathematical formulation guarantees:
- **Minimal Affected Sessions**: Typically moves $\le 5$ sessions to resolve the disruption.
- **Zero Hard Violations**: The rescheduled timetable passes all 13 rules in `validator.py`.
- **Audit Diff View**: Side-by-side comparison of original vs relocated slots for transparency.
- **Admin Authorization Gate**: Changes are held in draft state until an authorized Dean/Admin reviews and approves them.

---

## 6. Campus Intelligence & Predictive Conflict Monitoring

The conflict monitoring engine (`backend/conflict_monitor.py`) continuously analyzes live timetable and booking data across 7 conflict classes:

1. `FACULTY_OVERLAP`: Double-booked faculty across multiple sessions.
2. `GROUP_OVERLAP`: Overlapping class commitments for a student cohort.
3. `ROOM_OVERLAP`: Double-booked classrooms or laboratories.
4. `CAPACITY_VIOLATION`: Attendance exceeding room capacity (or halved exam capacity).
5. `ROOM_TYPE_MISMATCH`: Practical laboratory scheduled in a regular lecture room without apparatus.
6. `FACULTY_UNAVAILABILITY`: Sessions placed during approved faculty leave periods.
7. `ROOM_MAINTENANCE_CONFLICT`: Sessions or bookings assigned to a venue under active maintenance.

### 6.1 Deterministic Risk Scoring
Every room and booking request is evaluated with an algorithmic risk score (0–100):
- **Critical (80–100)**: Direct collision with existing schedule or zero capacity buffer.
- **High (60–79)**: Contended slot with multiple competing booking requests.
- **Medium (35–59)**: Room capacity tightness exceeding 80%.
- **Low (0–34)**: Safe, uncontentious assignment with ample buffer seats.

---

## 7. Explainable Scheduling Assistant (5 Pillars)

For every scheduling decision, the explainability service (`backend/explainability_service.py`) generates a verifiable, 5-pillar mathematical and institutional proof:

1. **Why This Room Was Selected**: Capacity fit, accessibility compliance, room-type match, and utilization tightness.
2. **Why This Particular Time Was Chosen**: Faculty availability, group vacancy, lunch compliance, and 2-hour lab start rules.
3. **Why Alternative Rooms Were Rejected**: Exact disqualifying constraint for rejected venues (e.g., *"LH-2 rejected: capacity 120 < 130 required; SH-1 rejected: no wheelchair elevator"*).
4. **Hard Constraints Verified**: Explicit checklist of the 13 verified constraints.
5. **Soft Constraints Influenced**: Impact on P9 penalties, student gaps, and room utilization efficiency.

---

## 8. Smart Campus Management Ecosystem (10 Modules)

### 8.1 Smart Campus Navigation (`/navigation`)
- 2D interactive vector SVG campus map covering 4 complexes and 27 rooms.
- Floor level selector (Floors 1 to 4).
- Wheelchair-accessible route generator prioritizing step-free corridors, ramps, and elevators.

### 8.2 Smart Classroom Check-In (`/checkin`)
- Dynamic QR code generation per period.
- Real-time headcount reporting vs room capacity.
- 15-minute grace period monitor for unused booked venues.
- Strict authorized release protocol requiring approval before freeing rooms.

### 8.3 Academic Calendar (`/calendar`)
- Unified multi-source calendar feed uniting classes, exams, events, and holidays.
- Departmental filters (CSE, ECE, MECH, CIVIL, ALL).
- Conflict warning radar for exam/class collisions.

### 8.4 Lab and Equipment Management (`/equipment`)
- High-value apparatus catalog (NVIDIA DGX A100 GPU nodes, 1GHz oscilloscopes, CNCs, UTMs, 3D printers).
- Timetable clash checks preventing reservation during scheduled practical classes.

### 8.5 Event Management (`/events`)
- Proposal submission, attendance tracking, and smart room/equipment recommendations.
- Multi-tier approval workflow for coordinators and admins.

### 8.6 Smart Maintenance Management (`/maintenance`)
- Defect reporting across HVAC, electrical, AV, plumbing, and structural issues.
- Automatic injection of `RoomUnavailability` into the database when room closure is required.

### 8.7 AI Campus Copilot (`/copilot`)
- Grounded conversational assistant supporting English and Hinglish.
- Verifiable database source badges on every response.

### 8.8 Green Campus Energy Analytics (`/green`)
- Hourly power modeling: HVAC ($0.035\text{ kW/seat}$) and lighting ($0.008\text{ kW/seat}$).
- Idle room energy waste analysis in kWh, INR cost, and $CO_2$ emissions ($0.72\text{ kg CO}_2\text{/kWh}$).

### 8.9 Campus Command Centre (`/command`)
- Executive console displaying campus occupancy rate, active conflict summary, pending approvals queue, and emergency ticker.

### 8.10 Emergency Campus Management (`/emergency`)
- Building and room lockdown declaration interface.
- Affected roster impact analysis and automated safe contingency relocations.
- Administrator approval gate for publishing changes.

---

## 9. Security, RBAC & AI Governance

- **Authentication**: JWT tokens signed with HMAC-SHA256, carrying user role and email claims.
- **Password Security**: Passwords hashed with bcrypt and cryptographic salt.
- **Anti-Bypass Guard**: The AI parser cannot elevate user roles or categories. All parsed parameters are strictly bound to authenticated JWT tokens.
- **Zero-LLM Validation**: The LLM is never trusted with scheduling correctness. All proposals must pass `backend/validator.py`.
