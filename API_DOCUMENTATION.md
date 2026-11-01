# CIT Nexus – Complete API Documentation

Comprehensive REST API reference for **CIT Nexus – Smart Campus Intelligence Platform**.

- **Base URL (Local)**: `http://localhost:8000`
- **Base URL (Production Render)**: `https://cit-scheduling-api.onrender.com`
- **Interactive Swagger UI**: `https://cit-scheduling-api.onrender.com/docs`
- **OpenAPI Schema**: `https://cit-scheduling-api.onrender.com/openapi.json`

---

## 1. Authentication & Users (`/api/auth`)

### 1.1 Login & Obtain JWT Token
- **Endpoint**: `POST /api/auth/login`
- **Auth Scope**: Public
- **Request Body**:
  ```json
  {
    "email": "admin@cit.edu",
    "password": "Admin@123"
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer",
    "user": {
      "id": 1,
      "email": "admin@cit.edu",
      "name": "Prof. Shreya Kapoor (Dean's Office)",
      "role": "admin",
      "department": "ADMIN"
    }
  }
  ```

### 1.2 User Registration
- **Endpoint**: `POST /api/auth/register`
- **Auth Scope**: Public
- **Request Body**:
  ```json
  {
    "name": "Priya Sen",
    "email": "priya.sen@cit.edu",
    "password": "SecurePassword123",
    "role": "student",
    "department": "ECE"
  }
  ```
- **Safeguard**: Public registration strictly permits `student`, `faculty`, and `coordinator`. Attempts to assign `role="admin"` are rejected with `403 Forbidden`.
- **Response (`201 Created`)**: Returns JWT access token, user role, and profile details for immediate authenticated session.

### 1.3 Forgot Password
- **Endpoint**: `POST /api/auth/forgot-password`
- **Auth Scope**: Public
- **Request Body**: `{"email": "user@cit.edu"}`
- **Response (`200 OK`)**: Returns cryptographic reset token valid for 30 minutes.

### 1.4 Reset Password
- **Endpoint**: `POST /api/auth/reset-password`
- **Auth Scope**: Public
- **Request Body**:
  ```json
  {
    "email": "user@cit.edu",
    "token": "32_character_hex_token",
    "new_password": "NewSecurePassword456"
  }
  ```
- **Response (`200 OK`)**: Updates password hash via Bcrypt and invalidates used reset token.

### 1.5 User Logout
- **Endpoint**: `POST /api/auth/logout`
- **Auth Scope**: Optional Bearer Token
- **Response (`200 OK`)**: Records `USER_LOGOUT` audit log event.

### 1.6 Get Current User Profile
- **Endpoint**: `GET /api/auth/me`
- **Auth Scope**: Bearer Token required
- **Response (`200 OK`)**: Returns profile object (`id`, `email`, `name`, `role`, `department`, `is_active`).

### 1.7 List Demo Accounts
- **Endpoint**: `GET /api/auth/demo-accounts`
- **Auth Scope**: Public
- **Response (`200 OK`)**: Pre-seeded demo credentials for `admin`, `department_coordinator`, `faculty`, `student`, and `club`.

### 1.8 Administrator User Directory
- **Endpoint**: `GET /api/auth/users`
- **Auth Scope**: Admin only (`require_role(["admin"])`)
- **Response (`200 OK`)**: Array of all registered users with permissions and creation dates.

### 1.9 Administrator Update User Role & Permissions
- **Endpoint**: `PATCH /api/auth/users/{user_id}/role`
- **Auth Scope**: Admin only (`require_role(["admin"])`)
- **Request Body**: `{"role": "faculty", "department": "CSE", "is_active": true}`
- **Safeguard**: Prevents demoting or deactivating the sole remaining active administrator.
- **Response (`200 OK`)**: Updated user profile.

### 1.10 Administrator Delete User Account
- **Endpoint**: `DELETE /api/auth/users/{user_id}`
- **Auth Scope**: Admin only (`require_role(["admin"])`)
- **Safeguard**: Prevents self-deletion of the active admin account.
- **Response (`200 OK`)**: Confirmation of account removal.

---

## 2. Timetable & CP-SAT Solver (`/api/timetable`)

### 2.1 Get Complete Schedule
- **Endpoint**: `GET /api/timetable/schedule`
- **Auth Scope**: Public
- **Query Parameters**:
  - `group_id` (optional): Filter by student cohort (e.g. `CSE-1`).
  - `faculty_id` (optional): Filter by professor (e.g. `F01`).
  - `room_id` (optional): Filter by classroom/lab (e.g. `LH-1`).
