from pydantic import BaseModel
from typing import Optional
from .user import UserRead

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead

class GoogleLoginRequest(BaseModel):
    token: str  # Chuỗi Token dài dằng dặc mà Google cấp cho Client
