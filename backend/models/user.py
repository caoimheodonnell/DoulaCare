#From Youtube Video "How to connect to an online MySQL database using FastAPI"
from sqlmodel import SQLModel, Field
from typing import Optional
from sqlmodel import SQLModel, Field, Column
from sqlalchemy import String, Text, DECIMAL

# This class defines the structure of the "users" table in the MySQL database
# Each attribute below represents a column in the table
class User(SQLModel, table=True):
    __tablename__ = "users"  # Sets the name of the table in the database

    # Primary key column (automatically increases for each new user)
    id: int | None = Field(default=None, primary_key=True)
    name: str
    location: str
    price: float
    verified: bool = False # Showing if the user is verified or not
    email: Optional[str] = Field(default=None, sa_column=Column(String(255)))
    role: str = "doula"  # "doula" | "mother" | "admin"
    qualifications: Optional[str] = Field(default=None, sa_column=Column(Text))
    services: Optional[str] = Field(default=None, sa_column=Column(Text))
    intro_video_url: Optional[str] = Field(default=None, sa_column=Column(String(255)))
    price_bundle: Optional[float] = None
    years_experience: Optional[int] = None
    photo_url: Optional[str] = None
    certificate_url: Optional[str] = None
    price_caption: Optional[str] = None
    bundle_caption: Optional[str] = None


