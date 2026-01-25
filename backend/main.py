"""

What this file does:
- Creates a SQLModel engine for MySQL using settings from `backend.settings.MYSQL_URL`.
- Serves static files from `/static`, including uploaded PDF certificates  and images under `/static/certificates`.
- Enables CORS for local Vite and Expo - React Native development.
- Shows endpoints for:
  - Users
  - Doulas
  - Bookings

References used while building this:
- YouTube: "How to connect to an online MySQL database using FastAPI" (engine + session patterns)- 2.15-https://www.youtube.com/watch?v=QuaNqXi-OwM
- YouTube: "How to Create a FastAPI & React Project - Python Backend and React Frontend" (project wiring and startup)-10 minutes-https://www.youtube.com/watch?v=aSdVU9-SxH4&t=648s
- YouTube: "Python FastAPI Tutorial #12 How to serve static files in FastAPI" (static mounting)-https://www.youtube.com/watch?v=nylnxFn1_U0
- ChatGPT for booking date error fix - https://chatgpt.com/c/6909d8e0-3bc0-8327-81dc-c1a4bebc6b8b
-ChatGPT debugging statement for certificates - https://chatgpt.com/c/690b7959-8ce0-8333-81a2-da437a26163b
- Upload certificate file https://fastapi.tiangolo.com/tutorial/request-files/#file-parameters-with-uploadfile
- Helped the chat backend - https://www.youtube.com/watch?v=nZhAW-JQ8NM
- For voice navigation backedn function - https://medium.com/@bnhminh_38309/build-a-fastapi-backend-for-speech-to-text-transcription-with-openai-whisper-4de7f082ab6e
- Errror handlign for voice navigatio - https://chatgpt.com/c/691b2910-cc30-8325-bc1a-027aa7947a2c
- Payment using STripe - https://medium.com/@abdulikram/building-a-payment-backend-with-fastapi-stripe-checkout-and-webhooks-08dc15a32010
- Review - https://fastapi.tiangolo.com/tutorial/query-params/#required-query-parameters
"""



from fastapi import FastAPI,Depends, HTTPException, Query,UploadFile, File, Request
from fastapi.staticfiles import StaticFiles
from sqlmodel import SQLModel, Session, create_engine, select
from typing import List,Optional,Dict, Any
from sqlalchemy import desc
from contextlib import asynccontextmanager
from backend.models.user import User
#to allow web/mobile development origins
from fastapi.middleware.cors import CORSMiddleware
from backend.db import engine, get_session
from collections import deque
from .models.booking import Booking
from pathlib import Path
#Random filenames for uploads
from uuid import uuid4
#file copy for uploads
import shutil
from fastapi.responses import JSONResponse
from datetime import datetime, timezone
from fastapi.routing import APIRoute
from fastapi import WebSocket, WebSocketDisconnect
from backend.chat import manager
import requests
from dotenv import load_dotenv
import os
from sqlalchemy import and_
import stripe
from pydantic import BaseModel
from backend.schemas import ReviewCreate
from backend.models.review import Review
from backend.models.favourite import Favourite
from backend.models.message import Message



class CheckoutRequest(BaseModel):
    booking_id: int



#Voice Navigation -https://medium.com/@bnhminh_38309/build-a-fastapi-backend-for-speech-to-text-transcription-with-openai-whisper-4de7f082ab6e
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")



# This function makes sure the database and tables are created before the app starts
#From Youtube Video "How to connect to an online MySQL database using FastAPI"-https://www.youtube.com/watch?v=QuaNqXi-OwM- 3mins
def create_db_and_tables():
    SQLModel.metadata.create_all(engine)


#From Youtube Video "How to connect to an online MySQL database using FastAPI"-https://www.youtube.com/watch?v=QuaNqXi-OwM- 3mins
# It runs create_db_and_tables() when the app starts
@asynccontextmanager
async def lifespan(app: FastAPI):
    yield

#For my certifcates uploads
#"Python FastAPI Tutorial #12 How to serve static files in FastAPI"- https://www.youtube.com/watch?v=nylnxFn1_U0
#Certificates are stored under static/certificates
app = FastAPI(title="DoulaCare API", lifespan=lifespan)
BASE_DIR = Path(__file__).parent
STATIC_DIR = BASE_DIR / "static"
CERT_DIR = STATIC_DIR / "certificates"
IMAGE_DIR  = STATIC_DIR / "images"
CERT_DIR.mkdir(parents=True, exist_ok=True)
IMAGE_DIR.mkdir(parents=True, exist_ok=True)


