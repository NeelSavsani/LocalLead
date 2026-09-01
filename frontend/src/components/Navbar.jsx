import React from 'react';
import { MapPin, Table, Kanban, FolderKanban, BarChart3, Sparkles, Download } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, stats, onExport, searchLocation }) {
  const tabs = [
    { id: 'map', label: 'Geo-Map Discovery', icon: MapPin },
    { id: 'table', label: 'Lead Qualification Table', icon: Table },
    { id: 'crm', label: 'Sales CRM Kanban', icon: Kanban },
    { id: 'projects', label: 'Client Projects', icon: FolderKanban },
    { id: 'analytics', label: 'Analytics Dashboard', icon: BarChart3 },
  ];

  return (
    <header className="glass-panel app-navbar" style={{ margin: '16px 20px', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
      {/* Brand */}
      <div className="app-navbar-brand" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 20px rgba(99, 102, 241, 0.5)'
        }}>
          <Sparkles size={22} color="#fff" />
        </div>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, background: 'linear-gradient(135deg, #fff 30%, #94a3b8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            LocalLead
          </h1>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Geo-Targeted Business Intelligence & Sales Pipeline</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="app-navbar-tabs" style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: isActive ? 'var(--primary)' : 'transparent',
                color: isActive ? '#fff' : 'var(--text-muted)',
                fontFamily: 'var(--font-heading)',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.88rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isActive ? '0 4px 12px var(--primary-glow)' : 'none'
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* Action / Stats Quick Summary */}
      <div className="app-navbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem' }}>
          <div style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <span style={{ color: 'var(--text-muted)' }}>Total Leads: </span>
            <strong style={{ color: '#22d3ee' }}>{stats?.discovery?.total_leads || 0}</strong>
          </div>
          <div style={{ padding: '4px 10px', background: 'rgba(244, 63, 94, 0.1)', borderRadius: '6px', border: '1px solid rgba(244, 63, 94, 0.2)' }}>
            <span style={{ color: '#fb7185' }}>High Priority: </span>
            <strong style={{ color: '#fb7185' }}>{stats?.discovery?.high_priority || 0}</strong>
          </div>
        </div>

        <button 
          className="btn-success" 
          onClick={onExport} 
          title={searchLocation ? `Export leads for "${searchLocation}" to Excel (.xlsx)` : "Export Leads Database to Excel (.xlsx)"}
        >
          <Download size={16} />
          Export Excel ({searchLocation ? searchLocation.split(',')[0] : 'Search'})
        </button>
      </div>
    </header>
  );
}
