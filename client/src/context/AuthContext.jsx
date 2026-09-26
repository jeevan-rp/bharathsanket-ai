import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { 
  auth, 
  db, 
  loginWithGoogleRole, 
  loginWithEmailPassword, 
  registerWithEmailPassword, 
  logoutUser 
} from '../config/firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserProfile(userDoc.data());
          } else {
            // Fallback profile if record not yet synced
            setUserProfile({
              uid: user.uid,
              email: user.email,
              displayName: user.displayName || 'Citizen',
              photoURL: user.photoURL || '',
              role: 'citizen'
            });
          }
        } catch (err) {
          console.error('Failed to fetch user profile:', err);
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginAs = async (role) => {
    setLoading(true);
    try {
      const { user, profile } = await loginWithGoogleRole(role);
      setCurrentUser(user);
      setUserProfile(profile);
      return profile;
    } finally {
      setLoading(false);
    }
  };

  const loginWithEmail = async (email, password) => {
    setLoading(true);
    try {
      const { user, profile } = await loginWithEmailPassword(email, password);
      setCurrentUser(user);
      setUserProfile(profile);
      return profile;
    } finally {
      setLoading(false);
    }
  };

  const registerWithEmail = async (email, password, role, displayName) => {
    setLoading(true);
    try {
      const { user, profile } = await registerWithEmailPassword(email, password, role, displayName);
      setCurrentUser(user);
      setUserProfile(profile);
      return profile;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await logoutUser();
    setCurrentUser(null);
    setUserProfile(null);
  };

  const value = {
    currentUser,
    userProfile,
    loading,
    loginAs,
    loginWithEmail,
    registerWithEmail,
    logout,
    isAuthenticated: !!currentUser,
    role: userProfile?.role || null
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading ? children : (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400 font-medium">Authenticating BharatSanket AI...</p>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

