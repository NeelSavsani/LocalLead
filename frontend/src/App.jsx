import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import MapDiscoveryView from './components/MapDiscoveryView';
import LeadsTableView from './components/LeadsTableView';
import CrmKanbanView from './components/CrmKanbanView';
import ProjectsView from './components/ProjectsView';
import StatsDashboardView from './components/StatsDashboardView';

const API_BASE = 'http://127.0.0.1:8000/api/v1';

export default function App() {
  const [activeTab, setActiveTab] = useState('map');
  
  // Data state
  const [leads, setLeads] = useState([]);
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scanError, setScanError] = useState(null);

  // Search location & map center state persisted in localStorage
  const [searchLocation, setSearchLocation] = useState(() => {
    return localStorage.getItem('locallead_search_location') || 'Racecourse, Rajkot';
  });

  const [mapCenter, setMapCenter] = useState(() => {
    const saved = localStorage.getItem('locallead_map_center');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return { latitude: 22.2999, longitude: 70.7912 }; // Default Racecourse Rajkot
  });

  const [radius, setRadius] = useState(1.0);

  // Save searchLocation and mapCenter to localStorage
  useEffect(() => {
    if (searchLocation) {
      localStorage.setItem('locallead_search_location', searchLocation);
    }
  }, [searchLocation]);

  useEffect(() => {
    if (mapCenter) {
      localStorage.setItem('locallead_map_center', JSON.stringify(mapCenter));
    }
  }, [mapCenter]);

  // Fetch initial leads, stats, and projects
  const fetchAllData = async () => {
    try {
      const [leadsRes, statsRes, projectsRes] = await Promise.all([
        fetch(`${API_BASE}/leads`),
        fetch(`${API_BASE}/stats`),
        fetch(`${API_BASE}/projects`)
      ]);

      if (leadsRes.ok) setLeads(await leadsRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
      if (projectsRes.ok) setProjects(await projectsRes.json());
    } catch (err) {
      console.error("API error:", err);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const triggerScan = async (loc, radKm, categories, gmapsUrl, limitVal) => {
    setLoading(true);
    setScanError(null);

    try {
      const resp = await fetch(`${API_BASE}/discover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: loc || searchLocation,
          gmaps_url: gmapsUrl || undefined,
          radius_km: radKm || radius,
          limit: limitVal || undefined,
          categories: categories && categories.length > 0 ? categories : undefined
        })
      });

      if (resp.ok) {
        const data = await resp.json();

        // Check if location resolution failed (NO HARDCODED GH5 FALLBACK)
        if (data.location_resolved === false) {
          setScanError(data.error_message || "Could not find coordinates for this location. Please paste a Google Maps URL below.");
          return;
        }

        setLeads(data.leads);
        if (data.center) {
          setMapCenter(data.center);
        }
        // Refresh dashboard statistics
        const statsRes = await fetch(`${API_BASE}/stats`);
        if (statsRes.ok) setStats(await statsRes.json());
      } else {
        setScanError("Failed to perform scan. Please check your backend connection or enter a valid Google Maps URL.");
      }
    } catch (err) {
      console.error("Scan error:", err);
      setScanError("Network connection error. Ensure the FastAPI backend server is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLead = async (leadId, payload) => {
    try {
      const resp = await fetch(`${API_BASE}/leads/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (resp.ok) {
        await fetchAllData();
      }
    } catch (err) {
      console.error("Update lead error:", err);
    }
  };

  const handleConvertToProject = async (lead) => {
    try {
      const resp = await fetch(`${API_BASE}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: lead.id,
          project_name: `${lead.business.name} Website`,
          client_name: lead.owner_name || lead.business.name,
          budget: lead.estimated_budget ? parseFloat(lead.estimated_budget.replace(/[^0-9.]/g, '')) || 25000 : 25000,
          deadline_days: 15
        })
      });

      if (resp.ok) {
        await fetchAllData();
        setActiveTab('projects');
      }
    } catch (err) {
      console.error("Convert project error:", err);
    }
  };

  const handleUpdateProject = async (projectId, payload) => {
    try {
      const resp = await fetch(`${API_BASE}/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (resp.ok) {
        await fetchAllData();
      }
    } catch (err) {
      console.error("Update project error:", err);
    }
  };

  // Location-specific Excel export
  const handleExport = () => {
    if (searchLocation && searchLocation.trim()) {
      window.open(`${API_BASE}/export?location=${encodeURIComponent(searchLocation.trim())}`, '_blank');
    } else {
      window.open(`${API_BASE}/export`, '_blank');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        stats={stats}
        onExport={handleExport}
        searchLocation={searchLocation}
      />

      <main style={{ flex: 1 }}>
        {activeTab === 'map' && (
          <MapDiscoveryView
            leads={leads}
            mapCenter={mapCenter}
            onScan={triggerScan}
            loading={loading}
            searchLocation={searchLocation}
            setSearchLocation={setSearchLocation}
            radius={radius}
            setRadius={setRadius}
            scanError={scanError}
            setScanError={setScanError}
          />
        )}

        {activeTab === 'table' && (
          <LeadsTableView
            leads={leads}
            onUpdateLead={handleUpdateLead}
            onRefresh={fetchAllData}
            onExport={handleExport}
          />
        )}

        {activeTab === 'crm' && (
          <CrmKanbanView
            leads={leads}
            onUpdateLead={handleUpdateLead}
            onConvertToProject={handleConvertToProject}
          />
        )}

        {activeTab === 'projects' && (
          <ProjectsView
            projects={projects}
            onUpdateProject={handleUpdateProject}
          />
        )}

        {activeTab === 'analytics' && (
          <StatsDashboardView
            stats={stats}
          />
        )}
      </main>
    </div>
  );
}
