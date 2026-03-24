from pydantic import BaseModel, ConfigDict
from typing import Dict, Any, Optional
import uuid
from datetime import datetime

class DiagramBase(BaseModel):
    title: str
    flow_data: Dict[str, Any]

class DiagramCreate(DiagramBase):
    pass

class DiagramUpdate(DiagramBase):
    id: uuid.UUID

class DiagramUpsert(DiagramBase):
    id: Optional[uuid.UUID] = None # Optional for create, required for update

class DiagramSaveRequest(BaseModel):
    title: str
    flow_data: dict
    raw_text: Optional[str] = None

class DiagramResponse(DiagramBase):
    id: uuid.UUID
    user_id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class DiagramListResponse(BaseModel):
    id: uuid.UUID
    title: str
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
