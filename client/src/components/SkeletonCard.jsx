/**
 * SkeletonCard Component (BharatSanket AI)
 * ==========================================
 * Reusable dark-mode glassmorphic skeleton placeholder with shimmering pulse
 * animation. Used across Citizen & Official dashboards to prevent layout shifts.
 */
export default function SkeletonCard({ count = 1, type = 'card' }) {
  const items = Array.from({ length: count }, (_, i) => i);

  if (type === 'stat') {
    return (
      <div className="flex gap-3 overflow-x-auto">
        {items.map((idx) => (
          <div
            key={idx}
            className="h-10 w-28 bg-white/5 border border-white/10 backdrop-blur-md rounded-xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (type === 'row') {
    return (
      <div className="space-y-2">
        {items.map((idx) => (
          <div
            key={idx}
            className="h-16 w-full bg-white/5 border border-white/10 backdrop-blur-md rounded-xl p-3 flex items-center justify-between animate-pulse"
          >
            <div className="space-y-1.5 flex-1">
              <div className="h-3 w-1/4 bg-white/10 rounded" />
              <div className="h-2.5 w-1/2 bg-white/5 rounded" />
            </div>
            <div className="h-6 w-16 bg-white/10 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  // Default card format
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {items.map((idx) => (
        <div
          key={idx}
          className="bg-white/5 border border-white/10 backdrop-blur-lg rounded-2xl p-5 space-y-3.5 shadow-xl animate-pulse"
        >
          {/* Header pill & severity */}
          <div className="flex items-center justify-between">
            <div className="h-4 w-20 bg-white/15 rounded-md" />
            <div className="h-4 w-16 bg-white/10 rounded-md" />
          </div>

          {/* Image placeholder */}
          <div className="h-32 bg-slate-900/80 rounded-xl border border-white/5" />

          {/* Text summaries */}
          <div className="space-y-2 pt-1">
            <div className="h-3.5 w-full bg-white/10 rounded" />
            <div className="h-3 w-4/5 bg-white/5 rounded" />
          </div>

          {/* Stepper mockup */}
          <div className="h-8 w-full bg-white/5 rounded-lg border border-white/5" />

          {/* Footer actions */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-between">
            <div className="h-6 w-24 bg-white/10 rounded-xl" />
            <div className="h-3 w-16 bg-white/5 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
