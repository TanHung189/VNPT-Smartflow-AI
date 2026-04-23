from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from pydantic import BaseModel

from app.database.session import get_db
from app.models.user import NguoiDung
from app.api.dependency import get_current_user

router = APIRouter(prefix="/users", tags=["Users"])

class UserProfileUpdate(BaseModel):
    ten_nguoi_dung: Optional[str] = None
    ten_phong_ban: Optional[str] = None

@router.get("/me", summary="Lấy thông tin người dùng hiện tại")
async def get_my_profile(
    current_user: NguoiDung = Depends(get_current_user)
):
    """Trả về thông tin của user đang đăng nhập."""
    return current_user

@router.put("/me", summary="Cập nhật thông tin người dùng")
async def update_my_profile(
    data: UserProfileUpdate,
    current_user: NguoiDung = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
):
    """Cập nhật tên và phòng ban của user."""
    if data.ten_nguoi_dung is not None:
        current_user.ten_nguoi_dung = data.ten_nguoi_dung
    if data.ten_phong_ban is not None:
        current_user.ten_phong_ban = data.ten_phong_ban
        
    session.add(current_user)
    await session.commit()
    await session.refresh(current_user)
    
    return current_user
