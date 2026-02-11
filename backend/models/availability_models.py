#From Youtube Video "How to connect to an online MySQL database using FastAPI"-https://www.youtube.com/watch?v=QuaNqXi-OwM
from sqlmodel import SQLModel, Field
from typing import Optional
import datetime as dt
from datetime import time

class DoulaAvailability(SQLModel, table=True):
    __tablename__ = "doula_availability"

    id: Optional[int] = Field(default=None, primary_key=True)
    doula_id: int = Field(index=True)
    day_of_week: int = Field(index=True)  # 0=Mon .. 6=Sun
    start_time: time
    end_time: time
    active: bool = True

class DoulaAvailabilityException(SQLModel, table=True):
    __tablename__ = "doula_availability_exceptions"

    id: Optional[int] = Field(default=None, primary_key=True)
    doula_id: int = Field(index=True)

    exception_date: dt.date = Field(index=True, sa_column_kwargs={"name": "date"})

    start_time: Optional[time] = None
    end_time: Optional[time] = None
    reason: Optional[str] = None
