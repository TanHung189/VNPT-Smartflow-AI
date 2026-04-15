#================================================================
# DIAGRAM ROUTER — Quản lý sơ đồ (CRUD) cho VNPT SmartFlow AI
#
# Endpoint:
#   POST   /diagrams/save        → Lưu sơ đồ mới vào diagrams_v2
#   GET    /diagrams/list        → Danh sách sơ đồ của user hiện tại
#   GET    /diagrams/{id}        → Chi tiết một sơ đồ
#   PUT    /diagrams/{id}        → Cập nhật tiêu đề + dữ liệu sơ đồ
#   DELETE /diagrams/{id}        → Xóa sơ đồ vĩnh viễn
#
# Tích hợp:
#   - SQLAlchemy 2.0 AsyncSession (async/await hoàn toàn)
#   - Redis cache invalidation sau mỗi thao tác ghi
#   - JWT Authentication qua get_current_user dependency
#   - Logging chi tiết để theo dõi và giải trình thực tập VNPT
#================================================================

import uuid
import logging
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.models import NguoiDung
from app.schemas.diagram import (
    DiagramCreate,
    DiagramUpdate,
    DiagramResponse,
    DiagramListResponse,
)
import app.services.diagram_service as diagram_service
from app.api.dependency import get_current_user

# -----------------------------------------------------------
# Khởi tạo logger và router
# -----------------------------------------------------------
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/diagrams",
    tags=["Diagrams"],
)


# ==============================================================
# POST /diagrams/save — Lưu sơ đồ mới
# ==============================================================

