#================================================================
# TẦNG DỊCH VỤ (Service Layer) — Xử lý toàn bộ logic nghiệp vụ
# liên quan đến bảng `so_do` (CSDL vnpt_smartflow_v1).
#
# Quy tắc bắt buộc:
#   - Mọi SELECT phải có điều kiện: SoDo.ngay_xoa == None
#   - Xóa sơ đồ: Soft Delete (đặt ngay_xoa = NOW())
#   - Dùng session.exec() — SQLModel pattern (KHÔNG dùng session.execute())
#   - Redis cache invalidate sau mỗi thao tác ghi
#================================================================

import json
import logging
import uuid
from datetime import datetime, timezone
from typing import List, Optional

from sqlmodel import select                           # ✅ SQLModel select — KHÔNG dùng sqlalchemy
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import NguoiDung
from app.models.diagram import SoDo
from app.models.diagram_history import PhienBanSoDo
from app.schemas.diagram import (
    DiagramCreate,
    DiagramUpdate,
    DiagramResponse,
    DiagramListResponse,
)
from app.core.redis import redis_client

logger = logging.getLogger(__name__)

# ── Hằng số Redis ──
CACHE_TTL_SECONDS = 300
CACHE_PREFIX_LIST = "diag_list"
CACHE_PREFIX_ONE  = "diag_one"


# =============================================================
# TIỆN ÍCH REDIS
# =============================================================

def _list_cache_key(user_id: str) -> str:
    return f"{CACHE_PREFIX_LIST}:{user_id}"

def _one_cache_key(user_id: str, so_do_id: str) -> str:
    return f"{CACHE_PREFIX_ONE}:{user_id}:{so_do_id}"

def _invalidate_user_cache(user_id: str, so_do_id: Optional[str] = None):
    """Xóa cache Redis sau mỗi thao tác ghi. Lỗi Redis không làm gián đoạn luồng chính."""
    keys = [_list_cache_key(user_id)]
    if so_do_id:
        keys.append(_one_cache_key(user_id, so_do_id))
    try:
        redis_client.delete(*keys)
        logger.info(f"[Redis] Đã xóa cache: {keys}")
    except Exception as e:
        logger.warning(f"[Redis] Không thể xóa cache (tiếp tục): {e}")


# =============================================================
# 1. TẠO SƠ ĐỒ MỚI
# =============================================================

async def create_diagram(
    session: AsyncSession,
    user: NguoiDung,
    data: DiagramCreate,
) -> DiagramResponse:
    """
    Lưu một sơ đồ mới vào bảng `so_do`.
    du_lieu_so_do (JSONB) chứa nodes + edges từ React Flow.
    """
    user_id_str = str(user.id_nguoi_dung)
    logger.info(f"[DiagramService] Tạo sơ đồ: id_nguoi_dung={user_id_str}, tieu_de='{data.tieu_de}'")

    try:
        so_do_moi = SoDo(
            id_chu_so_huu=user.id_nguoi_dung,
            tieu_de=data.tieu_de,
            the_loai=getattr(data, "the_loai", "flowchart"),
            du_lieu_so_do=data.du_lieu_so_do,
            la_noi_bo=data.la_noi_bo,
            van_ban_dau_vao=getattr(data, "van_ban_dau_vao", None),
            anh_thu_nho=getattr(data, "anh_thu_nho", None),
        )
        session.add(so_do_moi)
        await session.commit()
        await session.refresh(so_do_moi)

        phien_ban_moi = PhienBanSoDo(
            id_so_do=so_do_moi.id_so_do,
            du_lieu_so_do=so_do_moi.du_lieu_so_do,
            ly_do_thay_doi=getattr(data, "ly_do_thay_doi", "Tạo mới sơ đồ")
        )
        session.add(phien_ban_moi)
        await session.commit()

        _invalidate_user_cache(user_id_str)
        logger.info(f"[DiagramService] Thành công: id_so_do={so_do_moi.id_so_do}")
        return DiagramResponse.model_validate(so_do_moi)

    except Exception as e:
        await session.rollback()
        logger.error(f"[DiagramService] Lỗi tạo sơ đồ: {e}", exc_info=True)
        raise


# =============================================================
# 2. DANH SÁCH SƠ ĐỒ THEO NGƯỜI DÙNG
# =============================================================

