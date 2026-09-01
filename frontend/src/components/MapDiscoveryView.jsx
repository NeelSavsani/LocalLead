import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Layers, Globe, Phone, ShieldCheck, CheckCircle2, Sparkles, Navigation, Link as LinkIcon, AlertTriangle, Eye, ExternalLink, Clipboard } from 'lucide-react';
import L from 'leaflet';

// Fix default Leaflet icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const CATEGORIES = [
  "Garage / Auto Repair",
  "Hospital",
  "Clinic & Medical",
  "Hostel",
  "PG (Paying Guest)",
  "Small Retailer / General Store",
  "Salon / Saloon",
  "Restaurant",
  "Cafe",
  "Hotel & Lodging",
  "Pharmacy / Medical Store",
  "Gym & Fitness Center",
  "Coaching & Education",
  "Bakery & Sweets",
  "Electronics & Mobile Shop",
  "Boutique & Clothing",
  "Jewellery Store",
  "Spa & Wellness",
  "Laundry & Dry Cleaning",
  "Real Estate & Agency"
];

// Map Tile Layers Config
const TILE_LAYERS = {
  normal: {
    label: 'Normal',
    icon: '🗺️',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  },
  satellite: {
    label: 'Satellite',
    icon: '🛰️',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, and GIS User Community',
    maxZoom: 19
  },
  terrain: {
    label: 'Terrain',
    icon: '⛰️',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, USGS, NPS',
    maxZoom: 19
  }
};

