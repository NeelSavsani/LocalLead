import io
import datetime
from fastapi import FastAPI, Depends, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional

from .database import engine, Base, get_db
from .models import Business, WebsiteAnalysis, Lead, LeadActivity, Project
from .schemas import (
    DiscoveryRequest, BusinessOut, LeadOut, LeadUpdateStatus,
    ProjectCreate, ProjectOut, ProjectUpdateStatus
)
from .services.discovery import discover_businesses, enrich_phone_number
from .services.web_auditor import audit_website
from .services.scoring import calculate_two_scores
from .services.exporter import export_leads_to_excel

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="LocalLead API",
    description="Multi-Source Geo-Targeted Local Business Lead Generation Platform.",
    version="2.0.0"
)

# Enable CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "app": "LocalLead API — Multi-Source Engine",
        "version": "2.0.0",
        "endpoints": ["/api/v1/discover", "/api/v1/leads", "/api/v1/export", "/api/v1/projects", "/api/v1/stats", "/api/v1/enrich-phones"]
    }

@app.post("/api/v1/discover")
def discover_and_qualify(req: DiscoveryRequest, db: Session = Depends(get_db)):
    """
    Search an area, discover businesses from multiple adapters, deduplicate records,
    validate radius, perform website audits & phone contact enrichment, score leads, and save.
    """
    results = discover_businesses(req.location, req.radius_km, req.categories or [], gmaps_url=req.gmaps_url)
    
    if not results.get("location_resolved", True):
        return {
            "search_location": results["search_location"],
            "location_resolved": False,
            "error_message": results["error_message"],
            "center": None,
            "radius_km": req.radius_km,
            "total_found": 0,
            "leads": []
        }

    current_search_lead_ids = []

    # Process each discovered & deduplicated business
    for idx, b_data in enumerate(results["businesses"], start=1):
        existing_b = db.query(Business).filter(
            Business.name == b_data["name"],
            Business.search_location == results["search_location"]
        ).first()

        if existing_b:
            # If existing business record was missing a phone, update it with newly enriched phone!
            if not existing_b.phone and b_data.get("phone"):
                existing_b.phone = b_data["phone"]
                db.commit()
            elif not existing_b.phone:
                enriched_ph = enrich_phone_number(existing_b.name, results["search_location"])
                if enriched_ph:
                    existing_b.phone = enriched_ph
                    db.commit()

            lead = existing_b.lead
            if lead:
                current_search_lead_ids.append(lead.id)
            continue

        sources_arr = b_data.get("sources", ["openstreetmap"])
        providers_str = ", ".join(sources_arr)

        # Create Business record
        b_model = Business(
            name=b_data["name"],
            category=b_data["category"],
            address=b_data["address"],
            phone=b_data["phone"],
            website=b_data["website"],
            latitude=b_data["latitude"],
            longitude=b_data["longitude"],
            distance_meters=b_data["distance_meters"],
            search_location=results["search_location"],
            sources_count=len(sources_arr),
            source_providers=providers_str
        )
        db.add(b_model)
        db.flush()

        # Audit Website
        audit_data = audit_website(b_data["website"])

        # Calculate Two-Score Model (Data Confidence & Sales Opportunity)
        data_confidence, opp_score, priority, digital_presence_status = calculate_two_scores(b_data, audit_data)

        a_model = WebsiteAnalysis(
            business_id=b_model.id,
            has_website=audit_data["has_website"],
            is_https=audit_data["is_https"],
            is_mobile_friendly=audit_data["is_mobile_friendly"],
            has_online_booking=audit_data["has_online_booking"],
            has_contact_form=audit_data["has_contact_form"],
            digital_presence_status=digital_presence_status,
            opportunity_score=opp_score,
            audit_notes=audit_data["audit_notes"]
        )
        db.add(a_model)

        # Generate unique lead code (LL-0001, LL-0002, etc.)
        count = db.query(Lead).count() + 1
        lead_code = f"LL-{count:04d}"

        l_model = Lead(
            lead_code=lead_code,
            business_id=b_model.id,
            data_confidence=data_confidence,
            score=opp_score,
            priority=priority,
            status="NEW"
        )
        db.add(l_model)
        db.flush()

        # Activity log
        act = LeadActivity(
            lead_id=l_model.id,
            action_type="DISCOVERED",
            note=f"Multi-source scan at {results['search_location']}. Sources: {providers_str}. Confidence: {data_confidence}%, Opportunity: {opp_score}/100.",
            status_changed_to="NEW"
        )
        db.add(act)
        current_search_lead_ids.append(l_model.id)

    db.commit()

    # Return leads strictly for this search
    if current_search_lead_ids:
        scanned_leads = db.query(Lead).filter(Lead.id.in_(current_search_lead_ids)).all()
    else:
        scanned_leads = []

    return {
        "search_location": results["search_location"],
        "location_resolved": True,
        "error_message": None,
        "center": results["center"],
        "radius_km": results["radius_km"],
        "total_found": len(results["businesses"]),
        "leads": [LeadOut.model_validate(l) for l in scanned_leads]
    }

