#=====================================================
#Sử dụng thư viện sqlmodel để viết các class database, cái này dùng database first
#==========================================================

from sqlmodel import SQLModel, Field, Column
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid
from datetime import datetime
from typing import Optional, Dict

class Diagram(SQLModel, table=True):
    __tablename__ = "diagrams"

    diagram_id: uuid.UUID = Field(
        sa_column=Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    )
    user_id: uuid.UUID = Field(foreign_key="users.user_id", index=True)
    title: str = Field(max_length=255)
    raw_text_input: Optional[str] = None
    flow_data: Dict = Field(default={}, sa_column=Column(JSONB))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)