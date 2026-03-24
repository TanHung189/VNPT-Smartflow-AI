from typing import Optional, List, Dict
from sqlmodel import Field, Relationship, Column
from sqlalchemy.dialects.postgresql import JSONB

from app.database.base import Base

class Role(Base, table=True):
    __tablename__ = "roles"
    
    role_id: Optional[int] = Field(default=None, primary_key=True)
    role_name: str = Field(max_length=50, unique=True, nullable=False)
    description: Optional[str] = None
    permissions: Dict = Field(default={}, sa_column=Column(JSONB))

    # Quan hệ với Users
    users: List["User"] = Relationship(back_populates="role")
