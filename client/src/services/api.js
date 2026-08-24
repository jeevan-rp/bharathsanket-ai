import axios from 'axios';

/**
 * API Service Layer
 * Centralized Axios instance for all backend communication.
 * In dev, Vite proxies /api to localhost:8080.
 * In production (Cloud Run), same-origin requests go directly.
 */
const api = axios.create({
  baseURL: '/api',
  timeout: 60000, // 60s timeout for AI endpoints
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Submit a new citizen request.
 * The backend will send the text to Gemini AI for categorization
 * before saving it to MongoDB.
 */
export async function submitRequest({ originalText, language, lat, lng, district, state }) {
  const res = await api.post('/requests', { originalText, language, lat, lng, district, state });
  return res.data;
}

/**
 * Fetch all citizen requests (for map markers and stats).
 * Supports optional ?category=Roads&state=Maharashtra filtering.
 */
export async function fetchRequests({ category = 'all', state = 'all' } = {}) {
  const params = {};
  if (category !== 'all') params.category = category;
  if (state !== 'all') params.state = state;
  const res = await api.get('/requests', { params });
  return res.data;
}

/**
 * Fetch aggregated district demand data (sidebar list).
 */
export async function fetchDistrictDemand() {
  const res = await api.get('/requests/districts');
  return res.data;
}

/**
 * Trigger AI policy recommendation generation.
 * This is the heavy AI endpoint — it aggregates ALL data and
 * sends it to Gemini for cross-referential analysis.
 */
export async function getAIRecommendations() {
  const res = await api.post('/ai/recommend');
  return res.data;
}

/**
 * Health check.
 */
export async function healthCheck() {
  const res = await api.get('/health');
  return res.data;
}
