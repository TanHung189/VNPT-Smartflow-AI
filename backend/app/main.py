import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.core.config import settings
from app.database.session import init_db
from contextlib import asynccontextmanager

from app.api.router import api_router

# ── SlowAPI Limiter (Rate Limiting) ───────────────────────────
limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("--- 🔄 Hệ thống đang khởi tạo Cơ sở dữ liệu")
    try:
        await init_db()
        print("✅ Đã tạo bảng thành công trong vnpt_smartflow_v1")
    except Exception as e:
        print(f"❌ Lỗi khởi tạo DB: {e}")
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
# Đọc allowed origins từ settings (cấu hình qua .env)
# Development: ["*"]  |  Production: ["https://smartflow.vnpt.vn"]
cors_origins = settings.CORS_ORIGINS
allow_credentials = cors_origins != ["*"]  # credentials=False khi allow_origins=["*"]

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
    response.headers["Cross-Origin-Opener-Policy"] = "unsafe-none"
    response.headers["Cross-Origin-Embedder-Policy"] = "unsafe-none"
    return response


# ── Health Check ───────────────────────────────────────────────
@app.get("/health", tags=["System"], summary="Health check endpoint")
async def health_check():
    """
    Kiểm tra trạng thái hoạt động của backend.
    Dùng cho load balancer, Docker healthcheck, Kubernetes liveness probe.
    """
    return {"status": "healthy", "service": "VNPT SmartFlow AI", "version": "1.0.0"}


app.include_router(api_router, prefix="/api")

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.PORT,
        reload=True,
    )
