/**
 * CitizenPortal Component
 * ========================
 * The public-facing form where citizens submit development requests.
 * When submitted, the text is sent to the backend, which passes it
 * to Gemini AI for automatic categorization and severity scoring.
 */
import { useState } from 'react';
import { submitRequest } from '../services/api';
import { states, getDistricts, getCoordinates } from '../data/locations';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी (Hindi)' },
  { code: 'ta', label: 'தமிழ் (Tamil)' },
  { code: 'te', label: 'తెలుగు (Telugu)' },
  { code: 'bn', label: 'বাংলা (Bengali)' },
  { code: 'mr', label: 'मराठी (Marathi)' },
  { code: 'gu', label: 'ગુજરાતી (Gujarati)' },
];

export default function CitizenPortal() {
  const [form, setForm] = useState({
    originalText: '',
    language: 'en',
    state: '',
    district: '',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const districts = form.state ? getDistricts(form.state) : [];
  const coords = form.state && form.district ? getCoordinates(form.state, form.district) : null;

  const handleChange = (field, value) => {
    setForm(prev => ({
      ...prev,
      [field]: value,
      // Reset district when state changes
      ...(field === 'state' ? { district: '' } : {})
    }));
    // Clear previous result when form changes
    if (result) setResult(null);
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);

    if (!coords) {
      setError('Please select a valid state and district.');
      return;
    }
    if (form.originalText.trim().length < 5) {
      setError('Please describe your request in at least 5 characters.');
      return;
    }

    setLoading(true);
    try {
      const response = await submitRequest({
        originalText: form.originalText.trim(),
        language: form.language,
        lat: coords.lat,
        lng: coords.lng,
        district: form.district,
        state: form.state,
      });
      setResult(response);
      // Reset form after success
      setForm({ originalText: '', language: 'en', state: '', district: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800">
          Voice Your Development Need
        </h2>
        <p className="text-gray-500 mt-1 text-sm">
          Describe the infrastructure issue in your area. Our AI will analyze and categorize your request.
        </p>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md border border-gray-100 p-6 space-y-5">
        
        {/* Request Text */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Describe Your Request <span className="text-red-400">*</span>
          </label>
          <textarea
            value={form.originalText}
            onChange={e => handleChange('originalText', e.target.value)}
            placeholder="e.g. The main road in our village has been broken for 6 months and no one has fixed it. During rains it becomes impossible to travel..."
            rows={4}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm resize-none transition"
            disabled={loading}
          />
          <p className="text-xs text-gray-400 mt-1">Minimum 5 characters. Works in multiple Indian languages.</p>
        </div>

        {/* Language Selector */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Language
          </label>
          <select
            value={form.language}
            onChange={e => handleChange('language', e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white transition"
            disabled={loading}
          >
            {LANGUAGES.map(l => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
        </div>

        {/* Location Row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              State <span className="text-red-400">*</span>
            </label>
            <select
              value={form.state}
              onChange={e => handleChange('state', e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white transition"
              disabled={loading}
            >
              <option value=''>Select State</option>
              {states.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              District <span className="text-red-400">*</span>
            </label>
            <select
              value={form.district}
              onChange={e => handleChange('district', e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white transition"
              disabled={loading || !form.state}
            >
              <option value=''>{form.state ? 'Select District' : 'Select State first'}</option>
              {districts.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        {coords && (
          <p className="text-xs text-gray-400 flex items-center gap-1">
            📍 Coordinates: {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
          </p>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100">
            ⚠️ {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !form.originalText || !form.state || !form.district}
          className="w-full py-3 px-6 rounded-lg font-semibold text-white bg-gradient-to-r from-india-navy to-indigo-700 hover:from-indigo-800 hover:to-indigo-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg text-sm"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Analyzing with AI...
            </span>
          ) : (
            'Submit Request'
          )}
        </button>
      </form>

      {/* AI Result Card */}
      {result && result.success && result.data && (
        <div className="mt-6 bg-white rounded-xl shadow-md border border-green-100 p-6 animate-fade-in-up">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-lg">✅</div>
            <h3 className="font-bold text-gray-800">Request Submitted & AI Analyzed</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-gray-500">AI Category</span>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${getCategoryColor(result.data.aiCategory)}`}>
                {result.data.aiCategory}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-gray-500">Severity</span>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold severity-${result.data.aiSeverity}`}>
                {result.data.aiSeverity}/5 {getSeverityLabel(result.data.aiSeverity)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-gray-500">Location</span>
              <span className="font-medium text-gray-700">
                {result.data.location.district}, {result.data.location.state}
              </span>
            </div>
            <div className="py-2">
              <span className="text-gray-500 block mb-1">AI Summary</span>
              <p className="text-gray-800 font-medium">{result.data.aiSummary}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getCategoryColor(category) {
  const colors = {
    Roads: 'bg-orange-500',
    Water: 'bg-blue-500',
    Healthcare: 'bg-red-500',
    Electricity: 'bg-yellow-500',
    Sanitation: 'bg-green-600',
  };
  return colors[category] || 'bg-gray-500';
}

function getSeverityLabel(severity) {
  const labels = { 1: 'Low', 2: 'Minor', 3: 'Moderate', 4: 'High', 5: 'Critical' };
  return labels[severity] || '';
}
