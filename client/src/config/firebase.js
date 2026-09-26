import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

/**
 * Firebase Client SDK Configuration (BharatSanket AI)
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBjBNNCchvuhKskw7Ecb6ZpqvTA5UeuJdU",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "bharatsanket-ai.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "bharatsanket-ai",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "bharatsanket-ai.appspot.com",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:258975963909:web:bharatsanket-ai"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });


/**
 * Helper: Sync/Upsert user profile in Firestore
 */
export async function syncUserProfile(user, role = 'citizen', extraData = {}) {
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);
  const nowIso = new Date().toISOString();

  let userProfile = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || (role === 'official' ? 'Government Official' : 'Bharat Citizen'),
    photoURL: user.photoURL || '',
    role: role,
    lastLoginAt: nowIso,
    ...extraData
  };

  if (userSnap.exists()) {
    const existing = userSnap.data();
    userProfile = {
      ...existing,
      ...extraData,
      role: existing.role || role,
      lastLoginAt: nowIso
    };
    await setDoc(userRef, userProfile, { merge: true });
  } else {
    userProfile.createdAt = nowIso;
    await setDoc(userRef, userProfile);
  }

  return userProfile;
}

/**
 * Sign in with Google and assign selected role ('citizen' or 'official')
 */
export async function loginWithGoogleRole(role = 'citizen') {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    const profile = await syncUserProfile(user, role);
    return { user, profile };
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
}

/**
 * Sign in with Email and Password
 */
export async function loginWithEmailPassword(email, password) {
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const user = credential.user;
    
    // Fetch profile to know role
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    let profile;
    if (userSnap.exists()) {
      profile = userSnap.data();
    } else {
      // Default to citizen if document not created
      profile = await syncUserProfile(user, 'citizen');
    }
    return { user, profile };
  } catch (error) {
    console.error('Email Login Error:', error);
    throw error;
  }
}

/**
 * Register with Email and Password and save role to Firestore
 */
export async function registerWithEmailPassword(email, password, role = 'citizen', displayName = '') {
  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const user = credential.user;
    if (displayName) {
      await updateProfile(user, { displayName });
    }
    const profile = await syncUserProfile(user, role, displayName ? { displayName } : {});
    return { user, profile };
  } catch (error) {
    console.error('Email Register Error:', error);
    throw error;
  }
}

/**
 * Log out user
 */
export async function logoutUser() {
  await signOut(auth);
}

export { 
  app, 
  auth, 
  db, 
  storage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  googleProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword 
};


