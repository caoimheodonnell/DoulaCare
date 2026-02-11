#From Youtube Video "How to connect to an online MySQL database using FastAPI"-https://www.youtube.com/watch?v=QuaNqXi-OwM
from typing import Optional
from sqlmodel import SQLModel, Field, Column
from sqlalchemy import String, Text, DECIMAL
from uuid import UUID


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
    auth_id: Optional[UUID] = Field(default=None, index=True)

    care_needs: Optional[str] = Field(default=None, sa_column=Column(Text))
    pregnancy_stage: Optional[str] = Field(default=None, sa_column=Column(Text))
    postpartum_stage: Optional[str] = Field(default=None, sa_column=Column(Text))
    preferred_support: Optional[str] = Field(default=None, sa_column=Column(Text))
    notes: Optional[str] = Field(default=None, sa_column=Column(Text))




