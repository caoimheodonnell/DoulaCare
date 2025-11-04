# backend/models/service.py
from typing import Optional
from sqlmodel import SQLModel, Field

class Service(SQLModel, table=True):
    __tablename__ = "services"
    id: Optional[int] = Field(default=None, primary_key=True)
    doula_id: int = Field(foreign_key="users.id")
    name: str
    description: Optional[str] = None
    price: float
    is_bundle: bool = False
    duration_minutes: Optional[int] = None
