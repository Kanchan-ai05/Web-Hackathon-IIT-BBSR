import os

class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./cit_schedule.db")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "cit-super-secret-jwt-key-2027")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
    DATA_PATH: str = os.getenv("DATA_PATH", os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "cit_public.json"))

settings = Settings()