@app.post("/api/v1/enrich-phones")
def enrich_database_phones(db: Session = Depends(get_db)):
    """Bulk enrich missing phone numbers for existing businesses stored in the database."""
    businesses_without_phone = db.query(Business).filter(
        (Business.phone == None) | (Business.phone == "") | (Business.phone == "Not Listed")
    ).all()

    enriched_count = 0
    for b in businesses_without_phone:
        ph = enrich_phone_number(b.name, b.search_location or b.address)
        if ph:
            b.phone = ph
            enriched_count += 1

    db.commit()
    return {"status": "success", "total_checked": len(businesses_without_phone), "enriched_count": enriched_count}

@app.get("/api/v1/leads", response_model=List[LeadOut])
def get_leads(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    search: Optional[str] = None,
    location: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Retrieve qualified leads with filtering options."""
    query = db.query(Lead).join(Business)

    if status and status != "ALL":
        query = query.filter(Lead.status == status)
    if priority and priority != "ALL":
        query = query.filter(Lead.priority == priority)
    if location and location.strip():
        loc_pattern = f"%{location.strip()}%"
        query = query.filter(
            (Business.search_location.ilike(loc_pattern)) | 
            (Business.address.ilike(loc_pattern))
        )
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Business.name.ilike(search_pattern)) |
            (Business.category.ilike(search_pattern)) |
            (Lead.lead_code.ilike(search_pattern))
        )

    leads = query.order_by(Lead.score.desc()).all()
    return leads

@app.put("/api/v1/leads/{lead_id}", response_model=LeadOut)
def update_lead_status(lead_id: int, payload: LeadUpdateStatus, db: Session = Depends(get_db)):
    """Update lead status, phone number, notes, budget, owner name, or next follow-up date."""
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    old_status = lead.status
    if payload.status:
        lead.status = payload.status
    if payload.phone is not None and lead.business:
        lead.business.phone = payload.phone.strip()
    if payload.call_notes is not None:
        lead.call_notes = payload.call_notes
    if payload.owner_name is not None:
        lead.owner_name = payload.owner_name
    if payload.estimated_budget is not None:
        lead.estimated_budget = payload.estimated_budget
    if payload.next_follow_up is not None:
        lead.next_follow_up = payload.next_follow_up

    # Log activity
    act = LeadActivity(
        lead_id=lead.id,
        action_type="STATUS_UPDATE",
        note=payload.call_notes or f"Updated lead status to {lead.status}.",
        status_changed_to=lead.status
    )
    db.add(act)
    db.commit()
    db.refresh(lead)

    return lead

@app.get("/api/v1/export")
def download_excel(
    status: Optional[str] = None,
    location: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Export leads database to an Excel (.xlsx) file download.
    Supports filtering strictly by location (e.g. Racecourse Rajkot) and status.
    """
    query = db.query(Lead).join(Business)

    if status and status != "ALL":
        query = query.filter(Lead.status == status)

    if location and location.strip():
        clean_loc = location.strip()
        loc_pattern = f"%{clean_loc}%"
        
        loc_leads = query.filter(
            (Business.search_location.ilike(loc_pattern)) | 
            (Business.address.ilike(loc_pattern))
        ).order_by(Lead.score.desc()).all()

        if not loc_leads:
            city_words = [w.strip() for w in clean_loc.replace(",", " ").split() if len(w.strip()) >= 4]
            for word in reversed(city_words):
                fallback_leads = query.filter(
                    (Business.search_location.ilike(f"%{word}%")) |
                    (Business.address.ilike(f"%{word}%"))
                ).order_by(Lead.score.desc()).all()
                if fallback_leads:
                    loc_leads = fallback_leads
                    break

        leads = loc_leads
    else:
        leads = query.order_by(Lead.score.desc()).all()

    excel_bytes = export_leads_to_excel(leads)

    loc_slug = "".join(c if c.isalnum() else "_" for c in (location or "All_Locations"))[:25]
    filename = f"LocalLead_Export_{loc_slug}_{datetime.datetime.now().strftime('%Y%m%d_%H%M')}.xlsx"

    return Response(
        content=excel_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@app.post("/api/v1/projects", response_model=ProjectOut)
def convert_lead_to_project(req: ProjectCreate, db: Session = Depends(get_db)):
    """Convert a WON lead into an active Web Development Project."""
    lead = db.query(Lead).filter(Lead.id == req.lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    existing_proj = db.query(Project).filter(Project.lead_id == req.lead_id).first()
    if existing_proj:
        return existing_proj

    # Update lead status to WON
    lead.status = "WON"

    proj = Project(
        lead_id=lead.id,
        project_name=req.project_name,
        client_name=req.client_name,
        developer_name=req.developer_name or "Unassigned",
        budget=req.budget,
        status="PLANNING",
        deadline_days=req.deadline_days
    )
    db.add(proj)

    act = LeadActivity(
        lead_id=lead.id,
        action_type="CONVERTED_TO_PROJECT",
        note=f"Converted lead into active project: {req.project_name} (Budget: ₹{req.budget:,.0f}).",
        status_changed_to="WON"
    )
    db.add(act)

    db.commit()
    db.refresh(proj)
    return proj

@app.get("/api/v1/projects", response_model=List[ProjectOut])
def list_projects(db: Session = Depends(get_db)):
    """List all projects."""
    return db.query(Project).order_by(Project.created_at.desc()).all()

@app.put("/api/v1/projects/{project_id}", response_model=ProjectOut)
def update_project(project_id: int, payload: ProjectUpdateStatus, db: Session = Depends(get_db)):
    """Update project status or assigned developer."""
    proj = db.query(Project).filter(Project.id == project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")

    if payload.status:
        proj.status = payload.status
    if payload.developer_name:
        proj.developer_name = payload.developer_name
    if payload.budget is not None:
        proj.budget = payload.budget

    db.commit()
    db.refresh(proj)
    return proj

@app.get("/api/v1/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    """Retrieve high-level dashboard metrics."""
    total_businesses = db.query(Business).count()
    no_website = db.query(WebsiteAnalysis).filter(WebsiteAnalysis.has_website == False).count()
    poor_website = db.query(WebsiteAnalysis).filter(WebsiteAnalysis.has_website == True, WebsiteAnalysis.opportunity_score >= 50).count()
    
    total_leads = db.query(Lead).count()
    high_priority = db.query(Lead).filter(Lead.priority == "HIGH").count()
    
    contacted = db.query(Lead).filter(Lead.status == "CONTACTED").count()
    interested = db.query(Lead).filter(Lead.status == "INTERESTED").count()
    proposals = db.query(Lead).filter(Lead.status == "QUOTATION").count()
    won = db.query(Lead).filter(Lead.status == "WON").count()

    projects_count = db.query(Project).count()
    total_pipeline_val = sum([p.budget for p in db.query(Project).all()])

    return {
        "discovery": {
            "total_businesses": total_businesses,
            "no_website": no_website,
            "poor_website": poor_website,
            "total_leads": total_leads,
            "high_priority": high_priority
        },
        "sales": {
            "contacted": contacted,
            "interested": interested,
            "proposals": proposals,
            "won": won
        },
        "projects": {
            "active_projects": projects_count,
            "revenue": total_pipeline_val
        }
    }
