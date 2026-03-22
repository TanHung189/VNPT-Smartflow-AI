#==============================================================
#Cổng kết nối (API Router) giữa người dùng và hệ thống Backend.
#==============================================================

from fastapi import APIRouter , Query, UploadFile, File, Depends, HTTPException
from app.services.ai_service import ai_service
from sqlmodel.ext.asyncio.session import AsyncSession
from app.database import get_session
from app.models import Diagram
from pydantic import BaseModel
from app.schemas import DiagramSaveRequest
import uuid
import docx
import PyPDF2
import io
import logging

router = APIRouter(prefix="/api")

@router.post("/generate-flow")
async def generate_flow(text: str = Query(..., description="Văn bản quy trình")):
    try:
        data = ai_service.generate_smart_flow(text)
        return {"result" : "SUCCESS", "data" : data}
    except Exception as e:
        return {"result" : "ERROR", "message" : str(e)}


#API upload và đọc file
@router.post("/upload-process")
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
            # PyPDF2 may emit many repetitive warnings from its internal data structures
            # when parsing malformed PDFs. Temporarily raise the logger level for that
            # module to reduce noise while still allowing other logs to flow.
            pdf_logger = logging.getLogger("PyPDF2.generic._data_structures")
            previous_level = pdf_logger.level
            try:
                pdf_logger.setLevel(logging.ERROR)
                reader = PyPDF2.PdfReader(io.BytesIO(content))
                # extract_text may return None for some pages; filter those out
                pages = [p.extract_text() or "" for p in reader.pages]
                text = "\n".join(pages)
            finally:
                try:
                    pdf_logger.setLevel(previous_level)
                except Exception:
                    # ignore if logger state cannot be restored
                    pass

        data = ai_service.generate_smart_flow(text)
        return {"result": "SUCCESS", "data": data}
    except Exception as e:
        return {"result": "ERROR", "message": f"Lỗi đọc file: {str(e)}"}

# API Nhận diện hình ảnh thành luồng quy trình (Computer Vision)
@router.post("/generate-flow-from-image")
async def generate_flow_from_image(file: UploadFile = File(...)):
    try:
        # Xác thực định dạng phải là hình ảnh
        if not file.content_type.startswith("image/"):
            return {"result": "ERROR", "message": "File phải là định dạng hình ảnh (JPG, PNG)."}
            
        content = await file.read()
        
        # Chuyển xuống tầng logic Service để xử lý bằng mô hình AI
        data = ai_service.generate_flow_from_image(content, file.content_type)
        return {"result": "SUCCESS", "data": data}
    except Exception as e:
        # Xử lý lỗi sạch sẽ (vd: ảnh mờ không đọc được quy trình từ prompt AI)
        return {"result": "ERROR", "message": str(e)}

#api lưu sơ đò
@router.post("/save-diagram")
async def save_diagram(data: DiagramSaveRequest, session: AsyncSession = Depends(get_session)): 
   try:
    new_diagram = Diagram(
        title= data.title,
        flow_data= data.flow_data,
        raw_text_input= data.raw_text
    )

    session.add(new_diagram)
    await session.commit()
    await session.refresh(new_diagram)

    return {
        "status": "Success",
        "message": "Đã lưu sơ đồ thành công",
        "diagram_id": new_diagram.diagram_id
    }
   except Exception as e:
       await session.rollback()
       raise HTTPException(status=500, detail=f"Lỗi lưu trữ: str{e}")
    