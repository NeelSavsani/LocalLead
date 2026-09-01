import React, { useState } from 'react';
import { FolderKanban, User, Calendar, DollarSign, CheckCircle, Clock, Code2 } from 'lucide-react';

const STAGES = ["PLANNING", "REQUIREMENTS", "DESIGN", "DEVELOPMENT", "TESTING", "CLIENT_REVIEW", "COMPLETED"];

export default function ProjectsView({ projects, onUpdateProject }) {
  const [selectedDeveloper, setSelectedDeveloper] = useState('');

  return (
    <div style={{ padding: '0 20px 20px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>Client & Developer Project Management</h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Track active web development deliverables, developer assignments, and delivery schedules.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
        {projects.length === 0 ? (
          <div className="glass-panel" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>
            <FolderKanban size={36} color="var(--primary)" style={{ opacity: 0.5, marginBottom: '8px' }} />
            <p>No active projects yet. Close a deal in the <strong>CRM Kanban (Move to WON)</strong> to launch a new client project.</p>
          </div>
        ) : (
          projects.map((p) => {
            const currentStageIndex = STAGES.indexOf(p.status);
            const progressPercent = Math.round(((currentStageIndex + 1) / STAGES.length) * 100);

            return (
              <div key={p.id} className="glass-panel" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>{p.project_name}</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>Client: {p.client_name}</p>
                  </div>
                  <span className="badge badge-won">{p.status}</span>
                </div>

                {/* Progress bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    <span>Stage: {p.status}</span>
                    <span>{progressPercent}% Complete</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${progressPercent}%`, height: '100%', background: 'linear-gradient(90deg, #6366f1, #10b981)', borderRadius: '3px' }}></div>
                  </div>
                </div>

                {/* Project Details */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.8rem', background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#38bdf8' }}>
                    <DollarSign size={14} /> Budget: ₹{p.budget?.toLocaleString()}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fb134' }}>
                    <Clock size={14} /> Deadline: {p.deadline_days} Days
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', gridColumn: '1 / -1' }}>
                    <Code2 size={14} /> Assigned Developer: <strong style={{ color: '#fff' }}>{p.developer_name}</strong>
                  </div>
                </div>

                {/* Controls */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <select
                    value={p.status}
                    onChange={(e) => onUpdateProject(p.id, { status: e.target.value })}
                    style={{ flex: 1, padding: '6px 8px', borderRadius: '6px', background: '#1e293b', color: '#fff', border: '1px solid var(--border-subtle)', fontSize: '0.78rem' }}
                  >
                    {STAGES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>

                  <input
                    type="text"
                    placeholder="Assign Dev"
                    defaultValue={p.developer_name}
                    onBlur={(e) => onUpdateProject(p.id, { developer_name: e.target.value })}
                    style={{ flex: 1, padding: '6px 8px', borderRadius: '6px', background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid var(--border-subtle)', fontSize: '0.78rem' }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
