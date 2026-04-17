from fastapi import APIRouter
from app.api.endpoints.auth import router as auth_router
from app.api.endpoints.users import router as users_router
from app.api.endpoints.flow import router as flow_router
from app.api.endpoints.diagram_router import router as diagram_router
from app.api.endpoints.admin import router as admin_router

api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(users_router)

api_router.include_router(flow_router, prefix="/ai") 

api_router.include_router(diagram_router)
api_router.include_router(admin_router)