const express = require('express');
const router = express.Router();
const { getRecommendations, getExecutiveBriefing } = require('../controllers/aiController');

/**
 * AI Routes
 * Handles Gemini AI-powered analysis and recommendation endpoints.
 */

// POST /api/ai/recommend — Generate AI policy recommendations
router.post('/recommend', getRecommendations);

// POST /api/ai/briefing — Generate Commissioner Executive Briefing
router.post('/briefing', getExecutiveBriefing);

module.exports = router;
