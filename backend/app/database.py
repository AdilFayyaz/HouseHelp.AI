from sqlalchemy import create_engine, Column, Integer, String, DateTime, Float, Text, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from datetime import datetime
import os

# Database setup
DATABASE_URL = "sqlite:///./househelp.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Database Models
class Issue(Base):
    __tablename__ = "issues"
    
    id = Column(Integer, primary_key=True, index=True)
    image_path = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    voice_note_path = Column(String, nullable=True)
    diagnosis = Column(Text, nullable=True)
    repair_plan = Column(Text, nullable=True)  # JSON string
    is_diy = Column(Boolean, default=True)
    status = Column(String, default="new")  # new, in-progress, completed
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class MaintenanceProvider(Base):
    __tablename__ = "maintenance_providers"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    specialty = Column(String, nullable=False)
    contact_info = Column(String, nullable=False)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    availability = Column(String, default="available")
    rating = Column(Float, default=5.0)
    created_at = Column(DateTime, default=datetime.utcnow)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    issue_id = Column(Integer, nullable=False)
    cost = Column(Float, nullable=True)
    time_spent = Column(Float, nullable=True)  # in hours
    status = Column(String, nullable=False)  # completed, failed, in-progress
    notes = Column(Text, nullable=True)
    completed_by = Column(String, nullable=True)  # diy or provider name
    created_at = Column(DateTime, default=datetime.utcnow)

# Create tables
def create_tables():
    Base.metadata.create_all(bind=engine)

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Initialize with sample data
def initialize_sample_data():
    db = SessionLocal()
    try:
        # Check if providers already exist
        existing_providers = db.query(MaintenanceProvider).count()
        if existing_providers == 0:
            # Add sample maintenance providers
            providers = [
                MaintenanceProvider(
                    name="QuickFix Plumbing",
                    specialty="plumbing",
                    contact_info="contact@quickfix.com",
                    email="contact@quickfix.com",
                    phone="555-0101"
                ),
                MaintenanceProvider(
                    name="ElectroRepair Pro",
                    specialty="electrical",
                    contact_info="info@electrorepair.com",
                    email="info@electrorepair.com",
                    phone="555-0102"
                ),
                MaintenanceProvider(
                    name="Home Appliance Experts",
                    specialty="appliances",
                    contact_info="service@applianceexperts.com",
                    email="service@applianceexperts.com",
                    phone="555-0103"
                ),
                MaintenanceProvider(
                    name="Handyman Heroes",
                    specialty="general",
                    contact_info="help@handymanheroes.com",
                    email="help@handymanheroes.com",
                    phone="555-0104"
                )
            ]
            
            for provider in providers:
                db.add(provider)
            db.commit()
        
        # Add sample audit logs if none exist
        existing_audits = db.query(AuditLog).count()
        if existing_audits == 0:
            # Get some existing issues to create audit logs for
            issues = db.query(Issue).limit(3).all()
            sample_audits = []
            
            for i, issue in enumerate(issues):
                # Create audit logs for first few issues
                audit = AuditLog(
                    issue_id=issue.id,
                    cost=35.50 + (i * 15.25),  # Varying costs
                    time_spent=2.5 + (i * 0.5),  # Varying time
                    status="completed",
                    notes=f"Successfully repaired {issue.description[:50]}...",
                    completed_by="DIY" if issue.is_diy else "Professional"
                )
                sample_audits.append(audit)
            
            for audit in sample_audits:
                db.add(audit)
            db.commit()
            print(f"Added {len(sample_audits)} sample audit logs")
            
    finally:
        db.close()