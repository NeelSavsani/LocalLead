import React, { useState } from 'react';
import { Search, Filter, Phone, Edit, Globe, ShieldCheck, AlertTriangle, X, ExternalLink } from 'lucide-react';

export default function LeadsTableView({ leads, onUpdateLead, onRefresh, onExport }) {
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModalLead, setActiveModalLead] = useState(null);

  // Form states for modal
  const [modalStatus, setModalStatus] = useState('');
  const [modalPhone, setModalPhone] = useState('');
  const [modalOwner, setModalOwner] = useState('');
  const [modalNotes, setModalNotes] = useState('');
  const [modalBudget, setModalBudget] = useState('');
  const [modalFollowUp, setModalFollowUp] = useState('');

  const filteredLeads = leads.filter((l) => {
    const b = l.business;
    const matchesPriority = priorityFilter === 'ALL' || l.priority === priorityFilter;
    const matchesStatus = statusFilter === 'ALL' || l.status === statusFilter;
    const matchesSearch = !searchQuery || 
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.lead_code.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesPriority && matchesStatus && matchesSearch;
  });

  const openEditModal = (lead) => {
    setActiveModalLead(lead);
    setModalStatus(lead.status || 'NEW');
    setModalPhone(lead.business.phone || '');
    setModalOwner(lead.owner_name || '');
    setModalNotes(lead.call_notes || '');
    setModalBudget(lead.estimated_budget || '');
    setModalFollowUp(lead.next_follow_up || '');
  };

  const handleModalSave = (e) => {
    e.preventDefault();
    if (!activeModalLead) return;

    onUpdateLead(activeModalLead.id, {
      status: modalStatus,
      phone: modalPhone,
      owner_name: modalOwner,
      call_notes: modalNotes,
      estimated_budget: modalBudget,
      next_follow_up: modalFollowUp
    });

    setActiveModalLead(null);
  };

  return (
    <div style={{ padding: '0 20px 20px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Top Filter Bar */}
      <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        
        {/* Search */}
        <div style={{ position: 'relative', width: '280px' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search lead, business name..."
            style={{
              width: '100%',
              padding: '8px 12px 8px 34px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              background: 'rgba(0,0,0,0.3)',
              color: '#fff',
              fontSize: '0.85rem'
            }}
          />
          <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '10px' }} />
        </div>

        {/* Priority & Status Dropdown Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <Filter size={15} />
            Priority:
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: '6px', background: '#1e293b', color: '#fff', border: '1px solid var(--border-subtle)', fontSize: '0.82rem' }}
            >
              <option value="ALL">All Priorities</option>
              <option value="HIGH">High Priority</option>
              <option value="MEDIUM">Medium Priority</option>
              <option value="LOW">Low Priority</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Status:
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: '6px', background: '#1e293b', color: '#fff', border: '1px solid var(--border-subtle)', fontSize: '0.82rem' }}
            >
              <option value="ALL">All Statuses</option>
              <option value="NEW">New</option>
              <option value="CONTACTED">Contacted</option>
              <option value="INTERESTED">Interested</option>
              <option value="QUOTATION">Quotation Sent</option>
              <option value="WON">Won (Converted)</option>
              <option value="LOST">Lost</option>
            </select>
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="glass-panel" style={{ padding: '0', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
          <thead>
            <tr style={{ background: 'rgba(0,0,0,0.4)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase' }}>
              <th style={{ padding: '14px 16px' }}>Lead ID</th>
              <th style={{ padding: '14px 16px' }}>Business Name</th>
              <th style={{ padding: '14px 16px' }}>Category</th>
              <th style={{ padding: '14px 16px' }}>Phone / Sources</th>
              <th style={{ padding: '14px 16px' }}>Website Status</th>
              <th style={{ padding: '14px 16px' }}>Data Confidence</th>
              <th style={{ padding: '14px 16px' }}>Opp. Score</th>
              <th style={{ padding: '14px 16px' }}>Priority</th>
              <th style={{ padding: '14px 16px' }}>Status</th>
              <th style={{ padding: '14px 16px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeads.length === 0 ? (
              <tr>
                <td colSpan="10" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No leads found matching your criteria.
                </td>
              </tr>
            ) : (
              filteredLeads.map((l) => {
                const b = l.business;
                const w = b.analysis;
                const bGmapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.name + ' ' + (b.address !== 'Address Listed on Map' ? b.address : b.search_location))}&center=${b.latitude},${b.longitude}`;

                return (
                  <tr key={l.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.2s' }}>
                    <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontWeight: 600, color: 'var(--primary)' }}>
                      {l.lead_code}
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: '#fff' }}>
                      {b.name}
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{b.address}</span>
                        <a
                          href={bGmapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#818cf8', display: 'inline-flex', alignItems: 'center', gap: '2px', textDecoration: 'none', fontWeight: 600 }}
                          title="View business details on Google Maps"
                        >
                          🗺️ Maps <ExternalLink size={11} />
                        </a>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>{b.category}</td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>
                      {b.phone ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Phone size={13} color="#22d3ee" />
                          {b.phone}
                        </div>
                      ) : (
                        <span style={{ color: '#fb7185', fontSize: '0.8rem' }}>No Phone Listed</span>
                      )}
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>
                        Sources: {b.source_providers || 'openstreetmap'}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {!w || !w.has_website ? (
                        <span style={{ color: '#fb7185', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <AlertTriangle size={13} /> NO_WEBSITE
                        </span>
                      ) : (
                        <div style={{ fontSize: '0.8rem' }}>
                          <span style={{ color: w.opportunity_score >= 50 ? '#fbbf24' : '#34d399', fontWeight: 600 }}>
                            {w.digital_presence_status || 'WEBSITE_FOUND'}
                          </span>
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ color: '#38bdf8', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <ShieldCheck size={14} /> {l.data_confidence || 80}%
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 700, fontSize: '0.95rem' }}>{l.score}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span className={`badge badge-${l.priority.toLowerCase()}`}>{l.priority}</span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span className={`badge badge-${l.status.toLowerCase()}`}>{l.status}</span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <button
                        className="btn-secondary"
                        onClick={() => openEditModal(l)}
                        style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                      >
                        <Edit size={13} /> Manage
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Edit / Manage Lead Modal */}
      {activeModalLead && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999
        }}>
          <div className="glass-panel" style={{ width: '500px', padding: '24px', position: 'relative' }}>
            <button
              onClick={() => setActiveModalLead(null)}
              style={{ position: 'absolute', right: '16px', top: '16px', background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '4px', color: '#fff' }}>
              Manage Lead: {activeModalLead.business.name}
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Lead ID: {activeModalLead.lead_code} | Confidence: {activeModalLead.data_confidence}% | Opp. Score: {activeModalLead.score} ({activeModalLead.priority})
            </p>

            <div style={{ marginBottom: '16px' }}>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeModalLead.business.name + ' ' + activeModalLead.business.address)}&center=${activeModalLead.business.latitude},${activeModalLead.business.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  background: 'linear-gradient(135deg, #4f46e5 0%, #0284c7 100%)',
                  color: '#ffffff',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  textDecoration: 'none'
                }}
              >
                🗺️ Open Details on Google Maps <ExternalLink size={13} />
              </a>
            </div>

            <form onSubmit={handleModalSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>PHONE NUMBER</label>
                <input
                  type="text"
                  value={modalPhone}
                  onChange={(e) => setModalPhone(e.target.value)}
                  placeholder="e.g. 070960 83187"
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid var(--border-subtle)' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>SALES STATUS</label>
                <select
                  value={modalStatus}
                  onChange={(e) => setModalStatus(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', background: '#1e293b', color: '#fff', border: '1px solid var(--border-subtle)' }}
                >
                  <option value="NEW">NEW</option>
                  <option value="CONTACTED">CONTACTED</option>
                  <option value="INTERESTED">INTERESTED</option>
                  <option value="QUOTATION">QUOTATION SENT</option>
                  <option value="WON">WON (Convert to Client)</option>
                  <option value="LOST">LOST</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>OWNER / CONTACT PERSON NAME</label>
                <input
                  type="text"
                  value={modalOwner}
                  onChange={(e) => setModalOwner(e.target.value)}
                  placeholder="e.g. Dr. Payal / Owner"
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid var(--border-subtle)' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>ESTIMATED WEBSITE BUDGET</label>
                <input
                  type="text"
                  value={modalBudget}
                  onChange={(e) => setModalBudget(e.target.value)}
                  placeholder="e.g. ₹25,000"
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid var(--border-subtle)' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>CALL NOTES & REQUIREMENTS</label>
                <textarea
                  rows="3"
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  placeholder="e.g. Owner interested in a modern responsive website with online booking and WhatsApp CTA..."
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid var(--border-subtle)', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn-secondary" onClick={() => setActiveModalLead(null)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Lead Updates</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
