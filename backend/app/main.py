import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .loader import init_db
from .models import Room
from .routers import auth_router, admin_router, timetable_router, booking_router

# Initialize tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Chilika Institute of Technology (CIT) - Scheduling & Venue API",
    description="Backend API for CIT Timetable Generation, Exam Scheduling, and Venue Booking Management.",
    version="1.0.0"
)

# Configure CORS: allow specific frontend domain in production or all in dev
origins_env = os.getenv("ALLOWED_ORIGINS") or os.getenv("FRONTEND_URL")
if origins_env:
    allow_origins = [orig.strip() for orig in origins_env.split(",") if orig.strip()]
else:
    allow_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth_router.router)
app.include_router(admin_router.router)
app.include_router(timetable_router.router)
app.include_router(booking_router.router)

@app.on_event("startup")
def on_startup():
    """Auto-seed dataset and timetable if database is fresh so deployment is never empty."""
    import json
    from .database import SessionLocal
    from .models import TimetableSlot
    db = SessionLocal()
    try:
        if db.query(Room).count() == 0:
            print("Database empty on startup. Initializing CIT dataset...")
            init_db()

        if db.query(TimetableSlot).count() == 0:
            print("Timetable slots empty on startup. Loading initial timetable...")
            sched_path = os.path.join(os.getcwd(), "exports", "schedule.json")
            if not os.path.exists(sched_path):
                sched_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "exports", "schedule.json")
            if os.path.exists(sched_path):
                with open(sched_path, "r", encoding="utf-8") as f:
                    sc = json.load(f)
                for s in sc.get("timetable", []):
                    ts = TimetableSlot(
                        session_id=s["session_id"],
                        day=s["day"],
                        start_period=s["start_period"],
                        room_id=s["room_id"]
                    )
                    db.add(ts)
                db.commit()
    except Exception as e:
        print(f"Startup database initialization warning: {e}")
    finally:
        db.close()

@app.get("/health")
@app.get("/api/health")
def healthcheck():
    """Health check endpoint for Render, Railway, Vercel, and keep-alive pings."""
    return {
        "status": "healthy",
        "service": "cit-scheduling-backend",
        "institute": "Chilika Institute of Technology"
    }
