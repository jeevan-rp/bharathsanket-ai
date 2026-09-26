import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

/**
 * Login Component (BharatSanket AI)
 * =================================
 * Dark glassmorphism landing & authentication page.
 * Enhanced with Framer Motion and glassmorphic design tokens:
 * - bg-white/10, backdrop-blur-lg, border border-white/20, shadow-2xl
 * - Fluid hover scaling (whileHover={{ scale: 1.02 }})
 */
export default function Login() {
  const { loginAs, loginWithEmail, registerWithEmail } = useAuth();
  const navigate = useNavigate();

  // State
  const [selectedRole, setSelectedRole] = useState('citizen'); // 'citizen' | 'official'
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loadingAction, setLoadingAction] = useState(null); // 'email' | 'google' | 'demo-citizen' | 'demo-official'
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Human-readable Firebase Auth error formatter
  const formatAuthError = (err) => {
    const code = err?.code || '';
    switch (code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'Invalid email or password. Please check your credentials or register.';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists. Please log in instead.';
      case 'auth/weak-password':
        return 'Password must be at least 6 characters long.';
      case 'auth/invalid-email':
        return 'Please provide a valid email address.';
      case 'auth/popup-closed-by-user':
        return 'Google sign-in popup was closed before completion.';
      case 'auth/configuration-not-found':
        return 'Firebase Authentication is not initialized or Google provider is disabled.';
      default:
        return err?.message || 'Authentication failed. Please try again.';
    }
  };

  const handleRouteRedirect = (role) => {
    if (role === 'official') {
      navigate('/official/dashboard');
    } else {
      navigate('/citizen/dashboard');
    }
  };

  // 1. Email / Password Submit (Login or Register)
  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email || !password) {
      setError('Please provide both email and password.');
      toast.error('Please provide both email and password.');
      return;
    }

    setLoadingAction('email');
    const toastId = toast.loading(authMode === 'login' ? 'Authenticating with BharatSanket AI...' : 'Creating your account...');

    try {
      if (authMode === 'login') {
        const profile = await loginWithEmail(email, password);
        toast.success(`Welcome back, ${profile.displayName || 'User'}!`, { id: toastId });
        handleRouteRedirect(profile.role || selectedRole);
      } else {
        const profile = await registerWithEmail(
          email, 
          password, 
          selectedRole, 
          displayName || (selectedRole === 'official' ? 'Official User' : 'Citizen User')
        );
        toast.success(`Account registered successfully as ${selectedRole}!`, { id: toastId });
        handleRouteRedirect(profile.role || selectedRole);
      }
    } catch (err) {
      console.error('Email authentication error:', err);
      const msg = formatAuthError(err);
      setError(msg);
      toast.error(msg, { id: toastId });
    } finally {
      setLoadingAction(null);
    }
  };

  // 2. Google Sign-In
  const handleGoogleLogin = async () => {
    setError('');
    setSuccessMsg('');
    setLoadingAction('google');
    const toastId = toast.loading('Connecting to Google Identity...');

    try {
      const profile = await loginAs(selectedRole);
      toast.success(`Signed in as ${profile.displayName || 'User'}!`, { id: toastId });
      handleRouteRedirect(profile.role || selectedRole);
    } catch (err) {
      console.error('Google sign-in error:', err);
      const msg = formatAuthError(err);
      setError(msg);
      toast.error(msg, { id: toastId });
    } finally {
      setLoadingAction(null);
    }
  };

  // 3. Demo Logins (Auto-fill & Auto-login with fallback account creation)
  const handleDemoLogin = async (demoRole) => {
    setError('');
    setSuccessMsg('');
    const actionKey = demoRole === 'citizen' ? 'demo-citizen' : 'demo-official';
    setLoadingAction(actionKey);
    const toastId = toast.loading(`Logging in as Demo ${demoRole === 'official' ? 'Official' : 'Citizen'}...`);

    const demoCreds = demoRole === 'citizen'
      ? { email: 'citizen@bharatsanket.in', password: 'Demo@123', name: 'Rajesh Kumar' }
      : { email: 'official@bharatsanket.in', password: 'Admin@123', name: 'Priya Sharma' };

    setEmail(demoCreds.email);
    setPassword(demoCreds.password);
    setSelectedRole(demoRole);

    try {
      // First attempt standard login
      const profile = await loginWithEmail(demoCreds.email, demoCreds.password);
      toast.success(`Demo access granted as ${profile.displayName || demoRole}!`, { id: toastId });
      handleRouteRedirect(profile.role || demoRole);
    } catch (loginErr) {
      // If user doesn't exist in Auth yet, auto-register the demo user seamlessly on the fly
      if (
        loginErr.code === 'auth/user-not-found' || 
        loginErr.code === 'auth/invalid-credential'
      ) {
        try {
          const newProfile = await registerWithEmail(
            demoCreds.email, 
            demoCreds.password, 
            demoRole, 
            demoCreds.name
          );
          toast.success(`Demo profile provisioned as ${demoRole}!`, { id: toastId });
          handleRouteRedirect(newProfile.role || demoRole);
          return;
        } catch (regErr) {
          console.error('Demo auto-provisioning error:', regErr);
          const msg = formatAuthError(regErr);
          setError(msg);
          toast.error(msg, { id: toastId });
        }
      } else {
        console.error('Demo login error:', loginErr);
        const msg = formatAuthError(loginErr);
        setError(msg);
        toast.error(msg, { id: toastId });
      }
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden">
      {/* ─── Ambient Glow Blobs ─── */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* ─── Glassmorphism Card Container ─── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-md bg-white/10 border border-white/20 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80"
      >
        
        {/* Header / National Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-semibold mb-4 backdrop-blur-md">
            <div className="flex h-3 w-4 rounded overflow-hidden shadow-sm">
              <div className="w-1/3 bg-orange-400" />
              <div className="w-1/3 bg-slate-100" />
              <div className="w-1/3 bg-emerald-500" />
            </div>
            <span className="text-slate-200">National Infrastructure Intelligence</span>
          </div>

          <h1 className="text-3xl font-black tracking-tight text-white mb-1.5">
            BharatSanket <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-emerald-400">AI</span>
          </h1>
          <p className="text-slate-300 text-xs leading-relaxed max-w-xs mx-auto">
            AI-powered civic grievance resolution bridging citizens & government authorities.
          </p>
        </div>

        {/* ─── 1. Role Toggle Pill (Citizen vs Official) ─── */}
        <div className="mb-6 p-1.5 bg-black/40 border border-white/15 rounded-2xl flex items-center shadow-inner backdrop-blur-md">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={() => setSelectedRole('citizen')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-200 ${
              selectedRole === 'citizen'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-orange-500/25'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>👤</span>
            <span>Citizen Portal</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={() => setSelectedRole('official')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-200 ${
              selectedRole === 'official'
                ? 'bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-lg shadow-indigo-500/25'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>🏛️</span>
            <span>Government Official</span>
          </motion.button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2 animate-fadeIn">
            <span className="text-sm">⚠️</span>
            <span className="leading-snug">{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2">
            <span>✅</span>
            <span>{successMsg}</span>
          </div>
        )}

        {/* ─── 2. Email & Password Form ─── */}
        <form onSubmit={handleEmailAuth} className="space-y-3.5 mb-5">
          {authMode === 'register' && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1 text-left">
                Full Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={selectedRole === 'official' ? 'e.g. Priya Sharma' : 'e.g. Rajesh Kumar'}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
              />
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1 text-left">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder={selectedRole === 'official' ? 'official@bharatsanket.in' : 'citizen@bharatsanket.in'}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-[11px] font-semibold text-slate-400 text-left">
                Password
              </label>
              {authMode === 'login' && (
                <span className="text-[10px] text-slate-500">Min 6 characters</span>
              )}
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
            />
          </div>

          {/* Login & Register Buttons */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              onClick={() => setAuthMode('login')}
              disabled={!!loadingAction}
              className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 ${
                authMode === 'login'
                  ? selectedRole === 'official'
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                    : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-orange-500/20'
                  : 'bg-white/10 hover:bg-white/15 text-slate-300 border border-white/10'
              } disabled:opacity-50`}
            >
              {loadingAction === 'email' && authMode === 'login' ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span>Sign In</span>
              )}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              onClick={() => setAuthMode('register')}
              disabled={!!loadingAction}
              className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 ${
                authMode === 'register'
                  ? selectedRole === 'official'
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                    : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-orange-500/20'
                  : 'bg-white/10 hover:bg-white/15 text-slate-300 border border-white/10'
              } disabled:opacity-50`}
            >
              {loadingAction === 'email' && authMode === 'register' ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span>Register</span>
              )}
            </motion.button>
          </div>
        </form>

        {/* ─── Divider ─── */}
        <div className="relative flex py-2 items-center mb-4">
          <div className="flex-grow border-t border-white/10"></div>
          <span className="flex-shrink mx-3 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
            Or continue with
          </span>
          <div className="flex-grow border-t border-white/10"></div>
        </div>

        {/* ─── 3. Google Sign-In Button ─── */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={handleGoogleLogin}
          disabled={!!loadingAction}
          className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-white font-medium text-xs shadow-lg backdrop-blur-md transition-all disabled:opacity-50 mb-6"
        >
          {loadingAction === 'google' ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.57 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
            </svg>
          )}
          <span>Sign in with Google ({selectedRole === 'official' ? 'Official' : 'Citizen'})</span>
        </motion.button>

        {/* ─── 4. Demo Presentations Quick Access ─── */}
        <div className="pt-4 border-t border-white/10">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 flex items-center gap-1.5">
              <span>⚡</span> Presentation Quick Access
            </span>
            <span className="text-[10px] text-slate-500">1-Click Auto Login</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Demo Citizen Login */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => handleDemoLogin('citizen')}
              disabled={!!loadingAction}
              className="px-3 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-semibold text-xs flex flex-col items-center justify-center transition-all group disabled:opacity-50 backdrop-blur-md"
            >
              {loadingAction === 'demo-citizen' ? (
                <div className="w-4 h-4 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin my-0.5" />
              ) : (
                <>
                  <span className="flex items-center gap-1 text-[11px] font-bold text-white group-hover:text-amber-200">
                    <span>👤</span> Demo Citizen
                  </span>
                  <span className="text-[9px] text-slate-400 mt-0.5 truncate max-w-full">
                    citizen@bharatsanket.in
                  </span>
                </>
              )}
            </motion.button>

            {/* Demo Official Login */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => handleDemoLogin('official')}
              disabled={!!loadingAction}
              className="px-3 py-2.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-semibold text-xs flex flex-col items-center justify-center transition-all group disabled:opacity-50 backdrop-blur-md"
            >
              {loadingAction === 'demo-official' ? (
                <div className="w-4 h-4 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin my-0.5" />
              ) : (
                <>
                  <span className="flex items-center gap-1 text-[11px] font-bold text-white group-hover:text-indigo-200">
                    <span>🏛️</span> Demo Official
                  </span>
                  <span className="text-[9px] text-slate-400 mt-0.5 truncate max-w-full">
                    official@bharatsanket.in
                  </span>
                </>
              )}
            </motion.button>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-5 text-[10px] text-slate-500 text-center">
          <span>Protected by Firebase Auth & Firestore Rules</span>
        </div>
      </motion.div>
    </div>
  );
}

