import uvicorn
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from app.services.ai_service import ai_service # Import module xử lý AI đã tách
from app.core.config import settings # Import cấu hình hệ thống

app = FastAPI(title="VNPT SmartFlow AI")

#cấu hình CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/generate-flow")
async def generate_flow(text: str = Query(..., description="Văn bản quy trình nghiệp vụ")):
    """
    Endpoint tiếp nhận yêu cầu từ Frontend và trả về cấu trúc sơ đồ
    """
    try:
        # Gọi sang Service để xử lý (Service này đã có sẵn logic Fallback Key và Mock Data)
        data = ai_service.generate_smart_flow(text)
        return {"result": "SUCCESS", "data": data}
    except Exception as e:
        # Trả về lỗi chi tiết nếu có sự cố
        return {"result": "ERROR", "message": str(e)}

# Điểm chạy ứng dụng
if __name__ == "__main__":
    uvicorn.run(
        "main:app", 
        host="127.0.0.1", 
        port=settings.PORT, 
        reload=True
    )