#==================================================
#file này chứa các logic bảo mật hash pass, JWT
#==============================================
import os                                           
import hashlib
import base64
from datetime import datetime, timedelta            # Để xử lý thời gian (tạo hạn dùng cho Token)
from typing import Any, Union                      
from jose import jwt
from itsdangerous import URLSafeTimedSerializer, SignatureExpired, BadSignature

import bcrypt
from app.core.config import settings

def __prepare_password(password: str) -> str:
    """Nếu mật khẩu dài hơn 72 bytes (giới hạn của bcrypt), ta băm SHA256 trước để tránh lỗi."""
    pass_bytes = password.encode('utf-8')
    if len(pass_bytes) > 72:
        return base64.b64encode(hashlib.sha256(pass_bytes).digest()).decode('ascii')
    return password

def get_password_hash(password: str) -> str:
    pwd_bytes = __prepare_password(password).encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(
            __prepare_password(plain_password).encode('utf-8'),
            hashed_password.encode('utf-8')
        )
    except ValueError:
        return False

def create_access_token(subject: Union[str, Any]) -> str:

    # Tính toán thời điểm Token này sẽ hết hạn
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    # Payload: Dữ liệu nằm bên trong Token (chứa ID user và thời hạn)
    to_encode = {
        "exp": expire,
        "sub": str(subject)
    }
    # Tiến hành đóng gói và ký tên bằng chìa khóa SECRET_KEY
    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.ALGORITHM
    )

    return encoded_jwt


# ── Password Reset Token ─────────────────────────────────────────────────
# Sử dụng itsdangerous để tạo token URL-safe có TTL

def create_password_reset_token(email: str) -> str:
    """
    Tạo token reset mật khẩu dạng URL-safe, có TTL = PASSWORD_RESET_TOKEN_EXPIRE_MINUTES.
    Token được ký bằng JWT_SECRET_KEY để chống giả mạo.
    """
    serializer = URLSafeTimedSerializer(settings.JWT_SECRET_KEY)
    return serializer.dumps(email, salt="password-reset-salt")


def verify_password_reset_token(token: str) -> str | None:
    """
    Xác minh token reset mật khẩu và trả về email nếu hợp lệ.
    Trả về None nếu token hết hạn hoặc bị giả mạo.
    """
    serializer = URLSafeTimedSerializer(settings.JWT_SECRET_KEY)
    max_age = settings.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES * 60  # Chuyển phút → giây
    try:
        email = serializer.loads(token, salt="password-reset-salt", max_age=max_age)
        return email
    except (SignatureExpired, BadSignature):
        return None
