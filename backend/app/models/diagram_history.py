# =============================================================
# MODEL: PhienBanSoDo (Phiên Bản Sơ Đồ)
# Bảng: phien_ban_so_do
# Mô tả: Lưu lịch sử các phiên bản của một sơ đồ mỗi khi được cập nhật.
# =============================================================

import uuid
from datetime import datetime
from typing import Dict, Optional
from sqlmodel import Field, Relationship, Column
from sqlalchemy import ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB

from app.database.base import Base


class PhienBanSoDo(Base, table=True):
    """Model tương ứng với bảng `phien_ban_so_do`."""
    __tablename__ = "phien_ban_so_do"

    # Khóa chính UUID cho mỗi phiên bản
    id_phien_ban: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        sa_column=Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    )

    # Khóa ngoại trỏ tới sơ đồ gốc — ✅ ForeignKey đúng trong sa_column
    id_so_do: uuid.UUID = Field(
        sa_column=Column(
            UUID(as_uuid=True),
            ForeignKey("so_do.id_so_do", ondelete="CASCADE"),
            nullable=False,
        )
    )

    # Snapshot dữ liệu sơ đồ tại thời điểm lưu
    du_lieu_so_do: Dict = Field(
        default={},
        sa_column=Column(JSONB, nullable=False)
    )

    # Lý do thay đổi (ghi chú thủ công hoặc tự động)
    ly_do_thay_doi: Optional[str] = None

    # Thời điểm tạo phiên bản này
    ngay_tao: datetime = Field(default_factory=datetime.utcnow)

    # ── Quan hệ — SQLAlchemy tự detect FK từ sa_column ──
    so_do: Optional["SoDo"] = Relationship(back_populates="phien_bans")
