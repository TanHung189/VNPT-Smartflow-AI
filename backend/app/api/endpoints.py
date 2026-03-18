#==============================================================
#Cổng kết nối (API Router) giữa người dùng và hệ thống Backend.
#==============================================================

from fastapi import APIRouter , Query, UploadFile, File, Depends, HTTPException
from app.services.ai_service import ai_service
from sqlmodel.ext.asyncio.session import AssyncSession
from app.database import get_session
from app.models import Diagram
import uuid
import docx
import PyPDF2
import io

router = APIRouter()

@router.post("/api/generate-flow")
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

#api lưu sơ đò
@router.post("/save-diagram")
async def save_diagram(
    title: str,
    flow_data: dict,
    raw_text: str=None,
    session: AssyncSession = Depends(get_session)
): 
    try:
        new_entry= Diagram(
            title = title,
            data_flow = flow_data,
            raw_text_input= raw_text
        )

        session.add(new_entry)
        await session.commit()
        await session.refresh(new_entry)

        return{
            "status":"Success",
            "message": "Đã lưu sơ đồ vào Database",
            "diagram_id":new_entry.diagram_id
        }
    except Exception as e:
        await session.rollback()
        raise HTTPException(status=500, detail=f"Lỗi lưu trữ : str{e}")