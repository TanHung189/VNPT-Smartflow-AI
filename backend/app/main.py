import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.services.ai_service import ai_service
from app.core.config import settings
from app.database.session import init_db
from contextlib import asynccontextmanager

from app.api.router import api_router


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

# ── CORS — cho phép React dev server giao tiếp với Backend ──
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_coop_header(request: Request, call_next):
    response = await call_next(request)
    # Thêm header này để trình duyệt cho phép popup của Google giao tiếp với web của em
    response.headers["Cross-Origin-Opener-Policy"] = "same-origin-allow-popups"
    return response
app.include_router(api_router, prefix="/api")

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=settings.PORT,
        reload=True,
    )
