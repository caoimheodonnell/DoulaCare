#From Youtube Video "How to connect to an online MySQL database using FastAPI"-https://www.youtube.com/watch?v=QuaNqXi-OwM
from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime

class Review(SQLModel, table=True):
    __tablename__ = "reviews"
    id: Optional[int] = Field(default=None, primary_key=True)

    booking_id: int
    mother_id: int
    doula_id: int

    rating: int
    comment: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
