const { infrastructureReportsRef, citizenRequestsRef, GeoPoint } = require('../config/firebase');
const geminiService = require('../services/geminiService');

/**
 * Report Controller for Samvaad Infra-AI
 * Handles parsing, Firestore persistence with GeoPoints, and hotspot querying.
 */

/**
 * POST /api/reports
 * Takes unstructured, multilingual text (or speech transcript) from a citizen,
 * passes it through the Gemini AI parsing pipeline, converts coordinates into a
 * native Firestore GeoPoint, and saves the record.
 */
exports.createReport = async (req, res) => {
  try {
    const { text, imageUrl, language, clientCoordinates, userId, userEmail, userName } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length < 5) {
      return res.status(400).json({
        success: false,
        error: 'Complaint text must be at least 5 characters.'
      });
    }

    console.log(`\n📢 [BharatSanket AI] New Report Received: "${text.substring(0, 80)}..."`);
    if (userId) {
      console.log(`   👤 Submitter: ${userName || 'Citizen'} (${userEmail || userId})`);
    }
    if (imageUrl) {
      console.log(`   🖼️  Visual Evidence Attached: ${imageUrl.substring(0, 70)}...`);
    }

    // ─── 1. Gemini AI Multimodal Geospatial & Visual Extraction ───
    const parsed = await geminiService.parseInfrastructureReport(text.trim(), imageUrl || null);
    console.log(`   🤖 Gemini extracted category: ${parsed.intentCategory}, severity: ${parsed.severityLevel}/5`);
    console.log(`   📍 Location: ${parsed.extractedLocation.rawLocationText} -> ${parsed.extractedLocation.cityOrDistrict}, ${parsed.extractedLocation.state}`);
    console.log(`   🌐 Coordinates: (${parsed.estimatedCoordinates.lat}, ${parsed.estimatedCoordinates.lng})`);
    if (parsed.visualVerification) {
      console.log(`   🔍 Visual Confirmation: ${parsed.visualVerification.matchesComplaint ? 'MATCH' : 'NO_MATCH/UNVERIFIED'} (Confidence: ${(parsed.visualVerification.confidenceScore * 100).toFixed(0)}%)`);
    }

    // Override with client coordinates if accurate GPS was provided
    let finalLat = parsed.estimatedCoordinates.lat;
    let finalLng = parsed.estimatedCoordinates.lng;
    if (clientCoordinates && typeof clientCoordinates.lat === 'number' && typeof clientCoordinates.lng === 'number') {
      finalLat = clientCoordinates.lat;
      finalLng = clientCoordinates.lng;
    }

    // ─── 2. Native Firestore GeoPoint ───
    const geoPoint = new GeoPoint(finalLat, finalLng);
    const nowIso = new Date().toISOString();

    const reportDocument = {
      userId: userId || null,
      userEmail: userEmail || null,
      userName: userName || null,
      rawInput: text.trim(),
      imageUrl: imageUrl || null,
      visualVerification: parsed.visualVerification || null,
      detectedLanguage: parsed.detectedLanguage || language || 'Unknown',
      intentCategory: parsed.intentCategory,
      severityLevel: parsed.severityLevel,
      extractedLocation: parsed.extractedLocation,
      estimatedCoordinates: {
        lat: finalLat,
        lng: finalLng
      },
      geoPoint, // Native Firebase GeoPoint for spatial queries
      summary: parsed.summary,
      status: 'Pending',
      statusHistory: [
        {
          status: 'Pending',
          updatedAt: nowIso,
          updatedBy: userName || userEmail || 'Citizen Reporter',
          note: 'Initial complaint filed and verified by AI.'
        }
      ],
      impactScore: 1, // Start with 1 from original reporter
      upvotes: userId ? [userId] : [],
      createdAt: nowIso,

      // Backwards-compatibility fields for legacy dashboard / MapView
      originalText: text.trim(),
      language: parsed.detectedLanguage,
      location: {
        lat: finalLat,
        lng: finalLng,
        district: parsed.extractedLocation.cityOrDistrict || 'Unknown',
        state: parsed.extractedLocation.state || 'India'
      },
      aiCategory: parsed.intentCategory,
      aiSeverity: parsed.severityLevel,
      aiSummary: parsed.summary,
      timestamp: nowIso
    };

    // Save to primary infrastructure_reports collection
    const docRef = await infrastructureReportsRef.add(reportDocument);

    // Also mirror to citizen_requests collection to keep existing endpoints in sync
    await citizenRequestsRef.doc(docRef.id).set(reportDocument);

    const savedResponse = {
      _id: docRef.id,
      id: docRef.id,
      ...reportDocument,
      geoPoint: {
        latitude: finalLat,
        longitude: finalLng
      }
    };

    return res.status(201).json({
      success: true,
      data: savedResponse,
      message: `Report parsed and logged as ${parsed.intentCategory} in ${parsed.extractedLocation.cityOrDistrict || 'India'}`
    });
  } catch (error) {
    console.error('Error creating infrastructure report:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process infrastructure report',
      details: error.message
    });
  }
};

