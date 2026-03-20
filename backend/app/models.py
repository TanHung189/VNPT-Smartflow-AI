import uuid
from datetime import datetime
from typing import Optional, List, Dict
from sqlmodel import SQLModel, Field, Relationship, Column
from sqlalchemy.dialects.postgresql import UUID, JSONB


class Role(SQLModel, table=True):
    __tablename__ = "roles"
    
    role_id: Optional[int] = Field(default=None, primary_key=True)
    role_name: str = Field(max_length=50, unique=True, nullable=False)
    description: Optional[str] = None
    permissions: Dict = Field(default={}, sa_column=Column(JSONB))

    # Quan hệ với Users
    users: List["User"] = Relationship(back_populates="role")


class User(SQLModel, table=True):
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
    diagrams: List["Diagram"] = Relationship(back_populates="user")
    auth_providers: List["UserAuthen"] = Relationship(back_populates="user")
    refresh_tokens: List["RefreshToken"] = Relationship(back_populates="user")
    ai_logs: List["AIUsageLog"] = Relationship(back_populates="user")


class RefreshToken(SQLModel, table=True):
    __tablename__ = "refresh_token"
    
    token_id: Optional[int] = Field(default=None, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="users.user_id")
    token_value: str = Field(nullable=False)
    expires_at: datetime = Field(nullable=False)
    is_revoked: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    user: User = Relationship(back_populates="refresh_tokens")


class UserAuthen(SQLModel, table=True):
    __tablename__ = "user_authen"
    
    authen_id: Optional[int] = Field(default=None, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="users.user_id")
    provider: str = Field(max_length=20) # 'google', 'github', 'local'
    provider_key: Optional[str] = None
    password_hash: Optional[str] = None

    user: User = Relationship(back_populates="auth_providers")


class Diagram(SQLModel, table=True):
    __tablename__ = "diagrams"
    
    diagram_id: uuid.UUID = Field(
        sa_column=Column(UUID(as_uuid=True), primary_key=True, server_default="gen_random_uuid()")
    )
    user_id: uuid.UUID = Field(foreign_key="users.user_id")
    title: str = Field(max_length=255, nullable=False)
    raw_text_input: Optional[str] = None
    flow_data: Dict = Field(default={}, sa_column=Column(JSONB, nullable=False))
    thumbnail_url: Optional[str] = None
    is_template: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    user: User = Relationship(back_populates="diagrams")
    history: List["DiagramHistory"] = Relationship(back_populates="diagram")


class DiagramHistory(SQLModel, table=True):
    __tablename__ = "diagram_history"
    
    history_id: Optional[int] = Field(default=None, primary_key=True)
    diagram_id: uuid.UUID = Field(foreign_key="diagrams.diagram_id")
    version_data: Dict = Field(default={}, sa_column=Column(JSONB, nullable=False))
    changed_at: datetime = Field(default_factory=datetime.utcnow)
    change_reason: Optional[str] = None

    diagram: Diagram = Relationship(back_populates="history")


class ListTemplate(SQLModel, table=True):
    __tablename__ = "list_template"
    
    template_id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=100, nullable=False)
    category: Optional[str] = Field(max_length=50)
    description: Optional[str] = None
    flow_data: Dict = Field(default={}, sa_column=Column(JSONB, nullable=False))
    thumbnail_url: Optional[str] = None


class AIUsageLog(SQLModel, table=True):
    __tablename__ = "ai_usage_logs"
    
    log_id: Optional[int] = Field(default=None, primary_key=True)
    user_id: Optional[uuid.UUID] = Field(default=None, foreign_key="users.user_id")
    model_name: Optional[str] = Field(max_length=50)
    prompt_tokens: Optional[int] = None
    completion_tokens: Optional[int] = None
    status: Optional[str] = Field(max_length=20)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    user: Optional[User] = Relationship(back_populates="ai_logs")