ENV_PATH = BASE_DIR / ".env"
load_dotenv(dotenv_path=ENV_PATH)

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
print("OPENAI_API_KEY loaded?", bool(OPENAI_API_KEY))


stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
print("STRIPE key loaded?", bool(stripe.api_key))

#Youtube video-Python FastAPI Tutorial #12 How to serve static files in FastAPI-https://www.youtube.com/watch?v=nylnxFn1_U0
#anything inside STATIC_DIR is served under this path
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")
print("STATIC_DIR:", STATIC_DIR)


@app.middleware("http")
async def log_requests(request, call_next):
    print("========== NEW REQUEST ==========")
    print(f"URL: {request.url}")
    print(f"Client: {request.client.host}")
    print(f"Method: {request.method}")
    # you can comment this out if too noisy:
    # print(f"Headers: {dict(request.headers)}")

    response = await call_next(request)

    print(f"Status code: {response.status_code}")
    print("=================================")
    return response

# CORS (Cross-Origin Resource Sharing)
#Allow local vite and Expo development origins
##https://www.youtube.com/watch?v=aSdVU9-SxH4&t=648s - 12 minutes for origins adapted to my own
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

# Enable Cross-Origin Resource Sharing (CORS) for the frontend app
# This allows the React Native / web frontend (e.g., localhost:3000) to call the FastAPI backend (localhost:8000)
# From YouTube: "FastAPI CORS Middleware explained" - https://www.youtube.com/watch?v=aSdVU9-SxH4&t=648s - 13 mins
# Official docs: https://fastapi.tiangolo.com/tutorial/cors/
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#Uploads certificates PDF only
#Returns a URL under static/certificates for the frontend to open
#Helped wiht upload cdertificate https://fastapi.tiangolo.com/tutorial/request-files/#file-parameters-with-uploadfile
@app.post("/upload/certificate")
async def upload_certificate(file: UploadFile = File(...)):
    # only PDFs for now
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    # save with random name to avoid collisions
    filename = f"{uuid4()}.pdf"
    dest = CERT_DIR / filename
    #avoids reading entire file into memory at once
    with dest.open("wb") as out:
        shutil.copyfileobj(file.file, out)

    # return a path under /static so the frontend can open it directly
    return {"url": f"/static/certificates/{filename}"}

ALLOWED_IMAGE_MIME = {"image/jpeg", "image/png", "image/webp"}
EXT_BY_MIME = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}

@app.post("/upload/photo")
async def upload_photo(file: UploadFile = File(...)):
    if file.content_type not in ALLOWED_IMAGE_MIME:
        raise HTTPException(status_code=400, detail="Only JPG/PNG/WebP allowed")
    filename = f"{uuid4()}{EXT_BY_MIME[file.content_type]}"
    dest = IMAGE_DIR / filename
    with dest.open("wb") as out:
        shutil.copyfileobj(file.file, out)
    return {"url": f"/static/images/{filename}"}

# POST endpoint to add a new user to the database
#Create a new user
#double /users /users/ - avoids “Not Found” errors
#understanding the basice get and post method - https://www.youtube.com/watch?v=aSdVU9-SxH4&t=648s
@app.post("/users", response_model=User)
@app.post("/users/", response_model=User)
def create_user(user: User):
    with Session(engine) as session:
        session.add(user)
        session.commit()       # Go to DB
        session.refresh(user)  # Get the newly added user with its ID
        return user


# GET endpoint to retrieve all users from the database
@app.get("/users", response_model=List[User])
@app.get("/users/", response_model=List[User])
def get_users():
    with Session(engine) as session:
        users = session.exec(select(User)).all()
        return users

#Update a user by record id
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


# Root endpoint to test if the backend is running
@app.get("/")
def root():
    return {"message": "Backend connected successfully!"}



#ChatGpt conversation= https://chatgpt.com/c/6909d8e0-3bc0-8327-81dc-c1a4bebc6b8b
#AFter date error had to handle the sting to go to datetime format so needed help understanding parsa and to native
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

# Create a booking
#Validates mother_id/doula_id
#Stores tz-naive datetimes not strings
@app.post("/bookings", response_model=Booking)
def create_booking(booking: Booking):
    with Session(engine) as session:
        mother = session.get(User, booking.mother_id)
        doula  = session.get(User, booking.doula_id)

        if not mother or mother.role != "mother":
            raise HTTPException(status_code=400, detail="Invalid mother_id")
        if not doula or doula.role != "doula":
            raise HTTPException(status_code=400, detail="Invalid doula_id")

        #  fill auth ids from linked users table
        booking.mother_auth_id = mother.auth_id
        booking.doula_auth_id = doula.auth_id

        starts = parse_iso_dt(booking.starts_at)
        ends   = parse_iso_dt(booking.ends_at)

        booking.starts_at = to_naive_utc(starts)
        booking.ends_at   = to_naive_utc(ends)

        session.add(booking)
        session.commit()
        session.refresh(booking)
        return booking




