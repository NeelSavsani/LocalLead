# LocalLead — Multi-Source Business Discovery & Lead Generation Platform

> **Discover local businesses. Verify their digital presence. Find development opportunities. Convert businesses into clients.**

## 1. Product Overview

LocalLead is a geo-targeted B2B lead-generation platform for web/app development businesses.

A user selects an area and radius—for example:

- Location: **GH5 Circle, Gandhinagar**
- Radius: **1 km**
- Categories: Restaurants, Cafes, Garages, Salons, Clinics

The platform discovers businesses from **multiple legitimate data sources**, combines and deduplicates the results, independently validates their geographic distance, verifies business information, discovers and analyzes their website/digital presence, scores the sales opportunity, and manages the resulting leads through a CRM.

The complete workflow is:

```text
Select Area
    ↓
Discover Businesses
    ↓
Collect From Multiple Sources
    ↓
Normalize Results
    ↓
Deduplicate
    ↓
Validate Geographic Radius
    ↓
Verify Business Information
    ↓
Discover Website / Digital Presence
    ↓
Analyze Website Quality
    ↓
Identify Digital Gaps
    ↓
Calculate Lead Score
    ↓
CRM
    ↓
Contact / Follow-up
    ↓
Quotation
    ↓
Client
    ↓
Website / App Project
```

---

## 2. Why Multi-Source?

No single external business-data source should be assumed to contain every real-world business.

Example:

```text
Actual businesses in an area: 150

Source A: 110
Source B: 95
Source C: 70
```

After merging:

```text
Source A ─────┐
Source B ─────┼──→ Merge → Deduplicate → 137 unique businesses
Source C ─────┘
```

Multi-source discovery improves coverage, but it **does not guarantee 100% completeness**. The product should report confidence/coverage rather than claim that every business was found.

---

# 3. High-Level Architecture

```text
                         ┌───────────────────────┐
                         │        USER           │
                         │ Location + Radius     │
                         │ Categories            │
                         └───────────┬───────────┘
                                     │
                                     ▼
                         ┌───────────────────────┐
                         │   LOCATION SERVICE    │
                         │ Geocoding + Coordinates│
                         └───────────┬───────────┘
                                     │
                                     ▼
                       ┌───────────────────────────┐
                       │     SCAN ORCHESTRATOR     │
                       └────────────┬──────────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              ▼                     ▼                     ▼
      ┌───────────────┐     ┌───────────────┐     ┌───────────────┐
      │ Places / API  │     │ OpenStreetMap  │     │ Licensed Data │
      │ Source Adapter│     │ Source Adapter │     │ Source Adapter│
      └───────┬───────┘     └───────┬───────┘     └───────┬───────┘
              │                     │                     │
              └─────────────────────┼─────────────────────┘
                                    ▼
                         ┌─────────────────────┐
                         │ RESULT NORMALIZER   │
                         └──────────┬──────────┘
                                    ▼
                         ┌─────────────────────┐
                         │ DEDUPLICATION       │
                         └──────────┬──────────┘
                                    ▼
                         ┌─────────────────────┐
                         │ GEO VALIDATION      │
                         │ distance <= radius  │
                         └──────────┬──────────┘
                                    ▼
                         ┌─────────────────────┐
                         │ BUSINESS VERIFIER   │
                         └──────────┬──────────┘
                                    ▼
                    ┌──────────────────────────────┐
                    │ DIGITAL PRESENCE DISCOVERY  │
                    └──────────────┬───────────────┘
                                   ▼
                    ┌──────────────────────────────┐
                    │ WEBSITE ANALYSIS ENGINE      │
                    └──────────────┬───────────────┘
                                   ▼
                    ┌──────────────────────────────┐
                    │ LEAD SCORING ENGINE          │
                    └──────────────┬───────────────┘
                                   ▼
                         ┌─────────────────────┐
                         │     PostgreSQL      │
                         └──────────┬──────────┘
                                    │
                 ┌──────────────────┼──────────────────┐
                 ▼                  ▼                  ▼
           ┌────────────┐     ┌────────────┐     ┌────────────┐
           │ Dashboard  │     │    CRM     │     │ Excel      │
           │ + Map      │     │ + Sales    │     │ Export     │
           └────────────┘     └─────┬──────┘     └────────────┘
                                    ▼
                              Client / Project
```

