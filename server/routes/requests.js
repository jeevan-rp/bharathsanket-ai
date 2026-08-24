const express = require('express');
const router = express.Router();
const { createRequest, getRequests, getDistrictDemand } = require('../controllers/requestController');

/**
 * Request Routes
 * Handles citizen development request CRUD and aggregation.
 */

// POST /api/requests — Submit a new citizen request (triggers Gemini AI categorization)
router.post('/', createRequest);

// GET /api/requests — Fetch all requests (map markers + stats)
router.get('/', getRequests);

// GET /api/requests/districts — Aggregated demand by district (sidebar list)
router.get('/districts', getDistrictDemand);

module.exports = router;
