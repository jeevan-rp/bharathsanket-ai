const CitizenRequest = require('../models/CitizenRequest');
const geminiService = require('../services/geminiService');

/**
 * POST /api/requests
 * Receives a citizen's development request text, uses Gemini AI to
 * categorize it, then persists the enriched document to MongoDB.
 * 
 * Flow: Raw text → Gemini AI analysis → Structured document → MongoDB
 */
exports.createRequest = async (req, res) => {
  try {
    const { originalText, language, lat, lng, district, state } = req.body;

    // Validate required fields
    if (!originalText || !district || !state || lat == null || lng == null) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: originalText, district, state, lat, lng'
      });
    }

    if (originalText.trim().length < 5) {
      return res.status(400).json({
        success: false,
        error: 'Request text must be at least 5 characters'
      });
    }

    console.log(`\n📝 New citizen request from ${district}, ${state}`);
    console.log(`   Text: "${originalText.substring(0, 80)}..."`);

    // ─── Gemini AI does the heavy lifting here ───
    // It takes raw, potentially messy citizen text and extracts
    // a structured category, severity score, and English summary.
    // This transforms unstructured complaints into queryable data.
    console.log('   🤖 Sending to Gemini AI for categorization...');
    const aiAnalysis = await geminiService.categorizeRequest(originalText);
    console.log(`   ✅ AI Result: Category=${aiAnalysis.aiCategory}, Severity=${aiAnalysis.aiSeverity}/5`);
    console.log(`   📋 Summary: "${aiAnalysis.aiSummary}"`);

    // Build and save the full document
    const citizenRequest = new CitizenRequest({
      originalText: originalText.trim(),
      language: language || 'en',
      location: {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        district,
        state
      },
      aiCategory: aiAnalysis.aiCategory,
      aiSeverity: aiAnalysis.aiSeverity,
      aiSummary: aiAnalysis.aiSummary
    });

    const saved = await citizenRequest.save();

    res.status(201).json({
      success: true,
      data: saved,
      message: `Request categorized as ${aiAnalysis.aiCategory} (Severity ${aiAnalysis.aiSeverity}/5) by Gemini AI`
    });
  } catch (error) {
    console.error('Error creating request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process request. Please try again.'
    });
  }
};

/**
 * GET /api/requests
 * Fetches all citizen requests for the map view and dashboard.
 * Supports optional filtering by category and state.
 */
exports.getRequests = async (req, res) => {
  try {
    const { category, state } = req.query;
    const filter = {};

    if (category && category !== 'all') {
      filter.aiCategory = category;
    }
    if (state && state !== 'all') {
      filter['location.state'] = state;
    }

    // Limit to most recent 500 to prevent massive payloads
    const requests = await CitizenRequest
      .find(filter)
      .sort({ timestamp: -1 })
      .limit(500)
      .lean();

    // Compute summary stats for the dashboard
    const stats = await CitizenRequest.aggregate([
      { $group: {
        _id: null,
        total: { $sum: 1 },
        avgSeverity: { $avg: '$aiSeverity' },
        categories: { $push: '$aiCategory' }
      }}
    ]);

    const categoryCounts = {};
    if (stats.length > 0) {
      stats[0].categories.forEach(c => {
        categoryCounts[c] = (categoryCounts[c] || 0) + 1;
      });
    }

    res.json({
      success: true,
      count: requests.length,
      stats: {
        total: stats[0]?.total || 0,
        avgSeverity: stats[0]?.avgSeverity?.toFixed(1) || '0.0',
        byCategory: categoryCounts
      },
      data: requests
    });
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch requests'
    });
  }
};

/**
 * GET /api/requests/districts
 * Returns aggregated demand data grouped by district.
 * Used for the sidebar demand list in the dashboard.
 */
exports.getDistrictDemand = async (req, res) => {
  try {
    const districtData = await CitizenRequest.aggregate([
      {
        $group: {
          _id: '$location.district',
          state: { $first: '$location.state' },
          totalRequests: { $sum: 1 },
          avgSeverity: { $avg: '$aiSeverity' },
          topCategory: { $first: '$aiCategory' },
          categories: { $push: '$aiCategory' }
        }
      },
      { $sort: { totalRequests: -1 } },
      { $limit: 20 }
    ]);

    // Count categories per district
    const result = districtData.map(d => {
      const catCounts = {};
      d.categories.forEach(c => { catCounts[c] = (catCounts[c] || 0) + 1; });
      return {
        district: d._id,
        state: d.state,
        totalRequests: d.totalRequests,
        avgSeverity: Math.round(d.avgSeverity * 10) / 10,
        topCategory: d.topCategory,
        categories: catCounts
      };
    });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error fetching district demand:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch district demand data'
    });
  }
};
