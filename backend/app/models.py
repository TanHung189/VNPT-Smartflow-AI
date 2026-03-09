#=====================================================
#Sử dụng thư viện sqlmodel để viết các class database
#==========================================================

from sqlmodel import SQLModel, Field, Column, JSON, Relationship
from datetime import datetime
from typing import Optional, List, Dict


class VaiTro(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    ten_vai_tro: str = Field(unique=True, index=True)
    mo_ta: Optional[str] = None
    
    # Quan hệ: Một vai trò có thể có nhiều người dùng
    cac_nguoi_dung: List["NguoiDung"] = Relationship(back_populates="vai_tro")

# 2. Bảng NgườiDùng: Quản lý tài khoản cán bộ VNPT và người dùng tự do
class NguoiDung(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    ten_dang_nhap: str = Field(unique=True, index=True)
    mat_khau_ma_hoa: str
    ho_ten: str # Bùi Đổ Tấn Hưng
    ngay_tao: datetime = Field(default_factory=datetime.now)
    
    # Khóa ngoại nối với bảng VaiTro
    id_vai_tro: Optional[int] = Field(default=None, foreign_key="vaitro.id")
    vai_tro: Optional[VaiTro] = Relationship(back_populates="cac_nguoi_dung")
    
    # Quan hệ với các bảng khác
    cac_so_do: List["SoDo"] = Relationship(back_populates="nguoi_tao")
    cac_nhan_xet: List["NhanXet"] = Relationship(back_populates="nguoi_viet")
    cac_danh_muc: List["DanhMuc"] = Relationship(back_populates="nguoi_so_huu")

# 3. Bảng DanhMục: Phân loại theo lĩnh vực (Kỹ thuật, Giáo dục, Cá nhân)
class DanhMuc(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    ten_danh_muc: str = Field(index=True)
    mo_ta: Optional[str] = None
    
    # Nếu id_nguoi_dung là NULL thì đây là danh mục hệ thống có sẵn
    id_nguoi_dung: Optional[int] = Field(default=None, foreign_key="nguoidung.id")
    nguoi_so_huu: Optional[NguoiDung] = Relationship(back_populates="cac_danh_muc")
    
    cac_so_do: List["SoDo"] = Relationship(back_populates="danh_muc")

# 4. Bảng MẫuSơĐồ: Các Template giao diện (Xanh VNPT, Dark Mode...)
class MauSoDo(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    ten_mau: str = Field(unique=True)
    # Lưu cấu hình CSS, màu sắc dưới dạng JSON
    cau_hinh_style: Dict = Field(default={}, sa_column=Column(JSON))
    
    cac_so_do: List["SoDo"] = Relationship(back_populates="mau_da_chon")

# 5. Bảng SơĐồ: Lưu trữ kết quả sơ đồ quy trình từ Gemini AI
class SoDo(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    tieu_de: str = Field(index=True)
    van_ban_goc: str # Nội dung trích xuất từ file .docx
    # Dữ liệu Nodes và Edges cho React Flow
    du_lieu_json: Dict = Field(default={}, sa_column=Column(JSON)) 
    ngay_tao: datetime = Field(default_factory=datetime.now)
    
    # Các khóa ngoại liên kết
    id_nguoi_dung: int = Field(foreign_key="nguoidung.id")
    nguoi_tao: Optional[NguoiDung] = Relationship(back_populates="cac_so_do")
    
    id_danh_muc: Optional[int] = Field(foreign_key="danhmuc.id")
    danh_muc: Optional[DanhMuc] = Relationship(back_populates="cac_so_do")
    
    id_mau: Optional[int] = Field(foreign_key="mausodo.id")
    mau_da_chon: Optional[MauSoDo] = Relationship(back_populates="cac_so_do")
    
    cac_tai_lieu: List["TaiLieu"] = Relationship(back_populates="so_do")
    cac_nhan_xet: List["NhanXet"] = Relationship(back_populates="so_do")

# 6. Bảng TàiLiệu: Quản lý file gốc phục vụ đối soát
class TaiLieu(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    ten_file: str
    duong_dan: str
    loai_file: str # .docx, .pdf
    ngay_tai_len: datetime = Field(default_factory=datetime.now)
    
    id_so_do: int = Field(foreign_key="sodo.id")
    so_do: Optional[SoDo] = Relationship(back_populates="cac_tai_lieu")

# 7. Bảng LịchSửSơĐồ: Theo dõi các phiên bản chỉnh sửa
class LichSuSoDo(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    id_so_do: int = Field(foreign_key="sodo.id")
    du_lieu_cu: Dict = Field(sa_column=Column(JSON))
    ngay_chinh_sua: datetime = Field(default_factory=datetime.now)

# 8. Bảng NhậnXét: Thảo luận và góp ý quy trình
class NhanXet(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    noi_dung: str
    ngay_tao: datetime = Field(default_factory=datetime.now)
    
    id_so_do: int = Field(foreign_key="sodo.id")
    so_do: Optional[SoDo] = Relationship(back_populates="cac_nhan_xet")
    
    id_nguoi_dung: int = Field(foreign_key="nguoidung.id")
    nguoi_viet: Optional[NguoiDung] = Relationship(back_populates="cac_nhan_xet")

