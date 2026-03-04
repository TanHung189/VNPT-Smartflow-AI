import os
import json
from dotenv import load_dotenv
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import google.generativeai as genai

load_dotenv()
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_key = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=api_key)
model = genai.GenerativeModel('gemini-3-flash-preview')

@app.get("/api/generate-flow")
async def generate_flow(text: str = Query(..., description="Văn bản quy trình")):
    # Prompt yêu cầu JSON thay vì mã Mermaid
    prompt = (
        f"Bạn là chuyên gia quy trình VNPT. Hãy phân tích văn bản sau thành cấu trúc JSON để vẽ sơ đồ bằng React Flow. "
        f"Cấu trúc JSON yêu cầu: {{ 'nodes': [{{ 'id': '1', 'data': {{ 'label': 'Tên bước' }}, 'position': {{ 'x': 250, 'y': 5 }} }}], 'edges': [{{ 'id': 'e1-2', 'source': '1', 'target': '2' }}] }}. "
        f"Hãy tính toán vị trí y tăng dần (cách nhau 100 đơn vị) để sơ đồ dàn hàng dọc. "
        f"CHỈ trả về JSON, không giải thích. Quy trình: {text}"
    )
    
    try:
        response = model.generate_content(prompt)
        # Làm sạch chuỗi JSON từ AI
        clean_json = response.text.replace("```json", "").replace("```", "").strip()
        data = json.loads(clean_json)
        return {"result": "SUCCESS", "data": data}
    except Exception as e:
        return {"result": "ERROR", "message": str(e)}

if __name__ == "__main__":
    app_port = int(os.getenv("PORT", 8000))
    uvicorn.run("app.main:app", host="127.0.0.1", port=app_port, reload=True)