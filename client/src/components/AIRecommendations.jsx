/**
 * AIRecommendations Component (Samvaad Infra-AI)
 * ===============================================
 * Triggers the /api/ai/recommend endpoint to aggregate complaints and
 * compute Gemini AI policy recommendations.
 * Upgraded to Dark Theme & Glassmorphism styling.
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
    <div className="h-full flex flex-col bg-slate-900/90 text-slate-200">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-800 shrink-0 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
            <span className="text-indigo-400">🤖</span>
            <span>AI Policy Recommendations</span>
          </h3>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Gemini cross-references complaints with district infrastructure gaps
          </p>
        </div>
        {recommendations.length > 0 && (
          <button
            onClick={generate}
            disabled={loading}
            className="text-xs text-amber-400 hover:text-amber-300 font-medium transition"
          >
            {loading ? 'Analyzing...' : 'Regenerate'}
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
        {/* Generate Button Initial State */}
        {!recommendations.length && !loading && !error && (
          <div className="text-center py-6">
            <div className="text-3xl mb-2">🧠</div>
            <p className="text-xs text-slate-400 mb-4 max-w-xs mx-auto">
              Run Gemini AI analysis across citizen demand patterns and district infrastructure baselines.
            </p>
            <button
              onClick={generate}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-500 hover:from-amber-600 hover:to-emerald-600 text-white text-xs font-semibold rounded-xl transition shadow-lg shadow-orange-500/20"
            >
              Generate AI Recommendations
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="py-8 text-center space-y-3">
            <div className="animate-spin h-7 w-7 border-2 border-amber-400/30 border-t-amber-400 rounded-full mx-auto" />
            <p className="text-xs text-slate-300 font-medium">Gemini 2.5 Flash analyzing district demand...</p>
            <p className="text-[10px] text-slate-500">Cross-referencing citizen complaints with government indices</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
            <p className="font-semibold mb-1">Analysis Failed</p>
            <p className="text-slate-400">{error}</p>
            <button
              onClick={generate}
              className="mt-2 text-[11px] text-amber-400 underline font-semibold"
            >
              Try again
            </button>
          </div>
        )}

        {/* Recommendations List */}
        {recommendations.length > 0 && !loading && (
          <div className="space-y-3">
            {meta && (
              <div className="text-[10px] text-slate-500 flex items-center justify-between pb-1">
                <span>{meta.requestsAnalyzed} requests analyzed</span>
                <span>{meta.districtsCompared} districts compared</span>
              </div>
            )}

            {recommendations.map((rec, i) => (
              <div
                key={i}
                className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-2 hover:border-slate-700 transition animate-fade-in-up"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400">
                    Priority #{i + 1}: {rec.projectType}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    📍 {rec.district}, {rec.state}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {rec.reason}
                </p>

                {rec.estimatedBeneficiaries && (
                  <div className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                    <span>👥 Est. Beneficiaries:</span>
                    <span>{rec.estimatedBeneficiaries.toLocaleString()} citizens</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}