#same layout to my models
from sqlmodel import SQLModel
from typing import Optional

class ReviewCreate(SQLModel):
    booking_id: int
    rating: int
    comment: Optional[str] = None
