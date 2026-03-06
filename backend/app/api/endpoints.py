#==============================================================
#Cổng kết nối (API Router) giữa người dùng và hệ thống Backend.
#==============================================================

from fastapi import APIRouter , Query, UploadFile, File
from app.services.ai_service import ai_service
import docx
import PyPDF2
import io

router = APIRouter()

@router.get("/api/generate-flow")
async def generate_flow(text: str = Query(..., description="Văn bản quy trình")):
    try:
        data = ai_service.generate_smart_flow(text)
        return {"result" : "SUCCESS", "data" : data}
    except Exception as e:
        return {"result" : "ERROR", "message" : str(e)}


#API upload và đọc file
@router.post("/api/upload-process")
async def upload_process(file: UploadFile = File(...)):
    text = ""
    filename = file.filename.lower()
    content = await file.read()

    try:
        if filename.endswith(".txt"):
            text = content.decode("utf-8")
        elif filename.endswith(".docx"):
            doc = docx.Document(io.BytesIO(content))
            text = "\n".join([para.text for para in doc.paragraphs])
        elif filename.endswith(".pdf"):
            reader = PyPDF2.PdfReader(io.BytesIO(content))
            text = "\n".join([page.extract_text() for page in reader.pages])

        data = ai_service.generate_smart_flow(text)
        return {"result": "SUCCESS", "data": data}
    except Exception as e:
        return {"result": "ERROR", "message": f"Lỗi đọc file: {str(e)}"}

