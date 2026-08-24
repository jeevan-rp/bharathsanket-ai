import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import CitizenPortal from './components/CitizenPortal';
import Dashboard from './components/Dashboard';

/**
 * App Component
 * Top-level routing between Citizen Portal and Policymaker Dashboard.
 * Uses tab-style navigation with React Router NavLink.
 */
export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* ─── Header ─── */}
      <header className="bg-gradient-to-r from-india-navy via-india-navy to-indigo-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* India tricolor accent */}
            <div className="flex h-8 rounded overflow-hidden shadow">
              <div className="w-3 bg-india-saffron" />
              <div className="w-3 bg-white" />
              <div className="w-3 bg-india-green" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                BharatSanket <span className="text-india-saffron">AI</span>
              </h1>
              <p className="text-[10px] text-indigo-300 -mt-1 tracking-wide">
                Citizen Infrastructure Intelligence Platform
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <nav className="flex gap-1">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `px-4 py-2 rounded-t-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-white/15 text-white border-b-2 border-india-saffron'
                    : 'text-indigo-200 hover:text-white hover:bg-white/5'
                }`
              }
            >
              🏘️ Citizen Portal
            </NavLink>
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `px-4 py-2 rounded-t-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-white/15 text-white border-b-2 border-india-saffron'
                    : 'text-indigo-200 hover:text-white hover:bg-white/5'
                }`
              }
            >
              📊 Dashboard
            </NavLink>
          </nav>
        </div>
      </header>

      {/* ─── Main Content ─── */}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<CitizenPortal />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}