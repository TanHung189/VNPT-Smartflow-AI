# =============================================================
# MODEL: NguoiDung (Người Dùng)
# Bảng: nguoi_dung
# Mô tả: Quản lý tài khoản người dùng trong hệ thống.
#         Hỗ trợ Soft Delete thông qua trường `ngay_xoa`.
# =============================================================

import uuid
from datetime import datetime
from typing import Optional, List
from sqlmodel import Field, Relationship, Column
from sqlalchemy.dialects.postgresql import UUID

from app.database.base import Base
from app.models.role import VaiTro


class NguoiDung(Base, table=True):
    """Model tương ứng với bảng `nguoi_dung` trong CSDL vnpt_smartflow_v1."""
    __tablename__ = "nguoi_dung"

    # Khóa chính UUID — tương đương gen_random_uuid() của PostgreSQL
    id_nguoi_dung: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        sa_column=Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    )

    # Họ tên đầy đủ của người dùng
    ten_nguoi_dung: str = Field(max_length=100, nullable=False)

    # Địa chỉ email (duy nhất, dùng để đăng nhập)
    email: str = Field(max_length=255, unique=True, index=True, nullable=False)

    # Mật khẩu đã được băm (hash) — None nếu đăng nhập bằng OAuth2
    mat_khau_ma_hoa: Optional[str] = Field(default=None)

    # Mã nhân viên trong hệ thống VNPT (duy nhất)
    ma_nhan_vien: Optional[str] = Field(default=None, max_length=50, unique=True)

    # Khóa ngoại trỏ tới bảng vai_tro
    id_vai_tro: Optional[int] = Field(default=None, foreign_key="vai_tro.id_vai_tro")

    # Tên phòng ban của người dùng
    ten_phong_ban: Optional[str] = Field(default=None, max_length=100)

    # Đường dẫn ảnh đại diện
    anh_dai_dien: Optional[str] = None

    # Trạng thái tài khoản (True = đang hoạt động)
    trang_thai_hoat_dong: bool = Field(default=True)

    # Thời điểm đăng nhập gần nhất
    lan_dang_nhap_cuoi: Optional[datetime] = None

    # Thời điểm tạo tài khoản
    ngay_tao: datetime = Field(default_factory=datetime.utcnow)

    # Thời điểm cập nhật thông tin gần nhất (cập nhật tự động qua trigger DB)
    ngay_cap_nhat: datetime = Field(default_factory=datetime.utcnow)

    # Thời điểm xóa mềm (NULL = tài khoản đang hoạt động)
    ngay_xoa: Optional[datetime] = None

    # ── Quan hệ ──
    vai_tro: Optional[VaiTro] = Relationship(back_populates="nguoi_dungs")
    xac_thuc_providers: List["XacThucNguoiDung"] = Relationship(back_populates="nguoi_dung")
    refresh_tokens: List["TokenLamMoi"] = Relationship(back_populates="nguoi_dung")
    ai_logs: List["NhatKySuDungAI"] = Relationship(back_populates="nguoi_dung")
    so_dos: List["SoDo"] = Relationship(back_populates="chu_so_huu")