---

# 4. Critical Architecture Rule

**Do not make Chromium the primary source of truth.**

Instead:

```text
External Business Sources
          ↓
      Discovery
          ↓
      PostgreSQL
          ↓
 Verification / Enrichment
          ↓
 Digital Analysis
          ↓
    Lead Intelligence
```

Chromium/Playwright is a **worker for permitted verification/enrichment tasks**, not the foundation of the data layer.

---

# 5. Source Adapter Pattern

All providers should implement a common internal interface:

```text
BusinessSource
    ├── PlacesSource
    ├── OpenStreetMapSource
    ├── LicensedProviderSource
    └── FutureSource
```

Each adapter converts provider-specific data into the same internal model.

Example normalized object:

```json
{
  "source": "places",
  "source_id": "abc123",
  "name": "Patel Auto Garage",
  "category": "Garage",
  "phone": "+91 XXXXX XXXXX",
  "address": "GH5, Gandhinagar",
  "latitude": 23.215,
  "longitude": 72.636,
  "website": null
}
```

The rest of the application should not contain provider-specific logic.

---

# 6. Location Processing

User enters:

```text
GH5 Circle, Gandhinagar
```

The Location Service resolves it to:

```text
latitude
longitude
formatted address
```

Example:

```json
{
  "query": "GH5 Circle, Gandhinagar",
  "latitude": 23.215,
  "longitude": 72.636
}
```

The scan configuration becomes:

```json
{
  "latitude": 23.215,
  "longitude": 72.636,
  "radius_meters": 1000,
  "categories": [
    "restaurant",
    "cafe",
    "garage",
    "salon"
  ]
}
```

---

# 7. Business Discovery

Do not rely on one generic query.

Use category-specific discovery:

```text
Restaurants
Cafes
Garages
Car repair
Bike repair
Salons
Barbers
Clinics
Gyms
Bakeries
Electronics stores
Mobile shops
Furniture stores
Clothing stores
Coaching classes
Repair services
```

Each source performs the searches it supports.

Example:

```text
                 GH5 + 1 km
                     │
       ┌─────────────┼─────────────┐
       ▼             ▼             ▼
   Restaurant       Cafe         Garage
       │             │             │
       └─────────────┼─────────────┘
                     ▼
                Raw Results
```

---

# 8. Result Normalization

Different providers use different fields:

```text
Source A → business_name
Source B → name
Source C → title
```

Normalize everything to:

```text
Business
├── name
├── category
├── phone
├── address
├── latitude
├── longitude
├── website
└── source_records
```

Keep the original source ID and raw evidence.

---

# 9. Deduplication

The same business may appear several times:

```text
Source A: Patel Auto Garage
Source B: Patel Auto Garage - GH5
Source C: Patel Auto Garage
```

These should become one business.

Use multiple signals:

```text
Name similarity
+
Phone number
+
Coordinates
+
Address similarity
+
Website/domain
```

Example:

```text
Name similarity:      96%
Phone match:          YES
Address similarity:   91%
Coordinates:          15m apart
Website:              same

→ SAME BUSINESS
```

Do not rely only on business name.

---

# 10. Geographic Validation

This step is mandatory.

A provider may return a business because it considers it "nearby." LocalLead should independently calculate the distance from the selected point.

Example:

```text
GH5:
23.2150, 72.6360

Business:
23.2170, 72.6380

Distance:
~300 m

→ INCLUDE
```

If:

```text
Distance = 1.4 km
Radius = 1 km

→ EXCLUDE
```

Core rule:

```python
if distance <= radius:
    include_business()
else:
    exclude_business()
```

Use a proper geographic distance calculation such as Haversine or a PostGIS/geospatial equivalent.

---

# 11. Business Verification

After discovery and deduplication, verify:

```text
Business name
Phone
Address
Coordinates
Category
Website
Business status
```

Example:

```text
Name:        ✓
Phone:       ✓
Address:     ✓
Coordinates: ✓
Category:    ✓

Verification:
HIGH CONFIDENCE
```

---

# 12. Data Confidence Score

Separate data correctness from sales potential.

Example:

