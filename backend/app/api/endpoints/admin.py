from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select, func, desc
from app.database.session import get_db
from app.models.diagram import SoDo
from app.models.user import NguoiDung
from app.models.ai_model import MoHinhAI
from app.models.ai_usage_log import NhatKySuDungAI
from pydantic import BaseModel, ConfigDict
from typing import List, Any, Optional
import datetime
from datetime import timedelta
from app.api.dependency import get_current_admin, get_current_nhan_vien  # Yêu cầu role quan_tri

router = APIRouter(prefix="/admin", tags=["Admin"])

class DiagramDTO(BaseModel):
    id_so_do: str
    tieu_de: str
    the_loai: str
    ngay_tao: datetime.datetime
    la_mau_chuan: bool
    anh_thu_nho: str | None = None
    
    model_config = ConfigDict(from_attributes=True)

class DiagramAdminUpdate(BaseModel):
    la_mau_chuan: Optional[bool] = None
    tieu_de: Optional[str] = None
    the_loai: Optional[str] = None
    du_lieu_so_do: Optional[dict] = None

class AiModelBase(BaseModel):
    nha_cung_cap: str
    ten_mo_hinh: str
    mo_ta: str | None = None
    trang_thai_hoat_dong: bool = True

class AiModelDTO(AiModelBase):
    id_mo_hinh: int
    ngay_tao: datetime.datetime
    model_config = ConfigDict(from_attributes=True)

class UserAdminDTO(BaseModel):
    id_nguoi_dung: str
    ten_nguoi_dung: str
    email: str
    ten_phong_ban: str | None
    trang_thai_hoat_dong: bool
    ngay_tao: datetime.datetime
    id_vai_tro: int | None
    
    model_config = ConfigDict(from_attributes=True)

class UserAdminUpdate(BaseModel):
    id_vai_tro: Optional[int] = None
    trang_thai_hoat_dong: Optional[bool] = None

class ChartDataPointDTO(BaseModel):
    date: str
    total: int

class AiUsageStatDTO(BaseModel):
    name: str
    value: int

class ActivityLogDTO(BaseModel):
    id: str
    name: str
    creator: str
    time: str
    status: str

class AdminStatsDTO(BaseModel):
    total_users: int
    total_diagrams: int
    total_tokens: int
    chart_data: List[ChartDataPointDTO]
    ai_usage_stats: List[AiUsageStatDTO]

