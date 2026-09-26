/**
 * DemandList Component (Samvaad Infra-AI)
 * ========================================
 * Sidebar listing districts sorted by request volume.
 * Upgraded to Dark Theme & Glassmorphism styling.
 */
import { useState, useEffect } from 'react';
import { fetchHotspots, fetchDistrictDemand } from '../services/api';

export function DemandList({ onUpdate }) {
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      // First try /api/reports/hotspots, fallback to /api/requests/districts
      let res;
      try {
        res = await fetchHotspots();
      } catch (e) {
        res = await fetchDistrictDemand();
      }

      if (res && res.success) {
        setDistricts(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load district demand:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const maxRequests = districts.length > 0 ? (districts[0].totalReports || districts[0].totalRequests || 1) : 1;

  return (
    <div className="h-full flex flex-col bg-slate-900/90 text-slate-200">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between shrink-0">
        <h3 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
          <span className="text-orange-400">🔥</span>
          <span>Demand Hotspots</span>
        </h3>
        <button
          onClick={() => { loadData(); if (onUpdate) onUpdate(); }}
          className="text-xs text-amber-400 hover:text-amber-300 font-medium transition"
        >
          Refresh
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-5 w-5 border-2 border-amber-400/30 border-t-amber-400 rounded-full" />
          </div>
        ) : districts.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-8">
            No demand data yet. Submit reports from the Citizen Portal.
          </p>
        ) : (
          districts.map((d, i) => {
            const count = d.totalReports || d.totalRequests || 0;
            return (
              <div
                key={d.district + i}
                className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 hover:border-slate-700 transition animate-fade-in-up"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                {/* District name + count */}
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-xs text-slate-200 truncate">
                    {d.district}
                  </span>
                  <span className="text-xs font-bold text-amber-400 ml-2 bg-amber-500/10 px-1.5 py-0.5 rounded">
                    {count} {count === 1 ? 'report' : 'reports'}
                  </span>
                </div>

                {/* State */}
                <p className="text-[10px] text-slate-400 mb-2">{d.state}</p>

                {/* Mini Progress Bar */}
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(8, (count / maxRequests) * 100))}%` }}
                  />
                </div>

                {/* Category chips */}
                <div className="flex flex-wrap gap-1">
                  {Object.entries(d.categories || {})
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3)
                    .map(([cat, cnt]) => (
                      <span
                        key={cat}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800/80 border border-slate-700/60 text-slate-300"
                      >
                        {cat} ({cnt})
                      </span>
                    ))}
                </div>

                {/* Severity indicator */}
                <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-800/50">
                  <span className="text-[10px] text-slate-400">Avg Severity:</span>
                  <span className="text-[11px] font-bold text-orange-400">{d.avgSeverity}/5</span>
                  <div className="flex gap-0.5 ml-auto">
                    {[1, 2, 3, 4, 5].map(s => {
                      const active = s <= Math.round(d.avgSeverity || 3);
                      return (
                        <div
                          key={s}
                          className={`w-2.5 h-2.5 rounded-sm ${
                            active
                              ? s >= 4 ? 'bg-red-500' : s === 3 ? 'bg-amber-400' : 'bg-emerald-400'
                              : 'bg-slate-800'
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}