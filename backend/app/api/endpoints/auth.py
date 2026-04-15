from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from app.database.session import get_db
from app.models import NguoiDung, XacThucNguoiDung, VaiTro
from app.schemas import UserCreate, Token, GoogleLoginRequest
from app.core.security import get_password_hash, create_access_token, verify_password
from fastapi.security import OAuth2PasswordRequestForm
from typing import Optional
import uuid
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from app.core.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])


# ─────────────────────────────────────────────────────────
# HÀM TIỆN ÍCH: Lấy ID vai trò theo tên vai trò
# ─────────────────────────────────────────────────────────
async def _lay_id_vai_tro(session: AsyncSession, ten_vai_tro: str) -> Optional[int]:
    """Truy vấn bảng vai_tro để lấy id_vai_tro theo tên vai trò."""
    result = await session.exec(select(VaiTro).where(VaiTro.ten_vai_tro == ten_vai_tro))
    vai_tro = result.first()
    return vai_tro.id_vai_tro if vai_tro else None


async def _lay_ten_vai_tro(session: AsyncSession, id_vai_tro: Optional[int]) -> Optional[str]:
    """Truy vấn bảng vai_tro để lấy ten_vai_tro theo id."""
    if id_vai_tro is None:
        return None
    result = await session.exec(select(VaiTro).where(VaiTro.id_vai_tro == id_vai_tro))
    vai_tro = result.first()
    return vai_tro.ten_vai_tro if vai_tro else None


def _tao_user_response(nguoi_dung: NguoiDung, ten_vai_tro: Optional[str]) -> dict:
    """Đóng gói thông tin người dùng để trả về client (không có mật khẩu)."""
    return {
        "id_nguoi_dung": str(nguoi_dung.id_nguoi_dung),
        "ten_nguoi_dung": nguoi_dung.ten_nguoi_dung,
        "email": nguoi_dung.email,
        "anh_dai_dien": nguoi_dung.anh_dai_dien,
        "trang_thai_hoat_dong": nguoi_dung.trang_thai_hoat_dong,
        "id_vai_tro": nguoi_dung.id_vai_tro,
        "ten_vai_tro": ten_vai_tro,
    }


# ─────────────────────────────────────────────────────────
# POST /auth/register — Đăng ký tài khoản nhân viên mới
# ─────────────────────────────────────────────────────────
@router.post("/register", response_model=Token)
async def dang_ky(nguoi_dung_in: UserCreate, session: AsyncSession = Depends(get_db)):
    """
    Tạo tài khoản người dùng mới.
    - Mặc định gán vai trò 'nhan_vien' (lấy từ bảng vai_tro).
    - Trả về JWT token và thông tin người dùng ngay sau khi đăng ký.
    """
    # 1. Kiểm tra email đã tồn tại chưa
    stmt_check = select(NguoiDung).where(
        NguoiDung.email == nguoi_dung_in.email,
        NguoiDung.ngay_xoa == None  # noqa: E711 — chỉ xét tài khoản chưa xóa
    )
    result = await session.exec(stmt_check)
    if result.first():
        raise HTTPException(status_code=400, detail="Email này đã được sử dụng trong hệ thống")

    # 2. Lấy id_vai_tro của 'nhan_vien' trong bảng vai_tro
    id_vai_tro_nv = await _lay_id_vai_tro(session, "nhan_vien")
    # Không ném lỗi nếu bảng vai_tro chưa có dữ liệu — vẫn tạo tài khoản được

    # 3. Tạo bản ghi NguoiDung mới
    nguoi_dung_moi = NguoiDung(
        ten_nguoi_dung=nguoi_dung_in.ten_nguoi_dung,
        email=nguoi_dung_in.email,
        mat_khau_ma_hoa=get_password_hash(nguoi_dung_in.mat_khau),
        id_vai_tro=id_vai_tro_nv,
        trang_thai_hoat_dong=True,
    )
    session.add(nguoi_dung_moi)
    await session.commit()
    await session.refresh(nguoi_dung_moi)

    # 4. Cấp JWT token
    access_token = create_access_token(subject=str(nguoi_dung_moi.id_nguoi_dung))
    user_data    = _tao_user_response(nguoi_dung_moi, "nhan_vien")

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_data,
    }


