# =============================================================
# MODEL: NhatKyHeThong (Nhật Ký Hệ Thống)
# Bảng: nhat_ky_he_thong
# Mô tả: Ghi lại toàn bộ hoạt động quan trọng trên hệ thống.
#         Dùng để kiểm tra, giám sát và giải trình (audit trail).
# =============================================================

import uuid
from datetime import datetime
from typing import Dict, Optional
from sqlmodel import Field, Column
from sqlalchemy import ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB

from app.database.base import Base


class NhatKyHeThong(Base, table=True):
    """Model tương ứng với bảng `nhat_ky_he_thong`."""
    __tablename__ = "nhat_ky_he_thong"

    # Khóa chính tự tăng (BIGSERIAL)
    id_nhat_ky: Optional[int] = Field(default=None, primary_key=True)

    # Người thực hiện hành động — ✅ ForeignKey đúng, nullable để log cả hành động hệ thống
    id_nguoi_dung: Optional[uuid.UUID] = Field(
        default=None,
        sa_column=Column(
            UUID(as_uuid=True),
            ForeignKey("nguoi_dung.id_nguoi_dung", ondelete="SET NULL"),
            nullable=True,
        )
    )

    # Tên hành động thực hiện (ví dụ: 'CREATE_DIAGRAM', 'DELETE_USER')
    hanh_dong: str = Field(max_length=100, nullable=False)

    # Tên bảng bị ảnh hưởng (ví dụ: 'so_do', 'nguoi_dung')
    bang_bi_anh_huong: Optional[str] = Field(default=None, max_length=50)

    # ID bản ghi bị ảnh hưởng (dạng string để linh hoạt)
    id_ban_ghi: Optional[str] = Field(default=None, max_length=50)

    # Chi tiết bổ sung dạng JSON (trước/sau thay đổi, v.v.)
    chi_tiet: Optional[Dict] = Field(
        default=None,
        sa_column=Column(JSONB, nullable=True)
    )

    # Địa chỉ IP của client gửi yêu cầu
    dia_chi_ip: Optional[str] = Field(default=None, max_length=45)

    # Thời điểm ghi nhật ký
    ngay_tao: datetime = Field(default_factory=datetime.utcnow)