# List all bookings (useful for debugging)
@app.get("/bookings", response_model=List[Booking])
@app.get("/bookings/", response_model=List[Booking])
def get_bookings():
    with Session(engine) as session:
        return session.exec(select(Booking)).all()

# List bookings by mother


#For a mother her bookings will include doula name
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
#Helps the doula see who/where the booking is
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
               "doula_name": doula.name if doula else None,
               "location": mother.location if mother else None,
               "starts_at": b.starts_at,
               "ends_at": b.ends_at,
               "mode": b.mode,
               "status": b.status
           })


       return result

from uuid import UUID

# This endpoint makes sure every logged in user exists in our database.
# It creates the user the first time they sign up or log in.
# If the user already exists, it only fills in missing information.
#https://chatgpt.com/c/69615ba9-1c28-8333-86a4-0f853cf8264b - helps create the bootstrapping as it was not showing up in my sql table
class AuthBootstrap(SQLModel):
    auth_id: UUID
    role: str
    name: str | None = None
    location: str | None = None

@app.post("/users/bootstrap")
def bootstrap_user(payload: AuthBootstrap):
    with Session(engine) as session:
        existing = session.exec(
            select(User).where(User.auth_id == payload.auth_id)
        ).first()

        # If user already exists, only update fields that are empty/default
        if existing:
            changed = False

            # Update name if we got one and current is blank/default
            if payload.name and (not existing.name or existing.name.strip() == "" or existing.name == "New user"):
                existing.name = payload.name
                changed = True

            # Update location if we got one and current is blank/null
            if payload.location is not None and (existing.location is None or str(existing.location).strip() == ""):
                existing.location = payload.location
                changed = True

            # keep role in sync
            if payload.role and existing.role != payload.role:
                existing.role = payload.role
                changed = True

            if changed:
                session.add(existing)
                session.commit()
                session.refresh(existing)

            return existing

        # Otherwise create new
        user = User(
            auth_id=payload.auth_id,
            role=payload.role,
            name=payload.name or "New user",
            location=payload.location,
        )
        session.add(user)
        session.commit()
        session.refresh(user)
        return user

#used the same as the other bookings but now using auth id for the log in
@app.get("/bookings/by-mother-auth/{mother_auth_id}/details")
def get_bookings_for_mother_by_auth_detailed(mother_auth_id: UUID):
    with Session(engine) as session:
        # map auth uuid  internal user
        mother = session.exec(
            select(User).where(User.auth_id == mother_auth_id)
        ).first()
        if not mother or mother.role != "mother":
            raise HTTPException(404, "Mother not found for this auth_id")

        # use existing int FK (works even if mother_auth_id is NULL)
        bookings = session.exec(
            select(Booking).where(Booking.mother_id == mother.id)
        ).all()

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
                "status": b.status,
            })
        return result


@app.get("/bookings/by-doula-auth/{doula_auth_id}")
def get_bookings_for_doula_by_auth(doula_auth_id: UUID):
    with Session(engine) as session:
        # map auth uuid internal user
        doula = session.exec(
            select(User).where(User.auth_id == doula_auth_id)
        ).first()
        if not doula or doula.role != "doula":
            raise HTTPException(404, "Doula not found for this auth_id")

        # use existing int FK (works even if doula_auth_id is NULL)
        bookings = session.exec(
            select(Booking).where(Booking.doula_id == doula.id)
        ).all()

        result = []
        for b in bookings:
            mother = session.get(User, b.mother_id)
            result.append({
                "booking_id": b.id,
                "mother_name": mother.name if mother else None,
                "doula_name": doula.name,
                "location": mother.location if mother else None,
                "starts_at": b.starts_at,
                "ends_at": b.ends_at,
                "mode": b.mode,
                "status": b.status,
            })
        return result

# small helper model for the status update body
class BookingStatusUpdate(SQLModel):
    status: str  # "requested" | "confirmed" | "declined" | "cancelled"

