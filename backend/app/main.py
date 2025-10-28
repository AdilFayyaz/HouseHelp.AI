from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
import os
import uuid
import json
import shutil
from typing import List, Optional

from app.database import get_db, create_tables, initialize_sample_data, Issue, MaintenanceProvider, AuditLog
from app.schemas import (
    IssueCreate, IssueResponse, IssueUpdate,
    MaintenanceProviderCreate, MaintenanceProviderResponse,
    AuditLogCreate, AuditLogResponse,
    ChatMessage, ChatResponse, RepairPlan
)
from app.ai_service import phi4_service
from app.flowchart_service import generate_mermaid_flowchart, create_simple_flowchart

# Create FastAPI app
app = FastAPI(title="HouseHelp.AI API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded files
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Create tables on startup
@app.on_event("startup")
async def startup_event():
    create_tables()
    initialize_sample_data()
    # Check if Ollama and Phi-4 Mini are available
    if phi4_service.check_model_availability():
        print("✅ Phi-4 Mini model is available via Ollama")
    else:
        print("⚠️  Phi-4 Mini model not found. Please ensure Ollama is running and phi4-mini is installed.")
        print("   Run: ollama pull phi4-mini")

# Health check
@app.get("/")
async def root():
    return {"message": "HouseHelp.AI Backend is running!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "HouseHelp.AI API"}

# Issue endpoints
@app.post("/api/issues/", response_model=IssueResponse)
async def create_issue(
    description: str = Form(...),
    image: UploadFile = File(...),
    voice_note: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    """Create a new issue with image upload"""
    # Validate image file
    if not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Generate unique filename
    image_filename = f"{uuid.uuid4()}.{image.filename.split('.')[-1]}"
    image_path = f"uploads/{image_filename}"
    
    # Save image
    os.makedirs("uploads", exist_ok=True)
    with open(image_path, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)
    
    # Handle voice note if provided
    voice_note_path = None
    if voice_note:
        voice_filename = f"{uuid.uuid4()}.{voice_note.filename.split('.')[-1]}"
        voice_note_path = f"uploads/{voice_filename}"
        with open(voice_note_path, "wb") as buffer:
            shutil.copyfileobj(voice_note.file, buffer)
    
    # Create issue in database
    db_issue = Issue(
        image_path=image_path,
        description=description,
        voice_note_path=voice_note_path
    )
    db.add(db_issue)
    db.commit()
    db.refresh(db_issue)
    
    return db_issue

@app.get("/api/issues/", response_model=List[IssueResponse])
async def get_issues(db: Session = Depends(get_db)):
    """Get all issues"""
    return db.query(Issue).all()

@app.get("/api/issues/{issue_id}", response_model=IssueResponse)
async def get_issue(issue_id: int, db: Session = Depends(get_db)):
    """Get specific issue"""
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    return issue

@app.post("/api/issues/{issue_id}/analyze", response_model=dict)
async def analyze_issue(issue_id: int, db: Session = Depends(get_db)):
    """Analyze issue and generate repair plan"""
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    
    # Generate repair plan using AI
    repair_plan = phi4_service.generate_repair_plan(issue.image_path, issue.description)
    
    # Update issue with analysis
    issue.diagnosis = repair_plan.get("diagnosis", "")
    issue.repair_plan = json.dumps(repair_plan)
    issue.is_diy = repair_plan.get("is_diy", True)
    issue.status = "analyzed"
    
    db.commit()
    
    # Generate flowchart
    mermaid_chart = generate_mermaid_flowchart(repair_plan)
    text_chart = create_simple_flowchart(repair_plan.get("steps", []), repair_plan.get("is_diy", True))
    
    return {
        "repair_plan": repair_plan,
        "mermaid_flowchart": mermaid_chart,
        "text_flowchart": text_chart
    }

@app.put("/api/issues/{issue_id}", response_model=IssueResponse)
async def update_issue(issue_id: int, issue_update: IssueUpdate, db: Session = Depends(get_db)):
    """Update issue status"""
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    
    for field, value in issue_update.dict(exclude_unset=True).items():
        setattr(issue, field, value)
    
    db.commit()
    db.refresh(issue)
    return issue

# Maintenance Provider endpoints
@app.get("/api/providers/", response_model=List[MaintenanceProviderResponse])
async def get_providers(specialty: Optional[str] = None, db: Session = Depends(get_db)):
    """Get maintenance providers, optionally filtered by specialty"""
    query = db.query(MaintenanceProvider)
    if specialty:
        query = query.filter(MaintenanceProvider.specialty == specialty)
    return query.all()

@app.post("/api/providers/", response_model=MaintenanceProviderResponse)
async def create_provider(provider: MaintenanceProviderCreate, db: Session = Depends(get_db)):
    """Create new maintenance provider"""
    db_provider = MaintenanceProvider(**provider.dict())
    db.add(db_provider)
    db.commit()
    db.refresh(db_provider)
    return db_provider

@app.post("/api/issues/{issue_id}/call-maintenance")
async def call_maintenance(issue_id: int, provider_id: int, db: Session = Depends(get_db)):
    """Call maintenance provider for an issue"""
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    provider = db.query(MaintenanceProvider).filter(MaintenanceProvider.id == provider_id).first()
    
    if not issue or not provider:
        raise HTTPException(status_code=404, detail="Issue or provider not found")
    
    # Update issue status
    issue.status = "maintenance_called"
    db.commit()
    
    # Generate summary for provider
    repair_plan = json.loads(issue.repair_plan) if issue.repair_plan else {}
    summary = {
        "issue_id": issue.id,
        "description": issue.description,
        "diagnosis": issue.diagnosis,
        "image_path": issue.image_path,
        "repair_plan": repair_plan,
        "provider": {
            "name": provider.name,
            "contact": provider.contact_info
        }
    }
    
    return {"message": f"Maintenance request sent to {provider.name}", "summary": summary}

# Audit Log endpoints
@app.get("/api/audit-logs/", response_model=List[AuditLogResponse])
async def get_audit_logs(issue_id: Optional[int] = None, db: Session = Depends(get_db)):
    """Get audit logs, optionally filtered by issue"""
    query = db.query(AuditLog)
    if issue_id:
        query = query.filter(AuditLog.issue_id == issue_id)
    return query.order_by(AuditLog.created_at.desc()).all()

@app.post("/api/audit-logs/", response_model=AuditLogResponse)
async def create_audit_log(audit_log: AuditLogCreate, db: Session = Depends(get_db)):
    """Create audit log entry"""
    db_log = AuditLog(**audit_log.dict())
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    
    # Update associated issue status
    issue = db.query(Issue).filter(Issue.id == audit_log.issue_id).first()
    if issue:
        issue.status = audit_log.status
        db.commit()
    
    return db_log

# Chat endpoint
@app.post("/api/chat", response_model=ChatResponse)
async def chat(message: ChatMessage, db: Session = Depends(get_db)):
    """Chat with AI about repair issues"""
    context = ""
    
    # Get context from issue if provided
    if message.issue_id:
        issue = db.query(Issue).filter(Issue.id == message.issue_id).first()
        if issue:
            repair_plan = json.loads(issue.repair_plan) if issue.repair_plan else {}
            context = f"Issue: {issue.description}\nDiagnosis: {issue.diagnosis}\nRepair Plan: {json.dumps(repair_plan, indent=2)}"
    
    # Generate response
    response = phi4_service.chat_response(message.message, context)
    
    return ChatResponse(response=response, context=context if context else None)

# Dashboard endpoint
@app.get("/api/dashboard")
async def get_dashboard(db: Session = Depends(get_db)):
    """Get dashboard statistics"""
    total_issues = db.query(Issue).count()
    completed_issues = db.query(Issue).filter(Issue.status == "completed").count()
    diy_issues = db.query(Issue).filter(Issue.is_diy == True).count()
    professional_issues = db.query(Issue).filter(Issue.is_diy == False).count()
    
    # Calculate costs
    total_cost = db.query(AuditLog.cost).filter(AuditLog.cost.isnot(None)).all()
    total_cost = sum([cost[0] for cost in total_cost]) if total_cost else 0
    
    return {
        "total_issues": total_issues,
        "completed_issues": completed_issues,
        "diy_issues": diy_issues,
        "professional_issues": professional_issues,
        "total_cost": total_cost,
        "completion_rate": (completed_issues / total_issues * 100) if total_issues > 0 else 0
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)