# LocalLead — Geo-Targeted B2B Lead Generation & Sales CRM Platform

**LocalLead** is a geo-targeted B2B lead-generation, web presence analysis, sales CRM, and project management platform built for web development agencies and freelancers.

It automates the process of discovering local businesses (restaurants, garages, salons, clinics, retail stores), auditing their web presence, scoring sales opportunities, tracking leads through a sales pipeline, and converting won deals into active web development projects.

---

## 🌟 Key Features

- 🗺️ **Geo-Targeted Discovery**: Pinpoint any location/landmark and scan a radius (500m to 5km) using OpenStreetMap.
- 🌐 **Automated Web Auditor**: Audits websites for presence, HTTPS security, mobile responsiveness, online booking systems, and contact forms.
- 🎯 **Lead Opportunity Scoring**: Calculates a 0–100 lead score and categorizes priority (`HIGH`, `MEDIUM`, `LOW`).
- 📋 **Lead Qualification Table**: Filter, search, and manage lead records with audit notes.
- 📊 **Sales CRM Kanban**: Drag-and-drop pipeline stages (`NEW` ➔ `CONTACTED` ➔ `INTERESTED` ➔ `QUOTATION` ➔ `WON`).
- 📁 **Client & Developer Project Management**: Track won deliverables, stage milestones (`PLANNING` ➔ `DEVELOPMENT` ➔ `COMPLETED`), deadlines, and assigned developers.
- 📥 **One-Click Excel Export**: Download formatted `.xlsx` reports anytime.
- 📈 **Analytics Dashboard**: Real-time KPI statistics on business discovery, website deficits, and pipeline revenue projections.

---

## 🛠️ Technology Stack

- **Backend**: Python 3.12, FastAPI, SQLAlchemy, SQLite, Pydantic, Requests, BeautifulSoup4, Pandas, OpenPyXL
- **Frontend**: React (Vite), Leaflet.js (OpenStreetMap), Lucide Icons, Glassmorphism Vanilla CSS

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Python 3.10+
- Node.js 18+

### 2. Backend Setup
```bash
cd backend

# Create virtual environment & activate
python -m venv venv
.\venv\Scripts\activate   # On Windows
# source venv/bin/activate # On Mac/Linux

# Install requirements
pip install -r requirements.txt

# Start FastAPI Server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
*Backend API will run at:* `http://127.0.0.1:8000`

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```
*Frontend UI will run at:* `http://127.0.0.1:5173`

---

## 📁 Repository Structure

```text
LocalLead/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── services/       # Discovery, Web Auditor, Scoring Engine, Exporter
│   │   ├── database.py     # SQLite database config
│   │   ├── main.py         # FastAPI REST endpoints
│   │   ├── models.py       # SQLAlchemy ORM models
│   │   └── schemas.py      # Pydantic schemas
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/     # Navbar, MapDiscovery, LeadsTable, CrmKanban, Projects, Analytics
│   │   ├── App.jsx
│   │   └── index.css       # Design system & glassmorphism theme
│   ├── index.html
│   └── package.json
├── .gitignore
└── README.md
```

---

## 📄 Documentation
For detailed concept documentation and system architecture details, see [`LocalLead_Project_Concept_README.md`](LocalLead_Project_Concept_README.md).
