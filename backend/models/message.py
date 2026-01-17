#From Youtube Video "How to connect to an online MySQL database using FastAPI"-https://www.youtube.com/watch?v=QuaNqXi-OwM
from sqlmodel import SQLModel, Field
from typing import Optional
from uuid import UUID
from datetime import datetime

class Message(SQLModel, table=True):
    __tablename__ = "messages"

    id: Optional[int] = Field(default=None, primary_key=True)

    # Conversation participants (Supabase auth UUIDs)
    mother_auth_id: UUID = Field(index=True)
    doula_auth_id: UUID = Field(index=True)

    # Who sent it ("mother" or "doula")
    sender_role: str

    text: str

    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Simple read flags for “unread”
    read_by_mother: bool = False
    read_by_doula: bool = False
