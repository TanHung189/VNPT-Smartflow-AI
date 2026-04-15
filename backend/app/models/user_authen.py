# =============================================================
# MODEL: XacThucNguoiDung (Xác Thực Người Dùng)
# Bảng: xac_thuc_nguoi_dung
# Mô tả: Lưu thông tin xác thực OAuth2 của người dùng.
#         Ví dụ: đăng nhập bằng Google, GitHub, v.v.
# =============================================================

import uuid
from typing import Optional
from sqlmodel import Field, Relationship

from app.database.base import Base


class XacThucNguoiDung(Base, table=True):
    """Model tương ứng với bảng `xac_thuc_nguoi_dung`."""
    __tablename__ = "xac_thuc_nguoi_dung"

    # Khóa chính tự tăng
    id_xac_thuc: Optional[int] = Field(default=None, primary_key=True)

    # Khóa ngoại trỏ tới người dùng
    id_nguoi_dung: uuid.UUID = Field(foreign_key="nguoi_dung.id_nguoi_dung")

    # Nhà cung cấp xác thực: 'google', 'github', 'local', v.v.
    nha_cung_cap: str = Field(max_length=50, nullable=False)

    # ID người dùng do nhà cung cấp cấp (sub của Google, v.v.)
    id_nguoi_dung_cung_cap: str = Field(nullable=False)

    # ── Quan hệ ──
    nguoi_dung: "NguoiDung" = Relationship(back_populates="xac_thuc_providers")