```text
Name verified:       20
Phone verified:      25
Address verified:    20
Coordinates:         20
Website relation:    15
------------------------
Total:              100
```

Example:

```text
Data Confidence: 94/100
```

---

# 13. Website Discovery

For each business:

```text
Business
   ↓
Possible website/domain discovery
   ↓
Candidate website
   ↓
Business identity verification
```

Possible sources:

```text
Business data provider
Public business profiles
Search results
Business's own public online presence
```

A domain should not be considered official merely because its name resembles the business.

---

# 14. Website Verification

Suppose the system finds:

```text
patelautogarage.com
```

Check:

```text
Business name match?
Phone match?
Address match?
Category match?
```

If enough signals agree:

```text
Website = VERIFIED
```

Otherwise:

```text
Website = POSSIBLE / UNVERIFIED
```

---

# 15. Chromium / Playwright

Chromium is useful as an isolated browser worker for permitted public-information verification/enrichment.

Architecture:

```text
FastAPI
   ↓
Create Verification Job
   ↓
Queue
   ↓
Browser Worker
   ↓
Playwright
   ↓
Chromium
   ↓
Permitted public information
   ↓
Structured result
   ↓
PostgreSQL
```

Do not build the system around bypassing CAPTCHA, anti-bot protections, access controls, or rate limits.

---

# 16. Why Browser Workers Are Separate

Avoid:

```text
HTTP Request
   ↓
Start Chromium
   ↓
Scan everything
   ↓
Wait
   ↓
HTTP Response
```

Prefer:

```text
User
 ↓
Create Scan Job
 ↓
Return Job ID
 ↓
Background Worker
 ↓
Discovery / Verification
 ↓
Database
 ↓
Frontend Progress Update
```

This allows long-running scans without blocking the API.

---

# 17. Website Analysis

A business with a website can still be a lead.

Analyze:

```text
HTTPS
Mobile responsiveness
Basic performance
Contact information
Clear CTA
Online booking
Online ordering
Online menu/catalog
Service information
WhatsApp/contact CTA
```

Example:

```text
XYZ Salon

Website: YES
Mobile friendly: NO
Online booking: NO
Contact information: YES
Services: YES
WhatsApp CTA: NO

Opportunity:
HIGH
```

---

# 18. Digital Presence Classification

Use statuses such as:

```text
NO WEBSITE
WEBSITE FOUND
WEBSITE VERIFIED
WEBSITE POOR
WEBSITE GOOD
WEBSITE UNVERIFIED
```

This is much more useful than simply:

```text
Website = YES / NO
```

---

# 19. Sales Opportunity Score

Example scoring:

```text
No website                 +50
Poor website               +30
No online booking          +10
No online ordering/menu    +10
Weak contact CTA            +5
Business contact available +10
```

Example:

```text
Patel Auto Garage

No website:        +50
No booking:        +10
Phone available:   +10

Opportunity Score: 70/100
```

Make the scoring rules configurable.

---

# 20. Two-Score Model

Every business can have:

```text
Data Confidence Score
Sales Opportunity Score
```

Example:

```text
Patel Auto Garage

Data Confidence:    96/100
Opportunity Score:  91/100

Priority: HIGH
```

This prevents unreliable data from being treated as a high-quality sales lead.

---

# 21. Evidence and Freshness

Store evidence for important decisions.

Example:

```text
website_status = NO_WEBSITE
checked_at = 2026-09-01
sources = [source_a, source_b]
confidence = 94
```

Also store:

```text
first_seen_at
last_seen_at
last_verified_at
```

Businesses can change:

```text
Phone changes
Address changes
Website launches
Website disappears
Business closes
Business changes category
```

Therefore the database should support periodic re-checks.

---

# 22. Re-Scan

Example:

```text
GH5 Circle
1 km

September:
204 verified businesses

December:
219 verified businesses
```

Detect:

```text
New businesses
Removed businesses
Changed phones
New websites
Removed websites
Changed website quality
```

This turns the database into a living lead database.

---

# 23. Database

Use:

```text
PostgreSQL
```

Recommended tables:

```text
users
scans
scan_categories
businesses
business_sources
business_locations
business_contacts
websites
website_analysis
leads
lead_scores
lead_activities
follow_ups
clients
quotations
projects
developers
```