export default function MapDiscoveryView({ leads, mapCenter, onScan, loading, searchLocation, setSearchLocation, radius, setRadius, scanError, setScanError }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markersGroupRef = useRef(null);
  const circleRef = useRef(null);
  const centerMarkerRef = useRef(null);

  // Persist selected mapStyle (normal, satellite, terrain) in localStorage
  const [mapStyle, setMapStyle] = useState(() => {
    return localStorage.getItem('locallead_map_style') || 'normal';
  });

  const [selectedCategories, setSelectedCategories] = useState(CATEGORIES);
  const [selectedLead, setSelectedLead] = useState(null);
  const [gmapsUrl, setGmapsUrl] = useState('');
  const [pastedStatus, setPastedStatus] = useState(false);

  // Save mapStyle preference on change
  useEffect(() => {
    localStorage.setItem('locallead_map_style', mapStyle);
  }, [mapStyle]);

  // Initialize Map
  useEffect(() => {
    if (!mapRef.current) return;

    if (!mapInstanceRef.current) {
      const initialStyleKey = localStorage.getItem('locallead_map_style') || 'normal';
      const initialConfig = TILE_LAYERS[initialStyleKey] || TILE_LAYERS.normal;

      const initialLat = mapCenter ? mapCenter.latitude : 22.2999;
      const initialLng = mapCenter ? mapCenter.longitude : 70.7912;

      const map = L.map(mapRef.current).setView([initialLat, initialLng], 14);

      tileLayerRef.current = L.tileLayer(initialConfig.url, {
        attribution: initialConfig.attribution,
        maxZoom: initialConfig.maxZoom
      }).addTo(map);

      markersGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }
  }, []);

  // Change Map Style (Normal, Satellite, Terrain) dynamically
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !tileLayerRef.current) return;

    const layerConfig = TILE_LAYERS[mapStyle] || TILE_LAYERS.normal;
    map.removeLayer(tileLayerRef.current);

    tileLayerRef.current = L.tileLayer(layerConfig.url, {
      attribution: layerConfig.attribution,
      maxZoom: layerConfig.maxZoom
    }).addTo(map);
  }, [mapStyle]);

  // Pan, re-center map, update radius circle & render standalone SEARCH CENTER PIN
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapCenter) return;

    map.setView([mapCenter.latitude, mapCenter.longitude], 14);

    // Update Radius Circle
    if (circleRef.current) {
      map.removeLayer(circleRef.current);
    }
    circleRef.current = L.circle([mapCenter.latitude, mapCenter.longitude], {
      color: mapStyle === 'satellite' ? '#38bdf8' : '#6366f1',
      fillColor: mapStyle === 'satellite' ? '#38bdf8' : '#6366f1',
      fillOpacity: 0.15,
      radius: radius * 1000
    }).addTo(map);

    // Render Standalone Search Center Pin Icon (No background circle)
    if (centerMarkerRef.current) {
      map.removeLayer(centerMarkerRef.current);
    }

    const centerIconHtml = `
      <div style="
        font-size: 34px;
        line-height: 1;
        filter: drop-shadow(0 3px 6px rgba(0,0,0,0.8));
        display: flex;
        align-items: center;
        justify-content: center;
        user-select: none;
      ">
        📍
      </div>
    `;

    const centerDivIcon = L.divIcon({
      html: centerIconHtml,
      className: 'clean-standalone-pin',
      iconSize: [34, 34],
      iconAnchor: [17, 32]
    });

    const gmapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchLocation)}&center=${mapCenter.latitude},${mapCenter.longitude}`;

    const centerPopup = `
      <div style="padding: 4px; min-width: 200px;">
        <strong style="font-size: 0.95rem; color: #818cf8;">📍 Search Target Origin</strong>
        <div style="font-size: 0.82rem; color: #f8fafc; margin-top: 4px; font-weight: 600;">${searchLocation}</div>
        <div style="font-size: 0.75rem; color: #94a3b8; margin-top: 2px;">
          Coordinates: ${mapCenter.latitude.toFixed(4)}°, ${mapCenter.longitude.toFixed(4)}°
        </div>
        <div style="font-size: 0.75rem; color: #38bdf8; margin-top: 4px;">
          Radius: ${radius} km (${radius * 1000}m)
        </div>
        <div style="margin-top: 8px;">
          <a href="${gmapsSearchUrl}" target="_blank" rel="noopener noreferrer" style="
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 5px 10px;
            border-radius: 6px;
            background: rgba(99, 102, 241, 0.25);
            border: 1px solid rgba(99, 102, 241, 0.5);
            color: #a5b4fc;
            font-size: 0.76rem;
            font-weight: 600;
            text-decoration: none;
          ">
            🗺️ View Target on Google Maps ↗
          </a>
        </div>
      </div>
    `;

    centerMarkerRef.current = L.marker([mapCenter.latitude, mapCenter.longitude], { icon: centerDivIcon })
      .bindPopup(centerPopup)
      .addTo(map);

  }, [mapCenter, radius, mapStyle, searchLocation]);

  // Update Markers when leads change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    markersGroupRef.current.clearLayers();

    if (leads && leads.length > 0) {
      leads.forEach((l) => {
        const b = l.business;
        const w = b.analysis;
        
        let markerColor = '#10b981'; // Green
        if (!w || !w.has_website) {
          markerColor = '#f43f5e'; // Red
        } else if (w.opportunity_score >= 50) {
          markerColor = '#f59e0b'; // Amber
        }

        const customHtml = `
          <div style="
            background: ${markerColor};
            width: 28px;
            height: 28px;
            border-radius: 50%;
            border: 3px solid #ffffff;
            box-shadow: 0 0 12px ${markerColor};
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

        const bGmapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.name + ' ' + (b.address !== 'Address Listed on Map' ? b.address : searchLocation))}&center=${b.latitude},${b.longitude}`;

        const popupContent = `
          <div style="min-width: 210px;">
            <strong style="font-size: 1rem; color: #f8fafc;">${b.name}</strong>
            <div style="font-size: 0.8rem; color: #94a3b8; margin-top: 2px;">${b.category} • ${b.distance_meters}m away</div>
            <div style="margin-top: 6px; font-size: 0.78rem; color: #38bdf8;">
              🛡️ Confidence: ${l.data_confidence || 80}% (${b.source_providers || 'OSM'})
            </div>
            <div style="margin-top: 6px; font-weight: 600; font-size: 0.85rem; color: ${markerColor};">
              ${!w || !w.has_website ? '❌ No Website (High Opportunity)' : `⚠️ Opportunity Score: ${w.opportunity_score}/100`}
            </div>
            <div style="margin-top: 6px; font-size: 0.8rem; color: #cbd5e1;">${b.phone || 'No phone listed'}</div>
            <div style="margin-top: 10px;">
              <a href="${bGmapsUrl}" target="_blank" rel="noopener noreferrer" style="
                display: inline-flex;
                align-items: center;
                gap: 5px;
                padding: 6px 12px;
                border-radius: 6px;
                background: linear-gradient(135deg, #4f46e5 0%, #0284c7 100%);
                color: #ffffff;
                font-size: 0.78rem;
                font-weight: 600;
                text-decoration: none;
                box-shadow: 0 2px 8px rgba(79, 70, 229, 0.4);
              ">
                🗺️ View on Google Maps ↗
              </a>
            </div>
          </div>
        `;

        const marker = L.marker([b.latitude, b.longitude], { icon: customIcon })
          .bindPopup(popupContent);

        marker.on('click', () => setSelectedLead(l));
        markersGroupRef.current.addLayer(marker);
      });
    }
  }, [leads, searchLocation]);

  const toggleCategory = (cat) => {
    if (selectedCategories.includes(cat)) {
      setSelectedCategories(selectedCategories.filter(c => c !== cat));
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        setGmapsUrl(text.trim());
        if (scanError) setScanError(null);
        setPastedStatus(true);
        setTimeout(() => setPastedStatus(false), 2000);
      }
    } catch (err) {
      console.error("Clipboard paste error:", err);
    }
  };

  const handleScanSubmit = (e) => {
    e.preventDefault();
    onScan(searchLocation, radius, selectedCategories, gmapsUrl);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '370px 1fr 340px', gap: '16px', height: 'calc(100vh - 110px)', padding: '0 20px 20px 20px' }}>
      
      {/* Left Search Controls Panel */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '18px', overflowY: 'auto' }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}>
            <MapPin size={18} color="var(--primary)" />
            Multi-Source Scan Setup
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Search by area name or paste a Google Maps link.</p>
        </div>

        <form onSubmit={handleScanSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              LOCATION / LANDMARK NAME
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={searchLocation}
                onChange={(e) => {
                  setSearchLocation(e.target.value);
                  if (scanError) setScanError(null);
                }}
                placeholder="e.g. Racecourse, Rajkot or LDRP Gandhinagar"
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 36px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  background: 'rgba(0,0,0,0.3)',
                  color: '#fff',
                  fontSize: '0.88rem'
                }}
              />
              <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
            </div>
          </div>

          {/* Dedicated Google Maps URL Input with Paste Button Placed Just Below */}
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              OR GOOGLE MAPS LINK / COORDINATES
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={gmapsUrl}
                onChange={(e) => {
                  setGmapsUrl(e.target.value);
                  if (scanError) setScanError(null);
                }}
                placeholder="Paste link: https://maps.app.goo.gl/... or @22.29,70.79"
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 36px',
                  borderRadius: 'var(--radius-sm)',
                  border: scanError ? '1px solid #f43f5e' : '1px solid var(--border-subtle)',
                  background: 'rgba(0,0,0,0.3)',
                  color: '#fff',
                  fontSize: '0.82rem'
                }}
              />
              <LinkIcon size={15} color={gmapsUrl ? "var(--primary)" : "var(--text-muted)"} style={{ position: 'absolute', left: '12px', top: '12px' }} />
            </div>

            {/* Paste Button Placed Directly Below URL Field */}
            <button
              type="button"
              onClick={handlePasteFromClipboard}
              title="Paste Google Maps URL from clipboard"
              style={{
                width: '100%',
                marginTop: '8px',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                background: pastedStatus ? '#10b981' : 'rgba(99, 102, 241, 0.18)',
                color: pastedStatus ? '#fff' : '#a5b4fc',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.2s ease'
              }}
            >
              <Clipboard size={14} />
              {pastedStatus ? 'Pasted from Clipboard!' : ' Paste from Clipboard'}
            </button>

            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>
              Tip: Copy link from Google Maps on phone or browser and click Paste!
            </span>
          </div>

          {/* Unresolved Location Warning Alert */}
          {scanError && (
            <div style={{
              padding: '12px',
              borderRadius: '8px',
              background: 'rgba(244, 63, 94, 0.12)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: '#fca5a5',
              fontSize: '0.8rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#fb7185' }}>
                <AlertTriangle size={16} /> Location Not Found
              </div>
              <div>{scanError}</div>
              <div style={{ fontSize: '0.74rem', color: '#fecdd3', marginTop: '2px' }}>
                👉 Copy the address link from <strong>Google Maps</strong> and click <strong>Paste</strong> above to scan immediately!
              </div>
            </div>
          )}

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              RADIUS VALIDATION: <strong style={{ color: 'var(--primary)' }}>{radius} km ({radius * 1000} m)</strong>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                CATEGORIES ({selectedCategories.length}/{CATEGORIES.length})
              </label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedCategories([...CATEGORIES])}
                  style={{ background: 'none', border: 'none', color: '#818cf8', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 600 }}
                >
                  Select All
                </button>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>|</span>
                <button
                  type="button"
                  onClick={() => setSelectedCategories([])}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 600 }}
                >
                  Clear
                </button>
              </div>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '6px',
              maxHeight: '180px',
              overflowY: 'auto',
              paddingRight: '4px',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '8px',
              background: 'rgba(15, 23, 42, 0.4)'
            }}>
              {CATEGORIES.map((cat) => (
                <label
                  key={cat}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.78rem',
                    color: selectedCategories.includes(cat) ? '#fff' : 'var(--text-dim)',
                    cursor: 'pointer',
                    padding: '3px 5px',
                    borderRadius: '4px',
                    background: selectedCategories.includes(cat) ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                    border: selectedCategories.includes(cat) ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(cat)}
                    onChange={() => toggleCategory(cat)}
                    style={{ accentColor: 'var(--primary)', cursor: 'pointer' }}
                  />
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={cat}>
                    {cat}
                  </span>
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
              <span>Running Multi-Source Scan...</span>
            ) : (
              <>
                <Sparkles size={18} />
                Scan Area & Audit Leads
              </>
            )}
          </button>
        </form>

        {/* Legend */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)' }}>MAP MARKERS LEGEND</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
            <span style={{ fontSize: '15px' }}>📍</span>
            <span>Search Target Origin Pin</span>
          </div>
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
        
        {/* Floating Map View Switcher (Normal, Satellite, Terrain) */}
        <div style={{
          position: 'absolute',
          top: '14px',
          right: '14px',
          zIndex: 1000,
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(10px)',
          padding: '4px',
          borderRadius: '10px',
          border: '1px solid rgba(255,255,255,0.12)',
          display: 'flex',
          gap: '4px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
        }}>
          {Object.entries(TILE_LAYERS).map(([key, config]) => {
            const isActive = mapStyle === key;
            return (
              <button
                key={key}
                onClick={() => setMapStyle(key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: isActive ? 'var(--primary)' : 'transparent',
                  color: isActive ? '#fff' : 'var(--text-muted)',
                  fontSize: '0.8rem',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <span>{config.icon}</span>
                <span>{config.label}</span>
              </button>
            );
          })}
        </div>

        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      </div>

      {/* Right Business Results Drawer */}
      <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Deduplicated Leads ({leads.length})</h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Two-Score Model</span>
        </div>

        {leads.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text-muted)' }}>
            <Navigation size={32} color="var(--primary)" style={{ opacity: 0.5, marginBottom: '8px' }} />
            <p style={{ fontSize: '0.85rem' }}>No leads loaded yet. Enter a location or paste a Google Maps link to scan local businesses.</p>
          </div>
        ) : (
          leads.map((l) => {
            const b = l.business;
            const w = b.analysis;
            const isSelected = selectedLead?.id === l.id;
            const bGmapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.name + ' ' + (b.address !== 'Address Listed on Map' ? b.address : searchLocation))}&center=${b.latitude},${b.longitude}`;

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

                {/* Two-Score Indicators */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '6px', fontSize: '0.72rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#38bdf8', background: 'rgba(56,189,248,0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                    <ShieldCheck size={12} /> Confidence: {l.data_confidence || 80}%
                  </div>
                  <div style={{ color: 'var(--text-dim)', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
                    Sources: {b.source_providers || 'openstreetmap'}
                  </div>
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

                {/* View on Google Maps Button */}
                <div style={{ marginTop: '10px' }}>
                  <a
                    href={bGmapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '5px 10px',
                      borderRadius: '6px',
                      background: 'rgba(99, 102, 241, 0.2)',
                      border: '1px solid rgba(99, 102, 241, 0.4)',
                      color: '#a5b4fc',
                      fontSize: '0.76rem',
                      fontWeight: 600,
                      textDecoration: 'none',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    🗺️ View on Google Maps <ExternalLink size={12} />
                  </a>
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
