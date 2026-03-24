import uuid
from datetime import datetime
from typing import Optional, List
from sqlmodel import Field, Relationship, Column
from sqlalchemy.dialects.postgresql import UUID

from app.database.base import Base
from app.models.role import Role

class User(Base, table=True):
    __tablename__ = "users"
    
    user_id: uuid.UUID = Field(
        sa_column=Column(UUID(as_uuid=True), primary_key=True, server_default="gen_random_uuid()")
    )
    user_name: str = Field(max_length=100, nullable=False)
    user_password: str = Field(nullable=False)
    user_email: str = Field(max_length=255, unique=True, index=True, nullable=False)
    
    role_id: Optional[int] = Field(default=None, foreign_key="roles.role_id")
    avatar_url: Optional[str] = None
    is_active: bool = Field(default=True)
    last_login: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    role: Optional[Role] = Relationship(back_populates="users")
    # Tắt relationship Diagram tạm thời nếu Diagram lưu user_id theo sub string, hoặc cho phép nullable theo schema tự do.
    # diagrams: List["Diagram"] = Relationship(back_populates="user")
    auth_providers: List["UserAuthen"] = Relationship(back_populates="user")
    refresh_tokens: List["RefreshToken"] = Relationship(back_populates="user")
    ai_logs: List["AIUsageLog"] = Relationship(back_populates="user")
