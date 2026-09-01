import React from 'react';
import { Building2, GlobeX, Sparkles, TrendingUp, DollarSign, PieChart, BarChart3, CheckCircle2, ArrowRight, Target, ShieldCheck } from 'lucide-react';

export default function StatsDashboardView({ stats }) {
  const d = stats?.discovery || {};
  const s = stats?.sales || {};
  const p = stats?.projects || {};

  const totalBusinesses = d.total_businesses || 0;
  const noWebsite = d.no_website || 0;
  const poorWebsite = d.poor_website || 0;
  const acceptablePresence = Math.max(0, totalBusinesses - noWebsite - poorWebsite);

  const getPercent = (val) => (totalBusinesses > 0 ? Math.round((val / totalBusinesses) * 100) : 0);

  const overviewMetrics = [
    {
      label: 'Businesses Discovered',
      value: totalBusinesses,
      subtext: 'Mapped & analyzed',
      icon: Building2,
      color: '#38bdf8',
      bgGlow: 'rgba(56, 189, 248, 0.12)',
      borderColor: 'rgba(56, 189, 248, 0.3)'
    },
    {
      label: 'No Website Deficit',
      value: noWebsite,
      subtext: `${getPercent(noWebsite)}% high-value opportunity`,
      icon: GlobeX,
      color: '#f43f5e',
      bgGlow: 'rgba(244, 63, 94, 0.12)',
      borderColor: 'rgba(244, 63, 94, 0.3)'
    },
    {
      label: 'High Priority Leads',
      value: d.high_priority || 0,
      subtext: 'Score ≥ 50 opportunity',
      icon: Sparkles,
      color: '#f59e0b',
      bgGlow: 'rgba(245, 158, 11, 0.12)',
      borderColor: 'rgba(245, 158, 11, 0.3)'
    },
    {
      label: 'Pipeline Value',
      value: `₹${(p.revenue || 0).toLocaleString()}`,
      subtext: `${p.active_projects || 0} active projects`,
      icon: DollarSign,
      color: '#10b981',
      bgGlow: 'rgba(16, 185, 129, 0.12)',
      borderColor: 'rgba(16, 185, 129, 0.3)'
    },
  ];

  const auditRows = [
    {
      label: 'No Website Listed',
      detail: 'Highest conversion potential (Need full website & GMB branding)',
      value: noWebsite,
      percentage: getPercent(noWebsite),
      color: '#f43f5e',
      badge: 'High Priority'
    },
    {
      label: 'Weak / Outdated Web Presence',
      detail: 'Needs website redesign, SEO audit, or mobile optimization',
      value: poorWebsite,
      percentage: getPercent(poorWebsite),
      color: '#f59e0b',
      badge: 'Medium Priority'
    },
    {
      label: 'Established Digital Presence',
      detail: 'Already has functional web presence & active channels',
      value: acceptablePresence,
      percentage: getPercent(acceptablePresence),
      color: '#10b981',
      badge: 'Established'
    },
  ];

  const funnelSteps = [
    { label: 'Total Discovered', value: totalBusinesses, color: '#38bdf8' },
    { label: 'Qualified Leads', value: d.total_leads || 0, color: '#818cf8' },
    { label: 'Sales Contacted', value: s.contacted || 0, color: '#c084fc' },
    { label: 'Interested Prospects', value: s.interested || 0, color: '#fbbf24' },
    { label: 'Deals Won', value: s.won || 0, color: '#34d399' },
  ];

  return (
    <section style={{ maxWidth: '1400px', margin: '0 auto', padding: '10px 24px 36px 24px' }}>
      
      {/* Header Banner */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '28px',
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
        padding: '22px 28px',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 12px 32px -10px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)'
          }}>
            <BarChart3 size={24} color="#ffffff" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
              Analytics & Executive Dashboard
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '2px' }}>
              Real-time audit metrics, digital gap distribution, and agency deal pipeline.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{
            padding: '8px 16px',
            background: 'rgba(99, 102, 241, 0.12)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: '10px',
            textAlign: 'right'
          }}>
            <span style={{ fontSize: '0.72rem', color: '#a5b4fc', fontWeight: 600, display: 'block', textTransform: 'uppercase' }}>Opportunity Rate</span>
            <strong style={{ fontSize: '1.1rem', color: '#38bdf8', fontWeight: 800 }}>
              {getPercent(noWebsite + poorWebsite)}%
            </strong>
          </div>
        </div>
      </div>

      {/* Top 4 KPI Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '28px' }}>
        {overviewMetrics.map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.label}
              className="glass-panel"
              style={{
                padding: '22px',
                borderRadius: '16px',
                border: `1px solid ${m.borderColor}`,
                background: 'linear-gradient(145deg, rgba(22, 31, 52, 0.7) 0%, rgba(15, 23, 42, 0.85) 100%)',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.25s ease'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', display: 'block' }}>
                    {m.label}
                  </span>
                  <strong style={{ fontSize: '1.85rem', fontWeight: 800, color: '#f8fafc', display: 'block', marginTop: '6px', fontFamily: 'var(--font-heading)' }}>
                    {m.value}
                  </strong>
                </div>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: m.bgGlow,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `1px solid ${m.borderColor}`
                }}>
                  <Icon size={22} color={m.color} />
                </div>
              </div>
              <div style={{ marginTop: '14px', fontSize: '0.78rem', color: m.color, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>• {m.subtext}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Breakdown Section (2 Equal Spacious Columns) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
        
        {/* Panel 1: Digital Presence Opportunity Mix */}
        <div className="glass-panel" style={{ padding: '26px', borderRadius: '16px', background: 'rgba(15, 23, 42, 0.75)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <PieChart size={20} color="#38bdf8" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
                Digital Presence Audit Breakdown
              </h3>
            </div>
            <span style={{ fontSize: '0.78rem', padding: '4px 10px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '20px', color: '#94a3b8', fontWeight: 600 }}>
              {totalBusinesses} Scanned POIs
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {auditRows.map((row) => (
              <div key={row.label} style={{
                padding: '16px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div>
                    <strong style={{ fontSize: '0.92rem', color: '#f8fafc' }}>{row.label}</strong>
                    <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginTop: '2px' }}>{row.detail}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <strong style={{ fontSize: '1.1rem', color: row.color }}>{row.value}</strong>
                    <span style={{ fontSize: '0.74rem', color: '#64748b', display: 'block' }}>{row.percentage}% of total</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div style={{
                  height: '8px',
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  marginTop: '10px'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${row.percentage}%`,
                    background: row.color,
                    borderRadius: '10px',
                    transition: 'width 0.4s ease'
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Panel 2: Sales & Lead Pipeline Funnel */}
        <div className="glass-panel" style={{ padding: '26px', borderRadius: '16px', background: 'rgba(15, 23, 42, 0.75)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <TrendingUp size={20} color="#a855f7" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
                Sales Pipeline Conversion
              </h3>
            </div>
            <span style={{ fontSize: '0.78rem', padding: '4px 10px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '20px', color: '#34d399', fontWeight: 600 }}>
              {s.won || 0} Deals Closed
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {funnelSteps.map((step, idx) => (
              <div
                key={step.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 18px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.025)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '8px',
                    background: `${step.color}20`,
                    color: step.color,
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `1px solid ${step.color}40`
                  }}>
                    0{idx + 1}
                  </div>
                  <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#e2e8f0' }}>
                    {step.label}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <strong style={{ fontSize: '1.15rem', fontWeight: 800, color: step.color }}>
                    {step.value}
                  </strong>
                  {idx < funnelSteps.length - 1 && (
                    <ArrowRight size={14} color="#64748b" style={{ opacity: 0.5 }} />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Quick Summary Insight */}
          <div style={{
            marginTop: '20px',
            padding: '14px 16px',
            borderRadius: '10px',
            background: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.8rem',
            color: '#c7d2fe'
          }}>
            <ShieldCheck size={18} color="#818cf8" style={{ flexShrink: 0 }} />
            <span>
              <strong>Pro Tip:</strong> Focus outreach on the <strong>{noWebsite} businesses</strong> without websites for the highest close rate and speed.
            </span>
          </div>
        </div>

      </div>
    </section>
  );
}

