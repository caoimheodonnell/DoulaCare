# From Youtube Video "How to connect to an online MySQL database using FastAPI" - 2:15
# From Youtube Video "How to Create a FastAPI & React Project - Python Backend + React Frontend" - 10 minutes
# How I adapted the code for DoulaCare
# Uses SQLModel connecting to a single SQL URL engine
# Enables CORs for both my react vite and react native
# For my static file - Youtube video - Python FastAPI Tutorial #12 How to serve static files in FastAPI


from fastapi import FastAPI,Depends, HTTPException, Query,UploadFile, File
from fastapi.staticfiles import StaticFiles
from sqlmodel import SQLModel, Session, create_engine, select
from typing import List,Optional
from contextlib import asynccontextmanager
from backend.settings import MYSQL_URL
from backend.models.user import User
from fastapi.middleware.cors import CORSMiddleware
from .models.service import Service
from .db import get_session
from .models.booking import Booking
from pathlib import Path
from uuid import uuid4
import shutil
from datetime import datetime, timezone
# Create a database connection engine using the MySQL URL from settings.py
# echo=True prints SQL statements in the terminal for debugging
engine = create_engine(MYSQL_URL, echo=True)






# This function makes sure the database and tables are created before the app starts
def create_db_and_tables():
    SQLModel.metadata.create_all(engine)


# Lifespan context handles startup and shutdown events for the FastAPI app
# It runs create_db_and_tables() when the app starts
@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield
#For my certifcates uploads
app = FastAPI(title="DoulaCare API", lifespan=lifespan)
BASE_DIR = Path(__file__).parent
STATIC_DIR = BASE_DIR / "static"
CERT_DIR = STATIC_DIR / "certificates"
CERT_DIR.mkdir(parents=True, exist_ok=True)


#for my booking system
def to_naive_utc(dt: datetime | None) -> datetime | None:
    if dt is None:
        return None
    # convert aware -> UTC -> drop tzinfo
    if dt.tzinfo is not None:
        return dt.astimezone(timezone.utc).replace(tzinfo=None)
    # already naive: assume it's local; keep it as-is or normalize if you prefer
    return dt

#Youtube video-Python FastAPI Tutorial #12 How to serve static files in FastAPI
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")
print("STATIC_DIR:", STATIC_DIR)


