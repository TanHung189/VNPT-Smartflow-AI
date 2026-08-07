#==============================================================
# ROUTER AI — Tạo sơ đồ tự động từ văn bản / file / hình ảnh
#
# Lưu ý: Các API CRUD /diagrams/* đã được tách sang
#         app/api/endpoints/diagram_router.py
#==============================================================

from fastapi import APIRouter, UploadFile, File, HTTPException, Request, Depends
from pydantic import BaseModel, field_validator
from slowapi import Limiter
from slowapi.util import get_remote_address
import docx
import PyPDF2
import io
import logging
import hashlib
from typing import Optional

from app.services.ai_service import ai_service
from app.api.dependency import get_current_user
from app.models.user import NguoiDung
from app.core.config import settings
from fastapi import Form

# -----------------------------------------------------------
# Khởi tạo logger, router và rate limiter
# -----------------------------------------------------------
logger = logging.getLogger(__name__)
router = APIRouter(tags=["Flow-AI"])
limiter = Limiter(key_func=get_remote_address)

# Giới hạn ký tự tối đa cho text input
MAX_TEXT_LENGTH = 5000
MAX_FILE_SIZE_MB = 20


class GenerateRequest(BaseModel):
    text: str
    provider: Optional[str] = "gemini"
    is_internal: bool = False
    # Context-Aware: loại sơ đồ để AI inject đúng System Prompt
    the_loai: Optional[str] = "process"
    # Chat-to-Edit: truyền context canvas hiện tại để AI nhận biết nodes/edges đã có
    current_nodes: Optional[list] = None
    current_edges: Optional[list] = None

    @field_validator("text")
    @classmethod
    def validate_text_length(cls, v: str) -> str:
        """Giới hạn độ dài text để tránh lạm dụng API và prompt injection."""
        v = v.strip()
        if not v:
            raise ValueError("Văn bản không được để trống.")
        if len(v) > MAX_TEXT_LENGTH:
            raise ValueError(
                f"Văn bản quá dài ({len(v):,} ký tự). "
                f"Tối đa {MAX_TEXT_LENGTH:,} ký tự mỗi lần gọi."
            )
        return v


# ==============================================================
# [1] NHÓM API AI — Tạo sơ đồ tự động
# ==============================================================

@router.post(
    "/generate/text",
    summary="Tạo sơ đồ từ văn bản thuần túy",
)
@limiter.limit(f"{settings.AI_RATE_LIMIT_PER_MINUTE}/minute")
async def generate_flow(
    request: Request,
    req: GenerateRequest,
    current_user: NguoiDung = Depends(get_current_user),
):
    """Nhận văn bản mô tả quy trình và trả về JSON React Flow từ AI (Gemini/Ollama)."""
    try:
        # Cưỡng chế chuyển sang Local AI nếu là quy trình nội bộ
        if req.is_internal:
            req.provider = "ollama"
            logger.info("🔒 [SECURITY] Quy trình nội bộ -> Cưỡng bức dùng Ollama (KHÔNG gửi lên Cloud).")

        # Xây dựng prompt context từ canvas hiện tại (Chat-to-Edit)
        text_with_context = req.text
        if req.current_nodes or req.current_edges:
            import json
            context_str = json.dumps({
                "nodes": req.current_nodes or [],
                "edges": req.current_edges or [],
            }, ensure_ascii=False)
            text_with_context = (
                f"{req.text}\n\n"
                f"[Ngữ cảnh Canvas hiện tại - Hãy ADD/UPDATE/DELETE dựa trên sơ đồ này, KHÔNG tạo mới hoàn toàn]:\n"
                f"{context_str}"
            )
            logger.info(f"[Chat-to-Edit] Context inject: {len(req.current_nodes or [])} nodes, {len(req.current_edges or [])} edges")

        user_id = str(current_user.id_nguoi_dung)
        data = await ai_service.generate_smart_flow(
            text_with_context,
            req.provider,
            the_loai=req.the_loai or "process",
            user_id=user_id,
        )
        logger.info(f"[Context-Aware] the_loai={req.the_loai} | user_id={user_id}")
        return {"result": "SUCCESS", "data": data}
    except ValueError as e:
        # Lỗi validation (text quá dài) → 400
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"[generate_flow] Lỗi AI ({req.provider}): {e}", exc_info=True)
        return {"result": "ERROR", "message": str(e)}



