import uuid
from datetime import datetime
from typing import Dict, Optional
from sqlmodel import SQLModel, Field, Column
from sqlalchemy.dialects.postgresql import UUID, JSONB

from app.database.base import Base

class Diagram(Base, table=True):
    __tablename__ = "diagrams_v2" # Rename table to avoid conflict with existing 'diagrams' table if it already exists in DB
    
    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        sa_column=Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    )
    user_id: str = Field(index=True, nullable=False, max_length=255) # For Google OAuth sub
    title: str = Field(max_length=255, nullable=False)
    flow_data: Dict = Field(default={}, sa_column=Column(JSONB, nullable=False))
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow, sa_column_kwargs={"onupdate": datetime.utcnow})
