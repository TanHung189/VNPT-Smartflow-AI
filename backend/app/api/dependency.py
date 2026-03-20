from fastapi import Depends, HTTPException, status             # Các công cụ hỗ trợ của FastAPI
from fastapi.security import OAuth2PasswordBearer             # Công cụ lấy Token từ Header
from jose import jwt, JWTError                                # Thư viện xử lý JWT
from sqlalchemy.ext.asyncio import AsyncSession               # Kiểu dữ liệu session bất đồng bộ
from app.database import get_session                                # Hàm lấy kết nối Database
from app.models import User                                   # Model người dùng
from app.core.config import Settings        # Các cấu hình bảo mật đã tạo
import uuid

# Khai báo đường dẫn mà FastAPI sẽ tìm Token (mặc định là ở Header Authorization)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

async def get_current_user(
    token: str = Depends(oauth2_scheme),                      # Lấy token từ Header gửi lên
    session: AsyncSession = Depends(get_session)              # Lấy kết nối Database
) -> User:
    """
    Hàm này dùng để kiểm tra Token và trả về thông tin User hiện tại.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Không thể xác thực thông tin đăng nhập",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # 1. Giải mã Token bằng SECRET_KEY và thuật toán đã chọn
        payload = jwt.decode(token, Settings.JWT_SECRET_KEY, algorithms=[Settings.ALGORITHM])
        
        # 2. Lấy user_id (được lưu trong trường 'sub' của token)
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
            
    except JWTError: # Nếu Token bị sai, hết hạn hoặc bị hack
        raise credentials_exception
        
    # 3. Tìm User trong Database dựa trên ID từ Token
    from sqlmodel import select
    statement = select(User).where(User.user_id == uuid.UUID(user_id))
    result = await session.exec(statement)
    user = result.first()
    
    if user is None:
        raise credentials_exception
        
    return user # Trả về đối tượng User để API sử dụng