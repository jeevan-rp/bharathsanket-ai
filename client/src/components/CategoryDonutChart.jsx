import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = [
  '#f59e0b', // Amber (Road)
  '#3b82f6', // Blue (Water)
  '#10b981', // Emerald (Sanitation)
  '#8b5cf6', // Violet (Electricity)
  '#ef4444', // Red (Healthcare/Drainage)
  '#06b6d4', // Cyan
  '#ec4899', // Pink
];

export default function CategoryDonutChart({ catMap = {} }) {
  const data = Object.entries(catMap).map(([name, value]) => ({
    name,
    value
  }));

  if (data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-xs text-slate-500">
        No category distribution data available
      </div>
    );
  }

  const total = data.reduce((acc, curr) => acc + curr.value, 0);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      const percent = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
      return (
        <div className="bg-slate-900/95 border border-slate-700/80 backdrop-blur-md p-2 rounded-lg text-xs shadow-xl">
          <div className="font-bold text-slate-200">{item.name}</div>
          <div className="text-amber-400 font-semibold mt-0.5">
            {item.value} reports ({percent}%)
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-full flex flex-col p-3">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
          <span>📊</span>
          <span>Category Distribution</span>
        </h4>
        <span className="text-[10px] text-slate-400 font-mono">
          Total: {total}
        </span>
      </div>

      <div className="flex-1 w-full min-h-[140px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={38}
              outerRadius={58}
              paddingAngle={4}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                  stroke="#0f172a"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend chips */}
      <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-800/60 max-h-16 overflow-y-auto custom-scrollbar">
        {data.map((entry, index) => (
          <div
            key={entry.name}
            className="flex items-center gap-1 text-[10px] bg-slate-950/60 px-2 py-0.5 rounded border border-slate-800 text-slate-300"
          >
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <span className="truncate max-w-[80px]">{entry.name}</span>
            <span className="text-slate-400 font-mono">({entry.value})</span>
          </div>
        ))}
      </div>
    </div>
  );
}
