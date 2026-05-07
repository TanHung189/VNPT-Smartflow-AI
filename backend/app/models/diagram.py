# =============================================================
# MODEL: SoDo (Sơ Đồ)  
# Bảng: so_do
# Mô tả: Lưu trữ các sơ đồ luồng công việc được tạo bởi người dùng.
#         Hỗ trợ Soft Delete thông qua trường `ngay_xoa`.
#         Tất cả truy vấn SELECT phải lọc ngay_xoa IS NULL.
# =============================================================

import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional
from sqlmodel import Field, Relationship, Column
from sqlalchemy import ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB

def naive_utc() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)

from app.database.base import Base


class SoDo(Base, table=True):
    """Model tương ứng với bảng `so_do` trong CSDL vnpt_smartflow_v1."""
    __tablename__ = "so_do"

    # Khóa chính UUID
    id_so_do: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        sa_column=Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    )

    # Người sở hữu sơ đồ — ✅ ForeignKey khai báo đúng trong sa_column
    id_chu_so_huu: uuid.UUID = Field(
        sa_column=Column(
            UUID(as_uuid=True),
            ForeignKey("nguoi_dung.id_nguoi_dung", ondelete="CASCADE"),
            nullable=False,
            index=True,
        )
    )

    # Tiêu đề sơ đồ
    tieu_de: str = Field(max_length=255, nullable=False)

    # Thể loại sơ đồ (ví dụ: flowchart, sequence, v.v.)
    the_loai: str = Field(max_length=50, nullable=False, default="flowchart")

    # Mô tả ngắn
    mo_ta_ngan: Optional[str] = None

    # Văn bản đầu vào gốc (prompt người dùng nhập vào)
    van_ban_dau_vao: Optional[str] = None

    # Dữ liệu sơ đồ React Flow dạng JSON (nodes + edges)
    du_lieu_so_do: Dict = Field(
        default={},
        sa_column=Column(JSONB, nullable=False, server_default='{}')
    )

    # Đường dẫn ảnh thu nhỏ (thumbnail)
    anh_thu_nho: Optional[str] = None

    # Sơ đồ nội bộ (True = chỉ dùng AI nội bộ, không cloud)
    la_noi_bo: bool = Field(default=False)

    # Sơ đồ mẫu chuẩn (True = dùng làm template)
    la_mau_chuan: bool = Field(default=False)

    # Thời điểm tạo sơ đồ
    ngay_tao: datetime = Field(
        default_factory=naive_utc,
        sa_column=Column(DateTime(timezone=False), nullable=False, default=naive_utc)
    )

    # Thời điểm cập nhật gần nhất
    ngay_cap_nhat: datetime = Field(
        default_factory=naive_utc,
        sa_column=Column(DateTime(timezone=False), nullable=False, default=naive_utc, onupdate=naive_utc)
    )

    # Thời điểm xóa mềm — NULL = sơ đồ đang tồn tại
    # QUAN TRỌNG: Mọi SELECT phải có điều kiện ngay_xoa IS NULL
    ngay_xoa: Optional[datetime] = Field(
        default=None, 
        sa_column=Column(DateTime(timezone=False), nullable=True)
    )

    # ── Quan hệ ──
    # SQLAlchemy tự detect FK từ sa_column → không cần sa_relationship_kwargs nữa
    chu_so_huu: Optional["NguoiDung"] = Relationship(back_populates="so_dos")
    phien_bans: List["PhienBanSoDo"] = Relationship(back_populates="so_do")
