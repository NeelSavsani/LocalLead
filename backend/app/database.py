import os
import sqlite3
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "locallead.db")
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"

def migrate_db_schema():
    """Ensure missing columns are added to existing SQLite database tables seamlessly."""
    if not os.path.exists(DB_PATH):
        return

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    try:
        # Check businesses table
        cur.execute("PRAGMA table_info(businesses)")
        cols = [info[1] for info in cur.fetchall()]
        if "sources_count" not in cols:
            cur.execute("ALTER TABLE businesses ADD COLUMN sources_count INTEGER DEFAULT 1")
        if "source_providers" not in cols:
            cur.execute("ALTER TABLE businesses ADD COLUMN source_providers VARCHAR DEFAULT 'openstreetmap'")

        # Check website_analyses table
        cur.execute("PRAGMA table_info(website_analyses)")
        w_cols = [info[1] for info in cur.fetchall()]
        if "digital_presence_status" not in w_cols:
            cur.execute("ALTER TABLE website_analyses ADD COLUMN digital_presence_status VARCHAR DEFAULT 'NO_WEBSITE'")

        # Check leads table
        cur.execute("PRAGMA table_info(leads)")
        l_cols = [info[1] for info in cur.fetchall()]
        if "data_confidence" not in l_cols:
            cur.execute("ALTER TABLE leads ADD COLUMN data_confidence INTEGER DEFAULT 80")

        conn.commit()
    except Exception as e:
        print("Schema migration warning:", e)
    finally:
        conn.close()

# Execute auto-migration whenever database module is imported
migrate_db_schema()

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False, "timeout": 30}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
