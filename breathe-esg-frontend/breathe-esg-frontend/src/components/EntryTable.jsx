import { useEffect, useState, useCallback } from 'react';
import api from '../services/api';

const STATUS_CONFIG = {
  PENDING:  { color: 'var(--amber)',  bg: 'rgba(251,191,36,0.1)',   label: 'Pending'  },
  APPROVED: { color: 'var(--green)',  bg: 'rgba(52,211,153,0.1)',   label: 'Approved' },
  REJECTED: { color: 'var(--red)',    bg: 'rgba(248,113,113,0.1)',  label: 'Rejected' },
  FLAGGED:  { color: 'var(--purple)', bg: 'rgba(167,139,250,0.1)', label: 'Flagged'  },
};

const SOURCE_CONFIG = {
  SAP_FUEL:            { label: 'SAP Fuel', color: 'var(--green)'  },
  UTILITY_ELECTRICITY: { label: 'Utility',  color: 'var(--blue)'   },
  TRAVEL:              { label: 'Travel',   color: 'var(--purple)' },
};

const SCOPE_CONFIG = {
  SCOPE_1: { label: 'S1', color: 'var(--green)'  },
  SCOPE_2: { label: 'S2', color: 'var(--blue)'   },
  SCOPE_3: { label: 'S3', color: 'var(--purple)' },
};

const FILTERS = [
  { key: 'status', label: 'Status', options: ['PENDING','APPROVED','REJECTED','FLAGGED'] },
  { key: 'source', label: 'Source', options: ['SAP_FUEL','UTILITY_ELECTRICITY','TRAVEL']  },
  { key: 'scope',  label: 'Scope',  options: ['SCOPE_1','SCOPE_2','SCOPE_3']              },
];

/* ── Status badge ───────────────────────── */
function StatusBadge({ status }) {
  const c = STATUS_CONFIG[status] || { color: 'var(--text-muted)', bg: 'var(--bg-raised)', label: status };
  return (
    <span style={{
      background: c.bg,
      color: c.color,
      padding: '3px 10px',
      borderRadius: 999,
      fontSize: 11,
      fontWeight: 700,
      border: `1px solid ${c.color}30`,
      letterSpacing: '0.03em',
    }}>
      {c.label}
    </span>
  );
}

/* ── Action button ──────────────────────── */
function ActionBtn({ label, color, bg, onClick, loading }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      disabled={loading}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: '5px 11px',
        borderRadius: 6,
        border: `1px solid ${hov ? color + '80' : color + '35'}`,
        background: hov ? bg : 'transparent',
        color: color,
        fontSize: 11, fontWeight: 700,
        cursor: loading ? 'not-allowed' : 'pointer',
        transition: 'all 0.15s',
        opacity: loading ? 0.5 : 1,
        transform: hov && !loading ? 'translateY(-1px)' : 'translateY(0)',
        boxShadow: hov && !loading ? `0 4px 12px ${color}25` : 'none',
        display: 'flex', alignItems: 'center', gap: 4,
        letterSpacing: '0.02em',
      }}
    >
      {loading ? <span className="spinner" style={{ width: 10, height: 10 }} /> : label}
    </button>
  );
}

/* ── Filter select ──────────────────────── */
function FilterSelect({ label, value, options, onChange }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          background: 'var(--bg-raised)',
          border: `1px solid ${focused ? 'var(--border-glow)' : 'var(--border)'}`,
          borderRadius: 8,
          color: value ? 'var(--green)' : 'var(--text-secondary)',
          padding: '7px 32px 7px 12px',
          fontSize: 12,
          fontWeight: value ? 600 : 400,
          cursor: 'pointer',
          outline: 'none',
          transition: 'all 0.2s',
          appearance: 'none',
          boxShadow: focused ? '0 0 0 3px rgba(52,211,153,0.08)' : 'none',
        }}
      >
        <option value="">All {label}s</option>
        {options.map(o => (
          <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>
        ))}
      </select>
      {/* Arrow icon */}
      <span style={{
        position: 'absolute', right: 10, top: '50%',
        transform: 'translateY(-50%)',
        color: 'var(--text-muted)', fontSize: 10,
        pointerEvents: 'none',
      }}>▾</span>
    </div>
  );
}

