import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from .database import Base

class Business(Base):
    __tablename__ = "businesses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    category = Column(String, index=True)
    address = Column(String)
    phone = Column(String, nullable=True)
    website = Column(String, nullable=True)
    latitude = Column(Float)
    longitude = Column(Float)
    distance_meters = Column(Float)
    search_location = Column(String, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    analysis = relationship("WebsiteAnalysis", back_populates="business", uselist=False, cascade="all, delete-orphan")
    lead = relationship("Lead", back_populates="business", uselist=False, cascade="all, delete-orphan")

class WebsiteAnalysis(Base):
    __tablename__ = "website_analyses"

    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.id"), unique=True)
    has_website = Column(Boolean, default=False)
    is_https = Column(Boolean, default=False)
    is_mobile_friendly = Column(Boolean, default=False)
    has_online_booking = Column(Boolean, default=False)
    has_contact_form = Column(Boolean, default=False)
    opportunity_score = Column(Integer, default=0)
    audit_notes = Column(Text, nullable=True)
    checked_at = Column(DateTime, default=datetime.datetime.utcnow)

    business = relationship("Business", back_populates="analysis")

class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)
    lead_code = Column(String, unique=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.id"), unique=True)
    score = Column(Integer, default=0)
    priority = Column(String, default="MEDIUM") # HIGH, MEDIUM, LOW
    status = Column(String, default="NEW") # NEW, CONTACTED, FOLLOW_UP, INTERESTED, QUOTATION, WON, LOST
    owner_name = Column(String, nullable=True)
    call_notes = Column(Text, nullable=True)
    estimated_budget = Column(String, nullable=True)
    next_follow_up = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    business = relationship("Business", back_populates="lead")
    activities = relationship("LeadActivity", back_populates="lead", cascade="all, delete-orphan")
    project = relationship("Project", back_populates="lead", uselist=False)

class LeadActivity(Base):
    __tablename__ = "lead_activities"

    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"))
    action_type = Column(String) # CALL, NOTE, STATUS_CHANGE
    note = Column(Text)
    status_changed_to = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    lead = relationship("Lead", back_populates="activities")

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"), unique=True)
    project_name = Column(String)
    client_name = Column(String)
    developer_name = Column(String, default="Unassigned")
    budget = Column(Float, default=0.0)
    status = Column(String, default="PLANNING") # PLANNING, REQUIREMENTS, DESIGN, DEVELOPMENT, TESTING, CLIENT_REVIEW, COMPLETED
    deadline_days = Column(Integer, default=15)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    lead = relationship("Lead", back_populates="project")
