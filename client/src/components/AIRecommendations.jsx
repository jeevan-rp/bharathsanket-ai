/**
 * AIRecommendations Component
 * ============================
 * Triggers the /api/ai/recommend endpoint which:
 * 1. Fetches ALL citizen requests + government infrastructure data
 * 2. Sends aggregated data to Gemini AI
 * 3. Gemini cross-references demand vs infrastructure gaps
 * 4. Returns top 3 project recommendations
 * 
 * This is where the AI does the real policy intelligence work —
 * turning raw citizen complaints into actionable project briefs.
 */
import { useState } from 'react';
import { getAIRecommendations } from '../services/api';

export function AIRecommendations() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState(null);
  const [error, setError] = useState('');

  const generate = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getAIRecommendations();
      if (res.success) {
        setRecommendations(res.data || []);
        setMeta(res.meta || null);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate recommendations.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 shrink-0">
        <h3 className="font-bold text-sm text-gray-800">🤖 AI Project Recommendations</h3>
        <p className="text-[10px] text-gray-400 mt-0.5">
          Gemini analyzes demand vs infrastructure gaps
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
        {/* Generate Button */}
        {!recommendations.length && !loading && !error && (
          <div className="text-center py-6">
            <div className="text-3xl mb-2">🧠</div>
            <p className="text-xs text-gray-400 mb-4">
              Generate AI-powered project recommendations based on citizen demand patterns and infrastructure data.
            </p>
            <button
              onClick={generate}
              className="px-4 py-2 bg-gradient-to-r from-india-saffron to-orange-500 text-white text-sm font-semibold rounded-lg hover:from-orange-500 hover:to-orange-600 transition shadow-md hover:shadow-lg"
            >
              Generate Recommendations
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <div className="relative inline-block">
              <div className="animate-spin h-10 w-10 border-2 border-orange-200 border-t-orange-500 rounded-full" />
              <span className="absolute inset-0 flex items-center justify-center text-xs">🤖</span>
            </div>
            <p className="text-xs text-gray-500 mt-3">Gemini AI is analyzing {meta?.requestsAnalyzed || '...'} requests...</p>
            <p className="text-[10px] text-gray-400 mt-1">Cross-referencing demand data with infrastructure indices</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg border border-red-100">
            ⚠️ {error}
          </div>
        )}

        {/* Recommendations Cards */}
        {recommendations.map((rec, i) => (
          <div
            key={i}
            className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-lg p-3 mb-3 animate-fade-in-up shadow-sm hover:shadow-md transition"
            style={{ animationDelay: `${i * 150}ms` }}
          >
            {/* Project header with rank */}
            <div className="flex items-start gap-2 mb-2">
              <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${
                i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-gray-400' : 'bg-orange-400'
              }`}>
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm text-gray-800 leading-tight">{rec.projectType}</h4>
                <p className="text-[10px] text-gray-400">{rec.district}, {rec.state}</p>
              </div>
            </div>

            {/* Reasoning */}
            <p className="text-xs text-gray-600 leading-relaxed mb-2">{rec.reason}</p>

            {/* Beneficiaries */}
            <div className="flex items-center gap-1 bg-green-50 rounded-md px-2 py-1">
              <span className="text-[10px]">👥</span>
              <span className="text-[10px] text-green-700 font-medium">
                ~{rec.estimatedBeneficiaries.toLocaleString()} estimated beneficiaries
              </span>
            </div>
          </div>
        ))}

        {/* Meta info after generation */}
        {meta && recommendations.length > 0 && (
          <div className="text-center py-2">
            <button
              onClick={generate}
              className="text-xs text-indigo-500 hover:text-indigo-700 font-medium"
            >
              🔄 Regenerate
            </button>
            <p className="text-[10px] text-gray-300 mt-1">
              Based on {meta.requestsAnalyzed} requests across {meta.districtsCompared} districts
            </p>
          </div>
        )}
      </div>
    </div>
  );
}