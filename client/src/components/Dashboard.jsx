/**
 * Dashboard Component (Samvaad Infra-AI)
 * =======================================
 * Policymaker Intelligence View in full Dark Mode & Glassmorphism:
 * 1. Filter bar with high-contrast metric badges and category pills
 * 2. High-contrast Dark Leaflet map with CartoDB tiles and glowing markers
 * 3. Demand Hotspots ranked by volume & severity
 * 4. Gemini AI Policy Intelligence & Project Brief recommendations
 */
import { useState, useEffect, useCallback } from 'react';
import MapContainer from './MapContainer';
import { DemandList } from './DemandList';
import { AIRecommendations } from './AIRecommendations';
import { fetchReports, fetchRequests } from '../services/api';

const CATEGORIES = ['all', 'Road', 'Water', 'Drainage', 'Healthcare', 'Electricity', 'Sanitation'];

export default function Dashboard() {
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({ total: 0, avgSeverity: '0.0', byCategory: {} });
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('all');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // First try /api/reports, fall back to /api/requests
      let res;
      try {
        res = await fetchReports({ category: filterCategory });
      } catch (e) {
        res = await fetchRequests({ category: filterCategory });
      }

      if (res && res.success) {
        setReports(res.data || []);
        if (res.stats) {
          setStats(res.stats);
        }
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [filterCategory]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-slate-950 text-slate-100">
      {/* ─── Top Stats & Filter Bar ─── */}
      <div className="bg-slate-900/80 border-b border-slate-800/80 px-5 py-3 flex items-center gap-6 overflow-x-auto backdrop-blur-xl shrink-0">
        <StatBadge
          label="Total Grievances"
          value={stats.total}
          badgeClass="text-amber-400 bg-amber-500/10 border-amber-500/20"
        />
        <StatBadge
          label="Avg Severity"
          value={`${stats.avgSeverity} / 5`}
          badgeClass="text-red-400 bg-red-500/10 border-red-500/20"
        />

        {/* Category Breakdown Badges */}
        <div className="flex items-center gap-2 border-l border-slate-800 pl-4">
          {Object.entries(stats.byCategory || {})
            .sort((a, b) => b[1] - a[1])
            .map(([cat, count]) => (
              <span
                key={cat}
                className="text-xs px-2.5 py-1 rounded-lg bg-slate-800/60 border border-slate-700/60 text-slate-300 flex items-center gap-1.5"
              >
                <span className="font-semibold text-slate-100">{cat}:</span>
                <span className="text-amber-400 font-bold">{count}</span>
              </span>
            ))}
        </div>

        {/* Category Filter Pills */}
        <div className="ml-auto flex items-center gap-1.5 shrink-0">
          <span className="text-xs text-slate-400 font-medium mr-1">Filter:</span>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                filterCategory === cat
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'bg-slate-800/70 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/50'
              }`}
            >
              {cat === 'all' ? 'All Issues' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Main 3-Panel Layout ─── */}
      <div className="flex-1 flex overflow-hidden p-3 gap-3">
        {/* Map Panel (takes ~60% width) */}
        <div className="flex-[3] relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900/60 shadow-xl">
          {loading ? (
            <div className="h-full flex items-center justify-center bg-slate-950/80">
              <div className="text-center space-y-3">
                <div className="animate-spin h-9 w-9 border-2 border-amber-400/30 border-t-amber-400 rounded-full mx-auto" />
                <p className="text-sm text-slate-300 font-medium">Synchronizing geospatial map intelligence...</p>
              </div>
            </div>
          ) : reports.length === 0 ? (
            <div className="h-full flex items-center justify-center bg-slate-950/80">
              <div className="text-center px-8 max-w-sm">
                <div className="text-4xl mb-3">🗺️</div>
                <h3 className="font-semibold text-slate-200 text-base">No Reports Logged Yet</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Submit unstructured citizen complaints from the Citizen Portal to view live geospatial hot-markers on the map.
                </p>
              </div>
            </div>
          ) : (
            <MapContainer reports={reports} />
          )}

          {/* Quick Map Legend Overlay */}
          <div className="absolute bottom-4 left-4 z-[400] bg-slate-900/90 border border-slate-800 backdrop-blur-md px-3 py-2 rounded-xl text-[11px] text-slate-300 flex items-center gap-3 shadow-lg">
            <span className="font-bold text-slate-200">Severity:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              <span>1 Low</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
              <span>3 Moderate</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
              <span>5 Critical</span>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Hotspots & AI Policy Recommendations */}
        <div className="flex-[2] flex flex-col gap-3 min-w-[340px]">
          {/* Demand List Panel */}
          <div className="flex-1 bg-slate-900/80 rounded-2xl shadow-xl border border-slate-800 overflow-hidden backdrop-blur-xl">
            <DemandList onUpdate={loadData} />
          </div>

          {/* AI Recommendations Panel */}
          <div className="flex-1 bg-slate-900/80 rounded-2xl shadow-xl border border-slate-800 overflow-hidden backdrop-blur-xl">
            <AIRecommendations />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBadge({ label, value, badgeClass }) {
  return (
    <div className={`px-3 py-1.5 rounded-xl border text-xs flex items-center gap-2 font-medium ${badgeClass}`}>
      <span className="opacity-80">{label}:</span>
      <span className="text-sm font-extrabold">{value}</span>
    </div>
  );
}