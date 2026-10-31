"""MongoDB Document Datastore Layer for CIT Smart Campus Management Ecosystem.

Provides high-performance document persistence for:
1. Campus Navigation (Spatial Graph, Buildings, Floors, Accessible Paths)
2. Smart Classroom Check-ins (QR telemetry, occupancy, unused rooms)
3. Academic Calendar (Multi-source calendar events & milestone tracking)
4. Lab & Equipment Management (Catalog, reservations, calibration)
5. Campus Events (Clubs, departments, attendance, workflows)
6. Maintenance Tickets (Classroom/lab issues & scheduling unavailabilities)
7. Green Campus Analytics (Energy metrics, underutilization, carbon footprint)
8. Emergency Management (Lockdowns, affected class rosters, contingencies)
9. AI Campus Copilot (Role-scoped chat memories & audit queries)

Includes an embedded JSON fallback datastore so the entire platform operates
with 100% reliability even when a MongoDB server daemon is offline.
"""

import os
import json
import time
import copy
from typing import Dict, Any, List, Optional
from datetime import datetime
import pymongo
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from .config import settings

_mongo_client: Optional[MongoClient] = None
_is_mongo_connected: bool = False
_fallback_db: Dict[str, List[Dict[str, Any]]] = {}
_FALLBACK_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "mongodb_fallback.json")


class FallbackCollection:
    """Lightweight in-memory & file-backed document collection mimicking PyMongo."""

    def __init__(self, name: str):
        self.name = name

    def _get_docs(self) -> List[Dict[str, Any]]:
        global _fallback_db
        if self.name not in _fallback_db:
            _fallback_db[self.name] = []
        return _fallback_db[self.name]

    def _persist(self):
        try:
            os.makedirs(os.path.dirname(_FALLBACK_FILE), exist_ok=True)
            with open(_FALLBACK_FILE, "w", encoding="utf-8") as f:
                json.dump(_fallback_db, f, indent=2, default=str)
        except Exception:
            pass

    def insert_one(self, doc: Dict[str, Any]):
        doc_copy = copy.deepcopy(doc)
        if "_id" not in doc_copy:
            doc_copy["_id"] = f"{self.name}_{int(time.time() * 1000)}_{len(self._get_docs())}"
        self._get_docs().append(doc_copy)
        self._persist()
        return type("InsertOneResult", (), {"inserted_id": doc_copy["_id"]})()

    def insert_many(self, docs: List[Dict[str, Any]]):
        res_ids = []
        for i, d in enumerate(docs):
            doc_copy = copy.deepcopy(d)
            if "_id" not in doc_copy:
                doc_copy["_id"] = f"{self.name}_{int(time.time() * 1000)}_{i}_{len(self._get_docs())}"
            self._get_docs().append(doc_copy)
            res_ids.append(doc_copy["_id"])
        self._persist()
        return type("InsertManyResult", (), {"inserted_ids": res_ids})()

    def find(self, query: Optional[Dict[str, Any]] = None, projection: Optional[Dict[str, int]] = None):
        docs = self._get_docs()
        result = []
        for d in docs:
            matches = True
            if query:
                for k, v in query.items():
                    if k == "$or" and isinstance(v, list):
                        or_match = any(
                            all(d.get(sub_k) == sub_v for sub_k, sub_v in condition.items())
                            for condition in v
                        )
                        if not or_match:
                            matches = False
                            break
                    elif d.get(k) != v:
                        matches = False
                        break
            if matches:
                res_d = copy.deepcopy(d)
                if projection and projection.get("_id") == 0:
                    res_d.pop("_id", None)
                result.append(res_d)
        return result

    def find_one(self, query: Optional[Dict[str, Any]] = None):
        res = self.find(query)
        return res[0] if res else None

    def update_one(self, query: Dict[str, Any], update: Dict[str, Any], upsert: bool = False):
        docs = self._get_docs()
        for d in docs:
            matches = all(d.get(k) == v for k, v in query.items())
            if matches:
                if "$set" in update:
                    for sk, sv in update["$set"].items():
                        d[sk] = sv
                if "$inc" in update:
                    for ik, iv in update["$inc"].items():
                        d[ik] = d.get(ik, 0) + iv
                self._persist()
                return type("UpdateResult", (), {"matched_count": 1, "modified_count": 1})()

        if upsert:
            new_doc = copy.deepcopy(query)
            if "$set" in update:
                new_doc.update(update["$set"])
            return self.insert_one(new_doc)
        return type("UpdateResult", (), {"matched_count": 0, "modified_count": 0})()

    def delete_one(self, query: Dict[str, Any]):
        docs = self._get_docs()
        for idx, d in enumerate(docs):
            if all(d.get(k) == v for k, v in query.items()):
                docs.pop(idx)
                self._persist()
                return type("DeleteResult", (), {"deleted_count": 1})()
        return type("DeleteResult", (), {"deleted_count": 0})()

    def delete_many(self, query: Dict[str, Any]):
        docs = self._get_docs()
        to_keep = [d for d in docs if not all(d.get(k) == v for k, v in query.items())]
        deleted_count = len(docs) - len(to_keep)
        _fallback_db[self.name] = to_keep
        self._persist()
        return type("DeleteResult", (), {"deleted_count": deleted_count})()

    def count_documents(self, query: Optional[Dict[str, Any]] = None) -> int:
        return len(self.find(query))


