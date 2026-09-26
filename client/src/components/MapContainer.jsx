import { useState, useEffect, useRef, useMemo } from 'react';
import Map, { Source, Layer, Popup, NavigationControl, FullscreenControl } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { fetchReports } from '../services/api';

/**
 * MapContainer Component (Samvaad Infra-AI)
 * ==========================================
 * Robust, dark-themed Mapbox implementation.
 * - Centered on Coimbatore (Lat: 11.0168, Lng: 76.9558, Zoom: 12)
 * - Mapbox dark style: mapbox://styles/mapbox/dark-v11
 * - Fetches reports from GET http://localhost:8080/api/reports
 * - Converts data into a GeoJSON FeatureCollection
 * - Uses Mapbox Source with cluster={true} for automatic demand hotspot grouping
 * - Renders unclustered points with severity colors (Red for 4-5, Orange for 3, Blue for 1-2)
 */

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

// Coimbatore center coordinates
const INITIAL_VIEW_STATE = {
  latitude: 11.0168,
  longitude: 76.9558,
  zoom: 12,
  pitch: 0,
  bearing: 0
};

// Cluster circle layer styling
const clusterLayer = {
  id: 'clusters',
  type: 'circle',
  source: 'reports-source',
  filter: ['has', 'point_count'],
  paint: {
    'circle-color': [
      'step',
      ['get', 'point_count'],
      '#f59e0b', // amber-500 for < 5
      5,
      '#f97316', // orange-500 for 5 - 15
      15,
      '#ef4444'  // red-500 for >= 15
    ],
    'circle-radius': [
      'step',
      ['get', 'point_count'],
      18,
      5,
      24,
      15,
      30
    ],
    'circle-stroke-width': 2,
    'circle-stroke-color': '#ffffff',
    'circle-opacity': 0.85
  }
};

// Cluster count text layer
const clusterCountLayer = {
  id: 'cluster-count',
  type: 'symbol',
  source: 'reports-source',
  filter: ['has', 'point_count'],
  layout: {
    'text-field': '{point_count_abbreviated}',
    'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
    'text-size': 12
  },
  paint: {
    'text-color': '#ffffff'
  }
};

// Unclustered point layer: colored based on severity
// Red for 4-5, Orange for 3, Blue for 1-2
const unclusteredPointLayer = {
  id: 'unclustered-point',
  type: 'circle',
  source: 'reports-source',
  filter: ['!', ['has', 'point_count']],
  paint: {
    'circle-color': [
      'step',
      ['get', 'severity'],
      '#3b82f6', // Blue for 1-2
      3,
      '#f97316', // Orange for 3
      4,
      '#ef4444'  // Red for 4-5
    ],
    'circle-radius': [
      'interpolate',
      ['linear'],
      ['get', 'severity'],
      1, 7,
      3, 9,
      5, 12
    ],
    'circle-stroke-width': 2,
    'circle-stroke-color': '#ffffff',
    'circle-opacity': 0.9
  }
};

