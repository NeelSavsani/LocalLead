import React from 'react';
import { Building2, GlobeX, Sparkles, TrendingUp, DollarSign, PieChart, BarChart } from 'lucide-react';

export default function StatsDashboardView({ stats }) {
  const d = stats?.discovery || {};
  const s = stats?.sales || {};
  const p = stats?.projects || {};

  return (
    <div style={{ padding: '0 20px 20px 20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>Analytics & Revenue Dashboard</h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Real-time business discovery, website opportunity deficit, and sales conversion metrics.</p>
      </div>

      {/* Metric Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        
        <div className="glass-panel" style={{ padding: '18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4' }}>
            <Building2 size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Businesses Discovered</span>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>{d.total_businesses || 0}</h3>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e' }}>
            <GlobeX size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>No Website Deficit</span>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fb7185' }}>{d.no_website || 0}</h3>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
            <Sparkles size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>High Priority Leads</span>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fbbf24' }}>{d.high_priority || 0}</h3>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Project Pipeline Value</span>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#4ade80' }}>₹{(p.revenue || 0).toLocaleString()}</h3>
          </div>
        </div>

      </div>

      {/* Detailed Funnel Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        
        {/* Digital Presence Analysis Breakdown */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PieChart size={18} color="var(--primary)" />
            Digital Presence Audit Breakdown
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                <span>No Website (Prime Leads)</span>
                <strong style={{ color: '#fb7185' }}>{d.no_website || 0}</strong>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${d.total_businesses ? ((d.no_website / d.total_businesses) * 100) : 0}%`, height: '100%', background: '#f43f5e' }}></div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                <span>Weak / Outdated Website</span>
                <strong style={{ color: '#fbbf24' }}>{d.poor_website || 0}</strong>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${d.total_businesses ? ((d.poor_website / d.total_businesses) * 100) : 0}%`, height: '100%', background: '#f59e0b' }}></div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                <span>Acceptable Digital Presence</span>
                <strong style={{ color: '#34d399' }}>{(d.total_businesses || 0) - (d.no_website || 0) - (d.poor_website || 0)}</strong>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${d.total_businesses ? ((((d.total_businesses || 0) - (d.no_website || 0) - (d.poor_website || 0)) / d.total_businesses) * 100) : 0}%`, height: '100%', background: '#10b981' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Sales Pipeline Funnel */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={18} color="#06b6d4" />
            Sales Conversion Funnel
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(6,182,212,0.1)', borderRadius: '8px', border: '1px solid rgba(6,182,212,0.2)' }}>
              <span>Total Qualified Leads</span>
              <strong style={{ color: '#22d3ee' }}>{d.total_leads || 0}</strong>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(168,85,247,0.1)', borderRadius: '8px', border: '1px solid rgba(168,85,247,0.2)' }}>
              <span>Contacted by Sales Rep</span>
              <strong style={{ color: '#c084fc' }}>{s.contacted || 0}</strong>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(245,158,11,0.1)', borderRadius: '8px', border: '1px solid rgba(245,158,11,0.2)' }}>
              <span>Interested & Requirements Shared</span>
              <strong style={{ color: '#fbbf24' }}>{s.interested || 0}</strong>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(16,185,129,0.15)', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.3)' }}>
              <span>Deals Closed (Won Projects)</span>
              <strong style={{ color: '#4ade80' }}>{s.won || 0}</strong>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
