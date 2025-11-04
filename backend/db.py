#From Youtube Video "How to connect to an online MySQL database using FastAPI"
from sqlmodel import create_engine, Session
from backend.settings import MYSQL_URL

# Create the database engine
engine = create_engine(MYSQL_URL, echo=True)

# Dependency for FastAPI routes
def get_session():
    with Session(engine) as session:
        yield session
