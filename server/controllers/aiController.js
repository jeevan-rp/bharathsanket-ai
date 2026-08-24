const CitizenRequest = require('../models/CitizenRequest');
const GovDataset = require('../models/GovDataset');
const geminiService = require('../services/geminiService');

/**
 * POST /api/ai/recommend
 * 
 * This is the core AI-powered policy recommendation endpoint.
 * 
 * How it works:
 * 1. Fetches ALL citizen requests and government infrastructure data from MongoDB
 * 2. Aggregates citizen requests by district (volume, category breakdown, avg severity)
 * 3. Sends this combined dataset to Gemini AI
 * 4. Gemini cross-references demand patterns against infrastructure indices
 * 5. Returns the top 3 recommended projects for policymakers
 * 
 * This is where Gemini does the real "heavy lifting" for policy intelligence —
 * it identifies patterns a human analyst might miss and generates actionable
 * project recommendations with justifications in seconds.
 */
exports.getRecommendations = async (req, res) => {
  try {
    console.log('\n🔬 Generating AI policy recommendations...');
    console.log('   Fetching citizen requests and government data...');

    // Fetch all data in parallel for speed
    const [citizenRequests, govData] = await Promise.all([
      CitizenRequest.find().lean(),
      GovDataset.find().lean()
    ]);

    console.log(`   📊 Found ${citizenRequests.length} requests, ${govData.length} districts in dataset`);

    if (citizenRequests.length === 0) {
      return res.json({
        success: true,
        message: 'No citizen requests available yet. Submit some requests first to get AI recommendations.',
        data: []
      });
    }

    // ─── Gemini AI analyzes the combined dataset ───
    // The AI receives:
    // - Aggregated citizen demand (volume, severity, categories per district)
    // - Current infrastructure index per district (1-10 scale)
    // - Budget allocation and population data
    //
    // It then identifies the most impactful projects by finding
    // districts where HIGH demand meets LOW infrastructure.
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
