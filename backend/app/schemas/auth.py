# =============================================================
# SCHEMA: Xác Thực (Auth Schemas)
# Mô tả: Định nghĩa dữ liệu cho phản hồi đăng nhập và
#         các yêu cầu xác thực OAuth2.
#
# ⚠️  Token.user là Dict vì auth.py trả dict thô từ
#     _tao_user_response() — giúp tránh lỗi Pydantic validation
#     khi UUID không được serialize đúng từ ORM object.
# =============================================================

from pydantic import BaseModel
from typing import Optional, Dict, Any


class Token(BaseModel):
    """Phản hồi trả về sau khi đăng nhập/đăng ký thành công."""
    access_token: str            # JWT Access Token
    token_type: str = "bearer"  # Luôn là "bearer"
    user: Dict[str, Any]        # Dict người dùng (id_nguoi_dung, ten_nguoi_dung, ten_vai_tro,...)


class YeuCauDangNhapGoogle(BaseModel):
    """Yêu cầu đăng nhập bằng Google OAuth2."""
    token: str                   # ID Token do Google cấp cho client


# ── Alias tiếng Anh để tương thích với code hiện tại ──
GoogleLoginRequest = YeuCauDangNhapGoogle