---

# 24. Important Tables

### scans

```text
id
user_id
location_name
latitude
longitude
radius_meters
status
started_at
completed_at
```

### businesses

```text
id
name
category
normalized_name
latitude
longitude
formatted_address
created_at
updated_at
```

### business_sources

```text
id
business_id
provider
source_id
raw_data
first_seen_at
last_seen_at
```

### business_contacts

```text
id
business_id
phone
email
contact_type
verified
source
```

### websites

```text
id
business_id
url
status
verified
last_checked_at
```

### website_analysis

```text
id
website_id
mobile_score
performance_score
security_status
booking_available
ordering_available
menu_available
contact_available
overall_score
analyzed_at
```

### leads

```text
id
business_id
status
priority
data_confidence
opportunity_score
owner_name
notes
created_at
updated_at
```

---

# 25. Database Relationship

```text
User
 │
 └── Scan
      │
      └── Businesses
            │
            ├── Business Sources
            ├── Location
            ├── Contacts
            ├── Website
            │     └── Website Analysis
            │
            └── Lead
                  │
                  ├── Lead Score
                  ├── Activities
                  ├── Follow-ups
                  └── Client
                        │
                        └── Project
```

---

# 26. CRM

Lead statuses:

```text
NEW
CONTACTED
FOLLOW_UP
INTERESTED
REQUIREMENTS
QUOTATION
NEGOTIATION
WON
LOST
```

Example:

```text
NEW
 ↓
CONTACTED
 ↓
INTERESTED
 ↓
REQUIREMENTS
 ↓
QUOTATION
 ↓
WON
```

---

# 27. Follow-Up

Example:

```text
Business:
Patel Auto Garage

Status:
INTERESTED

Call Note:
Owner wants a service-booking website.

Next Follow-up:
Tomorrow

Estimated Budget:
₹20,000–₹30,000
```

---

# 28. Client Conversion

When a lead becomes a customer:

```text
Lead
 ↓
Client
 ↓
Project
```

Example:

```text
Client:
Patel Auto Garage

Project:
Business Website

Budget:
₹25,000

Deadline:
15 days

Developer:
Developer A
```

---

# 29. Project Management

Optional later module:

```text
PLANNING
 ↓
REQUIREMENTS
 ↓
DESIGN
 ↓
DEVELOPMENT
 ↓
TESTING
 ↓
CLIENT REVIEW
 ↓
COMPLETED
 ↓
MAINTENANCE
```

---

# 30. Excel Export

Excel is an export/reporting feature, not the primary database.

Flow:

```text
PostgreSQL
   ↓
Filter Leads
   ↓
Generate Excel
   ↓
.xlsx
```

Suggested columns:

```text
Lead ID
Business Name
Category
Owner Name
Phone
Email
Address
Latitude
Longitude
Distance
Website
Website Status
Website Quality
Data Confidence
Opportunity Score
Lead Priority
Lead Status
Notes
```

---

# 31. Dashboard

Example:

```text
LOCAL BUSINESS SCAN

Area:
GH5 Circle

Radius:
1 km

Businesses discovered:
247

Unique businesses:
218

Verified within radius:
204

No website:
63

Poor website:
41

High opportunity:
37
```

Sales:

```text
Contacted:
72

Interested:
19

Quotation:
12

Projects Won:
7
```

---

# 32. Scan Progress

```text
Scan: GH5 Circle — 1 km

[████████████████░░░░] 82%

✓ Location resolved
✓ Source A completed
✓ Source B completed
✓ Source C completed
✓ Deduplication completed
✓ Geographic validation completed
→ Website analysis running
```

---

# 33. Recommended Technology Stack

## Frontend

```text
Next.js
React
TypeScript
Tailwind CSS
```

## Backend

```text
Python
FastAPI
Pydantic
```

## Database

```text
PostgreSQL
```

For geographic queries at scale, consider:

```text
PostGIS
```

## Background Processing

```text
Redis
Celery / RQ
```

## Browser Automation

```text
Playwright
Chromium
```

Only for permitted verification/enrichment tasks.

## Data Processing

```text
pandas
openpyxl
```

## Deployment

