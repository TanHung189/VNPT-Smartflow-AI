# =============================================================
# MODEL: VaiTro (Vai Trò)
# Bảng: vai_tro
# Mô tả: Quản lý các vai trò trong hệ thống VNPT Smartflow AI.
#         Chỉ có 2 vai trò chính: 'quan_tri' và 'nhan_vien'.
# =============================================================

from typing import Optional, List, Dict
from sqlmodel import Field, Relationship, Column
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime

from app.database.base import Base


class VaiTro(Base, table=True):
    """Model tương ứng với bảng `vai_tro` trong CSDL vnpt_smartflow_v1."""
    __tablename__ = "vai_tro"

    # Khóa chính tự tăng
    id_vai_tro: Optional[int] = Field(default=None, primary_key=True)

    # Tên vai trò (duy nhất): 'quan_tri' hoặc 'nhan_vien'
    ten_vai_tro: str = Field(max_length=50, unique=True, nullable=False)

    # Mô tả ngắn về vai trò
    mo_ta: Optional[str] = None

    # Danh sách quyền hạn dạng JSON (mặc định rỗng)
    quyen_han: Dict = Field(default={}, sa_column=Column(JSONB))

    # Thời điểm tạo vai trò
    ngay_tao: datetime = Field(default_factory=datetime.utcnow)

    # ── Quan hệ ngược ──
    # Danh sách người dùng thuộc vai trò này
    nguoi_dungs: List["NguoiDung"] = Relationship(back_populates="vai_tro")
