from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from app.database.session import get_db
from app.models import NguoiDung
from app.models.role import VaiTro
from app.core.config import settings
import uuid

# Khai báo endpoint để FastAPI lấy Bearer Token từ Header Authorization
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    session: AsyncSession = Depends(get_db)
) -> NguoiDung:
    """
    Dependency: Giải mã JWT và trả về đối tượng NguoiDung hiện tại.
    Ném HTTP 401 nếu token không hợp lệ hoặc người dùng không tồn tại.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Không thể xác thực thông tin đăng nhập",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # Giải mã token bằng SECRET_KEY đã cấu hình
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.ALGORITHM])

        # Lấy id_nguoi_dung từ trường 'sub' trong payload
        user_id_str: str = payload.get("sub")
        if user_id_str is None:
            raise credentials_exception

    except JWTError:
        # Token hết hạn, sai chữ ký hoặc bị giả mạo
        raise credentials_exception

    # Truy vấn người dùng theo id_nguoi_dung (UUID)
    # Lọc thêm ngay_xoa IS NULL để không trả về tài khoản đã bị xóa mềm
    statement = select(NguoiDung).where(
        NguoiDung.id_nguoi_dung == uuid.UUID(user_id_str),
        NguoiDung.ngay_xoa == None  # noqa: E711 — SQLAlchemy yêu cầu so sánh với None
    )
    result = await session.exec(statement)
    user = result.first()

    if user is None:
        raise credentials_exception

    return user  # Trả về đối tượng NguoiDung để các endpoint sử dụng


async def get_current_admin(
    current_user: NguoiDung = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
) -> NguoiDung:
    """
    Dependency: Kiểm tra người dùng có vai trò 'quan_tri' (Quản trị viên).
    Ném HTTP 403 nếu không đủ quyền.
    Sử dụng id_vai_tro để tránh lazy-load relation trong async session.
    """
    if current_user.id_vai_tro is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bạn cần quyền Quản trị viên (quan_tri) để thực hiện thao tác này.",
        )

    # Query vai_tro trực tiếp để tránh lỗi MissingGreenlet khi dùng lazy relationship
    result = await session.exec(select(VaiTro).where(VaiTro.id_vai_tro == current_user.id_vai_tro))
    vai_tro = result.first()

    if vai_tro is None or vai_tro.ten_vai_tro != "quan_tri":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bạn cần quyền Quản trị viên (quan_tri) để thực hiện thao tác này.",
        )
    return current_user


async def get_current_nhan_vien(
    current_user: NguoiDung = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
) -> NguoiDung:
    """
    Dependency: Kiểm tra người dùng có ít nhất vai trò 'nhan_vien'.
    Cho phép cả 'nhan_vien' lẫn 'quan_tri' truy cập.
    """
    if current_user.id_vai_tro is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bạn không có quyền truy cập tính năng này.",
        )

    result = await session.exec(select(VaiTro).where(VaiTro.id_vai_tro == current_user.id_vai_tro))
    vai_tro = result.first()

    if vai_tro is None or vai_tro.ten_vai_tro not in ["nhan_vien", "quan_tri"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bạn không có quyền truy cập tính năng này.",
        )
    return current_user