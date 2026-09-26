import axios from 'axios';

/**
 * API Service Layer
 * Centralized Axios instance for all backend communication.
 * In dev, Vite proxies /api to localhost:8080.
 * In production (Cloud Run), same-origin requests go directly.
 */
const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl) return '/api';
  return envUrl.endsWith('/api') ? envUrl : `${envUrl.replace(/\/+$/, '')}/api`;
};

const api = axios.create({
  baseURL: getBaseUrl(),
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

/**
 * Samvaad Infra-AI API Endpoints
 */

/**
 * Submit unstructured multilingual infrastructure complaint with optional visual evidence.
 * Backend Gemini pipeline extracts intent, severity, location & coordinates,
 * and performs multimodal visual cross-verification when imageUrl is provided.
 */
export async function submitReport({ 
  text, 
  imageUrl = null, 
  language = 'auto', 
  clientCoordinates = null, 
  userId = null, 
  userEmail = null, 
  userName = null 
}) {
  const res = await api.post('/reports', { 
    text, 
    imageUrl, 
    language, 
    clientCoordinates, 
    userId, 
    userEmail, 
    userName 
  });
  return res.data;
}


/**
 * Fetch all infrastructure reports with optional filters.
 */
export async function fetchReports({ category = 'all', severity = 'all', userId = null, city = 'all' } = {}) {
  const params = {};
  if (category !== 'all') params.category = category;
  if (severity !== 'all') params.severity = severity;
  if (userId) params.userId = userId;
  if (city !== 'all') params.city = city;
  const res = await api.get('/reports', { params });
  return res.data;
}

/**
 * Fetch demand hotspots.
 */
export async function fetchHotspots() {
  const res = await api.get('/reports/hotspots');
  return res.data;
}

/**
 * Upvote / confirm an existing infrastructure report.
 * Boosts impactScore and appends citizen UID to prevent duplicate issues.
 */
export async function upvoteReport(reportId, userId) {
  const res = await api.patch(`/reports/${reportId}/upvote`, { userId });
  return res.data;
}

/**
 * Official workflow: Update report status ('Pending' | 'In Progress' | 'Resolved')
 * with audit note and officer signature.
 */
export async function updateReportStatus(reportId, { status, note, officerName, officerEmail }) {
  const res = await api.patch(`/reports/${reportId}/status`, {
    status,
    note,
    officerName,
    officerEmail
  });
  return res.data;
}

/**
 * Generate Gemini Municipal Commissioner Executive Briefing.
 */
export async function getExecutiveBriefing(reports = []) {
  const res = await api.post('/ai/briefing', { reports });
  return res.data;
}
