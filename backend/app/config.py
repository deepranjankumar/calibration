import os
from pathlib import Path
from dataclasses import dataclass, field

BASE_DIR = Path(__file__).resolve().parent.parent
PROJECT_ROOT = BASE_DIR.parent

# Load .env from project root if present
root_env_path = PROJECT_ROOT / ".env"
if root_env_path.exists():
    try:
        with open(root_env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    k = k.strip()
                    v = v.strip().strip("'\"")
                    if k:
                        os.environ.setdefault(k, v)
    except Exception as e:
        print(f"[config] Notice: Could not read .env: {e}")

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

    # Ollama Cloud LLM Configuration
    OLLAMA_CLOUD_API: str = os.getenv(
        "OLLAMA_CLOUD_API",
        "158766c54d1e411aa1fa9e2628d07036.LpApsQ-rnBlYANE0qD1nKPdh"
    )
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "https://ollama.com")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "nemotron-3-nano:30b")

    # AI Model Key
    AI_API_KEY: str = os.getenv("AI_API_KEY", "972008f37d754beb89ed92cd1d675a7a.dQAJ0eTAUvnOl44xX2diGvl1")

settings = Settings()

# Ensure directories exist
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
settings.STATIC_DIR.mkdir(parents=True, exist_ok=True)
settings.MODELS_DIR.mkdir(parents=True, exist_ok=True)
settings.SAMPLE_DATA_DIR.mkdir(parents=True, exist_ok=True)