#manage booking request
@app.post("/bookings/{booking_id}/status", response_model=Booking)
def update_booking_status(booking_id: int, payload: BookingStatusUpdate):
    with Session(engine) as session:
        booking = session.get(Booking, booking_id)
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")

        allowed = {"requested", "confirmed", "declined", "cancelled", "paid"}
        if payload.status not in allowed:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid status '{payload.status}'. "
                       f"Must be one of {', '.join(sorted(allowed))}."
            )

        booking.status = payload.status
        session.add(booking)
        session.commit()
        session.refresh(booking)
        return booking

#Returns filtered/sorted list of doulas
# q searches name/location/qualifications/services
#verirified toggles only verified doulas

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


       # New min_price support - filter= Youtube vide https://www.youtube.com/watch?v=BR2rrnTavmY&t=24s
       if min_price is not None:
           stmt = stmt.where(User.price >= min_price)


       if max_price is not None:
           stmt = stmt.where(User.price <= max_price)


       # Search term (name, location, etc.)
       # .ilike() performs a case-insensitive text match (similar to SQL ILIKE)
       # e.g. filters users where "location" includes the search term, ignoring case
       if q:
           like = f"%{q}%"
           stmt = stmt.where(
               (User.name.ilike(like)) |
               (User.location.ilike(like)) |
               (User.qualifications.ilike(like)) |
               (User.services.ilike(like))
           )


       # Sorting support
       # stmt short for statement- it’s a variable that holds your SQL query before it gets sent to the database
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




#ChatGPT debugging statement for certificates - https://chatgpt.com/c/690b7959-8ce0-8333-81a2-da437a26163b
@app.get("/debug/certificates")
async def debug_certificates():
    """
    Debug endpoint to check the certificate uploads folder.

    Returns JSON showing:
      - absolute path being checked
      - whether the folder exists
      - list of files inside
      - whether 1.pdf exists
    """
    # Folder we want to check
    cert_dir = Path("backend/static/certificates").resolve()

    # Check if it exists and is a directory
    exists = cert_dir.exists() and cert_dir.is_dir()

    # If it exists, list files (only actual files, not subdirectories)
    files = sorted([p.name for p in cert_dir.iterdir() if p.is_file()]) if exists else []

    # Build response
    return JSONResponse({
        "path": str(cert_dir),       # full absolute path
        "exists": exists,            # does the folder exist?
        "files": files,              # list of filenames
        "has_1_pdf": "1.pdf" in files,  # quick check for 1.pdf
        "count": len(files)          # number of files found
    })

#https://www.youtube.com/watch?v=nZhAW-JQ8NM- helped back end for the chat and chat.py
# Single community chat room for all moms and doulas
@app.get("/debug/routes")
def debug_routes():
    http_paths = []
    ws_paths = []

    for r in app.routes:
        if isinstance(r, APIRoute):
            http_paths.append(r.path)
        else:
            # WebsocketRoute is a subclass of fastapi.routing.Route
            if hasattr(r, "endpoint") and "websocket" in str(type(r)).lower():
                ws_paths.append(r.path)

    return {"http": http_paths, "websocket": ws_paths}




# Single "community" chat room for all moms and doulas
# keep last 100 messages in memory
chat_history = deque(maxlen=100)

@app.websocket("/chat")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)

    #  Send chat history as a normal list (JSON serializable)
    await websocket.send_json(list(chat_history))

    try:
        while True:
            data = await websocket.receive_json()  # {sender, text, time}
            chat_history.append(data)
            await manager.broadcast(data)
    except WebSocketDisconnect:
        await manager.disconnect(websocket)



# Voice search endpoint: accepts an audio file, sends it to OpenAI Whisper,
# and returns the text for the mobile app to use as a search query.
#Code mainly from :https://medium.com/@bnhminh_38309/build-a-fastapi-backend-for-speech-to-text-transcription-with-openai-whisper-4de7f082ab6e
#Used to help with part of my error handling for the files-https://chatgpt.com/c/691b2910-cc30-8325-bc1a-027aa7947a2c
@app.post("/voice-search")
async def voice_search(file: UploadFile = File(...)):
    if not file:
        # Ensure a file was actually uploaded
        raise HTTPException(status_code=400, detail="No file uploaded")

    # Read audio file into memory
    audio_data = await file.read()
    print("VOICE-SEARCH file:", file.filename, file.content_type, "bytes:", len(audio_data))
    print("OPENAI_API_KEY loaded?", bool(OPENAI_API_KEY))

    if not OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="Missing OPENAI_API_KEY")

    # Prepare request headers and form data for Whisper
    headers = {"Authorization": f"Bearer {OPENAI_API_KEY}"}
    files = {
        "file": (file.filename, audio_data, file.content_type),
        "model": (None, "whisper-1"),
        "response_format": (None, "json"),
        "language": (None, "en"), # focring english
    }

    # Send request to OpenAI Whisper API
    response = requests.post(
        "https://api.openai.com/v1/audio/transcriptions",
        headers=headers,
        files=files,
    )
    # Try to read the response as JSON; use raw text if that fails
    try:
        data = response.json()
    except Exception:
        data = {"raw": response.text}

    print("OpenAI status:", response.status_code)
    print("OpenAI body:", data)
    # Handle any error returned by OpenAI
    if response.status_code != 200:
        raise HTTPException(
            status_code=response.status_code,
            detail=data,
        )
    # Extract transcription text from JSON
    transcription = data.get("text", "")
    return JSONResponse(content={"text": transcription})

