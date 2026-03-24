import uuid
from datetime import datetime
from typing import Optional
from sqlmodel import Field, Relationship

from app.database.base import Base
from app.models.user import User

class AIUsageLog(Base, table=True):
    __tablename__ = "ai_usage_logs"
    
    log_id: Optional[int] = Field(default=None, primary_key=True)
    user_id: Optional[uuid.UUID] = Field(default=None, foreign_key="users.user_id")
    model_name: Optional[str] = Field(max_length=50)
    prompt_tokens: Optional[int] = None
    completion_tokens: Optional[int] = None
    status: Optional[str] = Field(max_length=20)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    user: Optional[User] = Relationship(back_populates="ai_logs")
