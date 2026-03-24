import uuid
from typing import Optional
from sqlmodel import Field, Relationship

from app.database.base import Base
from app.models.user import User

class UserAuthen(Base, table=True):
    __tablename__ = "user_authen"
    
    authen_id: Optional[int] = Field(default=None, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="users.user_id")
    provider: str = Field(max_length=20) # 'google', 'github', 'local'
    provider_key: Optional[str] = None
    password_hash: Optional[str] = None

    user: User = Relationship(back_populates="auth_providers")
