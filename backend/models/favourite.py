#From Youtube Video "How to connect to an online MySQL database using FastAPI"-https://www.youtube.com/watch?v=QuaNqXi-OwM
from sqlmodel import SQLModel, Field
from typing import Optional
from uuid import UUID
from datetime import datetime
from sqlalchemy import UniqueConstraint

class Favourite(SQLModel, table=True):
    __tablename__ = "favourites"
    __table_args__ = (UniqueConstraint("mother_auth_id", "doula_id", name="uq_mother_doula_fav"),)

    id: Optional[int] = Field(default=None, primary_key=True)
    mother_auth_id: UUID = Field(index=True)
    doula_id: int = Field(index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
