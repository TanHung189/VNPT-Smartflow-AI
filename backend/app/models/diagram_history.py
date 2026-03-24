import uuid
from datetime import datetime
from typing import Optional, Dict
from sqlmodel import Field, Relationship, Column
from sqlalchemy.dialects.postgresql import UUID, JSONB

from app.database.base import Base

class DiagramHistory(Base, table=True):
    __tablename__ = "diagram_history"
    
    history_id: Optional[int] = Field(default=None, primary_key=True)
    diagram_id: uuid.UUID = Field(foreign_key="diagrams_v2.id")  # Liên kết với bảng mới của Diagram
    version_data: Dict = Field(default={}, sa_column=Column(JSONB, nullable=False))
    changed_at: datetime = Field(default_factory=datetime.utcnow)
    change_reason: Optional[str] = None

    # Tạm thời bỏ Relationship ngược tới Diagram vì tính phức tạp của việc thay thế file
    # diagram = Relationship(back_populates="history")
