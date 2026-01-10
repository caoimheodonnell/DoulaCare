# backend/db.py
from sqlmodel import SQLModel, create_engine, Session
from dotenv import load_dotenv
import os

# Load .env
load_dotenv()

DATABASE_URL = os.getenv("SUPABASE_DB_URL")
print("DATABASE_URL =", DATABASE_URL)

# Create engine
engine = create_engine(DATABASE_URL, echo=True)

# Import ALL models so SQLModel knows about them
from backend.models.user import User
from backend.models.booking import Booking

def get_session():
    with Session(engine) as session:
        yield session

def init_db():
    print("Creating tables in Supabase…")
    SQLModel.metadata.create_all(engine)
    print("Done.")

if __name__ == "__main__":
    init_db()