export default function MapContainer({ reports: externalReports, onStatusChange }) {
  const [reportsData, setReportsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const mapRef = useRef(null);

  // Fetch reports from backend
  useEffect(() => {
    async function loadReports() {
      setLoading(true);
      try {
        const res = await fetchReports();
        if (res && res.success && Array.isArray(res.data)) {
          setReportsData(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch reports for Mapbox:', err);
      } finally {
        setLoading(false);
      }
    }

    if (externalReports && externalReports.length > 0) {
      setReportsData(externalReports);
    } else {
      loadReports();
    }
  }, [externalReports]);

  // Convert fetched array to GeoJSON FeatureCollection
  const geojson = useMemo(() => {
    const features = reportsData
      .filter(item => {
        const lat = item.estimatedCoordinates?.lat ?? item.location?.lat;
        const lng = item.estimatedCoordinates?.lng ?? item.location?.lng;
        return typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng);
      })
      .map(item => {
        const lat = item.estimatedCoordinates?.lat ?? item.location?.lat;
        const lng = item.estimatedCoordinates?.lng ?? item.location?.lng;
        const severity = item.severityLevel ?? item.aiSeverity ?? 3;
        const category = item.intentCategory ?? item.aiCategory ?? 'Road';
        const summary = item.summary ?? item.aiSummary ?? 'Infrastructure issue';
        const district = item.extractedLocation?.cityOrDistrict ?? item.location?.district ?? 'Unknown';
        const state = item.extractedLocation?.state ?? item.location?.state ?? 'India';
        const rawText = item.rawInput ?? item.originalText ?? '';

        return {
          type: 'Feature',
          properties: {
            id: item._id || item.id,
            severity,
            category,
            summary,
            status: item.status || 'Pending',
            impactScore: item.impactScore || (Array.isArray(item.upvotes) ? item.upvotes.length + 1 : 1),
            district,
            state,
            rawText,
            imageUrl: item.imageUrl || null,
            visualVerified: !!item.visualVerification?.matchesComplaint,
            visualReasoning: item.visualVerification?.aiReasoning || null
          },
          geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          }
        };

      });

    return {
      type: 'FeatureCollection',
      features
    };
  }, [reportsData]);

  // Click handler for unclustered points & clusters
  const onClick = (event) => {
    const feature = event.features && event.features[0];
    if (!feature) return;

    const clusterId = feature.properties?.cluster_id;

    if (clusterId) {
      // Zoom into cluster on click
      const mapboxSource = mapRef.current?.getSource('reports-source');
      mapboxSource?.getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (err) return;
        mapRef.current?.easeTo({
          center: feature.geometry.coordinates,
          zoom,
          duration: 500
        });
      });
    } else {
      // Show popup for unclustered point
      setSelectedFeature({
        coordinates: feature.geometry.coordinates,
        properties: feature.properties
      });
    }
  };

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-950">
      {/* Mapbox Map */}
      <Map
        ref={mapRef}
        initialViewState={INITIAL_VIEW_STATE}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
        interactiveLayerIds={['clusters', 'unclustered-point']}
        onClick={onClick}
      >
        <NavigationControl position="top-right" />
        <FullscreenControl position="top-right" />

        {/* Clustered GeoJSON Source */}
        <Source
          id="reports-source"
          type="geojson"
          data={geojson}
          cluster={true}
          clusterMaxZoom={14}
          clusterRadius={50}
        >
          {/* Cluster circle */}
          <Layer {...clusterLayer} />
          {/* Cluster count text */}
          <Layer {...clusterCountLayer} />
          {/* Unclustered points */}
          <Layer {...unclusteredPointLayer} />
        </Source>

        {/* Selected Point Popup */}
        {selectedFeature && (
          <Popup
            longitude={selectedFeature.coordinates[0]}
            latitude={selectedFeature.coordinates[1]}
            anchor="bottom"
            onClose={() => setSelectedFeature(null)}
            closeOnClick={false}
            className="mapbox-dark-popup"
          >
            <div className="p-1 min-w-[220px] max-w-[260px] text-slate-100 text-xs space-y-2">
              <div className="flex items-center justify-between border-b border-slate-700/60 pb-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-amber-400">
                    {selectedFeature.properties.category}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                    ⚡ {selectedFeature.properties.impactScore}
                  </span>
                </div>
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                  selectedFeature.properties.severity >= 4
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : selectedFeature.properties.severity === 3
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                    : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                }`}>
                  Severity {selectedFeature.properties.severity}/5
                </span>
              </div>

              {selectedFeature.properties.imageUrl && (
                <div className="relative rounded-lg overflow-hidden border border-slate-700/80 h-24">
                  <img
                    src={selectedFeature.properties.imageUrl}
                    alt="Map Evidence"
                    className="w-full h-full object-cover"
                  />
                  {selectedFeature.properties.visualVerified && (
                    <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/50 text-[9px] text-emerald-300 font-bold backdrop-blur-md">
                      ✨ AI Verified
                    </div>
                  )}
                </div>
              )}

              <p className="font-medium text-slate-200">
                {selectedFeature.properties.summary}
              </p>
              <div className="text-[10px] text-slate-400">
                📍 {selectedFeature.properties.district}, {selectedFeature.properties.state}
              </div>
              <div className="pt-1 border-t border-slate-700/40 flex items-center justify-between text-[10px]">
                <span className="text-slate-400">Status:</span>
                <div className="flex items-center gap-1.5">
                  <span className={`px-2 py-0.5 rounded-full font-semibold capitalize ${
                    (selectedFeature.properties.status || '').toLowerCase() === 'resolved'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : (selectedFeature.properties.status || '').toLowerCase() === 'in progress'
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}>
                    {selectedFeature.properties.status || 'Pending'}
                  </span>
                  {onStatusChange && (
                    <button
                      type="button"
                      onClick={() => onStatusChange(selectedFeature.properties)}
                      className="px-1.5 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold border border-amber-500/40 text-[9px] transition"
                    >
                      Update
                    </button>
                  )}
                </div>
              </div>
              {selectedFeature.properties.rawText && (
                <p className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-700/40">
                  "{selectedFeature.properties.rawText}"
                </p>
              )}
            </div>
          </Popup>
        )}
      </Map>


      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 z-10 bg-slate-900/90 border border-slate-800 backdrop-blur-md px-3 py-2 rounded-xl text-[11px] text-slate-300 flex items-center gap-3 shadow-lg">
        <span className="font-bold text-slate-200">Severity:</span>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
          <span>1-2 (Blue)</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" />
          <span>3 (Orange)</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
          <span>4-5 (Red)</span>
        </div>
        <div className="flex items-center gap-1 pl-2 border-l border-slate-700">
          <span className="w-3.5 h-3.5 rounded-full bg-amber-500/80 border border-white inline-block text-[8px] text-center font-bold text-white">#</span>
          <span>Hotspot Cluster</span>
        </div>
      </div>

      {loading && (
        <div className="absolute top-4 left-4 z-10 bg-slate-900/80 border border-slate-800 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs text-amber-400 flex items-center gap-2">
          <div className="animate-spin w-3 h-3 border border-amber-400 border-t-transparent rounded-full" />
          <span>Loading Mapbox reports...</span>
        </div>
      )}
    </div>
  );
}