@router.post(
    "/save",
    response_model=DiagramResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Lưu sơ đồ mới vào Postgres",
    description=(
        "Nhận JSON sơ đồ React Flow (nodes + edges) và lưu vào bảng **diagrams_v2**. "
        "Sau khi lưu thành công, cache Redis của danh sách sơ đồ sẽ bị xóa để đảm bảo đồng bộ dữ liệu."
    ),
)
async def save_diagram(
    data: DiagramCreate,
    current_user: NguoiDung = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> DiagramResponse:
    """
    Lưu một sơ đồ React Flow mới vào bảng diagrams_v2.

    - **title**: Tiêu đề sơ đồ (bắt buộc).
    - **flow_data**: JSON object gồm `nodes` và `edges` từ React Flow.
    - Yêu cầu: Bearer JWT token hợp lệ trong header `Authorization`.
    """
    user_id_str = str(current_user.id_nguoi_dung)
    logger.info(
        f"[DiagramRouter] POST /diagrams/save — id_nguoi_dung={user_id_str}, tieu_de='{data.tieu_de}'"
    )
    try:
        result = await diagram_service.create_diagram(session, current_user, data)
        logger.info(
            f"[DiagramRouter] Lưu thành công — id_so_do={result.id_so_do}"
        )
        return result

    except Exception as e:
        logger.error(
            f"[DiagramRouter] Lỗi POST /diagrams/save — user_id={user_id_str}: {e}",
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Không thể lưu sơ đồ: {str(e)}",
        )


# ==============================================================
# GET /diagrams/list — Lấy danh sách sơ đồ
# ==============================================================

@router.get(
    "/list",
    response_model=List[DiagramListResponse],
    summary="Lấy danh sách sơ đồ của tôi",
    description=(
        "Trả về danh sách tất cả sơ đồ thuộc user hiện tại, sắp xếp theo thời gian cập nhật mới nhất. "
        "Ưu tiên đọc từ Redis cache (TTL 5 phút) trước; nếu cache miss thì truy vấn Postgres và cập nhật cache."
    ),
)
async def list_diagrams(
    current_user: NguoiDung = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> List[DiagramListResponse]:
    """
    Lấy danh sách sơ đồ của user. Tự động dùng Redis cache nếu có.
    """
    user_id_str = str(current_user.id_nguoi_dung)
    logger.info(f"[DiagramRouter] GET /diagrams/list — id_nguoi_dung={user_id_str}")
    try:
        result = await diagram_service.get_diagrams_by_user(session, current_user)
        logger.info(
            f"[DiagramRouter] Trả về {len(result)} sơ đồ cho id_nguoi_dung={user_id_str}"
        )
        return result

    except Exception as e:
        logger.error(
            f"[DiagramRouter] Lỗi GET /diagrams/list — user_id={user_id_str}: {e}",
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Không thể lấy danh sách sơ đồ.",
        )


# ==============================================================
# GET /diagrams/{diagram_id} — Lấy chi tiết một sơ đồ
# ==============================================================

@router.get(
    "/{diagram_id}",
    response_model=DiagramResponse,
    summary="Lấy chi tiết một sơ đồ",
    description="Lấy toàn bộ thông tin (bao gồm flow_data JSON) của một sơ đồ. Chỉ trả về nếu sơ đồ thuộc về user hiện tại.",
)
async def get_diagram(
    diagram_id: uuid.UUID,
    current_user: NguoiDung = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> DiagramResponse:
    """
    Lấy chi tiết sơ đồ theo ID. Trả về 404 nếu không tồn tại hoặc không có quyền.
    """
    user_id_str = str(current_user.id_nguoi_dung)
    logger.info(
        f"[DiagramRouter] GET /diagrams/{diagram_id} — id_nguoi_dung={user_id_str}"
    )
    try:
        result = await diagram_service.get_diagram_by_id(session, user_id_str, diagram_id)
        if result is None:
            logger.warning(
                f"[DiagramRouter] 404 — diagram_id={diagram_id} không thuộc user_id={user_id_str}"
            )
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy sơ đồ hoặc bạn không có quyền truy cập.",
            )
        return result

    except HTTPException:
        raise  # Re-raise để FastAPI xử lý response đúng định dạng
    except Exception as e:
        logger.error(
            f"[DiagramRouter] Lỗi GET /diagrams/{diagram_id}: {e}",
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Lỗi khi lấy thông tin sơ đồ.",
        )


# ==============================================================
# PUT /diagrams/{diagram_id} — Cập nhật sơ đồ + xóa Redis cache
# ==============================================================

@router.put(
    "/{diagram_id}",
    response_model=DiagramResponse,
    summary="Cập nhật sơ đồ + xóa Redis cache",
    description=(
        "Cập nhật tiêu đề và dữ liệu sơ đồ. "
        "**Sau khi cập nhật thành công, tự động xóa Redis cache** "
        "(cả cache chi tiết và cache danh sách) để đảm bảo đồng bộ dữ liệu."
    ),
)
async def update_diagram(
    diagram_id: uuid.UUID,
    data: DiagramUpdate,
    current_user: NguoiDung = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> DiagramResponse:
    """
    Cập nhật sơ đồ. Redis cache liên quan sẽ bị xóa sau khi ghi DB thành công.
    """
    user_id_str = str(current_user.id_nguoi_dung)
    logger.info(
        f"[DiagramRouter] PUT /diagrams/{diagram_id} — id_nguoi_dung={user_id_str}, tieu_de='{data.tieu_de}'"
    )
    try:
        result = await diagram_service.update_diagram(session, user_id_str, diagram_id, data)
        if result is None:
            logger.warning(
                f"[DiagramRouter] 404 — diagram_id={diagram_id} không tìm thấy để update"
            )
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy sơ đồ hoặc bạn không có quyền chỉnh sửa.",
            )
        logger.info(
            f"[DiagramRouter] Cập nhật thành công + xóa Redis cache — diagram_id={diagram_id}"
        )
        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"[DiagramRouter] Lỗi PUT /diagrams/{diagram_id}: {e}",
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Lỗi khi cập nhật sơ đồ.",
        )


# ==============================================================
# DELETE /diagrams/{diagram_id} — Xóa sơ đồ + xóa Redis cache
# ==============================================================

@router.delete(
    "/{diagram_id}",
    status_code=status.HTTP_200_OK,
    summary="Xóa sơ đồ + xóa Redis cache",
    description=(
        "Xóa vĩnh viễn một sơ đồ khỏi database. "
        "**Sau khi xóa thành công, tự động xóa Redis cache** liên quan để đảm bảo đồng bộ dữ liệu."
    ),
)
async def delete_diagram(
    diagram_id: uuid.UUID,
    current_user: NguoiDung = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """
    Xóa sơ đồ theo ID. Trả về 404 nếu không tồn tại hoặc không có quyền.
    """
    user_id_str = str(current_user.id_nguoi_dung)
    logger.info(
        f"[DiagramRouter] DELETE /diagrams/{diagram_id} — id_nguoi_dung={user_id_str}"
    )
    try:
        deleted = await diagram_service.delete_diagram(session, user_id_str, diagram_id)
        if not deleted:
            logger.warning(
                f"[DiagramRouter] 404 — diagram_id={diagram_id} không tìm thấy để xóa"
            )
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy sơ đồ hoặc bạn không có quyền xóa.",
            )
        logger.info(
            f"[DiagramRouter] Xóa thành công + xóa Redis cache — diagram_id={diagram_id}"
        )
        return {"result": "SUCCESS", "message": "Đã xóa sơ đồ thành công."}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"[DiagramRouter] Lỗi DELETE /diagrams/{diagram_id}: {e}",
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Lỗi khi xóa sơ đồ.",
        )