/**
 * PATCH /api/reports/:id/upvote
 * Community trust loop: allows citizens to upvote/confirm existing issues,
 * preventing duplicates and boosting impactScore.
 */
exports.upvoteReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!id) {
      return res.status(400).json({ success: false, error: 'Report ID is required' });
    }

    const docRef = infrastructureReportsRef.doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }

    const data = docSnap.data();
    const upvotes = Array.isArray(data.upvotes) ? data.upvotes : [];
    let currentImpact = typeof data.impactScore === 'number' ? data.impactScore : 1;

    // Toggle upvote or prevent duplicates if userId is provided
    let hasUpvoted = false;
    if (userId) {
      if (upvotes.includes(userId)) {
        // Already upvoted -> remove upvote (toggle off)
        const updatedUpvotes = upvotes.filter(uid => uid !== userId);
        currentImpact = Math.max(1, currentImpact - 1);
        await docRef.update({
          impactScore: currentImpact,
          upvotes: updatedUpvotes
        });
        await citizenRequestsRef.doc(id).update({
          impactScore: currentImpact,
          upvotes: updatedUpvotes
        }).catch(() => {});

        return res.json({
          success: true,
          action: 'removed',
          impactScore: currentImpact,
          upvotes: updatedUpvotes,
          message: 'Upvote removed'
        });
      } else {
        upvotes.push(userId);
        hasUpvoted = true;
      }
    }

    const newImpact = currentImpact + 1;
    await docRef.update({
      impactScore: newImpact,
      upvotes: upvotes
    });

    await citizenRequestsRef.doc(id).update({
      impactScore: newImpact,
      upvotes: upvotes
    }).catch(() => {});

    return res.json({
      success: true,
      action: 'added',
      impactScore: newImpact,
      upvotes,
      message: 'Complaint upvoted successfully'
    });
  } catch (error) {
    console.error('Error upvoting report:', error);
    return res.status(500).json({ success: false, error: 'Failed to upvote report' });
  }
};

/**
 * PATCH /api/reports/:id/status
 * Official status workflow: allows officials to update status ('Pending' | 'In Progress' | 'Resolved')
 * and records an audit log entry in statusHistory.
 */
exports.updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note, officerName, officerEmail } = req.body;

    const validStatuses = ['Pending', 'In Progress', 'Resolved'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const docRef = infrastructureReportsRef.doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }

    const data = docSnap.data();
    const history = Array.isArray(data.statusHistory) ? data.statusHistory : [];
    const nowIso = new Date().toISOString();

    const historyEntry = {
      status,
      updatedAt: nowIso,
      updatedBy: officerName || officerEmail || 'Government Official',
      note: note || `Status updated to ${status}`
    };

    const updatedHistory = [...history, historyEntry];

    await docRef.update({
      status,
      statusHistory: updatedHistory,
      updatedAt: nowIso
    });

    await citizenRequestsRef.doc(id).update({
      status,
      statusHistory: updatedHistory,
      updatedAt: nowIso
    }).catch(() => {});

    return res.json({
      success: true,
      data: {
        id,
        status,
        statusHistory: updatedHistory,
        updatedAt: nowIso
      },
      message: `Report status updated to "${status}"`
    });
  } catch (error) {
    console.error('Error updating report status:', error);
    return res.status(500).json({ success: false, error: 'Failed to update status' });
  }
};

