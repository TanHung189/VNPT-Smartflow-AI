from typing import Optional, Dict
from sqlmodel import Field, Column
from sqlalchemy.dialects.postgresql import JSONB

from app.database.base import Base

class ListTemplate(Base, table=True):
    __tablename__ = "list_template"
    
    template_id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=100, nullable=False)
    category: Optional[str] = Field(max_length=50)
    description: Optional[str] = None
    flow_data: Dict = Field(default={}, sa_column=Column(JSONB, nullable=False))
    thumbnail_url: Optional[str] = None
