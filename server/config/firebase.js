const { initializeApp, cert, getApps, getApp } = require('firebase-admin/app');
const { getFirestore, GeoPoint } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

/**
 * Firebase Admin & Firestore Initialization
 * 
 * Flexible credentials support:
 * 1. FIREBASE_SERVICE_ACCOUNT_KEY: JSON string in environment variable
 * 2. FIREBASE_SERVICE_ACCOUNT_KEY_PATH: Path to service account JSON file
 * 3. FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY: Individual env variables
 * 4. Fallback to FIREBASE_PROJECT_ID or Application Default Credentials (ADC)
 */

function initializeFirebase() {
  const apps = getApps();
  if (apps.length > 0) {
    return apps[0];
  }

  let credential = null;

  // Option 1: Full JSON string or base64 encoded JSON string
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      let rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY.trim();
      // Handle possible extra quoting from env vars
      if (rawKey.startsWith("'") && rawKey.endsWith("'")) {
        rawKey = rawKey.slice(1, -1);
      }
      // Decode base64 if not starting with JSON brace
      if (!rawKey.startsWith('{')) {
        try {
          const decoded = Buffer.from(rawKey, 'base64').toString('utf8');
          if (decoded.startsWith('{')) {
            rawKey = decoded;
          }
        } catch (_) {}
      }
      const serviceAccount = JSON.parse(rawKey);
      credential = cert(serviceAccount);
      console.log(`🔥 Initialized Firebase from FIREBASE_SERVICE_ACCOUNT_KEY for project: ${serviceAccount.project_id}`);
    } catch (err) {
      console.warn('⚠️  Could not parse FIREBASE_SERVICE_ACCOUNT_KEY JSON string:', err.message);
    }
  }

  // Option 2: Local file path
  if (!credential && process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH) {
    const resolvedPath = path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH);
    if (fs.existsSync(resolvedPath)) {
      try {
        const fileContent = fs.readFileSync(resolvedPath, 'utf8');
        const serviceAccount = JSON.parse(fileContent);
        credential = cert(serviceAccount);
        console.log(`🔥 Initialized Firebase from key file at: ${resolvedPath}`);
      } catch (err) {
        console.warn('⚠️  Could not parse service account file:', err.message);
      }
    } else {
      console.warn(`⚠️  Service account file not found at: ${resolvedPath}`);
    }
  }

  // Option 3: Individual env variables
  if (!credential && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    try {
      let privateKey = process.env.FIREBASE_PRIVATE_KEY.trim();
      if ((privateKey.startsWith('"') && privateKey.endsWith('"')) || (privateKey.startsWith("'") && privateKey.endsWith("'"))) {
        privateKey = privateKey.slice(1, -1);
      }
      privateKey = privateKey.replace(/\\n/g, '\n');
      const projectId = process.env.FIREBASE_PROJECT_ID || 'bharatsanket-ai-01';
      credential = cert({
        projectId,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL.trim(),
        privateKey
      });
      console.log(`🔥 Initialized Firebase with clientEmail and privateKey for project: ${projectId}`);
    } catch (err) {
      console.warn('⚠️  Failed to create cert from individual credentials:', err.message);
    }
  }

  if (credential) {
    return initializeApp({ credential });
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || 'bharatsanket-ai-01';

  if (process.env.VERCEL) {
    console.warn(`⚠️  [Vercel Serverless] Running without Firebase Admin Service Account credentials!`);
    console.warn(`   Firestore queries will fail with 500 until FIREBASE_SERVICE_ACCOUNT_KEY is configured in Vercel settings.`);
  }

  console.log(`🔥 Initializing Firebase with Project ID: ${projectId} (ADC/Default)`);
  return initializeApp({ projectId });
}

const app = initializeFirebase();
const db = getFirestore(app);

// Enable ignoreUndefinedProperties to prevent errors when optional payload fields are missing
db.settings({ ignoreUndefinedProperties: true });

// Collection references
const citizenRequestsRef = db.collection('citizen_requests');
const infrastructureReportsRef = db.collection('infrastructure_reports');
const govDatasetsRef = db.collection('gov_datasets');

module.exports = {
  app,
  db,
  GeoPoint,
  citizenRequestsRef,
  infrastructureReportsRef,
  govDatasetsRef
};
