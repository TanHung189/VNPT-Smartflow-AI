import os
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.orm import sessionmaker
from app.database.base import Base

load_dotenv()

# docker-compose truyền DATABASE_URL, local .env dùng DB_URL
DB_URL = os.getenv("DATABASE_URL") or os.getenv("DB_URL")

engine = create_async_engine(DB_URL, echo=False)

async def init_db():
    async with engine.begin() as conn:
        # Tự động tạo bảng nếu chưa có
        await conn.run_sync(Base.metadata.create_all)
    
    # Seeding dữ liệu mẫu (Vai trò)
    from app.models.role import VaiTro
    from sqlalchemy import select
    
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    async with async_session() as session:
        # Kiểm tra xem đã có vai trò chưa
        result = await session.execute(select(VaiTro))
        roles = result.scalars().all()
        
        if not roles:
            print("🌱 Seeding default roles...")
            admin_role = VaiTro(
                ten_vai_tro="quan_tri",
                mo_ta="Quản trị viên toàn hệ thống",
                quyen_han={"all": True}
            )
            staff_role = VaiTro(
                ten_vai_tro="nhan_vien",
                mo_ta="Nhân viên sử dụng hệ thống",
                quyen_han={"view": True, "edit": True}
            )
            session.add(admin_role)
            session.add(staff_role)
            await session.commit()
            print("✅ Seeding roles completed.")
        
        # Kiểm tra xem đã có mô hình AI chưa
        from app.models.ai_model import MoHinhAI
        result_ai = await session.execute(select(MoHinhAI))
        ai_models = result_ai.scalars().all()
        
        if not ai_models:
            print("🌱 Seeding default AI models...")
            gemini = MoHinhAI(
                nha_cung_cap="gemini",
                ten_mo_hinh="gemini-3-flash",
                mo_ta="Google Gemini 1.5 Flash (Cloud)"
            )
            ollama = MoHinhAI(
                nha_cung_cap="ollama",
                ten_mo_hinh="qwen2.5-coder:1.5b",
                mo_ta="Ollama Qwen2.5 Coder (Local AI)"
            )
            session.add(gemini)
            session.add(ollama)
            await session.commit()
            print("✅ Seeding AI models completed.")

async def get_db():
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    async with async_session() as session:
        yield session