# CORS (Cross-Origin Resource Sharing)
origins = [
    # Vite web
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",

    # Expo (LAN & protocol) — adjust IP to your machine if needed
    "http://172.20.10.2:5173",
    "http://172.20.10.2:8081",
    "exp://172.20.10.2",

    # Expo Web (local)
    "http://localhost:8081",
    "http://127.0.0.1:8081",
    "http://localhost:8082",
    "http://127.0.0.1:8082",
    "http://localhost:8083", "http://127.0.0.1:8083",

    # Expo DevTools / Web Preview
    "http://localhost:19006",
    "http://127.0.0.1:19006",
    "http://localhost:19000",
    "http://127.0.0.1:19000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Where static files live:  .../backend/static
BASE_DIR = Path(__file__).parent
STATIC_DIR = BASE_DIR / "static"
CERT_DIR = STATIC_DIR / "certificates"
CERT_DIR.mkdir(parents=True, exist_ok=True)

# Serve static files (so /static/... works in the browser)
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")
print("STATIC_DIR:", STATIC_DIR)

@app.post("/upload/certificate")
async def upload_certificate(file: UploadFile = File(...)):
    # only PDFs for now
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    # save with random name to avoid collisions
    filename = f"{uuid4()}.pdf"
    dest = CERT_DIR / filename
    with dest.open("wb") as out:
        shutil.copyfileobj(file.file, out)

    # return a path under /static so the frontend can open it directly
    return {"url": f"/static/certificates/{filename}"}


# POST endpoint to add a new user to the database
@app.post("/users", response_model=User)
@app.post("/users/", response_model=User)
def create_user(user: User):
    with Session(engine) as session:
        session.add(user)
        session.commit()
        session.refresh(user)  # Get the newly added user with its ID
        return user


# GET endpoint to retrieve all users from the database
@app.get("/users", response_model=List[User])
@app.get("/users/", response_model=List[User])
def get_users():
    with Session(engine) as session:
        users = session.exec(select(User)).all()
        return users


# Root endpoint to test if the backend is running
@app.get("/")
def root():
    return {"message": "Backend connected successfully!"}

@app.post("/services", response_model=Service)
@app.post("/services/", response_model=Service)
def create_service(service: Service):
    with Session(engine) as session:
        # optional: ensure doula exists
        doula = session.get(User, service.doula_id)
        if not doula or doula.role != "doula":
            raise HTTPException(status_code=400, detail="Invalid doula_id")
        session.add(service)
        session.commit()
        session.refresh(service)
        return service

# List all services with filter
@app.get("/services", response_model=List[Service])
@app.get("/services/", response_model=List[Service])
def list_services_filtered(
    doula_id: Optional[int] = None,
    is_bundle: Optional[bool] = None,
    max_price: Optional[float] = Query(None, ge=0),
    q: Optional[str] = None,                  # search name/description
    sort_by: Optional[str] = Query(None, regex="^(price|name|duration)$"),
):
    with Session(engine) as session:
        stmt = select(Service)

        if doula_id is not None:
            stmt = stmt.where(Service.doula_id == doula_id)

        if is_bundle is not None:
            stmt = stmt.where(Service.is_bundle == is_bundle)

        if max_price is not None:
            stmt = stmt.where(Service.price.is_not(None)).where(Service.price <= max_price)

        if q:
            like = f"%{q}%"
            stmt = stmt.where(
                (Service.name.ilike(like)) | (Service.description.ilike(like))
            )

        if sort_by:
            col = {
                "price": Service.price,
                "name": Service.name,
                "duration": Service.duration_minutes,
            }[sort_by]
            stmt = stmt.order_by(col)   # ascending

        return session.exec(stmt).all()

# List services by doula (good for profile screen)
@app.get("/doulas/{doula_id}/services", response_model=List[Service])
@app.get("/doulas/{doula_id}/services/", response_model=List[Service])
def get_services_for_doula(doula_id: int):
    with Session(engine) as session:
        return session.exec(
            select(Service).where(Service.doula_id == doula_id)
        ).all()


# main.py
from datetime import datetime, timezone
from fastapi import HTTPException
import logging

log = logging.getLogger("uvicorn.error")

def parse_iso_dt(value: datetime | str | None) -> datetime | None:
    """Accepts datetime or ISO string ('...Z' or with offset). Returns datetime."""
    if value is None:
        return None
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        s = value.strip()
        # RN .toISOString() ends with 'Z' (UTC). Python fromisoformat wants '+00:00'
        if s.endswith("Z"):
            s = s[:-1] + "+00:00"
        try:
            return datetime.fromisoformat(s)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid datetime format: {value}. Use ISO-8601, e.g. 2025-11-01T14:00:00 or 2025-11-01T14:00:00Z",
            )
    raise HTTPException(status_code=400, detail="Invalid datetime value")

def to_naive_utc(dt: datetime | None) -> datetime | None:
    if dt is None:
        return None
    # if aware, convert to UTC then drop tz; if naive, leave as-is (assume local/UTC per your choice)
    if dt.tzinfo is not None:
        return dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt

@app.post("/bookings", response_model=Booking)
def create_booking(booking: Booking):
    with Session(engine) as session:
        mother = session.get(User, booking.mother_id)
        doula  = session.get(User, booking.doula_id)
        if not mother or mother.role != "mother":
            raise HTTPException(status_code=400, detail="Invalid mother_id")
        if not doula or doula.role != "doula":
            raise HTTPException(status_code=400, detail="Invalid doula_id")

        # NEW: parse strings -> datetime
        starts = parse_iso_dt(booking.starts_at)
        ends   = parse_iso_dt(booking.ends_at)

        # Normalize for MySQL
        booking.starts_at = to_naive_utc(starts)
        booking.ends_at   = to_naive_utc(ends)

        try:
            session.add(booking)
            session.commit()
            session.refresh(booking)
            return booking
        except Exception as e:
            log.exception("BOOKING INSERT FAILED")
            raise HTTPException(status_code=500, detail=f"{type(e).__name__}: {e}")




# List all bookings (useful for debugging)
@app.get("/bookings", response_model=List[Booking])
@app.get("/bookings/", response_model=List[Booking])
def get_bookings():
    with Session(engine) as session:
        return session.exec(select(Booking)).all()

