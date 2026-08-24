import { useState, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import EntryTable from './components/EntryTable';
import UploadPanel from './components/UploadPanel';
import EntryModal from './components/EntryModal';
import Login from './components/Login';  // 1. Import the new Login component
import Register from './components/Register';
import './index.css';

export default function App() {
  // 2. Add authentication state (checks if token exists on load)
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('accessToken'));
  const [authView, setAuthView] = useState('login');

  // ADD THIS FUNCTION:
  const handleLogout = () => {
    localStorage.removeItem('accessToken'); // Destroy the token
    setIsAuthenticated(false);              // Flip the app state back to false
    setAuthView('login');                   // Ensure they see the login screen, not register
  };

  const [page, setPage]           = useState('dashboard');
  const [selectedId, setSelected] = useState(null);
  const [refresh, setRefresh]     = useState(0);

  const triggerRefresh = useCallback(() => setRefresh(r => r + 1), []);

  const PAGE_META = {
    dashboard: { title: 'Carbon Overview',  sub: 'Real-time emissions tracking and analyst review status' },
    entries:   { title: 'Review Queue',     sub: 'Review, approve, or flag incoming emissions data'       },
    upload:    { title: 'Data Ingestion',   sub: 'Ingest data from SAP, utility portals, or travel platforms' },
  };

  const meta = PAGE_META[page];

// 3. If the user is NOT logged in, handle Login vs Register
  if (!isAuthenticated) {
    if (authView === 'register') {
      // Show Register screen and pass it the function to go back to Login
      return <Register onSwitchToLogin={() => setAuthView('login')} />;
    }
    
    // Default to Login screen and pass it the function to go to Register
    return (
      <Login 
        onLoginSuccess={() => setIsAuthenticated(true)} 
        onSwitchToRegister={() => setAuthView('register')} 
      />
    );
  }

  // 4. If they ARE logged in, show the normal layout below
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
      <Sidebar page={page} setPage={(p) => { setPage(p); setSelected(null); }} />

      <main style={{
        flex: 1,
        marginLeft: 260,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Top bar */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: 'rgba(8,12,16,0.85)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--border)',
          padding: '0 40px',
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Breadcrumb */}
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>BreatheESG</span>
            <span style={{ color: 'var(--text-muted)', fontSize: 16 }}>›</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{meta.title}</span>
          </div>

          {/* Live indicator & Logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'var(--green-glow)',
              border: '1px solid var(--border-glow)',
              borderRadius: 999, padding: '5px 14px',
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: 'var(--green)',
                animation: 'pulse-dot 2s infinite',
                display: 'inline-block',
              }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)', letterSpacing: '0.08em' }}>
                LIVE
              </span>
            </div>
            
            {/* Optional: A quick way to test logging out */}
            <button 
              onClick={() => {
                localStorage.removeItem('accessToken');
                setIsAuthenticated(false);
              }}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13 }}
            >
              Logout
            </button>
          </div>
        </div>

        {/* Page content */}
        <div style={{ flex: 1, padding: '36px 40px' }}>
          {/* Page header */}
          <div className="fade-up" style={{ marginBottom: 32 }}>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 30, fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              marginBottom: 6,
            }}>
              {meta.title}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              {meta.sub}
            </p>
          </div>

          {/* Content */}
          <div key={page} className="fade-up-delay1">
            {page === 'dashboard' && <Dashboard key={refresh} onNavigate={setPage} />}
            {page === 'entries'   && <EntryTable key={refresh} onSelect={setSelected} onRefresh={triggerRefresh} />}
            {page === 'upload'    && <UploadPanel onSuccess={() => { triggerRefresh(); setPage('entries'); }} />}
          </div>
        </div>
      </main>

      {/* Entry detail modal */}
      {selectedId && (
        <EntryModal
          entryId={selectedId}
          onClose={() => setSelected(null)}
          onAction={triggerRefresh}
        />
      )}
    </div>
  );
}