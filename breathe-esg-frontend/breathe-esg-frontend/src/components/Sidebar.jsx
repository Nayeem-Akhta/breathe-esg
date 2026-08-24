import { useState } from 'react';

const NAV = [
  {
    id: 'dashboard',
    label: 'Overview',
    sub: 'Carbon metrics',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5"/>
        <rect x="14" y="3" width="7" height="7" rx="1.5"/>
        <rect x="3" y="14" width="7" height="7" rx="1.5"/>
        <rect x="14" y="14" width="7" height="7" rx="1.5"/>
      </svg>
    ),
  },
  {
    id: 'entries',
    label: 'Review Queue',
    sub: 'Approve & flag',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4"/>
        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
      </svg>
    ),
  },
  {
    id: 'upload',
    label: 'Ingest Data',
    sub: 'Upload files',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
        <polyline points="17 8 12 3 7 8"/>
        <line x1="12" y1="3" x2="12" y2="15"/>
      </svg>
    ),
  },
];

export default function Sidebar({ page, setPage }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside style={{
      position: 'fixed', left: 0, top: 0, bottom: 0,
      width: collapsed ? 72 : 260,
      background: 'var(--bg-card)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 100,
      transition: 'width 0.3s cubic-bezier(0.16,1,0.3,1)',
      overflow: 'hidden',
    }}>

      {/* Logo */}
      <div style={{
        padding: collapsed ? '24px 0' : '24px 20px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        minHeight: 72,
        transition: 'padding 0.3s',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
          {/* Logo mark */}
          <div style={{
            width: 38, height: 38,
            borderRadius: 11,
            background: 'linear-gradient(135deg, #059669 0%, #34d399 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 0 20px rgba(52,211,153,0.35)',
            fontSize: 18,
          }}>
            🌿
          </div>
          {!collapsed && (
            <div style={{ animation: 'fadeIn 0.2s ease' }}>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 800, fontSize: 17,
                color: 'var(--text-primary)',
                letterSpacing: '-0.03em',
                lineHeight: 1.2,
              }}>
                Breathe<span style={{ color: 'var(--green)' }}>ESG</span>
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Carbon Platform
              </div>
            </div>
          )}
        </div>

        {/* Collapse toggle */}
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            style={{
              width: 26, height: 26, borderRadius: 6,
              background: 'var(--bg-raised)',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, cursor: 'pointer', flexShrink: 0,
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--green)'; e.currentTarget.style.borderColor = 'var(--border-glow)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            ‹‹
          </button>
        )}
        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            style={{
              position: 'absolute', right: -12, top: 28,
              width: 24, height: 24, borderRadius: '50%',
              background: 'var(--bg-raised)',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, cursor: 'pointer',
              transition: 'all 0.2s',
              zIndex: 10,
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--green)'; e.currentTarget.style.borderColor = 'var(--border-glow)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            ››
          </button>
        )}
      </div>

      {/* Nav label */}
      {!collapsed && (
        <div style={{
          padding: '20px 20px 8px',
          fontSize: 10, fontWeight: 700,
          color: 'var(--text-muted)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}>
          Navigation
        </div>
      )}

      {/* Nav items */}
      <nav style={{ padding: collapsed ? '16px 10px' : '8px 12px', flex: 1 }}>
        {NAV.map((item, idx) => {
          const active = page === item.id;
          return (
            <div
              key={item.id}
              className={`fade-up-delay${idx + 1}`}
              style={{ marginBottom: 4 }}
            >
              <button
                onClick={() => setPage(item.id)}
                title={collapsed ? item.label : ''}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  width: '100%',
                  padding: collapsed ? '12px 0' : '11px 14px',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  borderRadius: 'var(--radius-sm)',
                  background: active
                    ? 'linear-gradient(135deg, rgba(52,211,153,0.12), rgba(52,211,153,0.04))'
                    : 'transparent',
                  color: active ? 'var(--green)' : 'var(--text-secondary)',
                  fontWeight: active ? 600 : 400,
                  fontSize: 14,
                  transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)',
                  position: 'relative',
                  border: active ? '1px solid rgba(52,211,153,0.15)' : '1px solid transparent',
                }}
                onMouseEnter={e => {
                  if (!active) {
                    e.currentTarget.style.background = 'var(--bg-hover)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                    e.currentTarget.style.borderColor = 'var(--border)';
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                    e.currentTarget.style.borderColor = 'transparent';
                  }
                }}
              >
                {/* Active left bar */}
                {active && (
                  <div style={{
                    position: 'absolute', left: 0, top: '18%', bottom: '18%',
                    width: 3, borderRadius: '0 3px 3px 0',
                    background: 'var(--green)',
                    boxShadow: '0 0 10px var(--green)',
                  }} />
                )}

                {/* Icon */}
                <span style={{
                  color: active ? 'var(--green)' : 'inherit',
                  display: 'flex', alignItems: 'center',
                  filter: active ? 'drop-shadow(0 0 4px rgba(52,211,153,0.5))' : 'none',
                  transition: 'filter 0.2s',
                }}>
                  {item.icon}
                </span>

                {/* Label + sub */}
                {!collapsed && (
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ lineHeight: 1.3 }}>{item.label}</div>
                    <div style={{ fontSize: 10, color: active ? 'rgba(52,211,153,0.6)' : 'var(--text-muted)', marginTop: 1 }}>
                      {item.sub}
                    </div>
                  </div>
                )}
              </button>
            </div>
          );
        })}
      </nav>

      {/* Bottom status */}
      <div style={{
        padding: collapsed ? '16px 10px' : '16px 16px',
        borderTop: '1px solid var(--border)',
      }}>
        {collapsed ? (
          <div style={{
            width: 40, height: 40,
            borderRadius: 10,
            background: 'var(--bg-raised)',
            border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto',
          }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 8px var(--green)' }} />
          </div>
        ) : (
          <div style={{
            background: 'var(--bg-raised)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px',
            border: '1px solid var(--border)',
            transition: 'border-color 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-glow)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              System Status
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 6px var(--green)', animation: 'pulse-dot 2s infinite' }} />
              <span style={{ fontSize: 12, color: 'var(--green)', fontWeight: 600 }}>All Systems Operational</span>
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
              Spring Boot · PostgreSQL · v1.0
            </div>
          </div>
        )}
      </div>
    </aside>
  );
  
}