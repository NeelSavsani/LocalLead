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
  const [mapCenter, setMapCenter] = useState({ latitude: 23.2245, longitude: 72.6515 });

  // Search parameters
  const [searchLocation, setSearchLocation] = useState('Racecourse, Rajkot');
  const [radius, setRadius] = useState(1.0);

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

  const triggerScan = async (loc, radKm, categories) => {
    setLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/discover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: loc || searchLocation,
          radius_km: radKm || radius,
          categories: categories && categories.length > 0 ? categories : undefined
        })
      });

      if (resp.ok) {
        const data = await resp.json();
        setLeads(data.leads);
        if (data.center) {
          setMapCenter(data.center);
        }
        // Refresh dashboard statistics
        const statsRes = await fetch(`${API_BASE}/stats`);
        if (statsRes.ok) setStats(await statsRes.json());
      }
    } catch (err) {
      console.error("Scan error:", err);
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

  const handleExport = () => {
    window.open(`${API_BASE}/export`, '_blank');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        stats={stats}
        onExport={handleExport}
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
          />
        )}

        {activeTab === 'table' && (
          <LeadsTableView
            leads={leads}
            onUpdateLead={handleUpdateLead}
            onRefresh={fetchAllData}
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
