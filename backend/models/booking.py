# backend/models/booking.py
#From Youtube Video "How to connect to an online MySQL database using FastAPI"-https://www.youtube.com/watch?v=QuaNqXi-OwM
from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID

# This class defines the structure of the "bookings" table in the MySQL database
# Each attribute below represents a column in the table
class Booking(SQLModel, table=True):
    __tablename__ = "bookings"          # Sets the name of the table in the database
    # Primary key column (automatically increases for each new user)
    id: Optional[int] = Field(default=None, primary_key=True)
    mother_id: int
    doula_id: int
    starts_at: datetime
    ends_at: datetime
    mode: str = Field(default="online", max_length=20)
    status: str = Field(default="requested", max_length=20)
    mother_auth_id: Optional[UUID] = Field(default=None, index=True)
    doula_auth_id: Optional[UUID] = Field(default=None, index=True)


