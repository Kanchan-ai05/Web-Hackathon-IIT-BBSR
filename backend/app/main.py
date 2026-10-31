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

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
    """Auto-seed dataset if database is empty."""
    from .database import SessionLocal
    db = SessionLocal()
    try:
        if db.query(Room).count() == 0:
            print("Database empty on startup. Initializing CIT dataset...")
            init_db()
    except Exception as e:
        print(f"Startup database initialization warning: {e}")
    finally:
        db.close()

@app.get("/api/health")
def healthcheck():
    return {
        "status": "healthy",
        "service": "cit-scheduling-backend",
        "institute": "Chilika Institute of Technology"
    }