# Stripe Checkout success and cancel redirect handlers
@app.get("/payments/success")
def payments_success():
    return {"ok": True, "message": "Payment completed. You can return to the app."}

@app.get("/payments/cancel")
def payments_cancel():
    return {"ok": False, "message": "Payment cancelled. You can return to the app."}


#https://docs.stripe.com/checkout/quickstart?lang=python
# Similar to Stripe reference: creates a Stripe Checkout Session in payment mode
# Added: booking validation, dynamic pricing, metadata, and API-style response
# https://medium.com/@abdulikram/building-a-payment-backend-with-fastapi-stripe-checkout-and-webhooks-08dc15a32010
# Core Checkout Session structure follows the reference; booking logic and validation are custom

@app.post("/payments/checkout")
def payments_checkout(payload: CheckoutRequest):
    with Session(engine) as session:
        booking = session.get(Booking, payload.booking_id)
        if not booking:
            raise HTTPException(404, "Booking not found")

        if booking.status != "confirmed":
            raise HTTPException(400, "Booking must be confirmed before payment")

        if booking.status == "paid":
            raise HTTPException(400, "Booking already paid")

        doula = session.get(User, booking.doula_id)
        if not doula:
            raise HTTPException(400, "Invalid doula_id")

        amount_cents = int(float(doula.price) * 100)


        success_url = os.getenv(
            "STRIPE_SUCCESS_URL",
            "https://checkout.stripe.com/complete",
        )
        cancel_url = os.getenv(
            "STRIPE_CANCEL_URL",
            "https://checkout.stripe.com/cancel",
        )

        # IMPORTANT:
        # If your Booking model has booking_id, store that.
        # Otherwise store booking.id (primary key).
        booking_meta_id = getattr(booking, "booking_id", None) or booking.id

        checkout = stripe.checkout.Session.create(
            mode="payment",
            line_items=[
                {
                    "price_data": {
                        "currency": "eur",
                        "product_data": {"name": f"Consultation with {doula.name}"},
                        "unit_amount": amount_cents,
                    },
                    "quantity": 1,
                }
            ],
            metadata={"booking_id": str(booking_meta_id)},
            success_url=success_url,
            cancel_url=cancel_url,
        )

        return {"url": checkout.url}

@app.post("/payments/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    secret = os.getenv("STRIPE_WEBHOOK_SECRET")

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, secret)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid signature")

    event_type = event["type"]
    obj = event["data"]["object"]

    print("WEBHOOK EVENT TYPE:", event_type)

    booking_id = None

    # 1) Preferred: checkout session completed (has metadata booking_id)
    if event_type == "checkout.session.completed":
        booking_id = obj.get("metadata", {}).get("booking_id")

    # 2) Also handle payment intent succeeded
    # This may not include booking metadata unless you set it,
    if event_type == "payment_intent.succeeded":
        pi_id = obj.get("id")
        try:
            sessions = stripe.checkout.Session.list(payment_intent=pi_id, limit=1)
            if sessions.data:
                booking_id = sessions.data[0].get("metadata", {}).get("booking_id")
        except Exception as e:
            print("Could not map payment_intent to session:", e)

    if booking_id:
        with Session(engine) as db:
            booking = db.get(Booking, int(booking_id))
            if booking and booking.status in ("confirmed",):
                booking.status = "paid"
                db.add(booking)
                db.commit()
                print("Booking marked paid:", booking_id)

    return {"received": True}

# Helper endpoint to check review eligibility
# Uses same booking-status business rule as POST /reviews (must be paid)
# Follows same query/validation pattern used across booking endpoints
#https://fastapi.tiangolo.com/tutorial/query-params/#required-query-parameters - Similar to FastAPI GET examples, but checks the database before returning a result
@app.get("/reviews/can-review")
def can_review(mother_id: int, doula_id: int, session: Session = Depends(get_session)):
    booking = session.exec(
        select(Booking).where(
            Booking.mother_id == mother_id,
            Booking.doula_id == doula_id,
            Booking.status.in_(["paid"]) # only allowed leave a review if you have paid
        )
    ).first()

    return {
        "can_review": booking is not None,
        "booking_id": booking.id if booking else None
    }