# ─────────────────────────────────────────────────────────
# POST /auth/login — Đăng nhập email + mật khẩu
# ─────────────────────────────────────────────────────────
@router.post("/login", response_model=Token)
async def dang_nhap(
    form_data: OAuth2PasswordRequestForm = Depends(),
    session: AsyncSession = Depends(get_db),
):
    """
    Xác thực người dùng bằng email (username field) và mật khẩu.
    Chỉ cho phép tài khoản chưa bị xóa mềm (ngay_xoa IS NULL).
    Trả về JWT + ten_vai_tro để frontend điều hướng đúng dashboard.
    """
    # Tìm người dùng theo email — lọc tài khoản chưa xóa mềm
    stmt = select(NguoiDung).where(
        NguoiDung.email == form_data.username,
        NguoiDung.ngay_xoa == None  # noqa: E711
    )
    result     = await session.exec(stmt)
    nguoi_dung = result.first()

    # Kiểm tra tồn tại và mật khẩu đúng
    if not nguoi_dung or not verify_password(form_data.password, nguoi_dung.mat_khau_ma_hoa or ""):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email hoặc mật khẩu không chính xác",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Lấy tên vai trò để trả cho frontend
    ten_vai_tro = await _lay_ten_vai_tro(session, nguoi_dung.id_vai_tro)

    access_token = create_access_token(subject=str(nguoi_dung.id_nguoi_dung))
    user_data    = _tao_user_response(nguoi_dung, ten_vai_tro)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_data,
    }


# ─────────────────────────────────────────────────────────
# POST /auth/google — Đăng nhập bằng Google OAuth2
# ─────────────────────────────────────────────────────────
@router.post("/google", response_model=Token)
async def dang_nhap_google(request: GoogleLoginRequest, session: AsyncSession = Depends(get_db)):
    """
    Xác thực Google ID Token gửi lên từ '@react-oauth/google'.
    - Tự động tạo tài khoản nếu email chưa có trong hệ thống.
    - Ghi nhận nhà cung cấp vào bảng xac_thuc_nguoi_dung.
    """
    try:
        # 1. Xác minh Google ID Token
        client_id = getattr(settings, "GOOGLE_CLIENT_ID", None)
        idinfo = id_token.verify_oauth2_token(
            request.token,
            google_requests.Request(),
            client_id if client_id else None,
        )

        email = idinfo.get("email")
        ten   = idinfo.get("name")
        anh   = idinfo.get("picture")

        if not email:
            raise HTTPException(status_code=400, detail="Google token không chứa email")

        # 2. Tìm tài khoản hiện có (chưa bị xóa mềm)
        stmt  = select(NguoiDung).where(NguoiDung.email == email, NguoiDung.ngay_xoa == None)  # noqa: E711
        result = await session.exec(stmt)
        nguoi_dung = result.first()

        if not nguoi_dung:
            # 3. Lần đầu đăng nhập bằng Google → Tự động tạo tài khoản nhân viên
            id_vai_tro_nv = await _lay_id_vai_tro(session, "nhan_vien")
            nguoi_dung = NguoiDung(
                ten_nguoi_dung=ten or "Người dùng Google",
                email=email,
                mat_khau_ma_hoa=get_password_hash(str(uuid.uuid4())),  # Mật khẩu ngẫu nhiên
                id_vai_tro=id_vai_tro_nv,
                trang_thai_hoat_dong=True,
                anh_dai_dien=anh,
            )
            session.add(nguoi_dung)
            await session.commit()
            await session.refresh(nguoi_dung)

            # 4. Ghi nhận phương thức xác thực Google
            xac_thuc = XacThucNguoiDung(
                id_nguoi_dung=nguoi_dung.id_nguoi_dung,
                nha_cung_cap="google",
                id_nguoi_dung_cung_cap=idinfo.get("sub"),
            )
            session.add(xac_thuc)
            await session.commit()

        # 5. Lấy tên vai trò
        ten_vai_tro  = await _lay_ten_vai_tro(session, nguoi_dung.id_vai_tro)
        access_token = create_access_token(subject=str(nguoi_dung.id_nguoi_dung))
        user_data    = _tao_user_response(nguoi_dung, ten_vai_tro)

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user_data,
        }

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token Google không hợp lệ: {str(e)}",
        )