#==============================================================
# ROUTER AI — Tạo sơ đồ tự động từ văn bản / file / hình ảnh
#
# Lưu ý: Các API CRUD /diagrams/* đã được tách sang
#         app/api/endpoints/diagram_router.py
#==============================================================

from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
import docx
import PyPDF2
import io
import logging
from typing import Optional

from app.services.ai_service import ai_service
from fastapi import Form

# -----------------------------------------------------------
# Khởi tạo logger và router
# -----------------------------------------------------------
logger = logging.getLogger(__name__)
router = APIRouter(tags=["Flow-AI"])

class GenerateRequest(BaseModel):
    text: str
    provider: Optional[str] = "gemini"
    is_internal: bool = False
    current_diagram_state: Optional[str] = None

# ==============================================================
# [1] NHÓM API AI — Tạo sơ đồ tự động
# ==============================================================

@router.post(
    "/generate/text",
    summary="Tạo sơ đồ từ văn bản thuần túy",
)

async def generate_flow(req: GenerateRequest):
    """Nhận văn bản mô tả quy trình và trả về JSON React Flow từ AI (Gemini/Ollama)."""
    try:
        # Cường chế chuyển sang Local AI nếu là quy trình nội bộ
        if req.is_internal:
            req.provider = "ollama"
            logger.info("🔒 [SECURITY] Quy trình nội bộ -> Cưỡng bức dùng Ollama (KHÔNG gửi lên Cloud).")
            
        data = await ai_service.generate_smart_flow(req.text, req.provider, current_state=req.current_diagram_state)
        return {"result": "SUCCESS", "data": data}
    except Exception as e:
        logger.error(f"[generate_flow] Lỗi AI ({req.provider}): {e}", exc_info=True)
        return {"result": "ERROR", "message": str(e)}


@router.post(
    "/upload-process",
    summary="Tạo sơ đồ từ file (TXT / DOCX / PDF / PNG / JPG)",
)
async def upload_process(
    file: UploadFile = File(...),
    provider: str = Form("gemini"),
    is_internal: bool = Form(False)
):
    """Đọc nội dung file và chuyển đổi thành sơ đồ React Flow qua AI."""
    # Cường chế chuyển sang Local AI nếu là quy trình nội bộ
    if is_internal:
        provider = "ollama"
        logger.info("🔒 [SECURITY] Upload nội bộ -> Cưỡng bức dùng Ollama.")

    text = ""
    filename = file.filename.lower()
    content = await file.read()

    try:
        # Nếu là hình ảnh, gán thẳng vào vision AI
        if filename.endswith(".png") or filename.endswith(".jpg") or filename.endswith(".jpeg"):
            logger.info("📸 Gọi Vision AI cho file hình ảnh.")
            data = await ai_service.generate_flow_from_image(content, file.content_type)
            return {"result": "SUCCESS", "data": data}

        if filename.endswith(".txt"):
            text = content.decode("utf-8")
        elif filename.endswith(".docx"):
            doc = docx.Document(io.BytesIO(content))
            text = "\n".join([para.text for para in doc.paragraphs])
        elif filename.endswith(".pdf"):
            reader = PyPDF2.PdfReader(io.BytesIO(content))
            pages = [p.extract_text() or "" for p in reader.pages]
            text = "\n".join(pages)

        # Dùng AI tương ứng
        data = await ai_service.generate_smart_flow(text, provider=provider)
        return {"result": "SUCCESS", "data": data}

    except Exception as e:
        logger.error(f"[upload_process] Lỗi đọc file: {e}", exc_info=True)
        return {"result": "ERROR", "message": f"Lỗi đọc file: {str(e)}"}
    

@router.post(
    "/generate-flow-from-image",
    summary="Nhận diện hình ảnh quy trình (Computer Vision)",
)
async def generate_flow_from_image(file: UploadFile = File(...)):
    """Phân tích hình ảnh quy trình và trả về cấu trúc React Flow."""
    try:
        if not file.content_type.startswith("image/"):
            return {"result": "ERROR", "message": "File phải là định dạng hình ảnh (JPG, PNG)."}

        content = await file.read()
        data = await ai_service.generate_flow_from_image(content, file.content_type)
        return {"result": "SUCCESS", "data": data}

    except Exception as e:
        logger.error(f"[generate_flow_from_image] Lỗi AI vision: {e}", exc_info=True)
        return {"result": "ERROR", "message": str(e)}

