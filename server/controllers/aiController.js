const { citizenRequestsRef, govDatasetsRef } = require('../config/firebase');
const geminiService = require('../services/geminiService');

/**
 * POST /api/ai/recommend
 * 
 * This is the core AI-powered policy recommendation endpoint.
 * 
 * How it works:
 * 1. Fetches ALL citizen requests and government infrastructure data from Firestore
 * 2. Aggregates citizen requests by district (volume, category breakdown, avg severity)
 * 3. Sends this combined dataset to Gemini AI
 * 4. Gemini cross-references demand patterns against infrastructure indices
 * 5. Returns the top 3 recommended projects for policymakers
 */
exports.getRecommendations = async (req, res) => {
  try {
    console.log('\n🔬 Generating AI policy recommendations...');
    console.log('   Fetching citizen requests and government data from Firestore...');

    // Fetch all data in parallel for speed
    const [requestsSnapshot, govSnapshot] = await Promise.all([
      citizenRequestsRef.get(),
      govDatasetsRef.get()
    ]);

    const citizenRequests = [];
    requestsSnapshot.forEach(doc => {
      citizenRequests.push({ _id: doc.id, ...doc.data() });
    });

    const govData = [];
    govSnapshot.forEach(doc => {
      govData.push({ _id: doc.id, ...doc.data() });
    });

    console.log(`   📊 Found ${citizenRequests.length} requests, ${govData.length} districts in dataset`);

    if (citizenRequests.length === 0) {
      return res.json({
        success: true,
        message: 'No citizen requests available yet. Submit some requests first to get AI recommendations.',
        data: []
      });
    }

    // ─── Gemini AI analyzes the combined dataset ───
    console.log('   🤖 Sending aggregated data to Gemini AI for analysis...');
    const recommendations = await geminiService.generateRecommendations(
      citizenRequests,
      govData
    );
    console.log(`   ✅ Gemini returned ${recommendations.length} recommendations`);

    res.json({
      success: true,
      meta: {
        requestsAnalyzed: citizenRequests.length,
        districtsCompared: govData.length,
        generatedAt: new Date().toISOString()
      },
      data: recommendations
    });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate AI recommendations'
    });
  }
};

/**
 * POST /api/ai/briefing
 * Generates an authoritative municipal commissioner executive briefing
 * synthesized across real-time grievance records.
 */
exports.getExecutiveBriefing = async (req, res) => {
  try {
    let reports = req.body?.reports;
    if (!reports || !Array.isArray(reports) || reports.length === 0) {
      const { infrastructureReportsRef } = require('../config/firebase');
      const snapshot = await infrastructureReportsRef.get();
      reports = [];
      snapshot.forEach(doc => {
        reports.push({ _id: doc.id, ...doc.data() });
      });
    }

    const briefing = await geminiService.generateExecutiveBriefing(reports);

    res.json({
      success: true,
      data: briefing,
      meta: {
        totalReports: reports.length,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error generating executive briefing:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate executive briefing'
    });
  }
};
