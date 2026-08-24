/**
 * DemandList Component
 * =====================
 * Sidebar listing districts sorted by request volume.
 * Shows a mini bar chart and category breakdown per district.
 * Auto-refreshes when new requests are submitted.
 */
import { useState, useEffect } from 'react';
import { fetchDistrictDemand } from '../services/api';

export function DemandList({ onUpdate }) {
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const res = await fetchDistrictDemand();
      if (res.success) setDistricts(res.data);
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

  const maxRequests = districts.length > 0 ? districts[0].totalRequests : 1;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between shrink-0">
        <h3 className="font-bold text-sm text-gray-800">🔥 Demand Hotspots</h3>
        <button
          onClick={() => { loadData(); if (onUpdate) onUpdate(); }}
          className="text-xs text-indigo-500 hover:text-indigo-700 font-medium"
        >
          Refresh
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-5 w-5 border-2 border-indigo-300 border-t-indigo-600 rounded-full" />
          </div>
        ) : districts.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-8">
            No demand data yet. Submit requests from the Citizen Portal.
          </p>
        ) : (
          districts.map((d, i) => (
            <div
              key={d.district}
              className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition animate-fade-in-up"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              {/* District name + request count */}
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-xs text-gray-700 truncate">
                  {d.district}
                </span>
                <span className="text-xs font-bold text-indigo-600 ml-2">
                  {d.totalRequests}
                </span>
              </div>

              {/* State */}
              <p className="text-[10px] text-gray-400 mb-2">{d.state}</p>

              {/* Mini bar */}
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-gradient-to-r from-india-saffron to-red-500 rounded-full transition-all duration-500"
                  style={{ width: `${(d.totalRequests / maxRequests) * 100}%` }}
                />
              </div>

              {/* Category chips */}
              <div className="flex flex-wrap gap-1">
                {Object.entries(d.categories)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 3)
                  .map(([cat, count]) => (
                    <span
                      key={cat}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-white border border-gray-200 text-gray-500"
                    >
                      {cat} ({count})
                    </span>
                  ))}
              </div>

              {/* Severity indicator */}
              <div className="flex items-center gap-1 mt-2">
                <span className="text-[10px] text-gray-400">Avg severity:</span>
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(s => {
                    const active = s <= Math.round(d.avgSeverity);
                    return (
                      <div
                        key={s}
                        className={"w-3 h-3 rounded-sm " + (active ? "bg-orange-400" : "bg-gray-200")}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}