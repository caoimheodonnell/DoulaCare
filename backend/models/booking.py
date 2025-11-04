# backend/models/booking.py
# backend/models/booking.py
from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime

class Booking(SQLModel, table=True):
    __tablename__ = "bookings"            # <- make sure this matches!
    id: Optional[int] = Field(default=None, primary_key=True)
    mother_id: int
    doula_id: int
    starts_at: datetime
    ends_at: datetime
    mode: str = Field(default="online", max_length=20)
    status: str = Field(default="requested", max_length=20)


