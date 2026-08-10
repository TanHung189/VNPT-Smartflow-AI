# =============================================================
# SCHEMA: Sơ Đồ (Diagram Schemas)
# Mô tả: Định nghĩa dữ liệu đầu vào/đầu ra cho API sơ đồ.
#         Tên trường khớp 100% với cột trong bảng `so_do`.
# =============================================================

from pydantic import BaseModel, ConfigDict
from typing import Dict, Any, Optional
import uuid
from datetime import datetime


class TaoSoDo(BaseModel):
    """Schema nhận dữ liệu khi tạo sơ đồ mới (POST /diagrams/save)."""
    tieu_de: str                                      # Tiêu đề sơ đồ (bắt buộc)
    du_lieu_so_do: Dict[str, Any]                     # Dữ liệu JSON React Flow (nodes + edges)
    la_noi_bo: bool = False                           # Chỉ dùng AI nội bộ?
    van_ban_dau_vao: Optional[str] = None             # Văn bản prompt gốc của người dùng
    the_loai: str = "flowchart"                       # Thể loại sơ đồ
    anh_thu_nho: Optional[str] = None                 # Ảnh thu nhỏ dạng Base64
    mo_ta_ngan: Optional[str] = None                  # Mô tả ngắn sơ đồ
    ly_do_thay_doi: Optional[str] = None              # Tùy chọn lý do lưu log version



class CapNhatSoDo(BaseModel):
    """Schema nhận dữ liệu khi cập nhật sơ đồ (PUT /diagrams/{id})."""
    tieu_de: str                                      # Tiêu đề mới
    du_lieu_so_do: Dict[str, Any]                     # Dữ liệu JSON mới
    la_noi_bo: bool = False                           # Cờ AI nội bộ
    anh_thu_nho: Optional[str] = None                 # Ảnh thu nhỏ dạng Base64
    mo_ta_ngan: Optional[str] = None                  # Mô tả ngắn
    ly_do_thay_doi: Optional[str] = None              # Tùy chọn lý do lưu log version


class TraLoiSoDo(BaseModel):
    """Schema trả về đầy đủ thông tin một sơ đồ."""
    id_so_do: uuid.UUID                               # Mã sơ đồ (UUID)
    id_chu_so_huu: uuid.UUID                          # UUID người sở hữu
    tieu_de: str                                      # Tiêu đề sơ đồ
    the_loai: str                                     # Thể loại
    du_lieu_so_do: Dict[str, Any]                     # Dữ liệu React Flow
    la_noi_bo: bool = False                           # Cờ AI nội bộ
    la_mau_chuan: bool = False                        # Là template chuẩn?
    van_ban_dau_vao: Optional[str] = None             # Prompt gốc
    mo_ta_ngan: Optional[str] = None                  # Mô tả ngắn
    ngay_tao: datetime                                # Ngày tạo
    ngay_cap_nhat: datetime                           # Ngày cập nhật

    model_config = ConfigDict(from_attributes=True)


class TraLoiDanhSachSoDo(BaseModel):
    """Schema trả về mỗi phần tử trong danh sách sơ đồ (GET /diagrams/list)."""
    id_so_do: uuid.UUID                               # Mã sơ đồ
    tieu_de: str                                      # Tiêu đề
    the_loai: str = "flowchart"                       # Thể loại
    la_noi_bo: bool = False                           # Cờ nội bộ
    la_mau_chuan: bool = False                        # Template?
    mo_ta_ngan: Optional[str] = None                  # Mô tả ngắn
    ngay_cap_nhat: datetime                           # Lần cuối cập nhật

    model_config = ConfigDict(from_attributes=True)


class LuuSoDoRequest(BaseModel):
    """Schema request đơn giản cho endpoint lưu nhanh."""
    tieu_de: str
    du_lieu_so_do: dict
    van_ban_dau_vao: Optional[str] = None
    mo_ta_ngan: Optional[str] = None


# ── Alias tiếng Anh để tương thích với diagram_router.py và diagram_service.py ──
DiagramCreate       = TaoSoDo
DiagramUpdate       = CapNhatSoDo
DiagramResponse     = TraLoiSoDo
DiagramListResponse = TraLoiDanhSachSoDo
DiagramSaveRequest  = LuuSoDoRequest
DiagramUpdateBody   = CapNhatSoDo
