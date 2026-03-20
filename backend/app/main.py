import uvicorn
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from app.services.ai_service import ai_service # Import module xử lý AI đã tách
from app.core.config import settings # Import cấu hình hệ thống
from app.database import init_db
from contextlib import asynccontextmanager

from app.api.endpoints import router as diagram_router
from app.api.auth import router as auth_router

@asynccontextmanager
async def  lifespan(app: FastAPI):
    print("--- 🔄 Hệ thống đang khởi tạo Cơ sở dữ liệu")
    try:
        
        print("Đã tạo bảng thành công trong pgAdmin 4")
    except Exception as e:
        print(f"Lỗi khởi tạo: {e}")
    yield  
    print("Hệ thống đang đóng kết nối")

app = FastAPI(title="VNPT SmartFlow AI", lifespan=lifespan)


origins=[
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    #thêm sau
    "http://localhost:5173",    
    "http://127.0.0.1:8000",
    "http://localhost:8000",
]

    
#cấu hình CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(diagram_router)
app.include_router(auth_router)

# Điểm chạy ứng dụng
if __name__ == "__main__":
    uvicorn.run(
        "main:app", 
        host="127.0.0.1", 
        port=settings.PORT, 
        reload=True
    )

