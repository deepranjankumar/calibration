import os
from pathlib import Path
from dataclasses import dataclass, field

BASE_DIR = Path(__file__).resolve().parent.parent

@dataclass
class Settings:
    PROJECT_NAME: str = "AI-Driven Physical Examination System"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"
    
    # Storage & DB
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'physical_exam.db'}")
    
    # Uploads & Assets
    UPLOAD_DIR: Path = BASE_DIR / "uploads"
    STATIC_DIR: Path = BASE_DIR / "static"
    MODELS_DIR: Path = BASE_DIR / "models"
    SAMPLE_DATA_DIR: Path = BASE_DIR / "sample_data"
    
    # MediaPipe pose model path
    POSE_MODEL_PATH: Path = BASE_DIR / "models" / "pose_landmarker_full.task"
    
    # CORS
    CORS_ORIGINS: list[str] = field(default_factory=lambda: [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ])
    
    # Clinical limits & thresholds
    MIN_CONFIDENCE_THRESHOLD: float = 0.55
    CRITICAL_CONFIDENCE_WARNING: float = 0.40

    # AI Model Key
    AI_API_KEY: str = os.getenv("AI_API_KEY", "972008f37d754beb89ed92cd1d675a7a.dQAJ0eTAUvnOl44xX2diGvl1")

settings = Settings()

# Ensure directories exist
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
settings.STATIC_DIR.mkdir(parents=True, exist_ok=True)
settings.MODELS_DIR.mkdir(parents=True, exist_ok=True)
settings.SAMPLE_DATA_DIR.mkdir(parents=True, exist_ok=True)