@router.post(
    "/upload-process",
    summary="Tạo sơ đồ từ file (TXT / DOCX / PDF / PNG / JPG)",
)
@limiter.limit(f"{settings.AI_RATE_LIMIT_PER_MINUTE}/minute")
async def upload_process(
    request: Request,
    file: UploadFile = File(...),
    provider: str = Form("gemini"),
    is_internal: bool = Form(False),
    the_loai: str = Form("process"),
    current_user: NguoiDung = Depends(get_current_user),
):
    """Đọc nội dung file và chuyển đổi thành sơ đồ React Flow qua AI.
    
    Đặc điểm:
    - Với file ngắn (<6000 chars): gọi AI 1 lần, trả ngay.
    - Với file dài (>=6000 chars): chia chunk, gọi AI song song, gộp kết quả.
      Đảm bảo không bỏ sót entity nào từ tài liệu gốc.
    """
    if is_internal:
        provider = "ollama"
        logger.info("🔒 [SECURITY] Upload nội bộ -> Cưỡng bức dùng Ollama.")

    text = ""
    filename = file.filename.lower()
    content = await file.read()

    # Kiểm tra kích thước file
    if len(content) > MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail=f"File quá lớn. Tối đa {MAX_FILE_SIZE_MB}MB."
        )

    content_hash = hashlib.md5(content).hexdigest()[:12]
    user_id = str(current_user.id_nguoi_dung)

    try:
        # Ảnh → Vision AI
        if any(filename.endswith(ext) for ext in (".png", ".jpg", ".jpeg")):
            logger.info("📸 Gọi Vision AI cho file hình ảnh.")
            data = await ai_service.generate_flow_from_image(content, file.content_type)
            return {"result": "SUCCESS", "data": data}

        # Trích xuất text từ file
        if filename.endswith(".txt"):
            text = content.decode("utf-8", errors="ignore")
        elif filename.endswith(".docx"):
            doc = docx.Document(io.BytesIO(content))
            # Lấy cả nội dung bảng (table) để không bỏ sót thông tin
            parts = []
            for para in doc.paragraphs:
                if para.text.strip():
                    parts.append(para.text.strip())
            for table in doc.tables:
                for row in table.rows:
                    row_text = " | ".join(
                        cell.text.strip() for cell in row.cells if cell.text.strip()
                    )
                    if row_text:
                        parts.append(row_text)
            text = "\n".join(parts)
        elif filename.endswith(".pdf"):
            reader = PyPDF2.PdfReader(io.BytesIO(content))
            text = "\n".join(p.extract_text() or "" for p in reader.pages)

        text = text.strip()
        if not text:
            return {"result": "ERROR", "message": "Không đọc được nội dung từ file."}

        logger.info(f"[upload_process] Extracted {len(text)} chars | the_loai={the_loai} | hash={content_hash}")

        # ─── Xử lý file dài: chunk + merge ─────────────────────────────────
        CHUNK_LIMIT = 4000  # Giảm xuống 4000 để mỗi chunk an toàn hơn

        if len(text) <= CHUNK_LIMIT:
            # File ngắn: xử lý bình thường
            text_with_hash = f"[FILE_HASH:{content_hash}]\n{text}"
            data = await ai_service.generate_smart_flow(
                text_with_hash, provider=provider, the_loai=the_loai, user_id=user_id,
            )
        else:
            # File dài: chia theo dòng để không cắt giữa câu
            lines = text.splitlines()
            chunks: list[str] = []
            current = []
            current_len = 0
            for line in lines:
                line_len = len(line) + 1
                if current_len + line_len > CHUNK_LIMIT and current:
                    chunks.append("\n".join(current))
                    current = [line]
                    current_len = line_len
                else:
                    current.append(line)
                    current_len += line_len
            if current:
                chunks.append("\n".join(current))

            logger.info(f"[upload_process] File dài → {len(chunks)} chunks để xử lý song song")

            # Gọi AI song song cho tất cả chunks
            import asyncio
            tasks = [
                ai_service.generate_smart_flow(
                    f"[FILE_HASH:{content_hash}_chunk{i}]\n{chunk}",
                    provider=provider,
                    the_loai=the_loai,
                    user_id=user_id,
                )
                for i, chunk in enumerate(chunks)
            ]
            results = await asyncio.gather(*tasks, return_exceptions=True)

            # Gộp tất cả nodes và edges, đặt lại ID để không trùng
            merged_nodes: list = []
            merged_edges: list = []

            for chunk_idx, res in enumerate(results):
                if isinstance(res, Exception):
                    logger.warning(f"[upload_process] Chunk {chunk_idx} lỗi: {res}")
                    continue
                chunk_nodes = res.get("nodes", [])
                chunk_edges = res.get("edges", [])

                # Remap IDs để tránh trùng giữa các chunk
                id_map: dict = {}
                for node in chunk_nodes:
                    old_id = str(node.get("id", ""))
                    new_id = f"c{chunk_idx}_{old_id}"
                    id_map[old_id] = new_id
                    node["id"] = new_id
                    merged_nodes.append(node)

                for edge in chunk_edges:
                    src = str(edge.get("source", ""))
                    tgt = str(edge.get("target", ""))
                    edge["source"] = id_map.get(src, f"c{chunk_idx}_{src}")
                    edge["target"] = id_map.get(tgt, f"c{chunk_idx}_{tgt}")
                    edge["id"] = f"c{chunk_idx}_{edge.get('id', f'e{src}-{tgt}')}"
                    merged_edges.append(edge)

            data = {"nodes": merged_nodes, "edges": merged_edges}
            logger.info(f"[upload_process] Merged: {len(merged_nodes)} nodes, {len(merged_edges)} edges")

        return {"result": "SUCCESS", "data": data}

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"[upload_process] Lỗi: {e}", exc_info=True)
        return {"result": "ERROR", "message": f"Lỗi xử lý file: {str(e)}"}
    


@router.post(
    "/generate-flow-from-image",
    summary="Nhận diện hình ảnh quy trình (Computer Vision)",
)
@limiter.limit(f"{settings.AI_RATE_LIMIT_PER_MINUTE}/minute")
async def generate_flow_from_image(
    request: Request,
    file: UploadFile = File(...),
    the_loai: str = Form("process"),
    current_user: NguoiDung = Depends(get_current_user),
):
    """Phân tích hình ảnh quy trình và trả về cấu trúc React Flow."""
    try:
        if not file.content_type or not file.content_type.startswith("image/"):
            return {"result": "ERROR", "message": "File phải là định dạng hình ảnh (JPG, PNG, WEBP)."}

        content = await file.read()
        if len(content) > MAX_FILE_SIZE_MB * 1024 * 1024:
            return {"result": "ERROR", "message": f"Ảnh quá lớn (tối đa {MAX_FILE_SIZE_MB}MB)."}

        data = await ai_service.generate_flow_from_image(content, file.content_type, the_loai)
        return {"result": "SUCCESS", "data": data}

    except Exception as e:
        logger.error(f"[generate_flow_from_image] Lỗi AI vision: {e}", exc_info=True)
        return {"result": "ERROR", "message": str(e)}
