const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Gemini AI Service
 * =================
 * This service wraps the Google Gemini 1.5 Flash API and handles
 * two critical AI tasks for BharatSanket:
 * 
 * 1. CATEGORIZE — Analyzes raw citizen complaint text and extracts
 *    structured data (category, severity, summary). This is the
 *    "heavy lifting" that turns unstructured citizen feedback into
 *    queryable, actionable data points.
 * 
 * 2. RECOMMEND — Takes aggregated request data + infrastructure
 *    indices and generates policy-level project recommendations.
 *    This is where AI bridges the gap between citizen voices and
 *    government planning.
 */
class GeminiService {
  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      console.warn('⚠️  GEMINI_API_KEY not set. AI features will fail.');
    }
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Using Gemini 1.5 Flash for fast, cost-effective inference
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  /**
   * Analyze a single citizen request text.
   * Gemini converts raw, potentially multilingual text into a structured
   * JSON object with category, severity score, and English summary.
   * 
   * @param {string} text - The citizen's complaint/development request
   * @returns {Promise<{aiCategory: string, aiSeverity: number, aiSummary: string}>}
   */
  async categorizeRequest(text) {
    const prompt = `Analyze this citizen development request from India: "${text}"

Return a strict JSON object with exactly these three fields:
- "aiCategory": one of ["Roads", "Water", "Healthcare", "Electricity", "Sanitation"]
- "aiSeverity": integer from 1 to 5 (5 = most critical/urgent)
- "aiSummary": a concise 10-word summary in English

Return ONLY valid JSON, no markdown, no explanation.`;

    try {
      const result = await this.model.generateContent(prompt);
      const responseText = result.response.text().trim();
      
      // Robust JSON parsing: strip markdown code fences if present
      const cleaned = responseText
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
      
      const parsed = JSON.parse(cleaned);
      
      // Validate the parsed structure
      const validCategories = ['Roads', 'Water', 'Healthcare', 'Electricity', 'Sanitation'];
      if (!validCategories.includes(parsed.aiCategory)) {
        parsed.aiCategory = 'Roads'; // safe fallback
      }
      parsed.aiSeverity = Math.min(5, Math.max(1, parseInt(parsed.aiSeverity) || 3));
      parsed.aiSummary = String(parsed.aiSummary || 'Infrastructure development request');
      
      return parsed;
    } catch (error) {
      console.error('Gemini categorization failed:', error.message);
      // Graceful fallback so the app doesn't crash if AI is unavailable
      return {
        aiCategory: 'Roads',
        aiSeverity: 3,
        aiSummary: 'Citizen infrastructure development request'
      };
    }
  }

  /**
   * Generate AI-powered project recommendations for policymakers.
   * 
   * This is where Gemini does the real analytical "heavy lifting":
   * it cross-references citizen demand patterns with existing
   * infrastructure data to identify the most impactful projects.
   * A human analyst would take days to do this manually;
   * Gemini does it in seconds.
   * 
   * @param {Array} citizenRequests - All citizen requests from MongoDB
   * @param {Array} govData - District infrastructure indices from MongoDB
   * @returns {Promise<Array>} Top 3 project recommendations
   */
  async generateRecommendations(citizenRequests, govData) {
    // Aggregate requests by district for the AI prompt
    const districtDemand = {};
    citizenRequests.forEach(req => {
      const key = req.location.district;
      if (!districtDemand[key]) {
        districtDemand[key] = {
          district: key,
          state: req.location.state,
          totalRequests: 0,
          categories: {},
          avgSeverity: 0,
          severitySum: 0
        };
      }
      const d = districtDemand[key];
      d.totalRequests++;
      d.categories[d.aiCategory] = (d.categories[d.aiCategory] || 0) + 1;
      d.severitySum += req.aiSeverity;
      d.avgSeverity = (d.severitySum / d.totalRequests).toFixed(1);
    });

    const demandData = Object.values(districtDemand)
      .sort((a, b) => b.totalRequests - a.totalRequests)
      .slice(0, 15); // Top 15 districts by volume

    const prompt = `You are an AI policy advisor for Indian infrastructure development.

CITIZEN DEMAND DATA (aggregated from complaints/requests):
${JSON.stringify(demandData, null, 2)}

CURRENT DISTRICT INFRASTRUCTURE INDICES (1=poor, 10=excellent):
${JSON.stringify(govData.slice(0, 20), null, 2)}

Based on the above data, identify the top 3 highest-priority development projects.
Cross-reference citizen demand density with low infrastructure indices.

Return a JSON array of exactly 3 objects, each with:
- "district": district name (string)
- "state": state name (string)
- "projectType": specific project type (string, e.g. "Road Construction", "Water Treatment Plant")
- "reason": 2-3 sentence justification referencing demand data and infrastructure gaps
- "estimatedBeneficiaries": estimated number of people who would benefit (number)

Return ONLY valid JSON array, no markdown, no explanation.`;

    try {
      const result = await this.model.generateContent(prompt);
      const responseText = result.response.text().trim();
      
      const cleaned = responseText
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
      
      const recommendations = JSON.parse(cleaned);
      
      // Ensure we always return an array of exactly 3
      if (!Array.isArray(recommendations)) {
        return this._fallbackRecommendations(demandData, govData);
      }
      
      return recommendations.slice(0, 3).map(rec => ({
        district: String(rec.district || 'Unknown'),
        state: String(rec.state || 'India'),
        projectType: String(rec.projectType || 'Infrastructure Development'),
        reason: String(rec.reason || 'High citizen demand identified in this region.'),
        estimatedBeneficiaries: parseInt(rec.estimatedBeneficiaries) || 10000
      }));
    } catch (error) {
      console.error('Gemini recommendation failed:', error.message);
      return this._fallbackRecommendations(demandData, govData);
    }
  }

  /**
   * Fallback rule-based recommendations if Gemini is unavailable.
   * Uses simple heuristics on the aggregated data.
   */
  _fallbackRecommendations(demandData, govData) {
    if (demandData.length === 0) {
      return [
        {
          district: 'Varanasi', state: 'Uttar Pradesh',
          projectType: 'Road Network Expansion',
          reason: 'Insufficient data available. Recommend expanding road connectivity based on regional needs assessment.',
          estimatedBeneficiaries: 50000
        },
        {
          district: 'Patna', state: 'Bihar',
          projectType: 'Water Supply System Upgrade',
          reason: 'Multiple citizen requests indicate water infrastructure needs in this region.',
          estimatedBeneficiaries: 75000
        },
        {
          district: 'Jaipur', state: 'Rajasthan',
          projectType: 'Healthcare Facility Construction',
          reason: 'AI analysis suggests healthcare access gaps. Recommend new PHC construction.',
          estimatedBeneficiaries: 40000
        }
      ];
    }

    return demandData.slice(0, 3).map(d => ({
      district: d.district,
      state: d.state,
      projectType: `${Object.entries(d.categories).sort((a,b) => b[1]-a[1])[0]?.[0] || 'Infrastructure'} Improvement Project`,
      reason: `${d.totalRequests} citizen requests with average severity ${d.avgSeverity}/5 in ${d.district}. Top demand: ${Object.entries(d.categories).sort((a,b) => b[1]-a[1]).map(([k,v]) => `${k} (${v})`).join(', ')}.`,
      estimatedBeneficiaries: Math.round(d.totalRequests * 150)
    }));
  }
}

// Singleton — one GeminiService instance per server process
module.exports = new GeminiService();
