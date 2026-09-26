const express = require('express');
const router = express.Router();
const { createReport, getReports, getHotspots, upvoteReport, updateReportStatus } = require('../controllers/reportController');

/**
 * Samvaad Infra-AI Reports API
 */

// POST /api/reports — Ingest unstructured multilingual citizen complaint
router.post('/', createReport);

// GET /api/reports — Fetch reports with filters
router.get('/', getReports);

// GET /api/reports/hotspots — Aggregate demand hotspots
router.get('/hotspots', getHotspots);

// PATCH /api/reports/:id/upvote — Community upvote & deduplication impact boost
router.patch('/:id/upvote', upvoteReport);

// PATCH /api/reports/:id/status — Official status progression & audit history
router.patch('/:id/status', updateReportStatus);

module.exports = router;
