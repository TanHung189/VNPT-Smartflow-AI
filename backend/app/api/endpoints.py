from fastapi import APIRouter , Query
from app.services.ai_service import ai_service

router = APIRouter()

@app.get("/api/generate-flow")
async def generate_flow(text: str = Query(..., description="Văn bản quy trình")):
    try:
        data = ai_service.generate_smart_flow(text)
        return {"result" : "SUCCESS", "data" : data}
    except Exception as e:
        return {"result" : "ERROR", "message" : str(e)}