async def get_diagrams_by_user(
    session: AsyncSession,
    user: NguoiDung,
) -> List[DiagramListResponse]:
    """
    Lấy danh sách sơ đồ chưa bị xóa mềm của người dùng.
    Ưu tiên đọc từ Redis cache (TTL 5 phút).
    """
    user_id_str = str(user.id_nguoi_dung)
    cache_key   = _list_cache_key(user_id_str)

    # ── Cache HIT ──
    try:
        cached = redis_client.get(cache_key)
        if cached:
            logger.info(f"[Redis] Cache HIT: {cache_key}")
            return [DiagramListResponse(**item) for item in json.loads(cached)]
    except Exception as e:
        logger.warning(f"[Redis] Lỗi đọc cache: {e}")

    # ── Cache MISS → DB ──
    try:
        stmt = (
            select(SoDo)
            .where(
                SoDo.id_chu_so_huu == user.id_nguoi_dung,
                SoDo.ngay_xoa == None,  # noqa: E711
            )
            .order_by(SoDo.ngay_cap_nhat.desc())
        )
        result  = await session.exec(stmt)          # ✅ session.exec() — SQLModel pattern
        so_dos  = result.all()

        response_list = [DiagramListResponse.model_validate(d) for d in so_dos]

        try:
            serializable = [item.model_dump(mode="json") for item in response_list]
            redis_client.setex(cache_key, CACHE_TTL_SECONDS, json.dumps(serializable))
        except Exception as e:
            logger.warning(f"[Redis] Không lưu cache: {e}")

        return response_list

    except Exception as e:
        logger.error(f"[DiagramService] Lỗi lấy danh sách: {e}", exc_info=True)
        raise


# =============================================================
# 3. CHI TIẾT MỘT SƠ ĐỒ
# =============================================================

async def get_diagram_by_id(
    session: AsyncSession,
    user_id: str,
    so_do_id: uuid.UUID,
) -> Optional[DiagramResponse]:
    """
    Lấy chi tiết một sơ đồ (bao gồm du_lieu_so_do).
    Chỉ trả về nếu thuộc người dùng hiện tại và chưa bị xóa mềm.
    """
    cache_key = _one_cache_key(user_id, str(so_do_id))

    # ── Cache HIT ──
    try:
        cached = redis_client.get(cache_key)
        if cached:
            logger.info(f"[Redis] Cache HIT: {cache_key}")
            return DiagramResponse(**json.loads(cached))
    except Exception as e:
        logger.warning(f"[Redis] Lỗi đọc cache: {e}")

    # ── DB Query ──
    try:
        stmt = select(SoDo).where(
            SoDo.id_so_do == so_do_id,
            SoDo.id_chu_so_huu == uuid.UUID(user_id),
            SoDo.ngay_xoa == None,  # noqa: E711
        )
        result = await session.exec(stmt)           # ✅ session.exec()
        so_do  = result.first()

        if so_do is None:
            logger.warning(f"[DiagramService] Không tìm thấy: id_so_do={so_do_id}")
            return None

        response = DiagramResponse.model_validate(so_do)
        try:
            redis_client.setex(cache_key, CACHE_TTL_SECONDS, response.model_dump_json())
        except Exception as e:
            logger.warning(f"[Redis] Không lưu cache: {e}")

        return response

    except Exception as e:
        logger.error(f"[DiagramService] Lỗi lấy chi tiết: {e}", exc_info=True)
        raise


# =============================================================
# 4. CẬP NHẬT SƠ ĐỒ
# =============================================================

async def update_diagram(
    session: AsyncSession,
    user_id: str,
    so_do_id: uuid.UUID,
    data: DiagramUpdate,
) -> Optional[DiagramResponse]:
    """Cập nhật tieu_de, du_lieu_so_do và la_noi_bo cho sơ đồ đã tồn tại."""
    logger.info(f"[DiagramService] Cập nhật: id_so_do={so_do_id}, id_nguoi_dung={user_id}")

    try:
        stmt = select(SoDo).where(
            SoDo.id_so_do == so_do_id,
            SoDo.id_chu_so_huu == uuid.UUID(user_id),
            SoDo.ngay_xoa == None,  # noqa: E711
        )
        result = await session.exec(stmt)           # ✅ session.exec()
        so_do  = result.first()

        if so_do is None:
            logger.warning(f"[DiagramService] Không tìm thấy sơ đồ để cập nhật: {so_do_id}")
            return None

        so_do.tieu_de       = data.tieu_de
        so_do.du_lieu_so_do = data.du_lieu_so_do
        so_do.la_noi_bo     = data.la_noi_bo
        so_do.ngay_cap_nhat = datetime.now(timezone.utc).replace(tzinfo=None)
        
        if getattr(data, "anh_thu_nho", None) is not None:
             so_do.anh_thu_nho = data.anh_thu_nho

        phien_ban_moi = PhienBanSoDo(
            id_so_do=so_do.id_so_do,
            du_lieu_so_do=so_do.du_lieu_so_do,
            ly_do_thay_doi=getattr(data, "ly_do_thay_doi", "Cập nhật qua biên tập")
        )
        session.add(phien_ban_moi)

        await session.commit()
        await session.refresh(so_do)
        _invalidate_user_cache(user_id, str(so_do_id))

        logger.info(f"[DiagramService] Cập nhật thành công: id_so_do={so_do_id}")
        return DiagramResponse.model_validate(so_do)

    except Exception as e:
        await session.rollback()
        logger.error(f"[DiagramService] Lỗi cập nhật: {e}", exc_info=True)
        raise


