import React from 'react';
import { Building2, GlobeX, Sparkles, TrendingUp, DollarSign, PieChart, BarChart3 } from 'lucide-react';

export default function StatsDashboardView({ stats }) {
  const d = stats?.discovery || {};
  const s = stats?.sales || {};
  const p = stats?.projects || {};
  const totalBusinesses = d.total_businesses || 0;
  const noWebsite = d.no_website || 0;
  const poorWebsite = d.poor_website || 0;
  const acceptablePresence = totalBusinesses - noWebsite - poorWebsite;
  const percentage = (value) => (totalBusinesses ? `${(value / totalBusinesses) * 100}%` : '0%');

  const overviewMetrics = [
    { label: 'Businesses discovered', value: totalBusinesses, icon: Building2, tone: 'cyan' },
    { label: 'No website deficit', value: noWebsite, icon: GlobeX, tone: 'rose' },
    { label: 'High-priority leads', value: d.high_priority || 0, icon: Sparkles, tone: 'amber' },
    { label: 'Project pipeline value', value: `₹${(p.revenue || 0).toLocaleString()}`, icon: DollarSign, tone: 'emerald' },
  ];

  const auditRows = [
    { label: 'No website', detail: 'Prime leads', value: noWebsite, tone: 'rose' },
    { label: 'Weak or outdated website', detail: 'Needs an upgrade', value: poorWebsite, tone: 'amber' },
    { label: 'Acceptable digital presence', detail: 'Already established', value: acceptablePresence, tone: 'emerald' },
  ];

  const funnelRows = [
    { label: 'Qualified leads', value: d.total_leads || 0, tone: 'cyan' },
    { label: 'Contacted by sales', value: s.contacted || 0, tone: 'violet' },
    { label: 'Interested', value: s.interested || 0, tone: 'amber' },
    { label: 'Deals won', value: s.won || 0, tone: 'emerald' },
  ];

  return (
    <section className="dashboard-view">
      <header className="dashboard-heading">
        <div className="dashboard-heading-icon"><BarChart3 size={22} /></div>
        <div>
          <p className="dashboard-eyebrow">Performance overview</p>
          <h2>Analytics &amp; revenue dashboard</h2>
          <p className="dashboard-description">Track discovery opportunities, sales activity, and project value in one place.</p>
        </div>
      </header>

      <div className="dashboard-metrics">
        {overviewMetrics.map(({ label, value, icon: Icon, tone }) => (
          <article className={`dashboard-metric dashboard-tone-${tone}`} key={label}>
            <div className="dashboard-metric-icon"><Icon size={21} /></div>
            <div><p>{label}</p><strong>{value}</strong></div>
          </article>
        ))}
      </div>

      <div className="dashboard-details">
        <article className="glass-panel dashboard-panel">
          <div className="dashboard-panel-heading">
            <div><p className="dashboard-eyebrow">Opportunity mix</p><h3><PieChart size={18} /> Digital presence audit</h3></div>
            <span className="dashboard-total">{totalBusinesses} businesses</span>
          </div>
          <div className="dashboard-audit-list">
            {auditRows.map(({ label, detail, value, tone }) => (
              <div className={`dashboard-audit-row dashboard-tone-${tone}`} key={label}>
                <div className="dashboard-audit-label"><span>{label}</span><small>{detail}</small></div>
                <strong>{value}</strong>
                <div className="dashboard-progress" aria-label={`${label}: ${value}`}><span style={{ width: percentage(value) }} /></div>
              </div>
            ))}
          </div>
        </article>

        <article className="glass-panel dashboard-panel">
          <div className="dashboard-panel-heading">
            <div><p className="dashboard-eyebrow">Sales activity</p><h3><TrendingUp size={18} /> Conversion funnel</h3></div>
            <span className="dashboard-total">{s.won || 0} won</span>
          </div>
          <div className="dashboard-funnel-list">
            {funnelRows.map(({ label, value, tone }, index) => (
              <div className={`dashboard-funnel-row dashboard-tone-${tone}`} key={label}>
                <span className="dashboard-funnel-step">{String(index + 1).padStart(2, '0')}</span><span>{label}</span><strong>{value}</strong>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