# Similar to POST /bookings/{booking_id}/status:
# follows the same fetch to validate  pattern
@app.post("/reviews")
def create_review(payload: ReviewCreate, session: Session = Depends(get_session)):
    # Find the booking being reviewed
    booking = session.get(Booking, payload.booking_id)
    if not booking:
        raise HTTPException(404, "Booking not found")

    # Only allow review if booking was paid
    if booking.status not in ["paid"]:
        raise HTTPException(403, "You can only review after a paid booking.")

    # Create the review row
    review = Review(
        booking_id=payload.booking_id,
        mother_id=booking.mother_id,
        doula_id=booking.doula_id,
        rating=payload.rating,
        comment=payload.comment,
    )

    session.add(review)
    session.commit()
    session.refresh(review)
    return review

#mothers can now see reviews left by other mothers on the doula profile
@app.get("/reviews/by-doula/{doula_id}")
def reviews_by_doula(doula_id: int, session: Session = Depends(get_session)):
    # Same query pattern used in booking retrieval
    # https://docs.sqlalchemy.org/en/20/orm/queryguide/select.html#sqlalchemy.orm.Select.where
    reviews = session.exec(
        select(Review)
        .where(Review.doula_id == doula_id)
        .order_by(Review.created_at.desc())
    ).all()


    # Similar to booking responses:
    # expose only fields safe for public consumption
    return [
        {
            "id": r.id,
            "rating": r.rating,
            "comment": r.comment,
            "created_at": r.created_at,
        }
        for r in reviews
    ]

class ToggleFavouriteBody(BaseModel):
    doula_id: int

# Adapted from POST /bookings:
# - Uses the same mother validation pattern (auth UUID and role check),
#   but toggles a Favourite record instead of creating a Booking.
# Uses a conditional create/delete pattern:
# checks if a Favourite exists for the mother/doula pair, then creates or deletes it.
# Reference: SQLModel select().where() for existence checks
# https://sqlmodel.tiangolo.com/tutorial/select/
@app.post("/favourites/by-mother-auth/{mother_uuid}/toggle")
def toggle_favourite(mother_uuid: UUID, body: ToggleFavouriteBody):
    with Session(engine) as session:
        mother = session.exec(
            select(User).where(User.auth_id == mother_uuid, User.role == "mother")
        ).first()
        if not mother:
            raise HTTPException(404, "Mother not found")

        doula = session.get(User, body.doula_id)
        if not doula or doula.role != "doula":
            raise HTTPException(404, "Doula not found")

        existing = session.exec(
            select(Favourite).where(
                Favourite.mother_auth_id == mother_uuid,
                Favourite.doula_id == body.doula_id
            )
        ).first()

        if existing:
            session.delete(existing)
            session.commit()
            return {"favourited": False}

        fav = Favourite(mother_auth_id=mother_uuid, doula_id=body.doula_id)
        session.add(fav)
        session.commit()
        return {"favourited": True}


# Adapted from GET /bookings/by-mother/{mother_id}/details:
# - Both endpoints fetch records belonging to a specific mother
# - Both enrich those records with doula details (name, verified, etc.)
#   so the frontend does not have to work with raw IDs.
# Reference: SQLModel select().where()
# https://sqlmodel.tiangolo.com/tutorial/select/
@app.get("/favourites/by-mother-auth/{mother_uuid}/details")
def get_favourites_for_mother_detailed(mother_uuid: UUID):
    with Session(engine) as session:
        mother = session.exec(
            select(User).where(User.auth_id == mother_uuid, User.role == "mother")
        ).first()
        if not mother:
            raise HTTPException(404, "Mother not found")

        favs = session.exec(
            select(Favourite).where(Favourite.mother_auth_id == mother_uuid)
        ).all()

        result = []
        for f in favs:
            doula = session.get(User, f.doula_id)
            if not doula or doula.role != "doula":
                continue

            result.append({
                "favourite_id": f.id,
                "doula_id": doula.id,
                "doula_name": doula.name,
                "location": doula.location,
                "verified": doula.verified,
                "price": doula.price,
                "photo_url": doula.photo_url,
            })

        return result

