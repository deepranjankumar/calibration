from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

# Handle sqlite vs postgresql connection parameters
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    from app.models import examination
    from sqlalchemy import text
    Base.metadata.create_all(bind=engine)
    try:
        with engine.connect() as conn:
            result = conn.execute(text("PRAGMA table_info(examination_steps);")).fetchall()
            columns = [r[1] for r in result]
            if "patient_question_hi" not in columns:
                conn.execute(text("ALTER TABLE examination_steps ADD COLUMN patient_question_hi TEXT;"))
                conn.commit()
    except Exception:
        pass