- **Response (`200 OK`)**:
  ```json
  {
    "count": 189,
    "slots": [
      {
        "id": 1,
        "session_id": "CS101-LEC",
        "course_id": "CS101",
        "title": "Introduction to Programming",
        "faculty_id": "F01",
        "faculty_name": "Dr. A. Sharma",
        "day": "MON",
        "start_period": 1,
        "duration": 1,
        "room_id": "LH-1",
        "room_name": "Lecture Hall 1",
        "student_groups": ["CSE-1", "CSE-2"],
        "kind": "lecture",
        "size": 110,
        "is_lab_block": false
      }
    ]
  }
  ```

### 2.2 Trigger Full CP-SAT Timetable Generation
- **Endpoint**: `POST /api/timetable/generate`
- **Auth Scope**: `admin` only
- **Response (`200 OK`)**:
  ```json
  {
    "status": "success",
    "solver_status": "OPTIMAL",
    "sessions_scheduled": 189,
    "exams_scheduled": 41,
    "hard_violations": 0,
    "soft_penalty": 425,
    "export_path": "exports/schedule.json"
  }
  ```

### 2.3 Manual Session Move (With Pre-Write Constraint Validator)
- **Endpoint**: `POST /api/timetable/move`
- **Auth Scope**: `admin`, `department_coordinator`
- **Request Body**:
  ```json
  {
    "session_id": "CS101-LEC",
    "day": "TUE",
    "start_period": 3,
    "room_id": "LH-2"
  }
  ```
- **Response (`200 OK`)**: Session moved successfully. If a hard rule is violated, returns `400 Bad Request` with exact violation details.

### 2.4 Reschedule Disruption (Minimal Moves)
- **Endpoint**: `POST /api/timetable/reschedule`
- **Auth Scope**: `admin`, `department_coordinator`
- **Request Body**: Disruption payload with faculty leaves and room unavailabilities.
- **Response (`200 OK`)**: Relocated sessions ($\le 5$ moved), 0 hard violations, and before/after schedule diff.

---

## 3. Venue Bookings (`/api/booking`)

### 3.1 List All Bookings
- **Endpoint**: `GET /api/booking/requests`
- **Query Parameters**: `status`, `role`, `department`.

### 3.2 Submit Booking Request
- **Endpoint**: `POST /api/booking/request`
- **Auth Scope**: Authenticated User
- **Request Body**:
  ```json
  {
    "title": "Guest Lecture on Artificial Intelligence",
    "requested_category": "guest_lecture",
    "preferred_room_types": ["lecture_hall", "seminar_hall"],
    "required_features": ["projector", "audio_system"],
    "attendance": 90,
    "preferred_day": "WED",
    "preferred_periods": [6, 7]
  }
  ```

### 3.3 Batch Process Bookings (Rule-Based Priority Engine)
- **Endpoint**: `POST /api/booking/batch-process`
- **Auth Scope**: `admin`, `department_coordinator`
- **Response (`200 OK`)**:
  ```json
  {
    "status": "success",
    "total_evaluated": 25,
    "approved": 16,
    "rejected": 5,
    "alternatives_suggested": 4
  }
  ```

### 3.4 Cancel Booking & Dynamic Slot Release
- **Endpoint**: `POST /api/booking/cancel/{booking_id}`
- **Auth Scope**: Owner or `admin`
- **Response (`200 OK`)**: Cancels booking and immediately frees venue capacity in the database.

---

## 4. Conflict Monitor & Risk Scoring (`/api/conflict`)

### 4.1 Detect All Active Conflicts
- **Endpoint**: `GET /api/conflict/detect`
- **Response (`200 OK`)**:
  ```json
  {
    "total_conflicts": 0,
    "status": "ALL_CLEAR",
    "conflicts": []
  }
  ```

### 4.2 Room Risk Scores & Classification
- **Endpoint**: `GET /api/conflict/room-risks`
- **Response (`200 OK`)**: Returns risk score (0–100), classification (`Low`, `Medium`, `High`, `Critical`), utilization rate, and demand level for all 27 rooms.

### 4.3 Predictive Booking Risks
- **Endpoint**: `GET /api/conflict/booking-risks`
- **Response (`200 OK`)**: Evaluates pending booking requests for potential collision, overbooking contention, and alternative recommendations.

---

## 5. Campus Analytics (`/api/analytics`)

### 5.1 Real-Time Analytics Summary
- **Endpoint**: `GET /api/analytics/summary`
- **Response (`200 OK`)**: Room utilisation percentages, faculty workload distribution, cohort schedules, and booking statistics.

