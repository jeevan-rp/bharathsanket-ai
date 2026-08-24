require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

const requestRoutes = require('./routes/requests');
const aiRoutes = require('./routes/ai');

const app = express();
const PORT = process.env.PORT || 8080;

// ─── Middleware ───
app.use(cors({ origin: '*', methods: ['GET', 'POST'] }));
app.use(express.json({ limit: '1mb' }));

// ─── API Routes ───
app.use('/api/requests', requestRoutes);
app.use('/api/ai', aiRoutes);

// Health check endpoint (useful for Cloud Run monitoring)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'BharatSanket AI',
    timestamp: new Date().toISOString(),
    dbStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// ─── Serve React Frontend (Production) ───
// In production (Cloud Run), serve the built React app as static files.
// The Dockerfile copies the Vite build into server/public/
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));

// SPA fallback: serve index.html for any non-API route
app.get('*', (req, res) => {
  // Don't intercept API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(publicPath, 'index.html'), (err) => {
    if (err) {
      // If index.html doesn't exist (dev mode), return helpful message
      res.status(200).json({
        message: 'BharatSanket AI API is running. Start the React dev server for the frontend.',
        apiDocs: {
          postRequests: 'POST /api/requests — Submit citizen request',
          getRequests: 'GET /api/requests — Fetch all requests',
          getDistricts: 'GET /api/requests/districts — District demand data',
          recommend: 'POST /api/ai/recommend — AI policy recommendations'
        }
      });
    }
  });
});

// ─── Global Error Handler ───
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// ─── Database Connection & Server Start ───
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/bharatsanket';

async function start() {
  try {
    console.log('\n========================================');
    console.log('  🇮🇳  BharatSanket AI - Server Starting');
    console.log('========================================\n');

    // Connect to MongoDB Atlas (or local MongoDB for dev)
    console.log(`📡 Connecting to MongoDB...`);
    await mongoose.connect(MONGO_URI);
    console.log(`✅ MongoDB connected successfully`);

    // Start Express server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n🚀 Server running on http://0.0.0.0:${PORT}`);
      console.log(`   API: http://localhost:${PORT}/api/health`);
      console.log(`   Gemini AI: ${process.env.GEMINI_API_KEY ? '✅ Configured' : '⚠️  No API key set'}\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

start();
