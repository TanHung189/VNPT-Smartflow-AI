from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from app.database.session import get_db
from app.models import NguoiDung, XacThucNguoiDung, VaiTro
from app.schemas import UserCreate, Token, GoogleLoginRequest
from app.core.security import (
    get_password_hash, create_access_token, verify_password,
    create_password_reset_token, verify_password_reset_token,
)
from fastapi.security import OAuth2PasswordRequestForm
from typing import Optional
import secrets
from datetime import datetime
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

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

    # Cập nhật lần đăng nhập cuối
    nguoi_dung.lan_dang_nhap_cuoi = datetime.utcnow()
    await session.commit()

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
            # FIX: Dùng secrets.token_urlsafe(32) thay uuid4() để đảm bảo
            # mật khẩu dummy luôn < 72 byte (giới hạn bcrypt).
            # uuid4() an toàn (36 chars) nhưng token_urlsafe(32) = 43 chars,
            # semantically rõ ràng hơn và không bao giờ có thể vượt giới hạn.
            dummy_password = secrets.token_urlsafe(32)
            nguoi_dung = NguoiDung(
                ten_nguoi_dung=ten or "Người dùng Google",
                email=email,
                mat_khau_ma_hoa=get_password_hash(dummy_password),
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


# ─────────────────────────────────────────────────────────
# POST /auth/forgot-password — Yêu cầu link reset mật khẩu
# ─────────────────────────────────────────────────────────
from pydantic import BaseModel, EmailStr

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

@router.post("/forgot-password", status_code=200)
async def quen_mat_khau(
    request: ForgotPasswordRequest,
    session: AsyncSession = Depends(get_db)
):
    """
    Gửi link reset mật khẩu qua email.
    LUÔN trả về 200 để tránh bị dò email tồn tại hay không (enumeration attack).
    """
    stmt = select(NguoiDung).where(
        NguoiDung.email == request.email,
        NguoiDung.ngay_xoa == None  # noqa: E711
    )
    result = await session.exec(stmt)
    user = result.first()

    # Trả về thông báo chung dù email tồn tại hay không (bảo mật)
    generic_msg = {"message": "Nếu email tồn tại, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu trong vài phút."}

    if not user:
        return generic_msg  # Không tiết lộ email không tồn tại

    # Tạo reset token có TTL 30 phút
    reset_token = create_password_reset_token(user.email)
    reset_link = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"

    # Gửi email (tự động dùng SMTP nếu có cấu hình)
    if settings.MAIL_USERNAME and settings.MAIL_SERVER:
        try:
            from fastapi_mail import FastMail, MessageSchema, ConnectionConfig as MailConfig

            mail_config = MailConfig(
                MAIL_USERNAME=settings.MAIL_USERNAME,
                MAIL_PASSWORD=settings.MAIL_PASSWORD,
                MAIL_FROM=settings.MAIL_FROM,
                MAIL_FROM_NAME=settings.MAIL_FROM_NAME,
                MAIL_PORT=settings.MAIL_PORT,
                MAIL_SERVER=settings.MAIL_SERVER,
                MAIL_STARTTLS=settings.MAIL_STARTTLS,
                MAIL_SSL_TLS=settings.MAIL_SSL_TLS,
                USE_CREDENTIALS=True,
            )

            message = MessageSchema(
                subject="[⚡ VNPT SmartFlow AI] Đặt lại mật khẩu của bạn",
                recipients=[user.email],
                body=(
                    f"Xin chào {user.ten_nguoi_dung},\n\n"
                    f"Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.\n"
                    f"Nhấp vào link bên dưới để tiếp tục (link có hiệu lực trong 30 phút):\n\n"
                    f"{reset_link}\n\n"
                    f"Nếu bạn không yêu cầu điều này, hãy bỏ qua email này.\n\n"
                    f"Trân trọng,\nNhóm VNPT SmartFlow AI"
                ),
                subtype="plain",
            )

            fm = FastMail(mail_config)
            await fm.send_message(message)
            logger.info(f"[✉️ Password Reset] Email gửi thành công đến {user.email}")
        except Exception as e:
            logger.error(f"[Password Reset] Lỗi gửi email: {e}")
    else:
        # Fallback khi chưa cáu hình email: log và reset link ra console
        logger.warning(
            f"[Password Reset] Email chưa cấu hình. Reset link cho {user.email}:\n{reset_link}"
        )

    return generic_msg


# ─────────────────────────────────────────────────────────
# POST /auth/reset-password — Đặt lại mật khẩu với token
# ─────────────────────────────────────────────────────────
@router.post("/reset-password", status_code=200)
async def dat_lai_mat_khau(
    request: ResetPasswordRequest,
    session: AsyncSession = Depends(get_db)
):
    """
    Xác minh token và cập nhật mật khẩu mới cho người dùng.
    Token hết hạn sau PASSWORD_RESET_TOKEN_EXPIRE_MINUTES phút.
    """
    # Xác minh token
    email = verify_password_reset_token(request.token)
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn."
        )

    # Kiểm tra độ dài mật khẩu
    if len(request.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Mật khẩu mới phải có ít nhất 8 ký tự."
        )

    # Tìm người dùng
    stmt = select(NguoiDung).where(
        NguoiDung.email == email,
        NguoiDung.ngay_xoa == None  # noqa: E711
    )
    result = await session.exec(stmt)
    user = result.first()

    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài khoản.")

    # Cập nhật mật khẩu mới
    user.mat_khau_ma_hoa = get_password_hash(request.new_password)
    user.ngay_cap_nhat = datetime.utcnow()
    await session.commit()

    logger.info(f"[🔒 Password Reset] Tài khoản {email} đã đặt lại mật khẩu thành công.")
    return {"message": "Đặt lại mật khẩu thành công. Bạn có thể đăng nhập với mật khẩu mới."}