### 5.2 CSV Data Exports
- `GET /api/analytics/export/room-utilisation`
- `GET /api/analytics/export/faculty-workload`
- `GET /api/analytics/export/bookings`
- Returns formatted, downloadable CSV spreadsheets.

---

## 6. Explainable Decisions Assistant (`/api/explain`)

### 6.1 Explain Timetable Session Allocation (5 Pillars)
- **Endpoint**: `GET /api/explain/session/{session_id}`
- **Response (`200 OK`)**: 5-pillar mathematical breakdown of why the room and time were chosen, which alternative venues were rejected, and hard/soft constraints satisfied.

### 6.2 Compare Alternative Rooms Head-to-Head
- **Endpoint**: `POST /api/explain/compare-rooms`
- **Request Body**: `session_id`, `room_a_id`, `room_b_id`.

---

## 7. Smart Campus Navigation (`/api/navigation`)

### 7.1 List Campus Buildings & Complexes
- **Endpoint**: `GET /api/navigation/buildings`
- **Response (`200 OK`)**: Returns 4 campus complexes with coordinates, elevator availability, accessible ramps, and departments.

### 7.2 Query Rooms by Floor
- **Endpoint**: `GET /api/navigation/rooms?building=MAIN-ACADEMIC&floor=1`
- **Response (`200 OK`)**: Spatial coordinates (x, y), wing, accessibility, and capacity for matching rooms.

### 7.3 Calculate Turn-by-Turn Accessible Route
- **Endpoint**: `GET /api/navigation/route?origin=LH-1&destination=CS-LAB-1&accessible_only=true`
- **Response (`200 OK`)**: Turn-by-turn steps prioritizing ramps and elevators, total distance in meters, estimated walking time in minutes, and step-free verification.

---

## 8. Smart Classroom Check-In (`/api/checkin`)

### 8.1 Active Period Sessions
- **Endpoint**: `GET /api/checkin/active-sessions?day=MON&period=2`
- **Response (`200 OK`)**: Current room occupancy, instructor, scheduled title, and check-in status.

### 8.2 Verify QR Check-In
- **Endpoint**: `POST /api/checkin/verify`
- **Request Body**:
  ```json
  {
    "qr_token": "CIT-QR-LH-1-K89J2",
    "room_id": "LH-1",
    "attendee_id": "faculty@cit.edu",
    "headcount": 104
  }
  ```

### 8.3 Authorized Unused Room Release
- **Endpoint**: `POST /api/checkin/release-unused`
- **Auth Scope**: `admin`, `department_coordinator`
- **Request Body**: `room_id`, `reason`, `approver_notes`.

---

## 9. Lab & Equipment Management (`/api/equipment`)

### 9.1 Equipment Catalog
- **Endpoint**: `GET /api/equipment/list`
- **Response (`200 OK`)**: 10 specialized apparatuses, specifications, lab room, department, status, and power ratings.

### 9.2 Reserve Apparatus (With Class Clash Prevention)
- **Endpoint**: `POST /api/equipment/reserve`
- **Request Body**: `equipment_id`, `day`, `periods`, `purpose`, `user_email`.
- Verifies that the lab room has no conflicting practical class before confirming reservation.

---

## 10. Event Management & Recommendations (`/api/events`)

### 10.1 Smart Venue & Hardware Recommendations
- **Endpoint**: `GET /api/events/recommendations?attendance=120&event_type=hackathon&needs_lab=true`
- **Response (`200 OK`)**: Best-fit clash-free venues with sufficient capacity and suggested lab hardware.

### 10.2 Create Event Proposal
- **Endpoint**: `POST /api/events/create`
- **Request Body**: `title`, `organizer`, `description`, `expected_attendance`, `needs_lab`, `preferred_day`, `preferred_periods`, `assigned_venue`.

### 10.3 Approve or Reject Event
- **Endpoint**: `POST /api/events/approve/{event_id}`
- **Auth Scope**: `admin`, `department_coordinator`

---

## 11. Maintenance Management (`/api/maintenance`)

### 11.1 Report Infrastructure Defect
- **Endpoint**: `POST /api/maintenance/report`
- **Request Body**:
  ```json
  {
    "room_id": "CR-105",
    "title": "Ceiling Projector Short Circuit",
    "category": "electrical",
    "severity": "Critical",
    "requires_closure": true,
    "day": "Friday",
    "periods": [1, 2, 3, 4]
  }
  ```
