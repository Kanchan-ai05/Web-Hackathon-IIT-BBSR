"""FastAPI Router for Smart Campus Navigation.

Provides:
- Interactive campus map metadata & building footprints.
- Classroom, laboratory and building locator.
- Floor-wise room navigation.
- Accessible route suggestions (elevators & ramps only).
- Multi-criteria search by room number, department or building.
"""

import math
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Room
from ..auth import get_optional_current_user, User
from ..mongodb import get_navigation_collection

router = APIRouter(prefix="/api/navigation", tags=["Smart Campus Navigation"])


@router.get("/buildings")
def list_buildings():
    """Returns all campus complexes with floor counts and accessibility features."""
    col = get_navigation_collection()
    meta = col.find_one({"type": "campus_metadata"})
    if not meta or "buildings" not in meta:
        return {"count": 0, "buildings": []}
    return {
        "institute": meta.get("institute", "Chilika Institute of Technology"),
        "count": len(meta["buildings"]),
        "buildings": meta["buildings"]
    }


@router.get("/rooms")
def list_navigation_rooms(
    q: Optional[str] = Query(None, description="Search term for room ID, name, or department"),
    building: Optional[str] = Query(None, description="Filter by building ID"),
    floor: Optional[int] = Query(None, description="Filter by floor number (1-4)"),
    accessible_only: bool = Query(False, description="Filter only wheelchair-accessible venues"),
    db: Session = Depends(get_db)
):
    """Returns spatial positions, floor levels, and features for all campus rooms."""
    col = get_navigation_collection()
    meta = col.find_one({"type": "campus_metadata"})
    rooms_data = meta.get("rooms", []) if meta else []

    # Cross-reference with database rooms to ensure perfect consistency
    db_rooms = {r.id: r for r in db.query(Room).all()}

    results = []
    for r in rooms_data:
        r_id = r.get("room_id")
        db_r = db_rooms.get(r_id)

        # Apply filters
        if building and r.get("building") != building:
            continue
        if floor is not None and r.get("floor") != floor:
            continue
        if accessible_only and not r.get("accessible"):
            continue

        if q:
            term = q.lower()
            matches = (
                term in r_id.lower() or
                term in r.get("name", "").lower() or
                term in r.get("building", "").lower() or
                term in r.get("type", "").lower() or
                (db_r and any(term in use.lower() for use in db_r.allowed_uses))
            )
            if not matches:
                continue

        item = copy_room = dict(r)
        if db_r:
            item["features"] = db_r.features
            item["allowed_uses"] = db_r.allowed_uses
        results.append(item)

    return {
        "count": len(results),
        "rooms": results
    }


@router.get("/route")
def calculate_route(
    from_room: str = Query(..., description="Starting room ID (e.g. LH-1)"),
    to_room: str = Query(..., description="Destination room ID (e.g. AI-LAB)"),
    accessible_only: bool = Query(False, description="Require step-free / elevator route")
):
    """Computes turn-by-turn navigation route between two campus venues."""
    col = get_navigation_collection()
    meta = col.find_one({"type": "campus_metadata"})
    if not meta:
        raise HTTPException(status_code=500, detail="Campus navigation metadata not initialized")

    rooms_map = {r["room_id"]: r for r in meta.get("rooms", [])}
    buildings_map = {b["building_id"]: b for b in meta.get("buildings", [])}

    origin = rooms_map.get(from_room)
    dest = rooms_map.get(to_room)

    if not origin:
        raise HTTPException(status_code=404, detail=f"Origin room '{from_room}' not found.")
    if not dest:
        raise HTTPException(status_code=404, detail=f"Destination room '{to_room}' not found.")

    if accessible_only and not dest.get("accessible"):
        raise HTTPException(
            status_code=400,
            detail=f"Destination room '{dest['name']}' ({to_room}) is not wheelchair accessible."
        )

    # Route Steps Generation
    steps = []
    same_building = origin["building"] == dest["building"]
    same_floor = origin["floor"] == dest["floor"]

    origin_bldg = buildings_map.get(origin["building"], {})
    dest_bldg = buildings_map.get(dest["building"], {})

    steps.append({
        "step": 1,
        "instruction": f"Exit {origin['name']} on Floor {origin['floor']} ({origin['wing']} Wing).",
        "icon": "🚪"
    })

    total_meters = 0

    if not same_floor:
        if accessible_only:
            if not origin_bldg.get("has_elevator"):
                raise HTTPException(
                    status_code=400,
                    detail=f"Building '{origin_bldg.get('name')}' lacks elevator access for multi-floor transit."
                )
            steps.append({
                "step": len(steps) + 1,
                "instruction": f"Take the central accessibility elevator from Floor {origin['floor']} to Floor {dest['floor']}.",
                "icon": "🛗"
            })
        else:
            steps.append({
                "step": len(steps) + 1,
                "instruction": f"Proceed to central stairway and take stairs to Floor {dest['floor']}.",
                "icon": "🪜"
            })
        total_meters += 40

    if not same_building:
        steps.append({
            "step": len(steps) + 1,
            "instruction": f"Proceed to ground floor exit of {origin_bldg.get('name')} and follow the covered walkway towards {dest_bldg.get('name')}.",
            "icon": "🚶"
        })
        # Calculate approximate distance from coordinates
        c1 = origin_bldg.get("coordinates", {"lat": 20.148, "lng": 85.671})
        c2 = dest_bldg.get("coordinates", {"lat": 20.148, "lng": 85.671})
        dist_approx = round(math.sqrt((c1["lat"] - c2["lat"])**2 + (c1["lng"] - c2["lng"])**2) * 111000)
        dist_approx = max(dist_approx, 75)
        total_meters += dist_approx

        if accessible_only:
            steps.append({
                "step": len(steps) + 1,
                "instruction": f"Use the step-free access ramp at the main entrance of {dest_bldg.get('name')}.",
                "icon": "♿"
            })
            if dest["floor"] > 1:
                steps.append({
                    "step": len(steps) + 1,
                    "instruction": f"Take the entrance elevator in {dest_bldg.get('name')} to Floor {dest['floor']}.",
                    "icon": "🛗"
                })
        else:
            if dest["floor"] > 1:
                steps.append({
                    "step": len(steps) + 1,
                    "instruction": f"Enter {dest_bldg.get('name')} and proceed to Floor {dest['floor']}.",
                    "icon": "🪜"
                })

    # Final corridor approach
    steps.append({
        "step": len(steps) + 1,
        "instruction": f"Turn towards the {dest['wing']} Wing. {dest['name']} ({dest['room_id']}) will be on your {'right' if dest.get('x', 0) > 150 else 'left'}.",
        "icon": "🎯"
    })
    total_meters += 35

    est_walking_minutes = max(1, round(total_meters / 75.0, 1))

    return {
        "from": origin,
        "to": dest,
        "accessible_only": accessible_only,
        "total_distance_meters": total_meters,
        "estimated_duration_minutes": est_walking_minutes,
        "total_steps": len(steps),
        "steps": steps,
        "accessibility_confirmed": accessible_only or dest.get("accessible", False)
    }
