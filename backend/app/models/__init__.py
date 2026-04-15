# =============================================================
# MODELS PACKAGE — VNPT Smartflow AI
# Xuất toàn bộ Model SQLAlchemy/SQLModel tương ứng với schema
# vnpt_smartflow_v1 (tên bảng và cột đầy đủ bằng Tiếng Việt).
# =============================================================

from app.models.role import VaiTro
from app.models.user import NguoiDung
from app.models.user_authen import XacThucNguoiDung
from app.models.refresh_token import TokenLamMoi
from app.models.ai_model import MoHinhAI
from app.models.diagram import SoDo
from app.models.diagram_history import PhienBanSoDo
from app.models.ai_usage_log import NhatKySuDungAI
from app.models.system_log import NhatKyHeThong

__all__ = [
    "VaiTro",           # Bảng: vai_tro
    "NguoiDung",        # Bảng: nguoi_dung
    "XacThucNguoiDung", # Bảng: xac_thuc_nguoi_dung
    "TokenLamMoi",      # Bảng: token_lam_moi
    "MoHinhAI",         # Bảng: mo_hinh_ai
    "SoDo",             # Bảng: so_do
    "PhienBanSoDo",     # Bảng: phien_ban_so_do
    "NhatKySuDungAI",   # Bảng: nhat_ky_su_dung_ai
    "NhatKyHeThong",    # Bảng: nhat_ky_he_thong
]
