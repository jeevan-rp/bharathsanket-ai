import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import CitizenReport from './CitizenReport';
import StatusStepper from './StatusStepper';
import SkeletonCard from './SkeletonCard';
import { fetchReports, upvoteReport } from '../services/api';

/**
 * CitizenDashboard Component (BharatSanket AI)
 * ============================================
 * Allows authenticated citizens to:
 * 1. Submit voice/text infrastructure complaints with Gemini AI analysis
 * 2. Track only their own submitted issues matching their UID
 * 3. Explore nearby community issues, upvote/confirm to prevent duplicates and boost impact
 * 4. Monitor live lifecycle resolution via StatusStepper
 */
export default function CitizenDashboard() {
  const { currentUser, userProfile, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('mine'); // 'mine' | 'community'
  const [myReports, setMyReports] = useState([]);
  const [communityReports, setCommunityReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [upvotingIds, setUpvotingIds] = useState(new Set());

  const loadReportsData = async () => {
    setLoadingReports(true);
    try {
      // 1. Fetch user's own reports if logged in
      if (currentUser?.uid) {
        const myRes = await fetchReports({ userId: currentUser.uid });
        if (myRes && myRes.success) {
          setMyReports(myRes.data || []);
        }
      }

      // 2. Fetch community reports for deduplication / upvoting feed
      const commRes = await fetchReports();
      if (commRes && commRes.success) {
        setCommunityReports(commRes.data || []);
      }
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    loadReportsData();
  }, [currentUser?.uid]);

  const handleNewReport = (newDoc) => {
    setMyReports(prev => [newDoc, ...prev]);
    setCommunityReports(prev => [newDoc, ...prev]);
  };

  const handleUpvote = async (reportId) => {
    if (!reportId || upvotingIds.has(reportId)) return;

    setUpvotingIds(prev => new Set(prev).add(reportId));
    try {
      const res = await upvoteReport(reportId, currentUser?.uid);
      if (res && res.success) {
        if (res.action === 'added') {
          toast.success(`Confirmed! Impact increased to ${res.impactScore}.`);
        } else {
          toast('Upvote removed', { icon: '↩️' });
        }

        // Update both local arrays
        const updateArray = (list) =>
          list.map(item => {
            if ((item._id || item.id) === reportId) {
              return {
                ...item,
                impactScore: res.impactScore,
                upvotes: res.upvotes
              };
            }
            return item;
          });

        setMyReports(updateArray);
        setCommunityReports(updateArray);
      }
    } catch (err) {
      console.error('Failed to upvote report:', err);
      toast.error('Failed to upvote report.');
    } finally {
      setUpvotingIds(prev => {
        const next = new Set(prev);
        next.delete(reportId);
        return next;
      });
    }
  };

  const getSeverityBadge = (level) => {
    const config = {
      5: 'bg-red-500/20 text-red-400 border-red-500/40',
      4: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
      3: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
      2: 'bg-lime-500/20 text-lime-400 border-lime-500/40',
      1: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    };
    return config[level] || config[3];
  };

  const displayedReports = activeTab === 'mine' ? myReports : communityReports;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* ─── Top Navbar ─── */}
      <header className="bg-slate-900/90 border-b border-slate-800/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-3.5 rounded overflow-hidden shadow-sm">
              <div className="w-full bg-gradient-to-b from-orange-400 via-white to-emerald-500" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>BharatSanket</span>
                <span className="text-amber-400">AI</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase font-bold">
                  Citizen Trust Portal
                </span>
              </h1>
            </div>
          </div>

          {/* User profile & Logout */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-slate-200">
                {userProfile?.displayName || currentUser?.displayName || 'Citizen'}
              </div>
              <div className="text-[10px] text-slate-400">
                {currentUser?.email}
              </div>
            </div>

            {currentUser?.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt="Profile"
                className="w-8 h-8 rounded-full border border-slate-700"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs border border-amber-500/30">
                {(currentUser?.displayName || 'C')[0]}
              </div>
            )}

            <button
              onClick={logout}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* ─── Content ─── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 space-y-12">
        {/* 1. Complaint Ingestion Form */}
        <section>
          <CitizenReport onReportSubmitted={handleNewReport} />
        </section>

        {/* 2. Citizen Trust Loop: My Grievances & Community Upvote Feed */}
        <section className="bg-slate-900/80 border border-slate-800 backdrop-blur-xl rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>🛡️</span>
                  <span>Citizen Trust Loop</span>
                </h2>

                {/* Tab switch */}
                <div className="flex bg-slate-950/80 p-1 rounded-xl border border-slate-800">
                  <button
                    onClick={() => setActiveTab('mine')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                      activeTab === 'mine'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    My Submissions ({myReports.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('community')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                      activeTab === 'community'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>Community Feed</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-400 mt-1">
                {activeTab === 'mine'
                  ? 'Track live milestone resolution for issues you reported.'
                  : 'Upvote matching community complaints to prevent duplicates and amplify urgency to officials.'}
              </p>
            </div>

            <button
              onClick={loadReportsData}
              className="text-xs text-amber-400 hover:text-amber-300 font-medium self-start sm:self-auto"
            >
              🔄 Refresh Feed
            </button>
          </div>

          {loadingReports ? (
            <SkeletonCard count={6} />
          ) : displayedReports.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              <p className="text-2xl mb-2">📬</p>
              <p className="font-semibold text-slate-300">
                {activeTab === 'mine'
                  ? "You haven't submitted any complaints yet."
                  : 'No community complaints found.'}
              </p>
              <p className="mt-1">Use the report section above to voice an infrastructure issue in your area.</p>
            </div>
          ) : (
            <motion.div
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
            >
              <AnimatePresence>
                {displayedReports.map((report) => {
                  const reportId = report._id || report.id;
                  const hasUpvoted = currentUser?.uid && Array.isArray(report.upvotes) && report.upvotes.includes(currentUser.uid);
                  const isUpvoting = upvotingIds.has(reportId);
                  const impactScore = report.impactScore || (Array.isArray(report.upvotes) ? report.upvotes.length + 1 : 1);

                  return (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.2 }}
                      key={reportId}
                      className="bg-white/5 border border-white/10 hover:border-white/20 backdrop-blur-lg rounded-2xl p-4 flex flex-col justify-between transition-colors group shadow-xl"
                    >
                      <div className="space-y-3">
                        {/* Category & Impact / Severity Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-amber-400">
                              {report.intentCategory || report.aiCategory || 'General'}
                            </span>
                            {/* Impact Score Badge */}
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-semibold flex items-center gap-1">
                              <span>⚡</span>
                              <span>{impactScore} Impact</span>
                            </span>
                          </div>

                          <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold ${getSeverityBadge(report.severityLevel || report.aiSeverity)}`}>
                            Severity {report.severityLevel || report.aiSeverity}/5
                          </span>
                        </div>

                        {/* Evidence Photo */}
                        {report.imageUrl && (
                          <div className="relative rounded-xl overflow-hidden border border-slate-800 h-32 group">
                            <img
                              src={report.imageUrl}
                              alt="Evidence"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            {report.visualVerification?.matchesComplaint && (
                              <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-[9px] font-bold text-emerald-300 flex items-center gap-1 backdrop-blur-md">
                                <span>✨</span>
                                <span>AI Verified Ground Truth</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Summary */}
                        <p className="text-xs text-slate-200 font-medium line-clamp-2 leading-relaxed">
                          {report.summary || report.aiSummary}
                        </p>

                        {/* Location text */}
                        <div className="text-[11px] text-slate-400 flex items-center gap-1">
                          <span>📍</span>
                          <span className="truncate">
                            {report.extractedLocation?.cityOrDistrict || report.location?.district}, {report.extractedLocation?.state || report.location?.state}
                          </span>
                        </div>

                        {/* Status Stepper Milestone Component */}
                        <div className="pt-2 border-t border-slate-800/60">
                          <StatusStepper
                            status={report.status || 'Pending'}
                            statusHistory={report.statusHistory || []}
                          />
                        </div>
                      </div>

                      {/* Footer Actions: Upvote and Date */}
                      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                        {/* Community Upvote Button */}
                        <button
                          type="button"
                          onClick={() => handleUpvote(reportId)}
                          disabled={isUpvoting}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition border ${
                            hasUpvoted
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                          } ${isUpvoting ? 'opacity-50 cursor-wait' : ''}`}
                          title="Upvote to confirm this issue and prevent duplicates"
                        >
                          <span>{hasUpvoted ? '👍 Upvoted' : '👍 Confirm / Upvote'}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/40 text-amber-400">
                            {impactScore}
                          </span>
                        </button>

                        <span className="text-[10px] text-slate-500">
                          {new Date(report.createdAt || report.timestamp || 0).toLocaleDateString()}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </section>
      </main>
    </div>
  );
}
