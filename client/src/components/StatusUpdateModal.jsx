import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { updateReportStatus } from '../services/api';
import { useAuth } from '../context/AuthContext';

/**
 * StatusUpdateModal Component (BharatSanket AI - Official Workspace)
 * ===================================================================
 * Allows government officers to transition issue status:
 * Pending ➔ In Progress ➔ Resolved
 * and logs timestamped notes into the audit trail.
 */
export default function StatusUpdateModal({ report, isOpen, onClose, onUpdated }) {
  const { currentUser, userProfile } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState(report?.status || 'Pending');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Close modal on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !report) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const toastId = toast.loading('Updating grievance lifecycle status...');

    try {
      const reportId = report._id || report.id;
      const res = await updateReportStatus(reportId, {
        status: selectedStatus,
        note: note.trim() || `Status updated to ${selectedStatus} by official`,
        officerName: userProfile?.displayName || currentUser?.displayName || 'Municipal Officer',
        officerEmail: currentUser?.email || 'officer@gov.in'
      });

      if (res && res.success) {
        toast.success(`Grievance marked as "${selectedStatus}"!`, { id: toastId });
        if (onUpdated) {
          onUpdated(reportId, selectedStatus, res.data.statusHistory);
        }
        onClose();
      }
    } catch (err) {
      console.error('Failed to update status:', err);
      const msg = err.response?.data?.error || 'Failed to update grievance status.';
      setError(msg);
      toast.error(msg, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const statusOptions = [
    { value: 'Pending', label: 'Pending Action', desc: 'Awaiting inspection / review', color: 'border-amber-500/40 text-amber-300' },
    { value: 'In Progress', label: 'In Progress', desc: 'Field teams dispatched on ground', color: 'border-blue-500/40 text-blue-300' },
    { value: 'Resolved', label: 'Resolved / Closed', desc: 'Work finished and confirmed', color: 'border-emerald-500/40 text-emerald-300' }
  ];

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>🛡️</span>
              <span>Update Grievance Status</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              ID: <span className="font-mono text-slate-300">{report._id || report.id}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 transition"
          >
            ✕
          </button>
        </div>

        {/* Issue Brief */}
        <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-amber-400">
              {report.intentCategory || report.aiCategory}
            </span>
            <span className="text-[10px] text-slate-400">
              📍 {report.extractedLocation?.cityOrDistrict || report.location?.district}
            </span>
          </div>
          <p className="text-slate-300 line-clamp-2">
            {report.summary || report.aiSummary}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Status selector radio cards */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 block">
              Lifecycle Stage:
            </label>
            <div className="grid grid-cols-1 gap-2">
              {statusOptions.map((opt) => (
                <div
                  key={opt.value}
                  onClick={() => setSelectedStatus(opt.value)}
                  className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                    selectedStatus === opt.value
                      ? `bg-slate-800/80 ${opt.color} ring-1 ring-amber-500/30`
                      : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:bg-slate-800/40'
                  }`}
                >
                  <div>
                    <div className="font-bold text-xs">{opt.label}</div>
                    <div className="text-[10px] text-slate-500">{opt.desc}</div>
                  </div>
                  <input
                    type="radio"
                    name="status"
                    checked={selectedStatus === opt.value}
                    onChange={() => setSelectedStatus(opt.value)}
                    className="accent-amber-400"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Audit Note input */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Official Remarks / Ground Action:</span>
              <span className="text-[10px] text-slate-500 font-normal">Visible to citizens</span>
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. 'Road repair crew assigned. Drainage clearing underway'..."
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500 resize-none"
            />
          </div>

          {error && (
            <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 p-2 rounded-lg">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 shadow-lg shadow-amber-500/20 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <span>Confirm Status Update</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