/* ── Table row ──────────────────────────── */
function EntryRow({ entry, index, onSelect, onAction }) {
  const [hovered, setHovered] = useState(false);
  const [acting, setActing]   = useState(null);

  const src = SOURCE_CONFIG[entry.source_type] || { label: entry.source_type, color: 'var(--text-muted)' };
  const scp = SCOPE_CONFIG[entry.scope]        || { label: entry.scope,        color: 'var(--text-muted)' };
  const co2 = parseFloat(entry.co2e_kg || 0);

  const act = async (action) => {
    setActing(action);
    try {
      await onAction(entry.id, action);
    } finally {
      setActing(null);
    }
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: '90px 1fr 70px 130px 110px 100px 44px 210px',
        gap: 12,
        padding: '13px 20px',
        alignItems: 'center',
        borderBottom: '1px solid var(--border)',
        background: hovered
          ? 'var(--bg-hover)'
          : entry.is_flagged_auto ? 'rgba(251,191,36,0.02)' : 'transparent',
        transition: 'background 0.15s',
        animation: `fadeUp 0.4s ${index * 0.04}s both`,
        fontSize: 13,
      }}
    >
      {/* Source tag */}
      <div>
        <span style={{
          fontSize: 10, fontWeight: 700,
          color: src.color,
          background: src.color + '15',
          padding: '3px 8px',
          borderRadius: 5,
          border: `1px solid ${src.color}25`,
          letterSpacing: '0.03em',
        }}>
          {src.label}
        </span>
      </div>

      {/* Description — clickable */}
      <div
        onClick={() => onSelect(entry.id)}
        title={entry.description}
        style={{
          color: hovered ? 'var(--green)' : 'var(--blue)',
          cursor: 'pointer',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontWeight: 500,
          transition: 'color 0.15s',
          display: 'flex', alignItems: 'center', gap: 5,
        }}
      >
        {entry.description}
        {hovered && <span style={{ fontSize: 10, opacity: 0.6, flexShrink: 0 }}>↗</span>}
      </div>

      {/* Scope */}
      <div>
        <span style={{
          fontSize: 10, fontWeight: 800,
          color: scp.color,
          background: scp.color + '12',
          padding: '3px 7px',
          borderRadius: 5,
          border: `1px solid ${scp.color}20`,
        }}>
          {scp.label}
        </span>
      </div>

      {/* Value */}
      <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
        {parseFloat(entry.normalized_value || 0).toFixed(2)}
        <span style={{ color: 'var(--text-muted)', marginLeft: 4, fontSize: 11 }}>
          {entry.normalized_unit}
        </span>
      </div>

      {/* CO2e */}
      <div style={{
        fontFamily: 'var(--font-display)',
        fontWeight: 700, fontSize: 14,
        color: co2 > 5000 ? 'var(--red)' : co2 > 1000 ? 'var(--amber)' : 'var(--text-primary)',
      }}>
        {co2.toFixed(2)}
        <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 400, marginLeft: 3 }}>kg</span>
      </div>

      {/* Status */}
      <StatusBadge status={entry.review_status} />

      {/* Flag */}
      <div style={{ textAlign: 'center' }}>
        {entry.is_flagged_auto && (
          <div className="tooltip-wrap">
            <span style={{
              fontSize: 15,
              cursor: 'help',
              filter: 'drop-shadow(0 0 4px rgba(251,191,36,0.6))',
              animation: 'glow-pulse 2s infinite',
            }}>
              ⚠
            </span>
            <span className="tooltip">{entry.flag_reason || 'Suspicious entry'}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div>
        {entry.is_locked ? (
          <span style={{
            fontSize: 11, color: 'var(--text-muted)',
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <span>🔒</span>
            <span>Locked</span>
          </span>
        ) : (
          <div style={{ display: 'flex', gap: 5 }}>
            <ActionBtn
              label="✓ Approve"
              color="var(--green)"
              bg="rgba(52,211,153,0.12)"
              onClick={() => act('approve')}
              loading={acting === 'approve'}
            />
            <ActionBtn
              label="⚑"
              color="var(--purple)"
              bg="rgba(167,139,250,0.12)"
              onClick={() => act('flag')}
              loading={acting === 'flag'}
            />
            <ActionBtn
              label="✗"
              color="var(--red)"
              bg="rgba(248,113,113,0.12)"
              onClick={() => act('reject')}
              loading={acting === 'reject'}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main EntryTable ────────────────────── */
export default function EntryTable({ onSelect, onRefresh }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', source: '', scope: '' });

 const load = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Build the query string for your active filters
      const activeFilters = Object.entries(filters)
        .filter(([, v]) => v)
        .map(([k, v]) => `${k}=${v}`)
        .join('&');
      
      const queryParams = activeFilters ? `&${activeFilters}` : '';

      // 2. Make the API call directly using your secure Axios instance
      const res = await api.get(`/review/entries?organization_id=bdd9be7c-d742-4c79-9371-902c02aa3872${queryParams}`);
      
      // 3. Set the data
      setEntries(res.data.entries || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const handleAction = async (id, action) => {
    try {
      // 1. Send the action securely. We include an empty object {} as the body
      // so Spring Boot recognizes it as a valid POST request payload.
      await api.post(`/review/entries/${id}/${action}?organization_id=bdd9be7c-d742-4c79-9371-902c02aa3872`, {});
      
      // 2. Reload the table data from the backend to show the new status
      await load(); 
      
      // 3. Trigger the dashboard refresh so the main charts update
      if (onRefresh) onRefresh(); 
      
    } catch (e) {
      console.error(`Failed to ${action} entry ${id}:`, e);
      alert(e.response?.data?.error || `Action '${action}' failed. Check backend connection.`);
    }
  };

  const pending  = entries.filter(e => e.review_status === 'PENDING').length;
  const flagged  = entries.filter(e => e.is_flagged_auto).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Filter + stats bar */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '14px 20px',
        display: 'flex', alignItems: 'center',
        gap: 10, flexWrap: 'wrap',
      }}>
        {/* Filter label */}
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginRight: 4 }}>
          Filter:
        </span>

        {/* Filter dropdowns */}
        {FILTERS.map(f => (
          <FilterSelect
            key={f.key}
            label={f.label}
            value={filters[f.key]}
            options={f.options}
            onChange={v => setFilters(p => ({ ...p, [f.key]: v }))}
          />
        ))}

        {/* Clear filters */}
        {Object.values(filters).some(Boolean) && (
          <button
            onClick={() => setFilters({ status: '', source: '', scope: '' })}
            style={{
              padding: '6px 12px', borderRadius: 7,
              background: 'transparent',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
              fontSize: 11, fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.borderColor = 'var(--red)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            ✕ Clear
          </button>
        )}

        {/* Right side stats */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          {flagged > 0 && (
            <span style={{
              background: 'rgba(251,191,36,0.1)',
              color: 'var(--amber)', padding: '4px 12px',
              borderRadius: 999, fontSize: 11, fontWeight: 700,
              border: '1px solid rgba(251,191,36,0.2)',
            }}>
              ⚠ {flagged} suspicious
            </span>
          )}
          <span style={{
            background: 'var(--bg-raised)', color: 'var(--text-secondary)',
            padding: '5px 12px', borderRadius: 999,
            fontSize: 12, fontWeight: 600,
            border: '1px solid var(--border)',
          }}>
            {entries.length} entries
          </span>
          <button
            onClick={load}
            style={{
              padding: '7px 14px', borderRadius: 8,
              background: 'var(--bg-raised)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
              fontSize: 12, fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: 5,
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--green)'; e.currentTarget.style.borderColor = 'var(--border-glow)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      }}>
        {/* Table header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '90px 1fr 70px 130px 110px 100px 44px 210px',
          gap: 12, padding: '11px 20px',
          background: 'var(--bg-raised)',
          borderBottom: '1px solid var(--border)',
          fontSize: 10, fontWeight: 700,
          color: 'var(--text-muted)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}>
          <span>Source</span>
          <span>Description</span>
          <span>Scope</span>
          <span>Value</span>
          <span>CO₂e</span>
          <span>Status</span>
          <span style={{ textAlign: 'center' }}>⚠</span>
          <span>Actions</span>
        </div>

        {/* Body */}
        {loading ? (
          <div>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 12, alignItems: 'center' }}>
                <div className="skeleton" style={{ width: 70, height: 22, borderRadius: 5 }} />
                <div className="skeleton" style={{ flex: 1, height: 16 }} />
                <div className="skeleton" style={{ width: 40, height: 22, borderRadius: 5 }} />
                <div className="skeleton" style={{ width: 80, height: 16 }} />
                <div className="skeleton" style={{ width: 80, height: 16 }} />
                <div className="skeleton" style={{ width: 70, height: 22, borderRadius: 999 }} />
              </div>
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div style={{ padding: '64px 24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            <div style={{ fontSize: 44, marginBottom: 14, opacity: 0.3, animation: 'float 3s ease-in-out infinite' }}>📋</div>
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4, color: 'var(--text-secondary)' }}>No entries found</div>
            <div style={{ fontSize: 12 }}>Try adjusting your filters or upload a new file</div>
          </div>
        ) : (
          entries.map((entry, idx) => (
            <EntryRow
              key={entry.id}
              entry={entry}
              index={idx}
              onSelect={onSelect}
              onAction={handleAction}
            />
          ))
        )}

        {/* Footer */}
        {!loading && entries.length > 0 && (
          <div style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--border)',
            background: 'var(--bg-raised)',
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 11, color: 'var(--text-muted)',
          }}>
            <span>Showing {entries.length} entries</span>
            {pending > 0 && (
              <span style={{ color: 'var(--amber)', fontWeight: 600 }}>
                {pending} pending review
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}