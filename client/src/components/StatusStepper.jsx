/**
 * StatusStepper Component (BharatSanket AI - Citizen Trust Loop)
 * ==============================================================
 * Visual milestone stepper for tracking real-time complaint lifecycle:
 * [Submitted / Pending] ➔ [In Progress / Field Dispatched] ➔ [Resolved / Completed]
 * 
 * Features:
 * - Glassmorphic dark styling matching BharatSanket aesthetic
 * - Dynamic color transitions per stage (Amber -> Blue -> Emerald)
 * - Displays official audit timestamp & remarks tooltip/note
 */

export default function StatusStepper({ status = 'Pending', statusHistory = [] }) {
  const normalizedStatus = (status || 'pending').toLowerCase();

  const steps = [
    {
      key: 'pending',
      label: 'Report Filed',
      sublabel: 'AI Verified & Logged',
      icon: '📝',
      color: 'amber'
    },
    {
      key: 'in progress',
      label: 'In Progress',
      sublabel: 'Department Dispatched',
      icon: '⚙️',
      color: 'blue'
    },
    {
      key: 'resolved',
      label: 'Resolved',
      sublabel: 'Grievance Addressed',
      icon: '✅',
      color: 'emerald'
    }
  ];

  // Determine current active step index
  let activeIndex = 0;
  if (normalizedStatus === 'in progress' || normalizedStatus === 'in_progress') {
    activeIndex = 1;
  } else if (normalizedStatus === 'resolved' || normalizedStatus === 'closed') {
    activeIndex = 2;
  }

  // Find latest official note if available
  const latestHistoryEntry = statusHistory && statusHistory.length > 0 
    ? statusHistory[statusHistory.length - 1] 
    : null;

  return (
    <div className="w-full py-2 space-y-2">
      <div className="relative flex items-center justify-between">
        {/* Connecting progress track line */}
        <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 h-0.5 bg-slate-800 -z-0" />
        <div
          className="absolute top-1/2 left-4 -translate-y-1/2 h-0.5 bg-gradient-to-r from-amber-500 via-blue-500 to-emerald-500 transition-all duration-500 -z-0"
          style={{
            width: activeIndex === 0 ? '0%' : activeIndex === 1 ? '50%' : 'calc(100% - 2rem)'
          }}
        />

        {steps.map((step, idx) => {
          const isCompleted = idx < activeIndex;
          const isCurrent = idx === activeIndex;

          let bubbleStyle = 'bg-slate-900 border-slate-700 text-slate-500';
          if (isCurrent) {
            bubbleStyle = step.color === 'amber'
              ? 'bg-amber-500/20 border-amber-400 text-amber-300 ring-4 ring-amber-500/10 shadow-lg shadow-amber-500/20'
              : step.color === 'blue'
              ? 'bg-blue-500/20 border-blue-400 text-blue-300 ring-4 ring-blue-500/10 shadow-lg shadow-blue-500/20'
              : 'bg-emerald-500/20 border-emerald-400 text-emerald-300 ring-4 ring-emerald-500/10 shadow-lg shadow-emerald-500/20';
          } else if (isCompleted) {
            bubbleStyle = 'bg-emerald-500/20 border-emerald-500/60 text-emerald-400';
          }

          return (
            <div key={step.key} className="relative z-10 flex flex-col items-center">
              <div
                className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all duration-300 backdrop-blur-md ${bubbleStyle}`}
              >
                {isCompleted ? '✓' : step.icon}
              </div>
              <span className={`text-[10px] font-semibold mt-1.5 transition-colors ${
                isCurrent 
                  ? 'text-white' 
                  : isCompleted 
                  ? 'text-slate-300' 
                  : 'text-slate-500'
              }`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Latest Status Remark Note */}
      {latestHistoryEntry?.note && (
        <div className="mt-1 text-[10px] px-2.5 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-slate-400 flex items-center justify-between">
          <span className="truncate">
            <span className="text-slate-300 font-medium">Official update:</span> "{latestHistoryEntry.note}"
          </span>
          <span className="text-[9px] text-slate-500 shrink-0 ml-2">
            {new Date(latestHistoryEntry.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
          </span>
        </div>
      )}
    </div>
  );
}
