#==================================================
#file này chứa các logic bảo mật hash pass, JWT
#==============================================
import os                                           
from datetime import datetime, timedelta            # Để xử lý thời gian (tạo hạn dùng cho Token)
from typing import Any, Union                      
from jose import jwt                                # Thư viện chính để tạo và giải mã chuỗi JWT
from passlib.context import CryptContext            # Thư viện chuyên dụng để mã hóa mật khẩu
from app.core.config import Settings
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
     return pwd_context.verify(plain_password, hashed_password)

def create_access_token(subject: Union[str, Any]) -> str:

    # Tính toán thời điểm Token này sẽ hết hạn
    expire = datetime.utcnow() + timedelta(minutes=Settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    # Payload: Dữ liệu nằm bên trong Token (chứa ID user và thời hạn)
    to_encode = {
        "exp": expire,             
        "sub": str(subject)        
    }
    # Tiến hành đóng gói và ký tên bằng chìa khóa SECRET_KEY
    encoded_jwt = jwt.encode(
        to_encode, 
        Settings.JWT_SECRET_KEY,        
        algorithm=Settings.ALGORITHM 
    )
    
    return encoded_jwt
