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

  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      credential = cert(serviceAccount);
    } catch (err) {
      console.warn('⚠️  Could not parse FIREBASE_SERVICE_ACCOUNT_KEY JSON string:', err.message);
    }
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH) {
    const resolvedPath = path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH);
    if (fs.existsSync(resolvedPath)) {
      const fileContent = fs.readFileSync(resolvedPath, 'utf8');
      const serviceAccount = JSON.parse(fileContent);
      credential = cert(serviceAccount);
    } else {
      console.warn(`⚠️  Service account file not found at: ${resolvedPath}`);
    }
  } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    credential = cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    });
  }

  if (credential) {
    console.log('🔥 Initializing Firebase with service account credentials...');
    return initializeApp({ credential });
  }

  if (process.env.FIREBASE_PROJECT_ID) {
    console.log(`🔥 Initializing Firebase with Project ID: ${process.env.FIREBASE_PROJECT_ID}`);
    return initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID
    });
  }

  console.log('🔥 Initializing Firebase with Application Default Credentials...');
  return initializeApp();
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
