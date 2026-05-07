# =============================================================
# MODEL: NhatKySuDungAI (Nhật Ký Sử Dụng AI)
# Bảng: nhat_ky_su_dung_ai
# Mô tả: Ghi lại mỗi lần người dùng sử dụng mô hình AI để
#         theo dõi chi phí token và hiệu suất xử lý.
# =============================================================

import uuid
from datetime import datetime
from typing import Optional
from sqlmodel import Field, Relationship, Column
from sqlalchemy import ForeignKey
from sqlalchemy.dialects.postgresql import UUID

from app.database.base import Base


class NhatKySuDungAI(Base, table=True):
    """Model tương ứng với bảng `nhat_ky_su_dung_ai`."""
    __tablename__ = "nhat_ky_su_dung_ai"

    # Khóa chính tự tăng (BIGSERIAL)
    id_nhat_ky: Optional[int] = Field(default=None, primary_key=True)

    # Người dùng thực hiện yêu cầu AI (có thể NULL nếu anonymous)
    id_nguoi_dung: Optional[uuid.UUID] = Field(
        default=None,
        sa_column=Column(UUID(as_uuid=True), ForeignKey("nguoi_dung.id_nguoi_dung"), nullable=True)
    )

    # Mô hình AI được sử dụng (khóa ngoại → mo_hinh_ai)
    id_mo_hinh: Optional[int] = Field(
        default=None, foreign_key="mo_hinh_ai.id_mo_hinh"
    )

    # Số token trong prompt gửi lên AI
    so_token_dau_vao: int = Field(default=0)

    # Số token trong câu trả lời của AI
    so_token_dau_ra: int = Field(default=0)

    # Tổng thời gian xử lý tính bằng millisecond
    thoi_gian_xu_ly_ms: Optional[int] = None

    # Trạng thái kết quả: 'success', 'error', 'timeout', v.v.
    trang_thai: Optional[str] = Field(default=None, max_length=20)

    # Câu lệnh prompt người dùng gửi (TEXT)
    cau_lenh_prompt: Optional[str] = None

    # Mã sơ đồ tương ứng
    id_so_do: Optional[uuid.UUID] = Field(
        default=None,
        sa_column=Column(UUID(as_uuid=True), nullable=True)
    )

    # Thời điểm ghi nhật ký
    ngay_tao: datetime = Field(default_factory=datetime.utcnow)

    # ── Quan hệ ──
    nguoi_dung: Optional["NguoiDung"] = Relationship(back_populates="ai_logs")
