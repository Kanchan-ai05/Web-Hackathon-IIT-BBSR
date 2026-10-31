import os

class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./cit_schedule.db")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "cit-super-secret-jwt-key-2027")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
    DATA_PATH: str = os.getenv("DATA_PATH", os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "cit_public.json"))
    MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    MONGODB_DB_NAME: str = os.getenv("MONGODB_DB_NAME", "cit_smart_campus")

settings = Settings()