# Adapted from my previous WebSocket chat feature:
# kept the chat UI behaviour, but implemented private messaging using GET/POST endpoints and stored messages in SQL
# Unlike CommunityChat (which uses WebSockets) - it keeps the messages there so mothers can return to the conversation at anytiem
# This ChatGPT helped guide me in knowing the end points needed = https://chatgpt.com/c/696f9b88-5de8-832f-8ab9-8f97a929b31c
# Also used for REST - https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods



class SendMessageBody(BaseModel):
    receiver_auth_id: UUID
    text: str

#Sends a new private message via REST.
#Backend determines sender role and read flags server-side.
#Adapted from Chatgpt: replaced manual sender/receiver handling with server-side role logic.
#The server decides which user has read the message based on the sender.

@app.post("/messages/send")
def send_message(body: SendMessageBody, sender_auth_id: UUID, sender_role: str):
    with Session(engine) as session:
        # Validate sender exists and role matches.
        # This prevents a user faking a different role
        sender = session.exec(
            select(User).where(User.auth_id == sender_auth_id, User.role == sender_role)
        ).first()
        if not sender:
            raise HTTPException(404, "Sender not found")

        # Validate receiver exists.
        receiver = session.exec(
            select(User).where(User.auth_id == body.receiver_auth_id)
        ).first()
        if not receiver:
            raise HTTPException(404, "Receiver not found")

        # Role-based mapping:
        # If mother sends to mother_auth_id = sender, doula_auth_id = receiver
        # If doula sends to doula_auth_id = sender, mother_auth_id = receiver
        #
        # Read flags:
        # - Sender side is True (they obviously "read" what they just sent)
        # - Receiver side is False (unread notification logic depends on this)
        if sender_role == "mother":
            mother_auth_id = sender_auth_id
            doula_auth_id = body.receiver_auth_id
            read_by_mother = True
            read_by_doula = False
        elif sender_role == "doula":
            mother_auth_id = body.receiver_auth_id
            doula_auth_id = sender_auth_id
            read_by_mother = False
            read_by_doula = True
        else:
            raise HTTPException(400, "Invalid sender_role")

        # Create and persist message row
        msg = Message(
            mother_auth_id=mother_auth_id,
            doula_auth_id=doula_auth_id,
            sender_role=sender_role,
            text=body.text.strip(),
            read_by_mother=read_by_mother,
            read_by_doula=read_by_doula,
        )

        session.add(msg)
        session.commit()
        session.refresh(msg)

        return {"id": msg.id, "created_at": msg.created_at}


#Adapted from Chatgpt: forces ordered message retreived for a single conversation.
#Returns only required fields instead of exposing full Message objects.
@app.get("/messages/thread")
def get_thread(mother_auth_id: UUID, doula_auth_id: UUID):
    with Session(engine) as session:
        msgs = session.exec(
            select(Message)
            .where(
                Message.mother_auth_id == mother_auth_id,
                Message.doula_auth_id == doula_auth_id
            )
            .order_by(Message.created_at)
        ).all()

        # Return only fields needed by mobile UI (keeps response small)
        return [
            {
                "id": m.id,
                "sender_role": m.sender_role,
                "text": m.text,
                "created_at": m.created_at,
            }
            for m in msgs
        ]


#Adapted from ChatGPT: unread messages are counted based on the logged-in user’s role.
# Counts total unread messages for the logged-in user based on role.
# - Mother: unread = messages where read_by_mother == False
# - Doula:  unread = messages where read_by_doula  == False
#https://sqlmodel.tiangolo.com/tutorial/select/#where
# This endpoint is used by local notification polling on the device.
@app.get("/messages/unread-count")
def unread_count(user_auth_id: UUID, role: str):
    with Session(engine) as session:
        if role == "mother":
            unread = session.exec(
                select(Message).where(
                    Message.mother_auth_id == user_auth_id,
                    Message.read_by_mother == False
                )
            ).all()
        elif role == "doula":
            unread = session.exec(
                select(Message).where(
                    Message.doula_auth_id == user_auth_id,
                    Message.read_by_doula == False
                )
            ).all()
        else:
            raise HTTPException(400, "Invalid role")

        return {"count": len(unread)}

#Request body for marking messages as read in a private mother/doula chat
#Identifies the conversation and updates read flags based on the viewer's role
class MarkReadBody(BaseModel):
    mother_auth_id: UUID
    doula_auth_id: UUID
    role: str

#https://sqlmodel.tiangolo.com/tutorial/select/ - Grouping messages manually to form inbox-style threads
#Marks all messages in this conversation as read for the current role
#Adapted form ChatGPT: marks messages as read based on viewer role.
#Refactored later to only update messages sent by the other user.

