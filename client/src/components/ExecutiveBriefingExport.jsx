import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { getExecutiveBriefing } from '../services/api';

/**
 * ExecutiveBriefingExport Component (BharatSanket AI - Phase 5)
 * ==============================================================
 * Comprehensive Municipal Commissioner Briefing & Export Suite:
 * 1. Generates an AI-synthesized Strategic Executive Summary & Briefing with Gemini.
 * 2. Exports official filtered CSV dataset for municipal records.
 * 3. Triggers browser-native styled Print / PDF report for commissioner signatures.
 */
export default function ExecutiveBriefingExport({ reports = [] }) {
  const [briefing, setBriefing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Close modal on Escape key press
  useEffect(() => {
    if (!isModalOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  // Generate Commissioner Executive Summary via Gemini AI
  const handleGenerateBriefing = async () => {
    setLoading(true);
    const toastId = toast.loading('Synthesizing Executive Summary with Gemini...');
    try {
      const res = await getExecutiveBriefing(reports);
      if (res && res.success) {
        setBriefing(res.data);
        setIsModalOpen(true);
        toast.success('Executive Summary generated successfully!', { id: toastId });
      } else {
        toast.error('Could not generate summary.', { id: toastId });
      }
    } catch (err) {
      console.error('Failed to generate briefing:', err);
      toast.error('Failed to generate executive summary.', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  // Export filtered reports to CSV
  const handleExportCSV = () => {
    if (!reports || reports.length === 0) {
      toast.error('No reports available to export.');
      return;
    }

    const headers = [
      'Grievance ID',
      'Category',
      'Severity',
      'Impact Score',
      'Status',
      'District / City',
      'State',
      'Latitude',
      'Longitude',
      'AI Verified',
      'Citizen Summary',
      'Created Date'
    ];

    const rows = reports.map(r => {
      const id = r._id || r.id;
      const cat = r.intentCategory || r.aiCategory || 'General';
      const sev = r.severityLevel || r.aiSeverity || 3;
      const impact = r.impactScore || (Array.isArray(r.upvotes) ? r.upvotes.length + 1 : 1);
      const status = r.status || 'Pending';
      const city = `"${(r.extractedLocation?.cityOrDistrict || r.location?.district || 'Unknown').replace(/"/g, '""')}"`;
      const state = `"${(r.extractedLocation?.state || r.location?.state || 'India').replace(/"/g, '""')}"`;
      const lat = r.estimatedCoordinates?.lat ?? r.location?.lat ?? '';
      const lng = r.estimatedCoordinates?.lng ?? r.location?.lng ?? '';
      const verified = r.visualVerification?.matchesComplaint ? 'YES' : 'NO';
      const summary = `"${(r.summary || r.aiSummary || '').replace(/"/g, '""')}"`;
      const date = r.createdAt || r.timestamp || '';

      return [id, cat, sev, impact, status, city, state, lat, lng, verified, summary, date].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `BharatSanket_Grievance_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Exported ${reports.length} records to CSV!`);
  };

  // Trigger print / PDF generation
  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {/* CSV Export Button */}
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition shrink-0"
          title="Export active reports to CSV format"
        >
          <span>📥</span>
          <span>Export CSV</span>
        </button>

        {/* Executive AI Summary Button */}
        <button
          onClick={handleGenerateBriefing}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-500 hover:opacity-95 text-slate-950 font-bold text-xs transition shadow-md shadow-orange-500/10 disabled:opacity-50 shrink-0 whitespace-nowrap"
          title="Generate Gemini AI Executive Summary & Decision Intelligence Briefing"
        >
          {loading ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              <span>Synthesizing...</span>
            </>
          ) : (
            <>
              <span>📑</span>
              <span>Executive Summary</span>
            </>
          )}
        </button>
      </div>

      {/* ─── Executive Summary Modal (Mounted via React Portal to avoid clipping) ─── */}
      {isModalOpen && briefing && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[9999] overflow-y-auto bg-black/80 backdrop-blur-md p-3 sm:p-6 flex items-start justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="executive-summary-title"
        >
          <div
            className="relative w-full max-w-2xl my-auto bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] print:max-h-none print:h-auto print:bg-white print:text-black print:p-0 print:border-none animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-800 p-5 sm:p-6 bg-slate-900/95 backdrop-blur-md shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">🇮🇳</span>
                  <h3 id="executive-summary-title" className="text-base font-extrabold text-white tracking-tight">
                    BharatSanket AI • Executive Municipal Summary
                  </h3>
                </div>
                <p className="text-xs text-amber-400 mt-1 font-semibold">
                  Confidential • Municipal Commissioner Infrastructure Intelligence
                </p>
              </div>

              <div className="flex items-center gap-2 print:hidden shrink-0 ml-4">
                <button
                  onClick={handlePrintPDF}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
                  title="Print or Save PDF"
                >
                  <span>🖨️</span>
                  <span>Print / PDF</span>
                </button>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-sm font-bold transition border border-slate-700"
                  title="Close (Esc)"
                  aria-label="Close Executive Summary"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 custom-scrollbar text-xs">
              {/* Headline Callout */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 space-y-1">
                <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                  Strategic Headline
                </div>
                <div className="text-sm font-bold text-white leading-snug">
                  "{briefing.executiveHeadline}"
                </div>
              </div>

              {/* Situation Overview */}
              <div className="space-y-1.5">
                <h4 className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                  <span>📍</span>
                  <span>Ground Situation Overview</span>
                </h4>
                <p className="text-slate-300 leading-relaxed bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                  {briefing.situationOverview}
                </p>
              </div>

              {/* Risk Assessment */}
              <div className="space-y-1.5">
                <h4 className="font-bold text-slate-200 text-xs flex items-center gap-1.5 text-red-300">
                  <span>⚠️</span>
                  <span>Key Operational & Public Safety Risks</span>
                </h4>
                <p className="text-slate-300 leading-relaxed bg-red-500/10 border border-red-500/20 p-3.5 rounded-xl">
                  {briefing.topRiskAssessment}
                </p>
              </div>

              {/* Priority Action Items */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                  <span>📋</span>
                  <span>Priority Commissioner Directives</span>
                </h4>
                <div className="space-y-1.5">
                  {briefing.priorityActionItems?.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start gap-2.5 text-slate-300"
                    >
                      <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0 text-[10px]">
                        {idx + 1}
                      </span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resource Allocation & Impact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">
                    💰 Capital & Crew Deployment
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    {briefing.resourceAllocationAdvice}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                  <div className="text-[10px] text-emerald-400 font-semibold uppercase">
                    👥 Citizen Impact Projection
                  </div>
                  <p className="text-emerald-200 text-[11px] leading-relaxed">
                    {briefing.projectedCitizenImpact}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer with sign-off */}
            <div className="p-4 border-t border-slate-800/80 bg-slate-900/90 flex flex-wrap items-center justify-between text-[11px] text-slate-500 shrink-0 gap-2">
              <span>Synthesized via Gemini Geospatial & Multimodal Infrastructure Model</span>
              <span className="font-mono">Dated: {new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
