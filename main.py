import os 
from fastapi import FastAPI, Query # tạo ứng dụng api, định nghĩa tham số truyền qua url
from fastapi.middleware.cors import CORSMiddleware #Middleware xử lý CORS (cho phép frontend gọi backend)
import google.generativeai as genai

app = FastAPI()

# cấu hình CORS 
app.add_middleware(
    CORSMiddleware,
    allow_origins = origins,
    allow_methods = ["*"],
    allow_headers = ["*"],
)

# cấu hình Gemini API key
genai.configure(api_key="AIzaSyAeYtu4WtEyHs0Egfs6ObvndamCddAT6ac")

@app.get("/app/generate-flow")# decorater, đăng ký endpoint cho server

async def generate_flow(text: str = Query(..., description="Văn bản quy trình cần chuyển đổi")):
    model = genai.GenerativeModel('gemini-1.5-flash')
    
    # Câu lệnh hướng dẫn AI trả về đúng định dạng JSON cho biểu đồ
    prompt = f"""
    Dựa trên quy trình sau, hãy trích xuất và trả về dữ liệu dưới định dạng JSON cho React Flow.
    Chỉ trả về mã JSON, không giải thích gì thêm.
    Cấu trúc: {{ "nodes": [...], "edges": [...] }}
    Quy trình: {text}
    """
    
    response = model.generate_content(prompt)
    return {"result": response.text}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

