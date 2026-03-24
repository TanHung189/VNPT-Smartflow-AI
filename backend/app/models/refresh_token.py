import uuid
from datetime import datetime
from typing import Optional
from sqlmodel import Field, Relationship

from app.database.base import Base
from app.models.user import User

class RefreshToken(Base, table=True):
    __tablename__ = "refresh_token"
    
    token_id: Optional[int] = Field(default=None, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="users.user_id")
    token_value: str = Field(nullable=False)
    expires_at: datetime = Field(nullable=False)
    is_revoked: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    user: User = Relationship(back_populates="refresh_tokens")