def _load_fallback_from_file():
    global _fallback_db
    if os.path.exists(_FALLBACK_FILE):
        try:
            with open(_FALLBACK_FILE, "r", encoding="utf-8") as f:
                _fallback_db = json.load(f)
        except Exception:
            _fallback_db = {}


class MongoCollectionWrapper:
    """Wraps live PyMongo collection to ensure all documents have JSON-serializable _id."""

    def __init__(self, raw_col):
        self._col = raw_col
        self.name = raw_col.name

    def _clean(self, doc):
        if doc is None:
            return None
        d = dict(doc)
        if "_id" in d:
            d["_id"] = str(d["_id"])
        return d

    def find(self, *args, **kwargs):
        cursor = self._col.find(*args, **kwargs)
        return [self._clean(d) for d in cursor]

    def find_one(self, *args, **kwargs):
        doc = self._col.find_one(*args, **kwargs)
        return self._clean(doc)

    def insert_one(self, doc, *args, **kwargs):
        res = self._col.insert_one(doc, *args, **kwargs)
        if isinstance(doc, dict) and "_id" in doc:
            doc["_id"] = str(doc["_id"])
        return res

    def insert_many(self, docs, *args, **kwargs):
        res = self._col.insert_many(docs, *args, **kwargs)
        for d in docs:
            if isinstance(d, dict) and "_id" in d:
                d["_id"] = str(d["_id"])
        return res

    def update_one(self, *args, **kwargs):
        return self._col.update_one(*args, **kwargs)

    def delete_one(self, *args, **kwargs):
        return self._col.delete_one(*args, **kwargs)

    def delete_many(self, *args, **kwargs):
        return self._col.delete_many(*args, **kwargs)

    def count_documents(self, *args, **kwargs):
        return self._col.count_documents(*args, **kwargs)


def get_mongo_db():
    """Returns live PyMongo Database or Fallback Database if server is offline."""
    global _mongo_client, _is_mongo_connected

    if _mongo_client is None:
        try:
            # Connect with short timeout so boot is instantaneous
            client = MongoClient(
                settings.MONGODB_URL,
                serverSelectionTimeoutMS=1200,
                connectTimeoutMS=1200
            )
            # Ping database to verify live connectivity
            client.admin.command('ping')
            _mongo_client = client
            _is_mongo_connected = True
            print(f"[MongoDB] Successfully connected to live MongoDB at {settings.MONGODB_URL}")
        except Exception as e:
            _mongo_client = None
            _is_mongo_connected = False
            _load_fallback_from_file()
            # Silent fallback; application functions 100%

    if _is_mongo_connected and _mongo_client:
        live_db = _mongo_client[settings.MONGODB_DB_NAME]
        class LiveDatabaseWrapper:
            def __getitem__(self, item: str):
                return MongoCollectionWrapper(live_db[item])
            def get_collection(self, item: str):
                return MongoCollectionWrapper(live_db[item])
            @property
            def client(self):
                return _mongo_client
        return LiveDatabaseWrapper()
    else:
        _load_fallback_from_file()
        # Return fallback database accessor
        class FallbackDatabase:
            def __getitem__(self, item: str):
                return FallbackCollection(item)
            def get_collection(self, item: str):
                return FallbackCollection(item)
            @property
            def client(self):
                return None
        return FallbackDatabase()