/**
 * GET /api/reports
 * Returns list of infrastructure reports for policymaker dashboard.
 */
exports.getReports = async (req, res) => {
  try {
    const { category, severity, userId } = req.query;

    let query = infrastructureReportsRef;
    if (userId) {
      query = query.where('userId', '==', userId);
    }
    if (category && category !== 'all') {
      query = query.where('intentCategory', '==', category);
    }
    if (severity && severity !== 'all') {
      query = query.where('severityLevel', '==', parseInt(severity));
    }

    const snapshot = await query.get();
    const reports = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      reports.push({
        _id: doc.id,
        id: doc.id,
        ...data,
        geoPoint: data.geoPoint ? {
          latitude: data.geoPoint.latitude,
          longitude: data.geoPoint.longitude
        } : null
      });
    });

    // In-memory sort by timestamp descending
    reports.sort((a, b) => new Date(b.createdAt || b.timestamp || 0) - new Date(a.createdAt || a.timestamp || 0));

    // Calculate analytics metrics
    const categoryCounts = {};
    let totalSeverity = 0;
    reports.forEach(r => {
      const cat = r.intentCategory || r.aiCategory || 'Other';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      totalSeverity += (r.severityLevel || r.aiSeverity || 0);
    });

    const total = reports.length;
    const avgSeverity = total > 0 ? (totalSeverity / total).toFixed(1) : '0.0';

    return res.json({
      success: true,
      count: total,
      stats: {
        total,
        avgSeverity,
        byCategory: categoryCounts
      },
      data: reports
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch infrastructure reports',
      details: error.message
    });
  }
};

/**
 * GET /api/reports/hotspots
 * Aggregates hotspots by city/district with severity weighting
 */
exports.getHotspots = async (req, res) => {
  try {
    const snapshot = await infrastructureReportsRef.get();
    const hotspotMap = new Map();

    snapshot.forEach(doc => {
      const data = doc.data();
      const district = data.extractedLocation?.cityOrDistrict || data.location?.district;
      const state = data.extractedLocation?.state || data.location?.state || '';
      if (!district) return;

      if (!hotspotMap.has(district)) {
        hotspotMap.set(district, {
          district,
          state,
          totalReports: 0,
          totalSeverity: 0,
          categories: {},
          coordinates: data.estimatedCoordinates || { lat: data.location?.lat, lng: data.location?.lng }
        });
      }

      const h = hotspotMap.get(district);
      h.totalReports += 1;
      const sev = data.severityLevel || data.aiSeverity || 3;
      h.totalSeverity += sev;
      const cat = data.intentCategory || data.aiCategory || 'General';
      h.categories[cat] = (h.categories[cat] || 0) + 1;
    });

    const results = Array.from(hotspotMap.values()).map(h => {
      let topCategory = 'Road';
      let maxCount = 0;
      for (const [c, count] of Object.entries(h.categories)) {
        if (count > maxCount) {
          maxCount = count;
          topCategory = c;
        }
      }
      return {
        district: h.district,
        state: h.state,
        totalRequests: h.totalReports,
        totalReports: h.totalReports,
        avgSeverity: h.totalReports > 0 ? Math.round((h.totalSeverity / h.totalReports) * 10) / 10 : 0,
        topCategory,
        categories: h.categories,
        coordinates: h.coordinates
      };
    });

    results.sort((a, b) => b.totalReports - a.totalReports);
    return res.json({ success: true, data: results.slice(0, 25) });
  } catch (error) {
    console.error('Error fetching hotspots:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch hotspots'
    });
  }
};
