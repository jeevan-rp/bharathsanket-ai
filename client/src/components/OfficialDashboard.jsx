import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import MapContainer from './MapContainer';
import { DemandList } from './DemandList';
import { AIRecommendations } from './AIRecommendations';
import CategoryDonutChart from './CategoryDonutChart';
import StatusUpdateModal from './StatusUpdateModal';
import ExecutiveBriefingExport from './ExecutiveBriefingExport';
import { fetchReports } from '../services/api';

const CATEGORIES = ['all', 'Road', 'Water', 'Drainage', 'Healthcare', 'Electricity', 'Sanitation'];

/**
 * OfficialDashboard Component (BharatSanket AI)
 * ==============================================
 * Government Official / Policymaker Portal:
 * - Mapbox clustering with Coimbatore initial center
 * - City / District and Category filter controls
 * - Analytical metric cards (Total Pending Problems, High Severity Alerts, etc.)
 * - Recharts Category Distribution Donut Chart
 * - Status Workflow Modal (Pending -> In Progress -> Resolved) with Audit Trail
 * - Hotspots breakdown and AI Policy Recommendations
 */
export default function OfficialDashboard() {
  const { currentUser, userProfile, logout } = useAuth();
  const [allReports, setAllReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeSideTab, setActiveSideTab] = useState('analytics'); // 'analytics' | 'hotspots' | 'ai'
  const [modalReport, setModalReport] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchReports({ category: 'all', severity: 'all' });
      if (res && res.success) {
        setAllReports(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load official dashboard reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute unique cities for the dropdown
  const uniqueCities = useMemo(() => {
    const set = new Set();
    allReports.forEach(r => {
      const city = r.extractedLocation?.cityOrDistrict || r.location?.district;
      if (city) set.add(city);
    });
    return Array.from(set).sort();
  }, [allReports]);

  // Filtered reports for Mapbox and metrics based on UI controls
  const filteredReports = useMemo(() => {
    return allReports.filter(r => {
      const city = r.extractedLocation?.cityOrDistrict || r.location?.district;
      const cat = r.intentCategory || r.aiCategory;

      const matchesCity = selectedCity === 'all' || city?.toLowerCase() === selectedCity.toLowerCase();
      const matchesCategory = selectedCategory === 'all' || cat?.toLowerCase() === selectedCategory.toLowerCase();

      return matchesCity && matchesCategory;
    });
  }, [allReports, selectedCity, selectedCategory]);

  // Priority sorted reports: high impactScore and critical severity first
  const prioritySortedReports = useMemo(() => {
    return [...filteredReports].sort((a, b) => {
      const impactA = a.impactScore || (Array.isArray(a.upvotes) ? a.upvotes.length + 1 : 1);
      const impactB = b.impactScore || (Array.isArray(b.upvotes) ? b.upvotes.length + 1 : 1);
      const sevA = a.severityLevel || a.aiSeverity || 0;
      const sevB = b.severityLevel || b.aiSeverity || 0;

      // Weight impactScore and severity together
      const scoreA = impactA * 3 + sevA * 2;
      const scoreB = impactB * 3 + sevB * 2;
      return scoreB - scoreA;
    });
  }, [filteredReports]);

  // Calculate Metrics
  const metrics = useMemo(() => {
    const totalPending = filteredReports.filter(r => (r.status || 'Pending').toLowerCase() === 'pending').length;
    const inProgressCount = filteredReports.filter(r => (r.status || '').toLowerCase() === 'in progress').length;
    const resolvedCount = filteredReports.filter(r => (r.status || '').toLowerCase() === 'resolved').length;
    const criticalCount = filteredReports.filter(r => (r.severityLevel || r.aiSeverity) >= 4).length;
    const moderateCount = filteredReports.filter(r => (r.severityLevel || r.aiSeverity) === 3).length;
    const minorCount = filteredReports.filter(r => (r.severityLevel || r.aiSeverity) <= 2).length;

    // Category breakdown
    const catMap = {};
    filteredReports.forEach(r => {
      const c = r.intentCategory || r.aiCategory || 'Other';
      catMap[c] = (catMap[c] || 0) + 1;
    });

    return {
      total: filteredReports.length,
      totalPending,
      inProgressCount,
      resolvedCount,
      criticalCount,
      moderateCount,
      minorCount,
      catMap
    };
  }, [filteredReports]);

  const handleStatusUpdated = (reportId, newStatus, newHistory) => {
    setAllReports(prev =>
      prev.map(r => {
        if ((r._id || r.id) === reportId) {
          return {
            ...r,
            status: newStatus,
            statusHistory: newHistory
          };
        }
        return r;
      })
    );
  };

  const openStatusModalForProps = (props) => {
    const found = allReports.find(r => (r._id || r.id) === props.id);
    if (found) {
      setModalReport(found);
    } else {
      setModalReport(props);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden">
      {/* ─── Official Navbar ─── */}
      <header className="bg-slate-900/90 border-b border-slate-800/80 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 backdrop-blur-xl shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-4 rounded overflow-hidden shadow-sm">
            <div className="w-full bg-gradient-to-b from-orange-400 via-slate-100 to-emerald-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-tight">
                BharatSanket <span className="text-amber-400">AI</span>
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold uppercase tracking-wider">
                Official Workspace
              </span>
            </div>
            <p className="text-[10px] text-slate-400 -mt-0.5">
              Enterprise Public Good Decision Intelligence & Status Management
            </p>
          </div>
        </div>

        {/* User profile, Export Suite & actions */}
        <div className="flex items-center gap-2.5 sm:gap-3 ml-auto flex-wrap">
          {/* Executive Briefing & Export Suite */}
          <ExecutiveBriefingExport reports={filteredReports} />

          <div className="h-5 w-[1px] bg-slate-800 hidden md:block" />

          <div className="text-right hidden sm:block">
            <div className="text-xs font-semibold text-slate-200">
              {userProfile?.displayName || currentUser?.displayName || 'Executive Officer'}
            </div>
            <div className="text-[10px] text-indigo-400 font-mono">
              {currentUser?.email}
            </div>
          </div>

          <button
            onClick={logout}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition shadow-sm"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* ─── Metric Cards Bar ─── */}
      <div className="bg-slate-900/60 border-b border-slate-800/70 px-5 py-2.5 flex items-center gap-3 overflow-x-auto shrink-0 z-10 custom-scrollbar">
        {/* Total Grievances */}
        <div className="px-3 py-1.5 rounded-xl bg-slate-800/70 border border-slate-700/60 flex items-center gap-2">
          <span className="text-xs text-slate-400">Total:</span>
          <span className="text-sm font-extrabold text-white">{metrics.total}</span>
        </div>

        {/* Total Pending Problems */}
        <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2">
          <span className="text-xs text-amber-300 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            Pending:
          </span>
          <span className="text-sm font-extrabold text-amber-400">{metrics.totalPending}</span>
        </div>

        {/* In Progress */}
        <div className="px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center gap-2">
          <span className="text-xs text-blue-300">In Progress:</span>
          <span className="text-sm font-extrabold text-blue-400">{metrics.inProgressCount}</span>
        </div>

        {/* Resolved */}
        <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2">
          <span className="text-xs text-emerald-300">Resolved:</span>
          <span className="text-sm font-extrabold text-emerald-400">{metrics.resolvedCount}</span>
        </div>

        {/* Critical Alerts (4-5) */}
        <div className="px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2">
          <span className="text-xs text-red-300 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            Critical:
          </span>
          <span className="text-sm font-extrabold text-red-400">{metrics.criticalCount}</span>
        </div>

        {/* ─── UI Filter Controls (City and Category) ─── */}
        <div className="ml-auto flex items-center gap-3 shrink-0">
          {/* City Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 font-medium">City:</span>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Cities</option>
              {uniqueCities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 font-medium">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 focus:outline-none focus:border-amber-500"
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ─── Main Map & Analytics Grid (Mobile Stacked / Desktop Split-Screen) ─── */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden p-3 gap-3">
        {/* Left: Mapbox Clustered Map View */}
        <div className="h-[400px] lg:h-full lg:flex-[3] relative rounded-2xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-lg shadow-2xl shrink-0">
          {loading ? (
            <div className="h-full flex items-center justify-center bg-slate-950/80">
              <div className="text-center space-y-2">
                <div className="w-8 h-8 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-400">Loading Mapbox clustering engine...</p>
              </div>
            </div>
          ) : (
            <MapContainer
              reports={filteredReports}
              onStatusChange={openStatusModalForProps}
            />
          )}
        </div>

        {/* Right Sidebar: Dynamic Tab View (Analytics Chart / Hotspots / Gemini AI) */}
        <div className="flex-1 lg:flex-[2] flex flex-col gap-3 min-w-[320px] lg:max-w-[420px]">
          {/* Navigation Bar for Right Panel */}
          <div className="bg-slate-900/80 border border-slate-800 p-1.5 rounded-xl flex items-center gap-1 backdrop-blur-xl shrink-0">
            <button
              onClick={() => setActiveSideTab('analytics')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeSideTab === 'analytics'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              📊 Analytics
            </button>
            <button
              onClick={() => setActiveSideTab('queue')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeSideTab === 'queue'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ⚡ Priority Queue
            </button>
            <button
              onClick={() => setActiveSideTab('hotspots')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeSideTab === 'hotspots'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🔥 Hotspots
            </button>
            <button
              onClick={() => setActiveSideTab('ai')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeSideTab === 'ai'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🤖 AI Advise
            </button>
          </div>

          {/* Active Side Content */}
          <div className="flex-1 bg-slate-900/80 rounded-2xl shadow-xl border border-slate-800 overflow-hidden backdrop-blur-xl flex flex-col">
            {activeSideTab === 'analytics' && (
              <CategoryDonutChart catMap={metrics.catMap} />
            )}

            {activeSideTab === 'queue' && (
              <div className="h-full flex flex-col p-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 shrink-0">
                  <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <span>⚡</span>
                    <span>High-Impact Grievance Queue</span>
                  </div>
                  <span className="text-[10px] text-amber-400 font-mono">
                    {prioritySortedReports.length} issues
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar pt-2 space-y-2">
                  {prioritySortedReports.map(item => {
                    const id = item._id || item.id;
                    const impact = item.impactScore || (Array.isArray(item.upvotes) ? item.upvotes.length + 1 : 1);
                    const isResolved = (item.status || '').toLowerCase() === 'resolved';

                    return (
                      <div
                        key={id}
                        className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 space-y-2 hover:border-slate-700 transition"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-amber-400">
                            {item.intentCategory || item.aiCategory}
                          </span>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                              ⚡ {impact}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-500/20 text-red-400 border border-red-500/30 font-semibold">
                              Sev {item.severityLevel || item.aiSeverity}/5
                            </span>
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-300 line-clamp-2">
                          {item.summary || item.aiSummary}
                        </p>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px]">
                          <span className={`px-2 py-0.5 rounded-full font-semibold capitalize ${
                            isResolved
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : (item.status || '').toLowerCase() === 'in progress'
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}>
                            {item.status || 'Pending'}
                          </span>

                          <button
                            onClick={() => setModalReport(item)}
                            className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-bold transition"
                          >
                            Update Status ➔
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeSideTab === 'hotspots' && (
              <DemandList onUpdate={loadData} />
            )}

            {activeSideTab === 'ai' && (
              <AIRecommendations />
            )}
          </div>
        </div>
      </div>

      {/* ─── Status Update Workflow Modal ─── */}
      <StatusUpdateModal
        report={modalReport}
        isOpen={!!modalReport}
        onClose={() => setModalReport(null)}
        onUpdated={handleStatusUpdated}
      />
    </div>
  );
}