# List bookings by mother
@app.get("/bookings/by-mother/{mother_id}/details")
def get_bookings_for_mother_detailed(mother_id: int):
    with Session(engine) as session:
        mother = session.get(User, mother_id)
        if not mother or mother.role != "mother":
            raise HTTPException(404, "Mother not found")

        bookings = session.exec(
            select(Booking).where(Booking.mother_id == mother_id)
        ).all()
        # Ensures mothers can see full doula names after bookings not just ID
        result = []
        for b in bookings:
            doula = session.get(User, b.doula_id)
            result.append({
                "booking_id": b.id,
                "doula_name": doula.name if doula else None,
                "verified": doula.verified if doula else None,
                "starts_at": b.starts_at,
                "ends_at": b.ends_at,
                "mode": b.mode,
                "status": b.status
            })

        return result


# List bookings by doula
@app.get("/bookings/by-doula/{doula_id}")
@app.get("/bookings/by-doula/{doula_id}/")
def get_bookings_for_doula(doula_id: int):
    with Session(engine) as session:
        # ensure the doula exists
        doula = session.get(User, doula_id)
        if not doula or doula.role != "doula":
            raise HTTPException(404, "Doula not found")

        # get all bookings for this doula
        bookings = session.exec(
            select(Booking).where(Booking.doula_id == doula_id)
        ).all()

        # includes bookings with mother details not just id so its clear to the doula
        result = []
        for b in bookings:
            mother = session.get(User, b.mother_id)
            result.append({
                "booking_id": b.id,
                "mother_name": mother.name if mother else None,
                "location": mother.location if mother else None,
                "starts_at": b.starts_at,
                "ends_at": b.ends_at,
                "mode": b.mode,
                "status": b.status
            })

        return result

@app.put("/users/{user_id}", response_model=User)
@app.put("/users/{user_id}/", response_model=User)
def update_user(user_id: int, updated_user: User):
    with Session(engine) as session:
        user = session.get(User, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Update only the fields provided
        for key, value in updated_user.dict(exclude_unset=True).items():
            setattr(user, key, value)

        session.add(user)
        session.commit()
        session.refresh(user)
        return user

@app.get("/doulas", response_model=List[User])
@app.get("/doulas/", response_model=List[User])
def get_doulas(
    verified: bool = True,
    location: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    q: Optional[str] = None,   # for text search
    sort_by: Optional[str] = None
):
    with Session(engine) as session:
        stmt = select(User).where(User.role == "doula")

        if verified:
            stmt = stmt.where(User.verified == True)

        if location:
            stmt = stmt.where(User.location.ilike(f"%{location}%"))

        # New min_price support
        if min_price is not None:
            stmt = stmt.where(User.price >= min_price)

        if max_price is not None:
            stmt = stmt.where(User.price <= max_price)

        # Search term (name, location, etc.)
        if q:
            like = f"%{q}%"
            stmt = stmt.where(
                (User.name.ilike(like)) |
                (User.location.ilike(like)) |
                (User.qualifications.ilike(like)) |
                (User.services.ilike(like))
            )

        # Sorting support
        if sort_by == "price":
            stmt = stmt.order_by(User.price)
        elif sort_by == "name":
            stmt = stmt.order_by(User.name)
        elif sort_by == "location":
            stmt = stmt.order_by(User.location)

        return session.exec(stmt).all()


# Get a single doula by id for clickable profiles
@app.get("/doulas/{doula_id}", response_model=User)
@app.get("/doulas/{doula_id}/", response_model=User)
def get_doula_by_id(doula_id: int):
    with Session(engine) as session:
        doula = session.get(User, doula_id)
        if not doula or doula.role != "doula":
            raise HTTPException(status_code=404, detail="Doula not found")
        return doula


from typing import List

@app.get("/__debug/static")
def debug_static():
    cert_dir = STATIC_DIR / "certificates"
    files: List[str] = []
    if cert_dir.exists():
        files = [p.name for p in cert_dir.glob("*")]
    return {
        "static_dir": str(STATIC_DIR),
        "certificates_dir_exists": cert_dir.exists(),
        "files_in_certificates": files,
        "has_1_pdf": (cert_dir / "1.pdf").exists(),
    }

