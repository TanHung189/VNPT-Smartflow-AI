from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from app.database import get_session
from app.models import User, UserAuthen
from app.schemas import UserCreate, Token, GoogleLoginRequest
from app.core.security import get_password_hash , create_access_token, verify_password
from fastapi.security import OAuth2PasswordRequestForm
import uuid

router = APIRouter(prefix="/auth", tags=["Authentication"])

#api đăng ký 
@router.post("/register", response_model=Token)
async def register(User_in: UserCreate, session: AsyncSession= Depends(get_session)):
    statement = select(User).where(User.user_email == User_in.user_email)
    result = await session.exec(statement)
    if result.first():
        raise HTTPException(status_code=400, detail="Email này đã được sử dụng" )

    new_user = User(
        user_name = User_in.user_name,
        user_email = User_in.user_email,
        user_password = get_password_hash(User_in.user_password),
        is_active =True
    )
    session.add(new_user)
    await session.commit()
    await session.refresh(new_user)

    #cấp token để user đăng nhập luôn
    access_token = create_access_token(subject=str(new_user.user_id))
    return {"access_token": access_token, "token_type": "bearer","user": new_user}

#api đăng nhập
@router.post("/login", response_model=Token)
async def login( form_data: OAuth2PasswordRequestForm = Depends(), session: AsyncSession = Depends(get_session)):
    statement = select(User).where(User.user_email == form_data.username)
    result = await session.exec(statement)
    user = result.first()


    if not user or not verify_password(form_data.password, user.user_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email hoặc mật khẩu không chính xác",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(subject=str(user.user_id))

  
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user  # FastAPI sẽ tự lọc qua UserRead Schema để trả về
    }