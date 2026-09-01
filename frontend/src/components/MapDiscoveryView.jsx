import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Layers, Globe, Phone, AlertTriangle, CheckCircle2, ShieldAlert, Sparkles, Navigation } from 'lucide-react';
import L from 'leaflet';

// Fix default Leaflet icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const CATEGORIES = ["Restaurant", "Cafe", "Garage", "Salon", "Clinic", "Retail Store"];

export default function MapDiscoveryView({ leads, mapCenter, onScan, loading, searchLocation, setSearchLocation, radius, setRadius }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersGroupRef = useRef(null);
  const circleRef = useRef(null);

  const [selectedCategories, setSelectedCategories] = useState(CATEGORIES);
  const [selectedLead, setSelectedLead] = useState(null);

  // Initialize Map with standard OpenStreetMap tiles
  useEffect(() => {
    if (!mapRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapRef.current).setView([23.2245, 72.6515], 14);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(map);

      markersGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }
  }, []);

  // Pan and re-center map whenever mapCenter or radius changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapCenter) return;

    map.setView([mapCenter.latitude, mapCenter.longitude], 14);

    if (circleRef.current) {
      map.removeLayer(circleRef.current);
    }

    circleRef.current = L.circle([mapCenter.latitude, mapCenter.longitude], {
      color: '#6366f1',
      fillColor: '#6366f1',
      fillOpacity: 0.12,
      radius: radius * 1000
    }).addTo(map);
  }, [mapCenter, radius]);

  // Update Markers when leads change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    markersGroupRef.current.clearLayers();

    if (leads && leads.length > 0) {
      leads.forEach((l) => {
        const b = l.business;
        const w = b.analysis;
        
        let markerColor = '#10b981'; // Green (good site)
        if (!w || !w.has_website) {
          markerColor = '#f43f5e'; // Red (No website - High opportunity)
        } else if (w.opportunity_score >= 50) {
          markerColor = '#f59e0b'; // Amber (Poor site)
        }

        const customHtml = `
          <div style="
            background: ${markerColor};
            width: 28px;
            height: 28px;
            border-radius: 50%;
            border: 3px solid #ffffff;
            box-shadow: 0 0 10px ${markerColor};
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fff;
            font-weight: bold;
            font-size: 11px;
          ">
            ${l.score}
          </div>
        `;

        const customIcon = L.divIcon({
          html: customHtml,
          className: 'custom-map-pin',
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });

        const popupContent = `
          <div style="min-width: 180px;">
            <strong style="font-size: 1rem; color: #f8fafc;">${b.name}</strong>
            <div style="font-size: 0.8rem; color: #94a3b8; margin-top: 2px;">${b.category} • ${b.distance_meters}m</div>
            <div style="margin-top: 8px; font-weight: 600; font-size: 0.85rem; color: ${markerColor};">
              ${!w || !w.has_website ? '❌ No Website (High Opportunity)' : `⚠️ Opportunity Score: ${w.opportunity_score}/100`}
            </div>
            <div style="margin-top: 6px; font-size: 0.8rem; color: #cbd5e1;">${b.phone || 'No phone listed'}</div>
          </div>
        `;

        const marker = L.marker([b.latitude, b.longitude], { icon: customIcon })
          .bindPopup(popupContent);

        marker.on('click', () => setSelectedLead(l));
        markersGroupRef.current.addLayer(marker);
      });
    }
  }, [leads]);

  const toggleCategory = (cat) => {
    if (selectedCategories.includes(cat)) {
      setSelectedCategories(selectedCategories.filter(c => c !== cat));
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  const handleScanSubmit = (e) => {
    e.preventDefault();
    onScan(searchLocation, radius, selectedCategories);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr 340px', gap: '16px', height: 'calc(100vh - 110px)', padding: '0 20px 20px 20px' }}>
      
      {/* Left Search Controls Panel */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}>
            <MapPin size={18} color="var(--primary)" />
            Area & Radius Selection
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Define geographic region to scan for local business leads.</p>
        </div>

        <form onSubmit={handleScanSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              LOCATION / LANDMARK
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                placeholder="e.g. Racecourse, Rajkot or LDRP Gandhinagar"
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 36px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  background: 'rgba(0,0,0,0.3)',
                  color: '#fff',
                  fontSize: '0.9rem'
                }}
              />
              <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              SEARCH RADIUS: <strong style={{ color: 'var(--primary)' }}>{radius} km ({radius * 1000} m)</strong>
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[0.5, 1.0, 2.0, 5.0].map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => setRadius(r)}
                  style={{
                    flex: 1,
                    padding: '6px',
                    borderRadius: '6px',
                    border: '1px solid',
                    borderColor: radius === r ? 'var(--primary)' : 'var(--border-subtle)',
                    background: radius === r ? 'rgba(99,102,241,0.2)' : 'transparent',
                    color: radius === r ? '#fff' : 'var(--text-muted)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {r < 1 ? `${r * 1000}m` : `${r}km`}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
              BUSINESS CATEGORIES
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {CATEGORIES.map((cat) => (
                <label
                  key={cat}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.8rem',
                    color: selectedCategories.includes(cat) ? '#fff' : 'var(--text-dim)',
                    cursor: 'pointer'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(cat)}
                    onChange={() => toggleCategory(cat)}
                    style={{ accentColor: 'var(--primary)' }}
                  />
                  {cat}
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
          >
            {loading ? (
              <span>Scanning OpenStreetMap...</span>
            ) : (
              <>
                <Sparkles size={18} />
                Scan Area & Audit Leads
              </>
            )}
          </button>
        </form>

        {/* Legend */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)' }}>MAP MARKERS LEGEND</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#f43f5e' }}></span>
            <span>No Website (High Opportunity)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#f59e0b' }}></span>
            <span>Poor/Weak Website</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10b981' }}></span>
            <span>Good Web Presence</span>
          </div>
        </div>
      </div>

      {/* Center Interactive Map Container */}
      <div className="glass-panel" style={{ overflow: 'hidden', position: 'relative' }}>
        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      </div>

      {/* Right Business Results Drawer */}
      <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Discovered Leads ({leads.length})</h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sorted by Score</span>
        </div>

        {leads.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text-muted)' }}>
            <Navigation size={32} color="var(--primary)" style={{ opacity: 0.5, marginBottom: '8px' }} />
            <p style={{ fontSize: '0.85rem' }}>No leads loaded yet. Click <strong>"Scan Area"</strong> to discover local businesses.</p>
          </div>
        ) : (
          leads.map((l) => {
            const b = l.business;
            const w = b.analysis;
            const isSelected = selectedLead?.id === l.id;

            return (
              <div
                key={l.id}
                className="glass-card"
                onClick={() => setSelectedLead(l)}
                style={{
                  padding: '12px',
                  cursor: 'pointer',
                  borderColor: isSelected ? 'var(--primary)' : 'rgba(255,255,255,0.06)',
                  background: isSelected ? 'rgba(99,102,241,0.15)' : 'rgba(22, 31, 52, 0.6)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#fff' }}>{b.name}</h4>
                  <span className={`badge badge-${l.priority.toLowerCase()}`}>{l.score} PTS</span>
                </div>

                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {b.category} • {b.distance_meters} m away
                </div>

                <div style={{ marginTop: '8px', fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Globe size={13} color={!w || !w.has_website ? '#f43f5e' : '#10b981'} />
                    <span style={{ color: !w || !w.has_website ? '#fb7185' : '#a7f3d0' }}>
                      {!w || !w.has_website ? 'No Website' : b.website}
                    </span>
                  </div>

                  {b.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                      <Phone size={13} />
                      <span>{b.phone}</span>
                    </div>
                  )}
                </div>

                {/* Opportunity note */}
                {w && (
                  <div style={{
                    marginTop: '8px',
                    padding: '6px 8px',
                    borderRadius: '6px',
                    background: 'rgba(0,0,0,0.3)',
                    fontSize: '0.72rem',
                    color: 'var(--text-muted)'
                  }}>
                    {w.audit_notes}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
