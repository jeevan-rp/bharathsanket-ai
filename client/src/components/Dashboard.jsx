/**
 * Dashboard Component
 * ====================
 * The policymaker view with 3 panels:
 * 1. Interactive map (React-Leaflet) with severity-colored markers
 * 2. District demand sidebar (highest request volume)
 * 3. AI Recommendations panel (Gemini-generated project briefs)
 */
import { useState, useEffect, useCallback } from 'react';
import { MapView } from './MapView';
import { DemandList } from './DemandList';
import { AIRecommendations } from './AIRecommendations';
import { fetchRequests } from '../services/api';

const CATEGORIES = ['all', 'Roads', 'Water', 'Healthcare', 'Electricity', 'Sanitation'];

export default function Dashboard() {
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({ total: 0, avgSeverity: '0.0', byCategory: {} });
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('all');

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchRequests({ category: filterCategory });
      if (res.success) {
        setRequests(res.data);
        setStats(res.stats);
      }
    } catch (err) {
      console.error('Failed to load requests:', err);
    } finally {
      setLoading(false);
    }
  }, [filterCategory]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col">
      {/* Stats Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-2.5 flex items-center gap-6 overflow-x-auto">
        <StatBadge label="Total Requests" value={stats.total} color="text-indigo-600" />
        <StatBadge label="Avg Severity" value={`${stats.avgSeverity}/5`} color="text-orange-600" />
        {Object.entries(stats.byCategory).sort((a, b) => b[1] - a[1]).map(([cat, count]) => (
          <StatBadge key={cat} label={cat} value={count} color="text-gray-600" />
        ))}

        {/* Category Filter */}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-gray-400">Filter:</span>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                filterCategory === cat
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat === 'all' ? 'All' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main 3-Panel Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Map Panel (takes ~60% width) */}
        <div className="flex-[3] p-3">
          <div className="h-full rounded-xl overflow-hidden shadow-inner border border-gray-200">
            {loading ? (
              <div className="h-full flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <div className="animate-spin h-8 w-8 border-2 border-indigo-300 border-t-indigo-600 rounded-full mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Loading map data...</p>
                </div>
              </div>
            ) : requests.length === 0 ? (
              <div className="h-full flex items-center justify-center bg-gray-50">
                <div className="text-center px-8">
                  <div className="text-4xl mb-3">🗺️</div>
                  <h3 className="font-semibold text-gray-600">No requests yet</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Submit citizen requests from the portal to see them on the map.
                  </p>
                </div>
              </div>
            ) : (
              <MapView requests={requests} />
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="flex-[2] flex flex-col p-3 pl-0 gap-3">
          {/* Demand List */}
          <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <DemandList onUpdate={loadRequests} />
          </div>

          {/* AI Recommendations */}
          <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <AIRecommendations />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBadge({ label, value, color }) {
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <span className="text-xs text-gray-400">{label}:</span>
      <span className={`text-sm font-bold ${color}`}>{value}</span>
    </div>
  );
}