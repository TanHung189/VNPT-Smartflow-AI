import uvicorn
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.core.config import settings

logger = logging.getLogger(__name__)


# ── Sentry SDK — Khởi tạo TRƯỚC khi tạo app ──────────────────
# Chỉ khởi tạo nếu SENTRY_DSN được cấu hình
# Dùng try/except để app không crash nếu sentry-sdk chưa được cài
if settings.SENTRY_DSN:
    try:
        import sentry_sdk
        from sentry_sdk.integrations.fastapi import FastApiIntegration
        from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration

        # Thử import RedisIntegration (chỉ có trong sentry-sdk >= 1.12)
        try:
            from sentry_sdk.integrations.redis import RedisIntegration
            redis_integration = [RedisIntegration()]
        except ImportError:
            redis_integration = []

        sentry_sdk.init(
            dsn=settings.SENTRY_DSN,
            environment=settings.SENTRY_ENVIRONMENT,
            traces_sample_rate=settings.SENTRY_TRACES_SAMPLE_RATE,
            integrations=[
                FastApiIntegration(transaction_style="endpoint"),
                SqlalchemyIntegration(),
                *redis_integration,
            ],
            # Không gửi thông tin cá nhân nhạy cảm (GDPR-safe)
            send_default_pii=False,
        )
        logger.info(f"✅ [Sentry] SDK khởi tạo thành công | env={settings.SENTRY_ENVIRONMENT}")
    except ImportError:
        logger.warning("⚠️ [Sentry] Chưa cài sentry-sdk. Chạy: pip install sentry-sdk[fastapi]")
    except Exception as e:
        logger.error(f"❌ [Sentry] Lỗi khởi tạo: {e}")
else:
    logger.warning("⚠️ [Sentry] SENTRY_DSN chưa cấu hình — bỏ qua error tracking.")


# ── SlowAPI Limiter (Rate Limiting) ───────────────────────────
limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("--- 🔄 Hệ thống đang khởi tạo Cơ sở dữ liệu")
    try:
        from app.database.session import init_db
        await init_db()
        print("✅ Đã tạo bảng thành công trong vnpt_smartflow_v1")
    except Exception as e:
        print(f"❌ Lỗi khởi tạo DB: {e}")
        try:
            import sentry_sdk
            sentry_sdk.capture_exception(e)
        except Exception:
            pass
    yield
    print("🔌 Hệ thống đang đóng kết nối")


app = FastAPI(
    title="VNPT SmartFlow AI",
    description="Hệ thống quản lý quy trình Smartflow — VNPT nội bộ",
    version="1.0.0",
    lifespan=lifespan,
)

# ── Rate Limit Error Handler ───────────────────────────────────
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── CORS ──────────────────────────────────────────────────────
cors_origins = settings.CORS_ORIGINS
allow_credentials = cors_origins != ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Security Headers — cần thiết cho Google OAuth popup ───────
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["Cross-Origin-Opener-Policy"] = "same-origin-allow-popups"
    response.headers["Cross-Origin-Embedder-Policy"] = "unsafe-none"
    return response


# ── Health Check ───────────────────────────────────────────────
@app.get("/health", tags=["System"], summary="Health check endpoint")
async def health_check():
    """
    Kiểm tra trạng thái hoạt động của backend.
    Dùng cho load balancer, Docker healthcheck, Kubernetes liveness probe.
    """
    return {
        "status": "healthy",
        "service": "VNPT SmartFlow AI",
        "version": "1.0.0",
        "sentry_enabled": bool(settings.SENTRY_DSN),
    }


from app.api.router import api_router
app.include_router(api_router, prefix="/api")

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.PORT,
        reload=True,
    )
