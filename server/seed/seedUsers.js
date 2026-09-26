/**
 * BharatSanket AI - Demo Users Seed Script
 * ========================================
 * Programmatically creates or updates Demo Accounts in Firebase Auth & Firestore:
 * 1. Citizen: Rajesh Kumar (citizen@bharatsanket.in / Demo@123) -> role: 'citizen'
 * 2. Official: Priya Sharma (official@bharatsanket.in / Admin@123) -> role: 'official'
 * 
 * Execution:
 *   node server/seed/seedUsers.js
 */

require('dotenv').config();
const { getAuth } = require('firebase-admin/auth');
const { app, db } = require('../config/firebase');

const auth = getAuth(app);
const usersRef = db.collection('users');

const DEMO_USERS = [
  {
    email: 'citizen@bharatsanket.in',
    password: 'Demo@123',
    displayName: 'Rajesh Kumar',
    role: 'citizen',
    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  },
  {
    email: 'official@bharatsanket.in',
    password: 'Admin@123',
    displayName: 'Priya Sharma',
    role: 'official',
    photoURL: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
  }
];

async function seedDemoUsers() {
  console.log('🇮🇳 [BharatSanket AI] Seeding Demo User Accounts into Firebase Auth & Firestore...\n');

  for (const account of DEMO_USERS) {
    try {
      let userRecord;
      try {
        userRecord = await auth.getUserByEmail(account.email);
        console.log(`ℹ️  User already exists in Auth: ${account.email} (UID: ${userRecord.uid}). Updating password & profile...`);
        userRecord = await auth.updateUser(userRecord.uid, {
          password: account.password,
          displayName: account.displayName,
          photoURL: account.photoURL
        });
      } catch (notFoundErr) {
        if (notFoundErr.code === 'auth/user-not-found') {
          console.log(`✨ Creating user in Auth: ${account.email}...`);
          userRecord = await auth.createUser({
            email: account.email,
            password: account.password,
            displayName: account.displayName,
            photoURL: account.photoURL,
            emailVerified: true
          });
        } else {
          throw notFoundErr;
        }
      }

      // Upsert profile in Firestore 'users' collection
      const userDocRef = usersRef.doc(userRecord.uid);
      const nowIso = new Date().toISOString();

      await userDocRef.set({
        uid: userRecord.uid,
        email: account.email,
        displayName: account.displayName,
        photoURL: account.photoURL,
        role: account.role,
        updatedAt: nowIso,
        createdAt: nowIso
      }, { merge: true });

      console.log(`✅ [${account.role.toUpperCase()}] Seeded: ${account.displayName} (${account.email}) -> UID: ${userRecord.uid}`);
    } catch (err) {
      console.error(`❌ Failed to seed ${account.email}:`, err.message);
    }
  }

  console.log('\n🎉 Demo User Seeding Completed Successfully!\n');
}

seedDemoUsers()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal seeding error:', err);
    process.exit(1);
  });