# =============================================================
# 5. XÓA MỀM SƠ ĐỒ (Soft Delete)
# =============================================================

async def delete_diagram(
    session: AsyncSession,
    user_id: str,
    so_do_id: uuid.UUID,
) -> bool:
    """
    Soft Delete: đặt ngay_xoa = NOW() thay vì xóa vật lý.
    Sơ đồ vẫn còn trong DB nhưng sẽ không hiện lên trong bất kỳ truy vấn SELECT nào.
    """
    logger.info(f"[DiagramService] Xóa mềm: id_so_do={so_do_id}, id_nguoi_dung={user_id}")

    try:
        stmt = select(SoDo).where(
            SoDo.id_so_do == so_do_id,
            SoDo.id_chu_so_huu == uuid.UUID(user_id),
            SoDo.ngay_xoa == None,  # noqa: E711
        )
        result = await session.exec(stmt)           # ✅ session.exec()
        so_do  = result.first()

        if so_do is None:
            logger.warning(f"[DiagramService] Không tìm thấy sơ đồ để xóa: {so_do_id}")
            return False

        # ⭐ Soft Delete — ghi dấu thời gian xóa
        so_do.ngay_xoa = datetime.now(timezone.utc).replace(tzinfo=None)
        await session.commit()
        _invalidate_user_cache(user_id, str(so_do_id))

        logger.info(f"[DiagramService] Đã xóa mềm thành công: id_so_do={so_do_id}")
        return True

    except Exception as e:
        await session.rollback()
        logger.error(f"[DiagramService] Lỗi xóa mềm: {e}", exc_info=True)
        raise

# =============================================================
# 6. THÙNG RÁC (Trash Bin)
# =============================================================

async def get_trashed_diagrams(
    session: AsyncSession,
    user: NguoiDung,
) -> List[DiagramListResponse]:
    """Lấy danh sách sơ đồ đã bị xóa mềm của người dùng."""
    try:
        stmt = (
            select(SoDo)
            .where(
                SoDo.id_chu_so_huu == user.id_nguoi_dung,
                SoDo.ngay_xoa != None,  # noqa: E711
            )
            .order_by(SoDo.ngay_cap_nhat.desc())
        )
        result = await session.exec(stmt)
        so_dos = result.all()
        return [DiagramListResponse.model_validate(d) for d in so_dos]
    except Exception as e:
        logger.error(f"[DiagramService] Lỗi lấy danh sách thùng rác: {e}", exc_info=True)
        raise

async def restore_diagram(
    session: AsyncSession,
    user_id: str,
    so_do_id: uuid.UUID,
) -> bool:
    """Khôi phục sơ đồ từ thùng rác (đặt ngay_xoa = NULL)."""
    try:
        stmt = select(SoDo).where(
            SoDo.id_so_do == so_do_id,
            SoDo.id_chu_so_huu == uuid.UUID(user_id),
            SoDo.ngay_xoa != None,  # noqa: E711
        )
        result = await session.exec(stmt)
        so_do = result.first()
        if not so_do:
            return False
            
        so_do.ngay_xoa = None
        so_do.ngay_cap_nhat = datetime.now(timezone.utc).replace(tzinfo=None)
        await session.commit()
        _invalidate_user_cache(user_id, str(so_do_id))
        return True
    except Exception as e:
        await session.rollback()
        logger.error(f"[DiagramService] Lỗi khôi phục sơ đồ: {e}", exc_info=True)
        raise

async def hard_delete_diagram(
    session: AsyncSession,
    user_id: str,
    so_do_id: uuid.UUID,
) -> bool:
    """Xóa vĩnh viễn sơ đồ khỏi DB."""
    try:
        stmt = select(SoDo).where(
            SoDo.id_so_do == so_do_id,
            SoDo.id_chu_so_huu == uuid.UUID(user_id)
        )
        result = await session.exec(stmt)
        so_do = result.first()
        if not so_do:
            return False
            
        await session.delete(so_do)
        await session.commit()
        _invalidate_user_cache(user_id, str(so_do_id))
        return True
    except Exception as e:
        await session.rollback()
        logger.error(f"[DiagramService] Lỗi xóa vĩnh viễn sơ đồ: {e}", exc_info=True)
        raise

async def empty_trash(
    session: AsyncSession,
    user_id: str,
) -> bool:
    """Xóa vĩnh viễn tất cả sơ đồ trong thùng rác."""
    try:
        stmt = select(SoDo).where(
            SoDo.id_chu_so_huu == uuid.UUID(user_id),
            SoDo.ngay_xoa != None,  # noqa: E711
        )
        result = await session.exec(stmt)
        so_dos = result.all()
        
        for so_do in so_dos:
            await session.delete(so_do)
            
        await session.commit()
        _invalidate_user_cache(user_id)
        return True
    except Exception as e:
        await session.rollback()
        logger.error(f"[DiagramService] Lỗi dọn sạch thùng rác: {e}", exc_info=True)
        raise

