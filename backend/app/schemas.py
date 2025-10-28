from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

# Request Models
class IssueCreate(BaseModel):
    description: str
    voice_note_path: Optional[str] = None

class IssueUpdate(BaseModel):
    status: Optional[str] = None
    diagnosis: Optional[str] = None
    repair_plan: Optional[str] = None
    is_diy: Optional[bool] = None

class MaintenanceProviderCreate(BaseModel):
    name: str
    specialty: str
    contact_info: str
    email: Optional[str] = None
    phone: Optional[str] = None

class AuditLogCreate(BaseModel):
    issue_id: int
    cost: Optional[float] = None
    time_spent: Optional[float] = None
    status: str
    notes: Optional[str] = None
    completed_by: Optional[str] = None

class ChatMessage(BaseModel):
    message: str
    issue_id: Optional[int] = None

# Response Models
class IssueResponse(BaseModel):
    id: int
    image_path: str
    description: str
    voice_note_path: Optional[str]
    diagnosis: Optional[str]
    repair_plan: Optional[str]
    is_diy: bool
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class MaintenanceProviderResponse(BaseModel):
    id: int
    name: str
    specialty: str
    contact_info: str
    email: Optional[str]
    phone: Optional[str]
    availability: str
    rating: float
    created_at: datetime

    class Config:
        from_attributes = True

class AuditLogResponse(BaseModel):
    id: int
    issue_id: int
    cost: Optional[float]
    time_spent: Optional[float]
    status: str
    notes: Optional[str]
    completed_by: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class RepairPlan(BaseModel):
    diagnosis: str
    steps: List[dict]
    is_diy: bool
    estimated_time: Optional[str] = None
    estimated_cost: Optional[str] = None
    safety_warnings: Optional[List[str]] = None
    recommended_provider: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    context: Optional[str] = None