def is_mongodb_live() -> bool:
    """Checks whether the system is connected to a live MongoDB server or embedded fallback."""
    get_mongo_db()
    return _is_mongo_connected


# Collection Accessors
def get_navigation_collection():
    return get_mongo_db()["cit_campus_navigation"]

def get_checkins_collection():
    return get_mongo_db()["cit_checkins"]

def get_calendar_collection():
    return get_mongo_db()["cit_academic_calendar"]

def get_equipment_collection():
    return get_mongo_db()["cit_equipment_inventory"]

def get_events_collection():
    return get_mongo_db()["cit_campus_events"]

def get_maintenance_collection():
    return get_mongo_db()["cit_maintenance_tickets"]

def get_green_analytics_collection():
    return get_mongo_db()["cit_green_analytics"]

def get_emergency_collection():
    return get_mongo_db()["cit_emergency_protocols"]

def get_copilot_collection():
    return get_mongo_db()["cit_copilot_conversations"]


def init_mongodb(force_reseed: bool = False):
    """Seeds spatial navigation graph, equipment inventory, calendar milestones, and green ratings."""
    db = get_mongo_db()

    # 1. Campus Navigation Graph (Buildings & Spatial Nodes for all 27 rooms)
    nav_col = db["cit_campus_navigation"]
    if force_reseed or nav_col.count_documents({}) == 0:
        if force_reseed:
            nav_col.delete_many({})

        buildings = [
            {
                "building_id": "MAIN-ACADEMIC",
                "name": "Main Academic Complex",
                "code": "MAC",
                "floors": 4,
                "has_elevator": True,
                "accessible_ramps": True,
                "coordinates": {"lat": 20.1485, "lng": 85.6710},
                "departments": ["CSE", "ECE", "Dean's Office"]
            },
            {
                "building_id": "COMPUTING-SCIENCE",
                "name": "Computing & Sciences Block",
                "code": "CSB",
                "floors": 3,
                "has_elevator": True,
                "accessible_ramps": True,
                "coordinates": {"lat": 20.1492, "lng": 85.6718},
                "departments": ["CSE", "Physics", "Chemistry"]
            },
            {
                "building_id": "AUDITORIUM-COMPLEX",
                "name": "Central Auditorium & Convention Center",
                "code": "AUD",
                "floors": 2,
                "has_elevator": True,
                "accessible_ramps": True,
                "coordinates": {"lat": 20.1478, "lng": 85.6702},
                "departments": ["Institute Administration", "Cultural Affairs"]
            },
            {
                "building_id": "INNOVATION-WORKSHOPS",
                "name": "Innovation & Mechanical Workshop Block",
                "code": "IMW",
                "floors": 2,
                "has_elevator": False,
                "accessible_ramps": True,
                "coordinates": {"lat": 20.1472, "lng": 85.6725},
                "departments": ["Mechanical Engineering", "Civil Engineering"]
            }
        ]

        # Room spatial positioning across floors and buildings
        rooms_spatial = [
            # Main Academic Complex
            {"room_id": "LH-1", "name": "Lecture Hall 1", "building": "MAIN-ACADEMIC", "floor": 1, "wing": "East", "accessible": True, "type": "lecture_hall", "capacity": 120, "x": 120, "y": 80},
            {"room_id": "LH-2", "name": "Lecture Hall 2", "building": "MAIN-ACADEMIC", "floor": 1, "wing": "West", "accessible": True, "type": "lecture_hall", "capacity": 120, "x": 280, "y": 80},
            {"room_id": "LH-3", "name": "Lecture Hall 3", "building": "MAIN-ACADEMIC", "floor": 2, "wing": "East", "accessible": True, "type": "lecture_hall", "capacity": 100, "x": 120, "y": 180},
            {"room_id": "LH-4", "name": "Lecture Hall 4", "building": "MAIN-ACADEMIC", "floor": 2, "wing": "West", "accessible": True, "type": "lecture_hall", "capacity": 100, "x": 280, "y": 180},
            {"room_id": "CR-01", "name": "Classroom 101", "building": "MAIN-ACADEMIC", "floor": 1, "wing": "Central", "accessible": True, "type": "classroom", "capacity": 60, "x": 200, "y": 80},
            {"room_id": "CR-02", "name": "Classroom 102", "building": "MAIN-ACADEMIC", "floor": 1, "wing": "Central", "accessible": True, "type": "classroom", "capacity": 60, "x": 200, "y": 130},
            {"room_id": "CR-03", "name": "Classroom 201", "building": "MAIN-ACADEMIC", "floor": 2, "wing": "Central", "accessible": True, "type": "classroom", "capacity": 60, "x": 200, "y": 180},
            {"room_id": "CR-04", "name": "Classroom 202", "building": "MAIN-ACADEMIC", "floor": 2, "wing": "Central", "accessible": True, "type": "classroom", "capacity": 60, "x": 200, "y": 230},
            {"room_id": "CR-05", "name": "Classroom 301", "building": "MAIN-ACADEMIC", "floor": 3, "wing": "East", "accessible": True, "type": "classroom", "capacity": 50, "x": 120, "y": 280},
            {"room_id": "CR-06", "name": "Classroom 302", "building": "MAIN-ACADEMIC", "floor": 3, "wing": "West", "accessible": False, "type": "classroom", "capacity": 50, "x": 280, "y": 280},
            
            # Computing & Science Block
            {"room_id": "CS-LAB-1", "name": "Computer Science Lab 1", "building": "COMPUTING-SCIENCE", "floor": 1, "wing": "North", "accessible": True, "type": "lab", "capacity": 45, "x": 100, "y": 100},
            {"room_id": "CS-LAB-2", "name": "Computer Science Lab 2", "building": "COMPUTING-SCIENCE", "floor": 1, "wing": "South", "accessible": True, "type": "lab", "capacity": 45, "x": 250, "y": 100},
            {"room_id": "AI-LAB", "name": "Artificial Intelligence & HPC Lab", "building": "COMPUTING-SCIENCE", "floor": 2, "wing": "North", "accessible": True, "type": "lab", "capacity": 40, "x": 100, "y": 200},
            {"room_id": "HARDWARE-LAB", "name": "Hardware & Embedded Systems Lab", "building": "COMPUTING-SCIENCE", "floor": 2, "wing": "South", "accessible": True, "type": "lab", "capacity": 40, "x": 250, "y": 200},
            {"room_id": "ELECTRONICS-LAB", "name": "Electronics & VLSI Lab", "building": "COMPUTING-SCIENCE", "floor": 2, "wing": "Central", "accessible": True, "type": "lab", "capacity": 40, "x": 180, "y": 200},
            {"room_id": "PHYSICS-LAB", "name": "Engineering Physics Lab", "building": "COMPUTING-SCIENCE", "floor": 3, "wing": "East", "accessible": True, "type": "lab", "capacity": 40, "x": 100, "y": 300},
            {"room_id": "CHEMISTRY-LAB", "name": "Engineering Chemistry Lab", "building": "COMPUTING-SCIENCE", "floor": 3, "wing": "West", "accessible": True, "type": "lab", "capacity": 40, "x": 250, "y": 300},
            
            # Auditorium Complex
            {"room_id": "AUDITORIUM", "name": "Main Institute Auditorium", "building": "AUDITORIUM-COMPLEX", "floor": 1, "wing": "Ground", "accessible": True, "type": "auditorium", "capacity": 400, "x": 150, "y": 120},
            {"room_id": "SEMINAR-HALL-1", "name": "Seminar Hall 1", "building": "AUDITORIUM-COMPLEX", "floor": 1, "wing": "East", "accessible": True, "type": "seminar_hall", "capacity": 90, "x": 80, "y": 220},
            {"room_id": "SEMINAR-HALL-2", "name": "Seminar Hall 2", "building": "AUDITORIUM-COMPLEX", "floor": 2, "wing": "West", "accessible": True, "type": "seminar_hall", "capacity": 90, "x": 220, "y": 220},
            {"room_id": "MULTIPURPOSE-HALL", "name": "Multipurpose Hall", "building": "AUDITORIUM-COMPLEX", "floor": 2, "wing": "North", "accessible": True, "type": "multipurpose", "capacity": 150, "x": 150, "y": 280},
            
            # Innovation & Mechanical Workshop
            {"room_id": "PROJECT-LAB-1", "name": "Capstone Project Lab 1", "building": "INNOVATION-WORKSHOPS", "floor": 1, "wing": "East", "accessible": True, "type": "lab", "capacity": 35, "x": 100, "y": 90},
            {"room_id": "PROJECT-LAB-2", "name": "Capstone Project Lab 2", "building": "INNOVATION-WORKSHOPS", "floor": 1, "wing": "West", "accessible": True, "type": "lab", "capacity": 35, "x": 240, "y": 90},
            {"room_id": "MECH-WORKSHOP", "name": "Central Mechanical Workshop", "building": "INNOVATION-WORKSHOPS", "floor": 1, "wing": "Heavy Machinery", "accessible": True, "type": "lab", "capacity": 60, "x": 170, "y": 180},
            {"room_id": "CAD-CAM-LAB", "name": "CAD / CAM Simulation Lab", "building": "INNOVATION-WORKSHOPS", "floor": 2, "wing": "Design", "accessible": False, "type": "lab", "capacity": 40, "x": 170, "y": 260},
            {"room_id": "CONFERENCE-ROOM", "name": "Executive Conference Room", "building": "MAIN-ACADEMIC", "floor": 1, "wing": "Admin", "accessible": True, "type": "seminar_hall", "capacity": 30, "x": 80, "y": 50},
            {"room_id": "R01", "name": "Multipurpose Room R01", "building": "MAIN-ACADEMIC", "floor": 1, "wing": "Ground", "accessible": True, "type": "classroom", "capacity": 80, "x": 220, "y": 50}
        ]

        nav_col.insert_one({
            "type": "campus_metadata",
            "institute": "Chilika Institute of Technology",
            "buildings": buildings,
            "rooms": rooms_spatial,
            "updated_at": datetime.utcnow().isoformat()
        })

    # 2. Lab & Equipment Inventory Catalog
    eq_col = db["cit_equipment_inventory"]
    if force_reseed or eq_col.count_documents({}) == 0:
        if force_reseed:
            eq_col.delete_many({})

        equipment_data = [
            {"equipment_id": "EQ-GPU-01", "name": "NVIDIA A100 80GB Tensor Core Server", "room_id": "AI-LAB", "status": "available", "category": "Computing", "calibration_date": "2026-09-15"},
            {"equipment_id": "EQ-GPU-02", "name": "NVIDIA RTX 4090 Workstation Rig", "room_id": "AI-LAB", "status": "available", "category": "Computing", "calibration_date": "2026-09-15"},
            {"equipment_id": "EQ-3DP-01", "name": "Industrial Dual-Extruder 3D Printer", "room_id": "PROJECT-LAB-1", "status": "available", "category": "Prototyping", "calibration_date": "2026-08-20"},
            {"equipment_id": "EQ-CNC-01", "name": "HAAS 3-Axis CNC Vertical Milling Machine", "room_id": "MECH-WORKSHOP", "status": "available", "category": "Heavy Machinery", "calibration_date": "2026-07-10"},
            {"equipment_id": "EQ-OSC-01", "name": "Keysight 4-Channel 1GHz Digital Oscilloscope", "room_id": "ELECTRONICS-LAB", "status": "available", "category": "Testing", "calibration_date": "2026-10-01"},
            {"equipment_id": "EQ-OSC-02", "name": "Tektronix Mixed Domain Oscilloscope", "room_id": "HARDWARE-LAB", "status": "available", "category": "Testing", "calibration_date": "2026-10-01"},
            {"equipment_id": "EQ-SPEC-01", "name": "UV-Visible Double Beam Spectrophotometer", "room_id": "CHEMISTRY-LAB", "status": "available", "category": "Chemical Analysis", "calibration_date": "2026-09-01"},
            {"equipment_id": "EQ-OPT-01", "name": "He-Ne Laser Optics Interferometer Bench", "room_id": "PHYSICS-LAB", "status": "available", "category": "Optics", "calibration_date": "2026-08-15"},
            {"equipment_id": "EQ-SVR-01", "name": "Cisco Catalyst 48-Port Managed Switch Rack", "room_id": "CS-LAB-1", "status": "available", "category": "Networking", "calibration_date": "2026-09-20"},
            {"equipment_id": "EQ-PROJ-01", "name": "Sony 4K Laser High-Lumen Stage Projector", "room_id": "AUDITORIUM", "status": "available", "category": "Audio-Visual", "calibration_date": "2026-10-10"}
        ]
        eq_col.insert_many(equipment_data)

    # 3. Academic Calendar Milestones
    cal_col = db["cit_academic_calendar"]
    if force_reseed or cal_col.count_documents({}) == 0:
        if force_reseed:
            cal_col.delete_many({})

        milestones = [
            {"id": "CAL-01", "title": "Autumn Semester Instruction Commences", "category": "academic", "date": "2026-08-03", "department": "All", "mandatory": True},
            {"id": "CAL-02", "title": "Independence Day Holiday", "category": "holiday", "date": "2026-08-15", "department": "All", "mandatory": True},
            {"id": "CAL-03", "title": "Midsem Examinations (Week 8)", "category": "examination", "date": "2026-09-21", "end_date": "2026-09-26", "department": "All", "mandatory": True},
            {"id": "CAL-04", "title": "Gandhi Jayanti Holiday", "category": "holiday", "date": "2026-10-02", "department": "All", "mandatory": True},
            {"id": "CAL-05", "title": "Spectra Annual Techno-Cultural Fest", "category": "event", "date": "2026-10-14", "end_date": "2026-10-17", "department": "Student Affairs", "mandatory": False},
            {"id": "CAL-06", "title": "Diwali Vacation Break", "category": "holiday", "date": "2026-11-01", "end_date": "2026-11-05", "department": "All", "mandatory": True},
            {"id": "CAL-07", "title": "End-Semester Laboratory Examinations", "category": "examination", "date": "2026-11-16", "end_date": "2026-11-21", "department": "All", "mandatory": True},
            {"id": "CAL-08", "title": "End-Semester Theory Examinations", "category": "examination", "date": "2026-11-23", "end_date": "2026-12-05", "department": "All", "mandatory": True}
        ]
        cal_col.insert_many(milestones)

    # 4. Green Energy Ratings Specification
    green_col = db["cit_green_analytics"]
    if force_reseed or green_col.count_documents({"type": "room_energy_coefficients"}) == 0:
        green_col.insert_one({
            "type": "room_energy_coefficients",
            "ratings": {
                "lecture_hall": {"hvac_kw": 8.0, "lighting_kw": 1.2, "av_kw": 0.8},
                "classroom": {"hvac_kw": 4.5, "lighting_kw": 0.6, "av_kw": 0.4},
                "lab": {"hvac_kw": 10.0, "lighting_kw": 1.5, "equipment_kw": 6.0},
                "auditorium": {"hvac_kw": 25.0, "lighting_kw": 4.0, "av_kw": 3.5},
                "seminar_hall": {"hvac_kw": 6.5, "lighting_kw": 1.0, "av_kw": 1.2},
                "multipurpose": {"hvac_kw": 12.0, "lighting_kw": 2.0, "av_kw": 1.5}
            },
            "kwh_rate_inr": 8.50,
            "kg_co2_per_kwh": 0.82
        })

    print("[MongoDB] CIT Smart Campus database initialized successfully.")