@router.get("/diagrams", response_model=dict)
async def get_all_diagrams(
    search: str | None = None,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: NguoiDung = Depends(get_current_admin)  # 🔐 Chỉ admin
):
    """Lấy danh sách tất cả sơ đồ để quản trị viên có thể xem và set làm mẫu chuẩn."""
    try:
        query = select(SoDo).where(SoDo.ngay_xoa == None)
        
        if search:
            search_term = f"%{search}%"
            query = query.where(SoDo.tieu_de.ilike(search_term))
            
        count_query = select(func.count()).select_from(query.subquery())
        total = (await db.execute(count_query)).scalar_one()
            
        stmt = query.order_by(desc(SoDo.ngay_cap_nhat)).offset(skip).limit(limit)
        result = await db.execute(stmt)
        diagrams = result.scalars().all()
        
        items = [
            DiagramDTO(
                id_so_do=str(d.id_so_do),
                tieu_de=d.tieu_de,
                the_loai=d.the_loai,
                ngay_tao=d.ngay_tao,
                la_mau_chuan=d.la_mau_chuan,
                anh_thu_nho=d.anh_thu_nho
            ) for d in diagrams
        ]
        return {
            "total": total,
            "items": items
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats", response_model=AdminStatsDTO)
async def get_admin_stats(db: Session = Depends(get_db), current_user: NguoiDung = Depends(get_current_admin)):  # 🔐 Chỉ admin
    """Lấy thống kê tổng quan cho trang Admin."""
    try:
        total_users = (await db.execute(select(func.count(NguoiDung.id_nguoi_dung)).where(NguoiDung.ngay_xoa == None))).scalar_one()
        total_diagrams = (await db.execute(select(func.count(SoDo.id_so_do)).where(SoDo.ngay_xoa == None))).scalar_one()
        total_tokens = (await db.execute(select(func.sum(NhatKySuDungAI.so_token_dau_ra)))).scalar_one() or 0
        
        # Thống kê số sơ đồ theo ngày (7 ngày gần nhất)
        end_date = datetime.datetime.now()
        start_date = end_date - timedelta(days=6)
        
        stmt = select(
            func.date(SoDo.ngay_tao).label('date'),
            func.count(SoDo.id_so_do).label('total')
        ).where(
            SoDo.ngay_xoa == None,
            SoDo.ngay_tao >= start_date
        ).group_by(
            func.date(SoDo.ngay_tao)
        ).order_by(
            func.date(SoDo.ngay_tao)
        )
        
        results = await db.execute(stmt)
        rows = results.all()
        
        # Tạo map kết quả
        chart_map = {row.date.strftime("%Y-%m-%d"): row.total for row in rows}
        
        chart_data = []
        for i in range(7):
            d = (start_date + timedelta(days=i)).strftime("%Y-%m-%d")
            chart_data.append(ChartDataPointDTO(
                date=d,
                total=chart_map.get(d, 0)
            ))
            
        # Thống kê tỷ lệ Model AI sử dụng
        ai_stmt = select(
            MoHinhAI.ten_mo_hinh,
            func.count(NhatKySuDungAI.id_nhat_ky).label('total_usage')
        ).join(
            NhatKySuDungAI, NhatKySuDungAI.id_mo_hinh == MoHinhAI.id_mo_hinh
        ).group_by(
            MoHinhAI.ten_mo_hinh
        )
        ai_results = await db.execute(ai_stmt)
        ai_rows = ai_results.all()
        
        ai_usage_stats = [
            AiUsageStatDTO(name=row.ten_mo_hinh, value=row.total_usage)
            for row in ai_rows
        ]
        if not ai_usage_stats:
            ai_usage_stats = [AiUsageStatDTO(name="Chưa có dữ liệu", value=1)]
            
        return AdminStatsDTO(
            total_users=total_users,
            total_diagrams=total_diagrams,
            total_tokens=total_tokens,
            chart_data=chart_data,
            ai_usage_stats=ai_usage_stats
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/users", response_model=dict)
async def get_all_users(
    search: str | None = None,
    id_vai_tro: int | None = None,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: NguoiDung = Depends(get_current_admin)  # 🔐 Chỉ admin
):
    """Lấy danh sách người dùng cho Admin."""
    try:
        query = select(NguoiDung).where(NguoiDung.ngay_xoa == None)
        
        if search:
            search_term = f"%{search}%"
            query = query.where(
                (NguoiDung.ten_nguoi_dung.ilike(search_term)) |
                (NguoiDung.email.ilike(search_term)) |
                (NguoiDung.ten_phong_ban.ilike(search_term))
            )
            
        if id_vai_tro is not None:
            query = query.where(NguoiDung.id_vai_tro == id_vai_tro)
            
        count_query = select(func.count()).select_from(query.subquery())
        total = (await db.execute(count_query)).scalar_one()
            
        stmt = query.order_by(desc(NguoiDung.ngay_tao)).offset(skip).limit(limit)
        result = await db.execute(stmt)
        users = result.scalars().all()
        
        items = [
            UserAdminDTO(
                id_nguoi_dung=str(u.id_nguoi_dung),
                ten_nguoi_dung=u.ten_nguoi_dung,
                email=u.email,
                ten_phong_ban=u.ten_phong_ban,
                trang_thai_hoat_dong=u.trang_thai_hoat_dong,
                ngay_tao=u.ngay_tao,
                id_vai_tro=u.id_vai_tro
            ) for u in users
        ]
        return {
            "total": total,
            "items": items
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/users/{user_id}")
async def update_user_admin(
    user_id: str,
    payload: UserAdminUpdate,
    db: Session = Depends(get_db),
    current_user: NguoiDung = Depends(get_current_admin)  # 🔐 Chỉ admin
):
    """Cập nhật trạng thái/vai trò người dùng."""
    try:
        stmt = select(NguoiDung).where(NguoiDung.id_nguoi_dung == user_id, NguoiDung.ngay_xoa == None)
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")
            
        if payload.id_vai_tro is not None:
            user.id_vai_tro = payload.id_vai_tro
        if payload.trang_thai_hoat_dong is not None:
            user.trang_thai_hoat_dong = payload.trang_thai_hoat_dong
            
        user.ngay_cap_nhat = datetime.datetime.now()
        await db.commit()
        return {"result": "SUCCESS", "message": "Đã cập nhật thông tin người dùng!"}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/diagrams/{diagram_id}")
async def update_diagram_admin(
    diagram_id: str,
    payload: DiagramAdminUpdate,
    db: Session = Depends(get_db),
    current_user: NguoiDung = Depends(get_current_admin)  # 🔐 Chỉ admin
):
    """Cập nhật thông tin sơ đồ từ trang Admin (Template/Theme)."""
    try:
        stmt = select(SoDo).where(SoDo.id_so_do == diagram_id, SoDo.ngay_xoa == None)
        result = await db.execute(stmt)
        sodo = result.scalar_one_or_none()
        
        if not sodo:
            raise HTTPException(status_code=404, detail="Không tìm thấy sơ đồ")
            
        if payload.la_mau_chuan is not None:
            sodo.la_mau_chuan = payload.la_mau_chuan
        if payload.tieu_de is not None:
            sodo.tieu_de = payload.tieu_de
        if payload.the_loai is not None:
            sodo.the_loai = payload.the_loai
        if payload.du_lieu_so_do is not None:
            sodo.du_lieu_so_do = payload.du_lieu_so_do
            
        sodo.ngay_cap_nhat = datetime.datetime.now()
        await db.commit()
        
        return {"result": "SUCCESS", "message": "Đã cập nhật sơ đồ!"}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/ai-models", response_model=List[AiModelDTO])
async def get_ai_models(db: Session = Depends(get_db), current_user: NguoiDung = Depends(get_current_nhan_vien)):  # Cho phép cả nhân viên xem
    try:
        stmt = select(MoHinhAI).order_by(desc(MoHinhAI.ngay_tao))
        result = await db.execute(stmt)
        return result.scalars().all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ai-models", response_model=AiModelDTO)
async def create_ai_model(payload: AiModelBase, db: Session = Depends(get_db), current_user: NguoiDung = Depends(get_current_admin)):  # 🔐 Chỉ admin
    try:
        new_model = MoHinhAI(**payload.model_dump())
        db.add(new_model)
        await db.commit()
        await db.refresh(new_model)
        return new_model
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/ai-models/{model_id}", response_model=AiModelDTO)
async def update_ai_model(model_id: int, payload: AiModelBase, db: Session = Depends(get_db), current_user: NguoiDung = Depends(get_current_admin)):  # 🔐 Chỉ admin
    try:
        stmt = select(MoHinhAI).where(MoHinhAI.id_mo_hinh == model_id)
        result = await db.execute(stmt)
        model = result.scalar_one_or_none()
        if not model:
            raise HTTPException(status_code=404, detail="Không tìm thấy Model")
            
        for key, value in payload.model_dump().items():
            setattr(model, key, value)
            
        await db.commit()
        await db.refresh(model)
        return model
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/ai-models/{model_id}")
async def delete_ai_model(model_id: int, db: Session = Depends(get_db), current_user: NguoiDung = Depends(get_current_admin)):  # 🔐 Chỉ admin
    try:
        stmt = select(MoHinhAI).where(MoHinhAI.id_mo_hinh == model_id)
        result = await db.execute(stmt)
        model = result.scalar_one_or_none()
        if not model:
            raise HTTPException(status_code=404, detail="Không tìm thấy Model")
            
        await db.delete(model)
        await db.commit()
        return {"result": "SUCCESS", "message": "Đã xóa Model"}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/logs", response_model=List[ActivityLogDTO])
async def get_activity_logs(db: Session = Depends(get_db), current_user: NguoiDung = Depends(get_current_admin)):  # 🔐 Chỉ admin
    """Lấy danh sách nhật ký hoạt động (Quy trình gần đây)."""
    try:
        stmt = select(SoDo, NguoiDung).join(
            NguoiDung, SoDo.id_chu_so_huu == NguoiDung.id_nguoi_dung
        ).where(SoDo.ngay_xoa == None).order_by(desc(SoDo.ngay_cap_nhat)).limit(20)
        
        result = await db.execute(stmt)
        rows = result.all()
        
        logs = []
        now = datetime.datetime.utcnow()
        for sodo, user in rows:
            time_str = "Vừa xong"
            if sodo.ngay_cap_nhat:
                diff = now - sodo.ngay_cap_nhat
                minutes = max(0, diff.total_seconds() / 60)
                if minutes < 1:
                    time_str = "Vừa xong"
                elif minutes < 60:
                    time_str = f"{int(minutes)} phút trước"
                elif minutes < 1440:
                    time_str = f"{int(minutes/60)} giờ trước"
                else:
                    time_str = f"{int(minutes/1440)} ngày trước"
            
            logs.append(ActivityLogDTO(
                id=str(sodo.id_so_do)[:8].upper(),
                name=sodo.tieu_de,
                creator=user.ten_nguoi_dung,
                time=time_str,
                status="success"
            ))
            
        return logs
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

