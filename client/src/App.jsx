import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import CitizenDashboard from './components/CitizenDashboard';
import OfficialDashboard from './components/OfficialDashboard';
import ProtectedRoute from './components/ProtectedRoute';

function RootRedirect() {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role === 'official') {
    return <Navigate to="/official/dashboard" replace />;
  }

  return <Navigate to="/citizen/dashboard" replace />;
}

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.25, ease: 'easeIn' } }
};

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public Login Route */}
        <Route
          path="/login"
          element={
            <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="w-full">
              <Login />
            </motion.div>
          }
        />

        {/* Protected Citizen Dashboard */}
        <Route
          path="/citizen/dashboard"
          element={
            <ProtectedRoute allowedRole="citizen">
              <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="w-full">
                <CitizenDashboard />
              </motion.div>
            </ProtectedRoute>
          }
        />

        {/* Protected Official Dashboard */}
        <Route
          path="/official/dashboard"
          element={
            <ProtectedRoute allowedRole="official">
              <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="w-full h-full">
                <OfficialDashboard />
              </motion.div>
            </ProtectedRoute>
          }
        />

        {/* Root and Fallback Redirects */}
        <Route path="/" element={<RootRedirect />} />
        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-[#070d17] text-slate-100 font-sans selection:bg-amber-500/30 selection:text-amber-200">
        <Toaster
          position="top-right"
          toastOptions={{
            className: 'glass-toast',
            style: {
              background: 'rgba(15, 23, 42, 0.9)',
              color: '#f8fafc',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(16px)',
              borderRadius: '16px',
              fontSize: '12px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.6), 0 8px 10px -6px rgba(0, 0, 0, 0.6)',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#0f172a',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#0f172a',
              },
            },
          }}
        />
        <AnimatedRoutes />
      </div>
    </AuthProvider>
  );
}