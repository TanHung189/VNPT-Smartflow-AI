# =============================================================
# SCHEMAS PACKAGE — VNPT Smartflow AI
# Xuất toàn bộ Pydantic Schema tương ứng với CSDL vnpt_smartflow_v1.
# Tên gốc (Tiếng Việt) và alias (Tiếng Anh) đều được export.
# =============================================================

# ── Người dùng ──
from .user import TaoNguoiDung, DocNguoiDung, UserCreate, UserRead

# ── Xác thực ──
from .auth import Token, YeuCauDangNhapGoogle, GoogleLoginRequest

# ── Sơ đồ ──
from .diagram import (
    TaoSoDo, CapNhatSoDo, TraLoiSoDo, TraLoiDanhSachSoDo, LuuSoDoRequest,
    DiagramCreate, DiagramUpdate, DiagramResponse, DiagramListResponse,
    DiagramSaveRequest, DiagramUpdateBody,
)

__all__ = [
    # Tiếng Việt
    "TaoNguoiDung",
    "DocNguoiDung",
    "TaoSoDo",
    "CapNhatSoDo",
    "TraLoiSoDo",
    "TraLoiDanhSachSoDo",
    "LuuSoDoRequest",
    "Token",
    "YeuCauDangNhapGoogle",
    # Alias tiếng Anh (tương thích ngược)
    "UserCreate",
    "UserRead",
    "GoogleLoginRequest",
    "DiagramCreate",
    "DiagramUpdate",
    "DiagramResponse",
    "DiagramListResponse",
    "DiagramSaveRequest",
    "DiagramUpdateBody",
]
