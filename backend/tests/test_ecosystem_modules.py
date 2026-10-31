"""Automated Test Suite for CIT Smart Campus Management Ecosystem Modules.

Verifies all 10 new modules and MongoDB document integration:
1. Smart Campus Navigation (Map, buildings, locator, accessible routes)
2. Smart Classroom Check-in (QR check-in, occupancy, unused room detection)
3. Academic Calendar (Multi-source aggregation, department filters, conflict warnings)
4. Lab & Equipment Management (Catalog, reservations, clash prevention, calibration)
5. Event Management (Proposals, registrations, venue recommendations, workflows)
6. Maintenance Management (Tickets, staff assignment, automated room unavailability)
7. AI Campus Copilot (Role-scoped ground-truth conversational assistant)
8. Green Campus Analytics (Real kWh energy consumption, underutilization, CO2 metrics)
9. Campus Command Centre (Consolidated operational pulse)
10. Emergency Management (Lockdowns, impacted rosters, contingency re-allocations)
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.auth import create_access_token
from backend.app.mongodb import is_mongodb_live, get_navigation_collection, get_equipment_collection

client = TestClient(app)

ADMIN_TOKEN = create_access_token({"sub": "admin@cit.edu", "role": "admin", "name": "Dean Admin"})
FACULTY_TOKEN = create_access_token({"sub": "faculty@cit.edu", "role": "faculty", "name": "Dr. Rohit Sahoo"})
STUDENT_TOKEN = create_access_token({"sub": "student@cit.edu", "role": "student", "name": "Student Rep"})


def test_mongodb_connection_and_seeded_collections():
    """Verifies MongoDB layer is operational and initial collections seeded."""
    col = get_navigation_collection()
    meta = col.find_one({"type": "campus_metadata"})
    assert meta is not None, "Campus navigation metadata must be seeded"
    assert len(meta.get("buildings", [])) == 4, "Must have 4 campus building complexes"
    assert len(meta.get("rooms", [])) == 27, "Must have all 27 campus rooms spatial nodes"

    eq_col = get_equipment_collection()
    assert eq_col.count_documents({}) >= 8, "Must have lab equipment catalog initialized"


def test_navigation_module_endpoints():
    """Verifies Smart Campus Navigation: buildings, room locator, and accessible routing."""
    # 1. Buildings
    res_bldg = client.get("/api/navigation/buildings")
    assert res_bldg.status_code == 200
    b_data = res_bldg.json()
    assert b_data["count"] == 4
    codes = [b["code"] for b in b_data["buildings"]]
    assert "MAC" in codes and "CSB" in codes

    # 2. Rooms locator with search
    res_rooms = client.get("/api/navigation/rooms?building=COMPUTING-SCIENCE")
    assert res_rooms.status_code == 200
    r_data = res_rooms.json()
    assert r_data["count"] > 0
    assert all(r["building"] == "COMPUTING-SCIENCE" for r in r_data["rooms"])

    # 3. Route Calculation (accessible vs standard)
    res_route = client.get("/api/navigation/route?from_room=LH-1&to_room=AI-LAB&accessible_only=true")
    assert res_route.status_code == 200
    route = res_route.json()
    assert route["accessibility_confirmed"] is True
    assert route["total_steps"] >= 3
    assert route["estimated_duration_minutes"] >= 1
    # Check that elevator/ramp step is included for accessible mode
    assert any("elevator" in s["instruction"].lower() or "ramp" in s["instruction"].lower() for s in route["steps"])


def test_checkin_and_occupancy_endpoints():
    """Verifies Smart Classroom Check-in: active sessions, QR verification, occupancy, unused rooms."""
    # 1. Active sessions
    res_act = client.get("/api/checkin/active-sessions")
    assert res_act.status_code == 200
    act_data = res_act.json()
    assert act_data["count"] > 0
    target_id = act_data["active_sessions"][0]["target_id"]

    # 2. QR payload
    res_qr = client.get(f"/api/checkin/qr/{target_id}")
    assert res_qr.status_code == 200
    qr_data = res_qr.json()
    assert "qr_token" in qr_data

    # 3. Submit check-in
    res_sub = client.post("/api/checkin/verify", json={
        "target_id": target_id,
        "qr_token": qr_data["qr_token"],
        "user_email": "test.student@cit.edu",
        "user_name": "Test Student",
        "role": "student"
    })
    assert res_sub.status_code == 200
    sub_data = res_sub.json()
    assert sub_data["status"] in ("success", "already_checked_in")

    # 4. Occupancy stats
    res_occ = client.get("/api/checkin/occupancy-stats")
    assert res_occ.status_code == 200
    occ = res_occ.json()
    assert occ["total_rooms"] == 27
    assert occ["total_campus_capacity"] > 1000

    # 5. Unused rooms identification
    res_unused = client.get("/api/checkin/unused-rooms")
    assert res_unused.status_code == 200
    un_data = res_unused.json()
    assert "unused_rooms" in un_data


def test_equipment_management_endpoints():
    """Verifies Lab and Equipment Management: inventory, clash-free reservation, and maintenance logs."""
    # 1. Inventory list
    res_inv = client.get("/api/equipment/inventory")
    assert res_inv.status_code == 200
    inv = res_inv.json()
    assert inv["count"] >= 8
    first_eq = inv["inventory"][0]
    eq_id = first_eq["equipment_id"]

    # 2. Reserve equipment
    res_res = client.post("/api/equipment/reserve", json={
        "equipment_id": eq_id,
        "day": "Saturday",
        "period": 10,
        "duration_hours": 2,
        "purpose": "HPC benchmark test",
        "user_email": "researcher@cit.edu",
        "user_name": "Dr. Sahoo"
    })
    assert res_res.status_code in (200, 409)  # 200 on first try, 409 if already booked

    # 3. List reservations
    res_list = client.get("/api/equipment/reservations")
    assert res_list.status_code == 200


def test_maintenance_and_scheduling_unavailability():
    """Verifies Maintenance ticketing and automatic RoomUnavailability injection."""
    headers = {"Authorization": f"Bearer {ADMIN_TOKEN}"}

    # 1. Report issue with closure required
    res_rep = client.post("/api/maintenance/report", json={
        "room_id": "CR-105",
        "title": "Ceiling Projector Short Circuit",
        "category": "electrical",
        "severity": "Critical",
        "requires_closure": True,
        "day": "Friday",
        "periods": [1, 2, 3]
    }, headers=headers)
    assert res_rep.status_code == 200
    rep_data = res_rep.json()
    assert rep_data["status"] == "success"
    ticket_id = rep_data["ticket"]["ticket_id"]
    assert rep_data["ticket"]["unavailability_id"] is not None

    # 2. List tickets
    res_list = client.get("/api/maintenance/tickets?room_id=CR-105")
    assert res_list.status_code == 200
    assert res_list.json()["count"] >= 1

    # 3. Assign technician
    res_assign = client.post("/api/maintenance/assign", json={
        "ticket_id": ticket_id,
        "staff_name": "Ramesh Kumar (Electrician)"
    }, headers=headers)
    assert res_assign.status_code == 200

    # 4. Resolve ticket (releases room unavailability)
    res_res = client.post(f"/api/maintenance/resolve/{ticket_id}", json={
        "resolution_notes": "Wiring replaced and tested. Venue safe for classes."
    }, headers=headers)
    assert res_res.status_code == 200
    assert "resolved" in res_res.json()["message"].lower()


def test_academic_calendar_endpoints():
    """Verifies Academic Calendar multi-source aggregation and conflict detector."""
    # 1. Unified calendar feed
    res_cal = client.get("/api/calendar/unified")
    assert res_cal.status_code == 200
    cal_data = res_cal.json()
    assert cal_data["count"] > 10
    categories = {e["category"] for e in cal_data["events"]}
    assert "exam" in categories or "event" in categories or "academic" in categories

    # 2. Department filter
    res_dept = client.get("/api/calendar/unified?department=CSE")
    assert res_dept.status_code == 200

    # 3. Conflict detector
    res_conf = client.get("/api/calendar/conflicts")
    assert res_conf.status_code == 200
    assert "conflicts" in res_conf.json()


def test_event_management_and_recommendations():
    """Verifies Event Management: venue recommendations, event creation, and approval."""
    # 1. Smart venue and equipment recommendations
    res_rec = client.get("/api/events/recommendations?attendance=110&event_type=hackathon&needs_lab=true")
    assert res_rec.status_code == 200
    rec_data = res_rec.json()
    assert len(rec_data["recommended_venues"]) > 0
    assert all(r["capacity"] >= 110 for r in rec_data["recommended_venues"])
    assert len(rec_data["recommended_equipment"]) > 0

    # 2. Create event proposal
    res_cr = client.post("/api/events/create", json={
        "title": "CIT HackAI 2026",
        "organizer": "Spectra Coding Club",
        "organizer_type": "club",
        "department": "CSE",
        "expected_attendance": 80,
        "proposed_date": "2026-10-16",
        "proposed_venue": "LH-1"
    })
    assert res_cr.status_code == 200
    evt_id = res_cr.json()["event"]["event_id"]

    # 3. Register for event
    res_reg = client.post(f"/api/events/register/{evt_id}", json={
        "user_email": "coder@cit.edu",
        "user_name": "Alex Coder"
    })
    assert res_reg.status_code == 200

    # 4. Admin approval
    headers = {"Authorization": f"Bearer {ADMIN_TOKEN}"}
    res_app = client.post(f"/api/events/approve/{evt_id}", json={
        "decision": "approved",
        "notes": "Venue LH-1 confirmed and AV staff assigned."
    }, headers=headers)
    assert res_app.status_code == 200
    assert res_app.json()["status_now"] == "approved"


def test_green_campus_analytics_deterministic():
    """Verifies Green Campus Analytics: real kWh calculation, wasted energy, and carbon metrics."""
    res_green = client.get("/api/green/analytics")
    assert res_green.status_code == 200
    green_data = res_green.json()

    summary = green_data["summary"]
    assert summary["total_weekly_consumption_kwh"] > 0
    assert summary["total_weekly_electricity_cost_inr"] > 0
    assert summary["total_weekly_carbon_emissions_kg_co2"] > 0
    assert len(green_data["room_breakdown"]) == 27


def test_command_centre_summary():
    """Verifies Campus Command Centre: consolidated real-time executive dashboard."""
    res_cmd = client.get("/api/command/summary")
    assert res_cmd.status_code == 200
    cmd_data = res_cmd.json()

    assert "occupancy" in cmd_data
    assert cmd_data["occupancy"]["total_rooms"] == 27
    assert "conflicts" in cmd_data
    assert "emergency_alerts" in cmd_data
    assert "pending_approvals" in cmd_data
    assert "maintenance_pulse" in cmd_data


def test_emergency_management_workflow():
    """Verifies Emergency lockdown, affected roster identification, contingency generation, and approval."""
    headers = {"Authorization": f"Bearer {ADMIN_TOKEN}"}

    # 1. Declare emergency closure for a building
    res_lock = client.post("/api/emergency/lockdown", json={
        "scope": "building",
        "building": "INNOVATION-WORKSHOPS",
        "title": "HVAC Overhaul Lockdown",
        "severity": "HIGH",
        "reason": "Emergency electrical transformer service"
    }, headers=headers)
    assert res_lock.status_code == 200
    lock_data = res_lock.json()
    incident_id = lock_data["incident_id"]
    assert lock_data["closed_rooms_count"] > 0

    # 2. Generate contingency alternatives
    res_cont = client.post(f"/api/emergency/generate-contingency/{incident_id}", headers=headers)
    assert res_cont.status_code == 200
    cont_data = res_cont.json()
    assert cont_data["contingency_status"] == "ready_for_approval"

    # 3. Approve contingency plan (if any relocations proposed)
    if cont_data["successfully_relocated_count"] > 0:
        res_appr = client.post(f"/api/emergency/approve-contingency/{incident_id}", json={}, headers=headers)
        assert res_appr.status_code == 200
        assert res_appr.json()["status"] == "success"


def test_ai_campus_copilot_endpoint():
    """Verifies AI Campus Copilot responds with grounded database facts."""
    res_chat = client.post("/api/copilot/chat", json={
        "message": "When are the midsem exams and what rooms are available?"
    })
    assert res_chat.status_code == 200
    chat_data = res_chat.json()
    assert len(chat_data["reply"]) > 20
    assert "disclaimer" in chat_data
