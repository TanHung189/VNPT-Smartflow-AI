import os
from logging.config import fileConfig
from dotenv import load_dotenv

from sqlalchemy import engine_from_config, pool
from alembic import context

# Load .env file for local development
load_dotenv()

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# ── IMPORT ALL MODELS so Alembic can see the full schema ──
# Đây là phần quan trọng nhất: phải import tất cả models để Alembic biết cần tạo bảng nào
from app.database.base import Base
import app.models.user          # noqa: F401
import app.models.role           # noqa: F401
import app.models.diagram        # noqa: F401
import app.models.ai_model       # noqa: F401
import app.models.ai_usage_log   # noqa: F401
import app.models.refresh_token  # noqa: F401
import app.models.system_log     # noqa: F401
import app.models.diagram_history # noqa: F401

target_metadata = Base.metadata

# ── ĐỌC DATABASE URL TỰ ĐỘNG TỪ BIẾN MÔI TRƯỜNG ──
# docker-compose truyền DATABASE_URL, local .env dùng DB_URL
db_url = os.getenv("DATABASE_URL") or os.getenv("DB_URL")
if db_url:
    # Alembic không hỗ trợ asyncpg, phải dùng psycopg2 (sync driver)
    sync_url = db_url.replace("postgresql+asyncpg://", "postgresql://")
    config.set_main_option("sqlalchemy.url", sync_url)


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
