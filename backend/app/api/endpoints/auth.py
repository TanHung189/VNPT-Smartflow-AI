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
from pydantic import BaseModel, EmailStr
from typing import Optional
import secrets
from datetime import datetime
import logging
import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])


# ─────────────────────────────────────────────────────────
# HÀM TIỆN ÍCH NỘI BỘ
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


async def _verify_google_token(token: str) -> dict:
    """
    Xác minh Google token (hỗ trợ cả id_token và access_token).

    - id_token: dùng endpoint tokeninfo?id_token= (từ GoogleLogin iframe)
    - access_token: dùng endpoint userinfo (từ useGoogleLogin implicit flow)

    Trả về: dict chứa email, name, picture, sub
    Ném: ValueError nếu token không hợp lệ
    """
    async with httpx.AsyncClient(timeout=10.0) as client:
        # Thử trước với id_token (flow cũ)
        try:
            resp = await client.get(
                f"https://oauth2.googleapis.com/tokeninfo?id_token={token}"
            )
            if resp.status_code == 200:
                idinfo = resp.json()
                if idinfo.get("email"):
                    # Kiểm tra email đã được xác minh
                    if not idinfo.get("email_verified", False):
                        raise ValueError("Email Google chưa được xác minh")
                    return idinfo
        except httpx.RequestError:
            pass

        # Thử với access_token (flow mới - useGoogleLogin implicit)
        try:
            resp = await client.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {token}"},
            )
            if resp.status_code == 200:
                userinfo = resp.json()
                if userinfo.get("email"):
                    # userinfo endpoint luôn trả về email đã xác minh
                    userinfo["email_verified"] = True
                    return userinfo
            error_data = resp.json()
            raise ValueError(f"Google xác minh thất bại: {error_data.get('error_description', 'Token không hợp lệ')}")
        except httpx.RequestError as e:
            raise ValueError(f"Không thể kết nối Google API: {e}")



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
    stmt = select(NguoiDung).where(
        NguoiDung.email == form_data.username,
        NguoiDung.ngay_xoa == None  # noqa: E711
    )
    result     = await session.exec(stmt)
    nguoi_dung = result.first()

    if not nguoi_dung or not verify_password(form_data.password, nguoi_dung.mat_khau_ma_hoa or ""):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email hoặc mật khẩu không chính xác",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Kiểm tra tài khoản có bị khóa không
    if not nguoi_dung.trang_thai_hoat_dong:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tài khoản của bạn đã bị tạm khóa. Vui lòng liên hệ quản trị viên.",
        )

    ten_vai_tro = await _lay_ten_vai_tro(session, nguoi_dung.id_vai_tro)

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
async def dang_nhap_google(
    request: GoogleLoginRequest,
    session: AsyncSession = Depends(get_db),
):
    """
    Xác thực Google ID Token gửi lên từ '@react-oauth/google'.
    Dùng Google TokenInfo API để xác minh (không phụ thuộc transport).
    - Tự động tạo tài khoản nếu email chưa có trong hệ thống.
    - Ghi nhận nhà cung cấp vào bảng xac_thuc_nguoi_dung.
    """
    try:
        # 1. Xác minh Google ID Token qua Google TokenInfo API
        idinfo = await _verify_google_token(request.token)

        email = idinfo.get("email")
        ten   = idinfo.get("name")
        anh   = idinfo.get("picture")

        if not email:
            raise HTTPException(status_code=400, detail="Google token không chứa email")

        logger.info(f"[Google OAuth] Xác thực thành công: {email}")

        # 2. Tìm tài khoản hiện có (chưa bị xóa mềm)
        stmt   = select(NguoiDung).where(
            NguoiDung.email == email,
            NguoiDung.ngay_xoa == None,  # noqa: E711
        )
        result     = await session.exec(stmt)
        nguoi_dung = result.first()

        if not nguoi_dung:
            # 3. Lần đầu đăng nhập bằng Google → Tự động tạo tài khoản nhân viên
            logger.info(f"[Google OAuth] Tạo tài khoản mới cho: {email}")
            id_vai_tro_nv = await _lay_id_vai_tro(session, "nhan_vien")

            # Tạo mật khẩu dummy an toàn (user không thể đăng nhập bằng mật khẩu này)
            dummy_password = secrets.token_urlsafe(32)
            nguoi_dung = NguoiDung(
                ten_nguoi_dung=ten or email.split("@")[0],
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
            try:
                xac_thuc = XacThucNguoiDung(
                    id_nguoi_dung=nguoi_dung.id_nguoi_dung,
                    nha_cung_cap="google",
                    id_nguoi_dung_cung_cap=idinfo.get("sub"),
                )
                session.add(xac_thuc)
                await session.commit()
            except Exception as e:
                # Không block đăng nhập nếu ghi nhận OAuth provider thất bại
                logger.warning(f"[Google OAuth] Không thể ghi xac_thuc_nguoi_dung: {e}")

        else:
            # Cập nhật ảnh đại diện mới nhất từ Google nếu thay đổi
            if anh and nguoi_dung.anh_dai_dien != anh:
                nguoi_dung.anh_dai_dien = anh
                await session.commit()

        # Kiểm tra tài khoản có bị khóa không
        if not nguoi_dung.trang_thai_hoat_dong:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Tài khoản của bạn đã bị tạm khóa. Vui lòng liên hệ quản trị viên.",
            )

        # 5. Cập nhật lần đăng nhập cuối
        nguoi_dung.lan_dang_nhap_cuoi = datetime.utcnow()
        await session.commit()

        # 6. Tạo JWT và trả về
        ten_vai_tro  = await _lay_ten_vai_tro(session, nguoi_dung.id_vai_tro)
        access_token = create_access_token(subject=str(nguoi_dung.id_nguoi_dung))
        user_data    = _tao_user_response(nguoi_dung, ten_vai_tro)

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user_data,
        }

    except HTTPException:
        # Re-raise HTTPException (lỗi nghiệp vụ đã được xử lý)
        raise
    except ValueError as e:
        # Lỗi xác minh Google token
        logger.warning(f"[Google OAuth] Xác minh token thất bại: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token Google không hợp lệ: {str(e)}",
        )
    except Exception as e:
        # Lỗi không mong muốn (network, DB...)
        logger.error(f"[Google OAuth] Lỗi không xác định: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Đã xảy ra lỗi trong quá trình đăng nhập Google. Vui lòng thử lại.",
        )


# ─────────────────────────────────────────────────────────
# POST /auth/forgot-password — Yêu cầu link reset mật khẩu
# ─────────────────────────────────────────────────────────
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

    generic_msg = {"message": "Nếu email tồn tại, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu trong vài phút."}

    if not user:
        return generic_msg

    reset_token = create_password_reset_token(user.email)
    reset_link = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"

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
    email = verify_password_reset_token(request.token)
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn."
        )

    if len(request.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Mật khẩu mới phải có ít nhất 8 ký tự."
        )

    stmt = select(NguoiDung).where(
        NguoiDung.email == email,
        NguoiDung.ngay_xoa == None  # noqa: E711
    )
    result = await session.exec(stmt)
    user = result.first()

    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài khoản.")

    user.mat_khau_ma_hoa = get_password_hash(request.new_password)
    user.ngay_cap_nhat = datetime.utcnow()
    await session.commit()

    logger.info(f"[🔒 Password Reset] Tài khoản {email} đã đặt lại mật khẩu thành công.")
    return {"message": "Đặt lại mật khẩu thành công. Bạn có thể đăng nhập với mật khẩu mới."}