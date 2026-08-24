/**
 * MapView Component
 * ==================
 * Renders an interactive Leaflet map of India with citizen request markers.
 * Markers are color-coded by AI-assigned severity:
 *   Red (5) → Orange (4) → Yellow (3) → Lime (2) → Green (1)
 * 
 * Each marker popup shows the request summary, category, and severity.
 */
import { useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { INDIA_CENTER, INDIA_ZOOM } from '../data/locations';

function getSeverityColor(severity) {
  const colors = {
    1: '#22c55e', // green
    2: '#84cc16', // lime
    3: '#eab308', // yellow
    4: '#f97316', // orange
    5: '#ef4444', // red
  };
  return colors[severity] || '#6b7280';
}

function getCategoryIcon(category) {
  const icons = {
    Roads: '🛣️',
    Water: '💧',
    Healthcare: '🏥',
    Electricity: '⚡',
    Sanitation: '🧹',
  };
  return icons[category] || '📌';
}

export function MapView({ requests }) {
  // Group overlapping markers by rounding coordinates
  const markers = useMemo(() => {
    return requests.map(req => ({
      id: req._id,
      lat: req.location.lat,
      lng: req.location.lng,
      severity: req.aiSeverity,
      category: req.aiCategory,
      summary: req.aiSummary,
      district: req.location.district,
      state: req.location.state,
      text: req.originalText,
    }));
  }, [requests]);

  return (
    <MapContainer
      center={INDIA_CENTER}
      zoom={INDIA_ZOOM}
      className="h-full w-full"
      zoomControl={true}
      minZoom={4}
      maxZoom={18}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {markers.map(marker => (
        <CircleMarker
          key={marker.id}
          center={[marker.lat, marker.lng]}
          radius={6 + marker.severity}
          fillColor={getSeverityColor(marker.severity)}
          color="#fff"
          weight={1.5}
          opacity={0.9}
          fillOpacity={0.75}
        >
          <Popup>
            <div className="text-xs space-y-1 min-w-[180px]">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-800">
                  {getCategoryIcon(marker.category)} {marker.category}
                </span>
                <span className={`severity-${marker.severity} px-1.5 py-0.5 rounded text-[10px] font-bold`}>
                  {marker.severity}/5
                </span>
              </div>
              <p className="font-medium text-gray-700">{marker.summary}</p>
              <p className="text-gray-400">📍 {marker.district}, {marker.state}</p>
              <details className="mt-1">
                <summary className="text-gray-400 cursor-pointer hover:text-gray-600">Original text</summary>
                <p className="text-gray-500 mt-0.5 italic">{marker.text}</p>
              </details>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}