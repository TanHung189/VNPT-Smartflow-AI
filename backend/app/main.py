import os
from dotenv import load_dotenv
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai
import uvicorn

# 1. Tải cấu hình từ file .env
load_dotenv()

app = FastAPI()

# 2. Cấu hình CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Cấu hình api key
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("LỖI: Chưa có GEMINI_API_KEY trong file .env")
    exit()

genai.configure(api_key=api_key)

# Sử dụng model flash để có tốc độ phản hồi nhanh nhất
model = genai.GenerativeModel('gemini-3-flash-preview')

# Trong main.py
@app.get("/api/generate-flow")
async def generate_flow(text: str = Query(..., description="Văn bản quy trình")):
    # Prompt mới: Yêu cầu AI xuất mã Mermaid
    prompt = (
        f"Bạn là chuyên gia quy trình VNPT. Hãy chuyển văn bản sau thành mã Mermaid JS định dạng 'graph TD'. "
        f"CHỈ trả về mã, không giải thích. Quy trình: {text}"
    )
    
    try:
        response = model.generate_content(prompt)
        # Làm sạch mã để chỉ lấy phần nội dung biểu đồ
        clean_code = response.text.replace("```mermaid", "").replace("```", "").strip()
        return {"result": clean_code}
    except Exception as e:
        return {"result": "ERROR", "message": str(e)}

if __name__ == "__main__":
    app_port = int(os.getenv("PORT", 8000))
    uvicorn.run("app.main:app", host="127.0.0.1", port=app_port, reload=True)