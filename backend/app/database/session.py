import os
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.orm import sessionmaker
from app.database.base import Base

load_dotenv()

DB_URL = os.getenv("DB_URL") 

engine = create_async_engine(DB_URL, echo=True)

async def init_db():
    async with engine.begin() as conn:
        # Tự động tạo bảng nếu chưa có
        await conn.run_sync(Base.metadata.create_all)

async def get_db():
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    async with async_session() as session:
        yield session
