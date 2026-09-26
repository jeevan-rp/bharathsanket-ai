const { citizenRequestsRef } = require('../config/firebase');
const geminiService = require('../services/geminiService');

/**
 * POST /api/requests
 * Receives a citizen's development request text, uses Gemini AI to
 * categorize it, then persists the enriched document to Firestore.
 * 
 * Flow: Raw text → Gemini AI analysis → Structured document → Firestore
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
    console.log('   🤖 Sending to Gemini AI for categorization...');
    const aiAnalysis = await geminiService.categorizeRequest(originalText);
    console.log(`   ✅ AI Result: Category=${aiAnalysis.aiCategory}, Severity=${aiAnalysis.aiSeverity}/5`);
    console.log(`   📋 Summary: "${aiAnalysis.aiSummary}"`);

    const requestData = {
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
      aiSummary: aiAnalysis.aiSummary,
      timestamp: new Date().toISOString()
    };

    const docRef = await citizenRequestsRef.add(requestData);

    const saved = {
      _id: docRef.id,
      ...requestData
    };

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

    let query = citizenRequestsRef;
    if (category && category !== 'all') {
      query = query.where('aiCategory', '==', category);
    }
    if (state && state !== 'all') {
      query = query.where('location.state', '==', state);
    }

    const snapshot = await query.get();

    let requests = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      requests.push({
        _id: doc.id,
        ...data
      });
    });

    // Sort descending by timestamp in memory (avoids composite index requirement in Firestore)
    requests.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));

    // Limit to 500
    if (requests.length > 500) {
      requests = requests.slice(0, 500);
    }

    // Compute summary stats for dashboard
    const categoryCounts = {};
    let totalSeverity = 0;

    requests.forEach(r => {
      if (r.aiCategory) {
        categoryCounts[r.aiCategory] = (categoryCounts[r.aiCategory] || 0) + 1;
      }
      if (typeof r.aiSeverity === 'number') {
        totalSeverity += r.aiSeverity;
      }
    });

    const total = requests.length;
    const avgSeverity = total > 0 ? (totalSeverity / total).toFixed(1) : '0.0';

    res.json({
      success: true,
      count: total,
      stats: {
        total,
        avgSeverity,
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
    const snapshot = await citizenRequestsRef.get();
    
    // Aggregate by district in memory
    const districtMap = new Map();

    snapshot.forEach(doc => {
      const data = doc.data();
      const district = data.location?.district;
      const state = data.location?.state;
      if (!district) return;

      if (!districtMap.has(district)) {
        districtMap.set(district, {
          district,
          state: state || '',
          totalRequests: 0,
          totalSeverity: 0,
          categories: {}
        });
      }

      const entry = districtMap.get(district);
      entry.totalRequests += 1;
      if (typeof data.aiSeverity === 'number') {
        entry.totalSeverity += data.aiSeverity;
      }
      if (data.aiCategory) {
        entry.categories[data.aiCategory] = (entry.categories[data.aiCategory] || 0) + 1;
      }
    });

    // Format & calculate topCategory and avgSeverity
    const result = Array.from(districtMap.values()).map(d => {
      let topCategory = '';
      let maxCatCount = 0;
      for (const [cat, count] of Object.entries(d.categories)) {
        if (count > maxCatCount) {
          maxCatCount = count;
          topCategory = cat;
        }
      }

      const avgSeverity = d.totalRequests > 0 
        ? Math.round((d.totalSeverity / d.totalRequests) * 10) / 10 
        : 0;

      return {
        district: d.district,
        state: d.state,
        totalRequests: d.totalRequests,
        avgSeverity,
        topCategory,
        categories: d.categories
      };
    });

    // Sort by totalRequests descending and take top 20
    result.sort((a, b) => b.totalRequests - a.totalRequests);
    const top20 = result.slice(0, 20);

    res.json({ success: true, data: top20 });
  } catch (error) {
    console.error('Error fetching district demand:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch district demand data'
    });
  }
};
