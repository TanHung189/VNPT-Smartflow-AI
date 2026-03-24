from pydantic import BaseModel, EmailStr
from typing import Optional
import uuid

class UserCreate(BaseModel):
    user_name: str
    user_email: EmailStr
    user_password: str

class UserRead(BaseModel):
    user_id: uuid.UUID
    user_name: str
    user_email: EmailStr
    avatar_url: Optional[str] = None
    is_active: bool
    role_id: Optional[int] = None
