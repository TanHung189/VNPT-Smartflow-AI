# =============================================================
# SCHEMA: Người Dùng (User Schemas) — vnpt_smartflow_v1
# =============================================================

from pydantic import BaseModel, EmailStr
from typing import Optional
import uuid


class TaoNguoiDung(BaseModel):
    """Schema nhận dữ liệu khi đăng ký tài khoản mới."""
    ten_nguoi_dung: str          # Họ tên đầy đủ — khớp cột ten_nguoi_dung
    email: EmailStr              # Địa chỉ email dùng để đăng nhập
    mat_khau: str                # Mật khẩu chưa mã hoá
    ma_nhan_vien: Optional[str] = None # Mã nhân viên (Tùy chọn)


class DocNguoiDung(BaseModel):
    """Schema trả về thông tin người dùng (loại bỏ mật khẩu)."""
    id_nguoi_dung: uuid.UUID          # Mã định danh duy nhất (UUID)
    ten_nguoi_dung: str               # Họ tên đầy đủ
    email: EmailStr                   # Email đăng nhập
    anh_dai_dien: Optional[str] = None        # URL ảnh đại diện
    trang_thai_hoat_dong: bool = True         # Tài khoản đang hoạt động?
    id_vai_tro: Optional[int] = None          # Mã vai trò (FK → vai_tro)
    ten_vai_tro: Optional[str] = None         # Tên vai trò: 'quan_tri' / 'nhan_vien'
    ten_phong_ban: Optional[str] = None       # Tên phòng ban (nếu có)
    ma_nhan_vien: Optional[str] = None        # Mã nhân viên

    model_config = {"from_attributes": True}


# ── Alias tiếng Anh để tương thích ngược ──
UserRead   = DocNguoiDung
UserCreate = TaoNguoiDung
