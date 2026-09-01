from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

# Business Schemas
class BusinessBase(BaseModel):
    name: str
    category: str
    address: str
    phone: Optional[str] = None
    website: Optional[str] = None
    latitude: float
    longitude: float
    distance_meters: float

class BusinessCreate(BusinessBase):
    search_location: str

class WebsiteAnalysisOut(BaseModel):
    has_website: bool
    is_https: bool
    is_mobile_friendly: bool
    has_online_booking: bool
    has_contact_form: bool
    opportunity_score: int
    audit_notes: Optional[str] = None

    class Config:
        from_attributes = True

class BusinessOut(BusinessBase):
    id: int
    search_location: str
    analysis: Optional[WebsiteAnalysisOut] = None

    class Config:
        from_attributes = True

# Lead Schemas
class LeadOut(BaseModel):
    id: int
    lead_code: str
    score: int
    priority: str
    status: str
    owner_name: Optional[str] = None
    call_notes: Optional[str] = None
    estimated_budget: Optional[str] = None
    next_follow_up: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    business: BusinessOut

    class Config:
        from_attributes = True

class LeadUpdateStatus(BaseModel):
    status: str
    call_notes: Optional[str] = None
    owner_name: Optional[str] = None
    estimated_budget: Optional[str] = None
    next_follow_up: Optional[str] = None

# Discovery Search Request
class DiscoveryRequest(BaseModel):
    location: str # e.g. "GH5 Circle, Gandhinagar" or lat,lng
    radius_km: float = 1.0
    categories: Optional[List[str]] = Field(default_factory=lambda: ["Restaurant", "Cafe", "Garage", "Salon", "Clinic", "Retail Store"])

# Project Schemas
class ProjectCreate(BaseModel):
    lead_id: int
    project_name: str
    client_name: str
    developer_name: Optional[str] = "Unassigned"
    budget: float = 0.0
    deadline_days: int = 15

class ProjectOut(BaseModel):
    id: int
    lead_id: int
    project_name: str
    client_name: str
    developer_name: str
    budget: float
    status: str
    deadline_days: int
    created_at: datetime

    class Config:
        from_attributes = True

class ProjectUpdateStatus(BaseModel):
    status: str
    developer_name: Optional[str] = None
    budget: Optional[float] = None
