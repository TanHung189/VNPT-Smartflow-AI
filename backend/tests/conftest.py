# ================================================================
# conftest.py — Cấu hình fixtures dùng chung cho toàn bộ test suite
#
# ⚠️ Lưu ý quan trọng:
# - Dùng SQLite in-memory thay vì PostgreSQL để test không cần server
# - Phải set env vars TRƯỚC KHI import bất kỳ module nào của app
# - Session-scoped DB: tạo 1 lần cho toàn bộ session test
# ================================================================

import asyncio
import pytest
import pytest_asyncio
from typing import AsyncGenerator
from httpx import AsyncClient, ASGITransport
import os

# ── BƯỚC 1: Set env vars TRƯỚC KHI import app ──────────────────
# Thứ tự này cực kỳ quan trọng. Nếu import app trước, config đã
# được nạp với giá trị cũ và mock sẽ không có tác dụng.
os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///:memory:")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379/0")
os.environ.setdefault("GEMINI_API_KEYS", "fake-api-key-for-testing")
os.environ.setdefault("SECRET_KEY", "test-secret-key-not-for-production-32chars")
os.environ.setdefault("SENTRY_DSN", "")
os.environ.setdefault("GOOGLE_CLIENT_ID", "fake-client-id.apps.googleusercontent.com")
os.environ.setdefault("GOOGLE_CLIENT_SECRET", "fake-client-secret")
os.environ.setdefault("ALGORITHM", "HS256")
os.environ.setdefault("ACCESS_TOKEN_EXPIRE_MINUTES", "60")

# ── BƯỚC 2: Patch SQLAlchemy UUID type trước khi models được load ──
# Lý do: Model NguoiDung dùng PostgreSQL-specific UUID(as_uuid=True)
# SQLite không có type này → cần swap sang String(36) cho test
from unittest.mock import patch, MagicMock
import sqlalchemy.dialects.postgresql as pg_dialect

# Tạo UUID type tương thích SQLite
from sqlalchemy import String
from sqlalchemy.types import TypeDecorator
import uuid as uuid_module

class SQLiteCompatibleUUID(TypeDecorator):
    """UUID type tương thích SQLite: lưu dưới dạng VARCHAR(36)."""
    impl = String(36)
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        return uuid_module.UUID(str(value))

# Monkey-patch PostgreSQL UUID → SQLite compatible UUID
pg_dialect.UUID = lambda **kwargs: SQLiteCompatibleUUID()

# ── BƯỚC 3: Patch JSONB → JSON (SQLite không có JSONB) ──────────
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy import JSON
pg_dialect.JSONB = JSON

# ── BƯỚC 4: Bây giờ mới an toàn import app ──────────────────────
from sqlmodel import SQLModel
from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.orm import sessionmaker


# ── Tạo async engine SQLite in-memory ──────────────────────────
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"
test_engine = create_async_engine(
    TEST_DATABASE_URL,
    echo=False,
    connect_args={"check_same_thread": False},
)
TestSessionLocal = sessionmaker(
    test_engine, class_=AsyncSession, expire_on_commit=False
)


async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
    """Ghi đè dependency get_db → dùng SQLite test DB thay PostgreSQL."""
    async with TestSessionLocal() as session:
        yield session


# ── Fixtures ──────────────────────────────────────────────────
@pytest.fixture(scope="session")
def event_loop():
    """Tạo event loop dùng chung cho toàn bộ session test."""
    policy = asyncio.get_event_loop_policy()
    loop = policy.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_database():
    """Tạo schema database test trước khi chạy test, xóa sau khi xong."""
    # Import tất cả models để SQLModel nhận biết các bảng cần tạo
    from app.models import NguoiDung  # noqa: F401
    from app.models.role import VaiTro  # noqa: F401

    async with test_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)

    # Seed vai_tro cơ bản cho test
    async with TestSessionLocal() as session:
        from sqlmodel import select
        from app.models.role import VaiTro

        result = await session.execute(select(VaiTro))
        if not result.scalars().first():
            session.add(VaiTro(ten_vai_tro="nhan_vien", mo_ta="Nhân viên"))
            session.add(VaiTro(ten_vai_tro="quan_tri", mo_ta="Quản trị viên"))
            await session.commit()

    yield

    async with test_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.drop_all)


@pytest_asyncio.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    """HTTP client bất đồng bộ để gọi API. Không cần server chạy thật."""
    # Import app ở đây để đảm bảo env đã được set
    from app.main import app
    from app.database.session import get_db

    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://testserver",
    ) as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Trả về AsyncSession test để dùng trong test cần truy vấn DB trực tiếp."""
    async with TestSessionLocal() as session:
        yield session


@pytest.fixture
def sample_user_data() -> dict:
    """Dữ liệu mẫu tạo user mới."""
    return {
        "ten_nguoi_dung": "Test User VNPT",
        "email": "testuser_main@vnpt.com",
        "mat_khau": "TestPassword123!",
    }
