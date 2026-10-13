import os
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from app.core.config import settings

db_url = settings.DATABASE_URL
connect_args = {}

if db_url.startswith("sqlite"):
    connect_args["check_same_thread"] = False
    # If a relative sqlite file is given, resolve it relative to backend root
    if db_url.startswith("sqlite:///") and ":memory:" not in db_url:
        path_part = db_url[len("sqlite:///"):]
        if not os.path.isabs(path_part):
            backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            abs_db_path = os.path.normpath(os.path.join(backend_dir, path_part.lstrip("./\\")))
            # Ensure parent directory exists
            os.makedirs(os.path.dirname(abs_db_path), exist_ok=True)
            db_url = f"sqlite:///{abs_db_path.replace(os.sep, '/')}"

engine = create_engine(
    db_url,
    echo=False,
    pool_pre_ping=True,
    connect_args=connect_args,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
