#==================================================
#file này chứa các endpoint Register, Login, Google Login. Như là DTO
#==============================================

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

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead

class GoogleLoginRequest(BaseModel):
    token: str  # Chuỗi Token dài dằng dặc mà Google cấp cho Client