- **Engine Action**: Automatically creates a `RoomUnavailability` constraint in the scheduling database when closure is required.

### 11.2 Assign Technician
- **Endpoint**: `POST /api/maintenance/assign`
- **Request Body**: `ticket_id`, `staff_name`.

### 11.3 Resolve Ticket & Restore Room Availability
- **Endpoint**: `POST /api/maintenance/resolve/{ticket_id}`
- **Request Body**: `resolution_notes`.
- **Engine Action**: Automatically deletes the `RoomUnavailability` record, restoring the room to the scheduler.

---

## 12. Academic Calendar (`/api/calendar`)

### 12.1 Unified Multi-Source Calendar Feed
- **Endpoint**: `GET /api/calendar/unified`
- **Query Parameters**: `department` (`CSE`, `ECE`, `MECH`, `CIVIL`, `ALL`).
- **Response (`200 OK`)**: Aggregated events across classes, exams, events, and holidays, plus milestone countdowns.

### 12.2 Calendar Conflict Warnings
- **Endpoint**: `GET /api/calendar/conflicts`
- **Response (`200 OK`)**: High-occupancy overlaps and exam-class collisions.

---

## 13. Green Campus Energy Analytics (`/api/green`)

### 13.1 Campus Energy & Sustainability Pulse
- **Endpoint**: `GET /api/green/summary`
- **Response (`200 OK`)**: Today's total kWh consumption, wasted idle energy in kWh, carbon footprint in kg $CO_2$, cost of waste in INR, audited underutilised rooms, and algorithmic eco-recommendations.

---

## 14. Campus Command Centre (`/command`)

### 14.1 Consolidated Operational Pulse
- **Endpoint**: `GET /api/command/summary`
- **Response (`200 OK`)**: Executive console combining occupancy rate, active scheduling conflicts, emergency incident ticker, pending approvals queue, and maintenance tickets.

---

## 15. Emergency Management (`/api/emergency`)

### 15.1 Declare Lockdown / Closure
- **Endpoint**: `POST /api/emergency/lockdown`
- **Auth Scope**: `admin` only
- **Request Body**:
  ```json
  {
    "scope": "building",
    "building": "INNOVATION-WORKSHOPS",
    "title": "Electrical Transformer Maintenance Lockdown",
    "severity": "HIGH",
    "reason": "Precautionary power cut"
  }
  ```
- **Response (`200 OK`)**: Closed venues list, affected timetable classes, impacted student cohorts, and faculty members.

### 15.2 Approve Contingency Schedule Relocations
- **Endpoint**: `POST /api/emergency/contingency/approve`
- **Auth Scope**: `admin` only
- **Request Body**: `incident_id`, `admin_notes`.
- **Response (`200 OK`)**: Publishes contingency relocations to the live campus timetable.

---

## 16. AI Copilot Chat (`/api/copilot`)

### 16.1 Query Grounded Assistant
- **Endpoint**: `POST /api/copilot/chat`
- **Request Body**:
  ```json
  {
    "query": "Which labs have high GPU capacity available on Wednesday afternoon?",
    "role": "faculty"
  }
  ```
- **Response (`200 OK`)**: Natural-language answer, grounded factual citations from SQLite/MongoDB, and source domain.

---

## 17. AI Booking Request Parser (`/api/ai`)

### 17.1 Parse Natural Language or Hinglish Prompt
- **Endpoint**: `POST /api/ai/parse-booking`
- **Request Body**:
  ```json
  {
    "prompt": "Spectra fest ke liye Room 01 chahiye Wednesday P10-P11 100 students",
    "role": "club"
  }
  ```
- **Response (`200 OK`)**: Structured booking draft JSON. Role and category are locked strictly to authenticated user's credentials (anti-bypass).

---

## 18. Administration & Audit Logs (`/api/admin`)

### 18.1 Retrieve Immutable Audit Trail
- **Endpoint**: `GET /api/admin/audit-logs`
- **Auth Scope**: `admin` only
- **Response (`200 OK`)**: Chronological audit log of all timetable generations, dataset replacements, and booking decisions with user, action, and timestamp.

### 18.2 Reset Demo Data to Factory Baseline
- **Endpoint**: `POST /api/admin/reset-demo-data`
- **Auth Scope**: `admin` only

---

## 19. System Health & Ping (`/health`)

- **Endpoint**: `GET /health`
- **Auth Scope**: Public
- **Response (`200 OK`)**:
  ```json
  {
    "status": "healthy",
    "dataset": "cit-public-v1",
    "timestamp": "2026-11-01T03:30:00Z"
  }
  ```