@app.post("/messages/mark-read")
def mark_read(body: MarkReadBody):
    with Session(engine) as session:
        msgs = session.exec(
            select(Message).where(
                Message.mother_auth_id == body.mother_auth_id,
                Message.doula_auth_id == body.doula_auth_id
            )
        ).all()

        # Update flags based on viewer role
        for m in msgs:
            if body.role == "mother":
                m.read_by_mother = True
            elif body.role == "doula":
                m.read_by_doula = True
            else:
                raise HTTPException(400, "Invalid role")

        session.add_all(msgs)
        session.commit()
        return {"ok": True}

#Loads the full message history for a single mother to doula conversation
#using a REST GET endpoint instead of WebSockets.
#Adapted from ChatGPT: manual Python grouping to form inbox-style threads.
#Includes last message and unread count per mother/doula pair.

@app.get("/messages/threads")
def get_threads(user_auth_id: UUID, role: str):
    """
    Inbox list:
    - Returns one row per conversation (mother/doula pair)
    - Includes last message and unread count for that pair
    """
    with Session(engine) as session:
        if role == "mother":
            # Fetch all messages for this user, newest first
            msgs = session.exec(
                select(Message)
                .where(Message.mother_auth_id == user_auth_id)
                .order_by(desc(Message.created_at))
            ).all()
        elif role == "doula":
            msgs = session.exec(
                select(Message)
                .where(Message.doula_auth_id == user_auth_id)
                .order_by(desc(Message.created_at))
            ).all()
        else:
            raise HTTPException(400, "Invalid role")

        # Group by "other person" auth id
        threads: Dict[str, Dict[str, Any]] = {}

        for m in msgs:
            # Determine the "other participant" depending on role
            other_auth = (
                str(m.doula_auth_id) if role == "mother" else str(m.mother_auth_id)
            )

            # create thread record if first time you see it
            if other_auth not in threads:
                other_user = session.exec(
                    select(User).where(User.auth_id == UUID(other_auth))
                ).first()

                threads[other_auth] = {
                    "other_auth_id": other_auth,
                    "other_name": other_user.name if other_user else "Unknown",
                    "other_role": "doula" if role == "mother" else "mother",
                    "last_text": m.text,
                    "last_created_at": m.created_at,
                    "unread_count": 0,
                }

            # count unread per thread
            if role == "mother" and (m.read_by_mother is False):
                threads[other_auth]["unread_count"] += 1
            if role == "doula" and (m.read_by_doula is False):
                threads[other_auth]["unread_count"] += 1

        return list(threads.values())

#Adapted from Chatgpt: replaced Python thread grouping with SQL aggregation.
#Uses rolesafe unread counts and returns one row per conversation.
#Loads the user's message inbox (one item per conversation),
#similar to WhatsApp conversation lists.
#Uses GET /messages/inbox instead of loading full message history.

@app.get("/messages/inbox")
def inbox(user_auth_id: UUID, role: str):
    with Session(engine) as session:
        if role == "mother":
            msgs = session.exec(
                select(Message).where(Message.mother_auth_id == user_auth_id)
                .order_by(Message.created_at.desc())
            ).all()
        elif role == "doula":
            msgs = session.exec(
                select(Message).where(Message.doula_auth_id == user_auth_id)
                .order_by(Message.created_at.desc())
            ).all()
        else:
            raise HTTPException(400, "Invalid role")

        threads = {}
        for m in msgs:
            # A thread is uniquely identified by the mother/doula pair
            key = f"{m.mother_auth_id}-{m.doula_auth_id}"
            if key not in threads:
                # find the "other" user to show name
                if role == "mother":
                    other = session.exec(select(User).where(User.auth_id == m.doula_auth_id)).first()
                else:
                    other = session.exec(select(User).where(User.auth_id == m.mother_auth_id)).first()

                threads[key] = {
                    "thread_key": key,
                    "mother_auth_id": m.mother_auth_id,
                    "doula_auth_id": m.doula_auth_id,
                    "other_name": other.name if other else "User",
                    "last_text": m.text,
                    "last_at": m.created_at,
                    "unread_count": 0,
                }

            # count unread messages for this role
            # Only count as unread if:
            # - The message is unread for this role
            # - AND it was sent by the other role
            if role == "mother" and (m.read_by_mother == False) and (m.sender_role == "doula"):
                threads[key]["unread_count"] += 1
            if role == "doula" and (m.read_by_doula == False) and (m.sender_role == "mother"):
                threads[key]["unread_count"] += 1

        return list(threads.values())