```text
Docker
Linux VPS / Cloud
Nginx
PostgreSQL
Redis
```

---

# 34. Backend Structure

```text
backend/
└── app/
    ├── api/
    ├── models/
    ├── schemas/
    ├── services/
    │   ├── location/
    │   ├── discovery/
    │   │   ├── base.py
    │   │   ├── places.py
    │   │   ├── osm.py
    │   │   └── licensed_provider.py
    │   ├── normalization/
    │   ├── deduplication/
    │   ├── geo/
    │   ├── verification/
    │   ├── website/
    │   ├── scoring/
    │   └── crm/
    ├── workers/
    └── main.py
```

Browser worker:

```text
browser-worker/
├── scanners/
├── verifiers/
├── playwright/
└── workers/
```

---

# 35. API Design

Possible endpoints:

```text
POST /api/scans
GET  /api/scans/{id}
GET  /api/scans/{id}/businesses

GET  /api/businesses
GET  /api/businesses/{id}

POST /api/businesses/{id}/verify
POST /api/businesses/{id}/analyze-website

GET  /api/leads
GET  /api/leads/{id}
PATCH /api/leads/{id}

POST /api/leads/{id}/activities
POST /api/leads/{id}/follow-ups

POST /api/leads/{id}/convert

GET /api/exports/leads.xlsx
```

---

# 36. Example End-to-End Scan

Input:

```text
Location:
GH5 Circle, Gandhinagar

Radius:
1 km

Categories:
Restaurants + Cafes + Garages + Salons
```

Discovery:

```text
Source A → 160
Source B → 91
Source C → 74
```

Merge:

```text
325 raw records
```

Deduplicate:

```text
248 unique businesses
```

Geographic validation:

```text
213 within 1 km
```

Verification:

```text
205 sufficiently verified
```

Digital analysis:

```text
61 no website
39 weak website
105 acceptable website
```

Lead scoring:

```text
35 high priority
31 medium priority
34 lower priority
```

Sales:

```text
35 high-priority leads
       ↓
Calls
       ↓
Interested businesses
       ↓
Requirements
       ↓
Quotes
       ↓
Clients
```

---

# 37. Accuracy Strategy

Optimize for:

```text
Coverage
+
Correctness
+
Deduplication
+
Geographic accuracy
+
Business identity verification
+
Freshness
```

Not merely:

```text
Number of businesses found
```

Example:

```text
200 accurate businesses
```

is more valuable than:

```text
500 records containing duplicates,
wrong locations and unrelated businesses.
```

---

# 38. Source Reliability

Track source quality.

Example:

```text
Source A
Coverage: High
Phone accuracy: High

Source B
Coverage: Medium
Address accuracy: High

Source C
Coverage: Medium
Website accuracy: Medium
```

Useful internal metrics:

```text
Discovery contribution
Duplicate rate
Missing-field rate
Verification agreement
```

---

# 39. Cost Optimization

Do not necessarily run every expensive source for every scan.

Possible strategy:

```text
Low-cost sources
       ↓
Merge + Deduplicate
       ↓
Identify missing fields / uncertain records
       ↓
Use expensive source for targeted verification
```

This can reduce API costs.

---

# 40. Security

Include:

```text
Authentication
Authorization
API key protection
Rate limiting
Input validation
Encrypted secrets
Database access controls
Audit logs
```

External provider API keys must never be exposed in the frontend.

---

# 41. Legal / Data Principles

The system should:

- Prefer legitimate APIs and licensed business-data providers.
- Use business/public contact information appropriately.
- Follow the terms of each data provider.
- Store only information necessary for the workflow.
- Provide suitable correction/deletion controls.
- Avoid guessing owner identities.
- Avoid unauthorized scraping.
- Never bypass CAPTCHA, access controls, or anti-bot protections.
- Respect applicable privacy and communications requirements.

Commercial deployment should include a review of provider terms, licensing, privacy obligations, and outreach rules.

---

# 42. Development Roadmap

## Phase 1 — Core Discovery

```text
1. Location search
2. Radius selection
3. Category selection
4. One business-data source
5. Normalization
6. PostgreSQL
7. Geographic validation
8. Basic business list
```

## Phase 2 — Multi-Source

