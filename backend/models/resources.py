#From Youtube Video "How to connect to an online MySQL database using FastAPI"-https://www.youtube.com/watch?v=QuaNqXi-OwM
from sqlmodel import SQLModel, Field
from typing import Optional

from datetime import datetime

class Resource(SQLModel, table=True):
    __tablename__ = "resources"

    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    description: str
    url: str
    source_label: str = "Read more"
    tags: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)

