# =============================================================
# MODEL: TokenLamMoi (Token Làm Mới)
# Bảng: token_lam_moi
# Mô tả: Lưu Refresh Token để cấp lại Access Token sau khi hết hạn.
#         Token có thể bị thu hồi (revoke) thủ công bởi admin.
# =============================================================

import uuid
from datetime import datetime
from typing import Optional
from sqlmodel import Field, Relationship

from app.database.base import Base


class TokenLamMoi(Base, table=True):
    """Model tương ứng với bảng `token_lam_moi`."""
    __tablename__ = "token_lam_moi"

    # Khóa chính tự tăng
    id_token: Optional[int] = Field(default=None, primary_key=True)

    # Khóa ngoại trỏ tới người dùng sở hữu token
    id_nguoi_dung: uuid.UUID = Field(foreign_key="nguoi_dung.id_nguoi_dung")

    # Chuỗi giá trị token (duy nhất, được lưu dạng hash trong thực tế)
    gia_tri_token: str = Field(unique=True, nullable=False)

    # Thời điểm hết hạn của token
    ngay_het_han: datetime = Field(nullable=False)

    # Trạng thái thu hồi (True = đã bị vô hiệu hóa)
    bi_thu_hoi: bool = Field(default=False)

    # Thời điểm tạo token
    ngay_tao: datetime = Field(default_factory=datetime.utcnow)

    # ── Quan hệ ──
    nguoi_dung: "NguoiDung" = Relationship(back_populates="refresh_tokens")