```text
1. Source adapter interface
2. Second data source
3. Third data source
4. Result merging
5. Deduplication
6. Source evidence
7. Coverage metrics
```

## Phase 3 — Digital Presence

```text
1. Website discovery
2. Website verification
3. Website quality analysis
4. Data confidence score
5. Opportunity score
```

## Phase 4 — Browser Worker

```text
1. Job queue
2. Playwright worker
3. Chromium-based permitted verification
4. Enrichment
5. Retry/error handling
```

## Phase 5 — CRM

```text
1. Lead statuses
2. Call notes
3. Follow-ups
4. Lead activities
5. Quotations
6. Client conversion
```

## Phase 6 — Business Platform

```text
1. Project management
2. Developer assignment
3. Revenue analytics
4. Re-scans
5. Change detection
6. AI-assisted analysis
```

---

# 43. MVP Scope

Do not build everything initially.

The first useful version should contain:

```text
✓ Location search
✓ Radius selection
✓ Category selection
✓ Multi-source discovery
✓ Normalization
✓ Deduplication
✓ Geographic validation
✓ PostgreSQL
✓ Basic website detection
✓ Lead list
✓ Excel export
```

Then add verification, website analysis and CRM.

---

# 44. Most Important Architecture Decisions

### 1. PostgreSQL is the source of truth

Not Excel.

### 2. Multiple sources are used for discovery

Not one provider.

### 3. Radius is independently validated

Do not blindly trust "nearby" search results.

### 4. Deduplication happens before lead scoring

Otherwise one business can become multiple leads.

### 5. Website existence and website quality are different

A poor website can still be a valuable opportunity.

### 6. Data confidence and sales opportunity are different

One measures reliability; the other measures commercial potential.

### 7. Chromium is a worker

It is not the foundation of the platform.

### 8. Evidence and timestamps are stored

Every important verification should be auditable and re-checkable.

---

# 45. Final Architecture

```text
                         LOCALLEAD
                             │
                             ▼
                  ┌─────────────────────┐
                  │ Location Selection  │
                  │ GH5 + 1 km          │
                  └──────────┬──────────┘
                             ▼
                  ┌─────────────────────┐
                  │ Scan Orchestrator   │
                  └──────────┬──────────┘
                             │
          ┌──────────────────┼──────────────────┐
          ▼                  ▼                  ▼
     Places/API             OSM          Licensed Sources
          │                  │                  │
          └──────────────────┼──────────────────┘
                             ▼
                    Normalize Results
                             ▼
                       Deduplicate
                             ▼
                     Geo Validation
                             ▼
                    Business Verification
                             │
                    ┌────────┴────────┐
                    ▼                 ▼
             Direct/API Checks   Playwright/Chromium
                    │                 │
                    └────────┬────────┘
                             ▼
                    Website Discovery
                             ▼
                     Website Analysis
                             ▼
                       Lead Scoring
                             │
                             ▼
                         PostgreSQL
                             │
                ┌────────────┼────────────┐
                ▼            ▼            ▼
            Dashboard       CRM         Excel
                             │
                             ▼
                          Sales
                             │
                             ▼
                         Quotation
                             │
                             ▼
                           Client
                             │
                             ▼
                          Project
                             │
                             ▼
                        Website/App
```

---

# 46. Final Product Definition

**LocalLead is a multi-source, geo-targeted business intelligence and lead-generation platform that discovers local businesses, validates their location and identity, analyzes their digital presence, identifies website/application opportunities, scores those opportunities, and manages the journey from business discovery to sales, client conversion and development project.**

## Product Flow

```text
AREA
 ↓
MULTI-SOURCE DISCOVERY
 ↓
NORMALIZATION
 ↓
DEDUPLICATION
 ↓
GEO VALIDATION
 ↓
BUSINESS VERIFICATION
 ↓
WEBSITE DISCOVERY
 ↓
WEBSITE ANALYSIS
 ↓
LEAD SCORING
 ↓
CRM
 ↓
SALES
 ↓
CLIENT
 ↓
DEVELOPMENT PROJECT
 ↓
REVENUE
```

## Core Philosophy

The goal is not:

> "Find as many businesses as possible."

The goal is:

> **"Find the most useful, accurate, verified and commercially relevant businesses within a selected geographic area."**
