# =============================================================
# MODEL: MoHinhAI (Mô Hình AI)
# Bảng: mo_hinh_ai
# Mô tả: Lưu danh sách các mô hình AI được hỗ trợ trong hệ thống.
#         Ví dụ: gemini-1.5-flash (cloud), qwen2.5-coder:3b (nội bộ).
# =============================================================

from typing import Optional, Dict
from sqlmodel import Field, Column
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime

from app.database.base import Base


class MoHinhAI(Base, table=True):
    """Model tương ứng với bảng `mo_hinh_ai` trong CSDL vnpt_smartflow_v1."""
    __tablename__ = "mo_hinh_ai"

    # Khóa chính tự tăng
    id_mo_hinh: Optional[int] = Field(default=None, primary_key=True)

    # Nhà cung cấp AI: 'gemini', 'ollama', v.v.
    nha_cung_cap: str = Field(max_length=50, nullable=False)

    # Tên định danh duy nhất của mô hình
    ten_mo_hinh: str = Field(max_length=100, unique=True, nullable=False)

    # Mô tả chi tiết về mô hình
    mo_ta: Optional[str] = None

    # Trạng thái hoạt động (True = đang dùng, False = vô hiệu hóa)
    trang_thai_hoat_dong: bool = Field(default=True)

    # Endpoint URL tùy chỉnh (VD: Ollama custom remote URL)
    endpoint_url: Optional[str] = Field(default=None, max_length=255)

    # Tham số cấu hình nâng cao dạng JSON
    tham_so_cau_hinh: Optional[Dict] = Field(
        default=None,
        sa_column=Column(JSONB, nullable=True)
    )

    # Thời điểm đăng ký mô hình vào hệ thống
    ngay_tao: datetime = Field(default_factory=datetime.utcnow)
