import React, { useState } from 'react';
import { Phone, ArrowRight, CheckCircle2, UserCheck, DollarSign, FolderPlus, MessageSquare, ExternalLink } from 'lucide-react';

const COLUMNS = [
  { id: 'NEW', title: 'New Leads', color: '#06b6d4' },
  { id: 'CONTACTED', title: 'Contacted', color: '#c084fc' },
  { id: 'INTERESTED', title: 'Interested', color: '#fbbf24' },
  { id: 'QUOTATION', title: 'Quotation Sent', color: '#f97316' },
  { id: 'WON', title: 'Won Deals', color: '#4ade80' }
];

export default function CrmKanbanView({ leads, onUpdateLead, onConvertToProject }) {
  const [draggedLeadId, setDraggedLeadId] = useState(null);

  const handleDragStart = (leadId) => {
    setDraggedLeadId(leadId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (columnId) => {
    if (draggedLeadId) {
      onUpdateLead(draggedLeadId, { status: columnId });
      setDraggedLeadId(null);
    }
  };

  return (
    <div style={{ padding: '0 20px 20px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>Sales CRM Kanban Pipeline</h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Drag leads between columns to update their sales status. Click 'Create Web Project' on Won deals.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', minHeight: 'calc(100vh - 200px)' }}>
        {COLUMNS.map((col) => {
          const columnLeads = leads.filter((l) => l.status === col.id);

          return (
            <div
              key={col.id}
              className="glass-panel"
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(col.id)}
              style={{
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                background: 'rgba(15, 23, 42, 0.65)',
                borderTop: `3px solid ${col.color}`
              }}
            >
              {/* Column Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: col.color }}></span>
                  {col.title}
                </h3>
                <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '10px', background: 'rgba(255,255,255,0.08)', fontWeight: 600 }}>
                  {columnLeads.length}
                </span>
              </div>

              {/* Lead Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto' }}>
                {columnLeads.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px 10px', fontSize: '0.75rem', color: 'var(--text-dim)', border: '1px dashed var(--border-subtle)', borderRadius: '8px' }}>
                    Drag leads here
                  </div>
                ) : (
                  columnLeads.map((l) => {
                    const b = l.business;
                    const bGmapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.name + ' ' + (b.address !== 'Address Listed on Map' ? b.address : b.search_location))}&center=${b.latitude},${b.longitude}`;

                    return (
                      <div
                        key={l.id}
                        draggable
                        onDragStart={() => handleDragStart(l.id)}
                        className="glass-card"
                        style={{
                          padding: '12px',
                          cursor: 'grab',
                          background: 'rgba(26, 37, 61, 0.9)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <span style={{ fontSize: '0.7rem', fontFamily: 'monospace', color: 'var(--primary)', fontWeight: 700 }}>
                            {l.lead_code}
                          </span>
                          <span className={`badge badge-${l.priority.toLowerCase()}`} style={{ fontSize: '0.65rem' }}>
                            {l.score} PTS
                          </span>
                        </div>

                        <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff', marginTop: '4px' }}>{b.name}</h4>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.category}</div>

                        {/* View on Google Maps link */}
                        <div style={{ marginTop: '4px' }}>
                          <a
                            href={bGmapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: '0.7rem', color: '#818cf8', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                          >
                            🗺️ Google Maps <ExternalLink size={10} />
                          </a>
                        </div>

                        {l.owner_name && (
                          <div style={{ fontSize: '0.72rem', color: '#38bdf8', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <UserCheck size={12} /> {l.owner_name}
                          </div>
                        )}

                        {l.estimated_budget && (
                          <div style={{ fontSize: '0.72rem', color: '#4ade80', marginTop: '2px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <DollarSign size={12} /> Budget: {l.estimated_budget}
                          </div>
                        )}

                        {l.call_notes && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '6px', background: 'rgba(0,0,0,0.3)', padding: '4px 6px', borderRadius: '4px' }}>
                            "{l.call_notes}"
                          </div>
                        )}

                        {/* Convert to Project action if WON */}
                        {col.id === 'WON' && (
                          <button
                            className="btn-success"
                            onClick={() => onConvertToProject(l)}
                            style={{ width: '100%', marginTop: '8px', padding: '6px', fontSize: '0.75rem', justifyContent: 'center' }}
                          >
                            <FolderPlus size={14} /> Create Web Project
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
