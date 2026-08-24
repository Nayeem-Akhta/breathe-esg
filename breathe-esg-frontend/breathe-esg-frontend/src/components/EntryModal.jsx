import { useEffect, useState } from 'react';
import { getEntry, approveEntry, rejectEntry, flagEntry } from '../api/client';

const STATUS_CONFIG = {
  PENDING:  { color: 'var(--amber)',  bg: 'rgba(251,191,36,0.1)',  label: 'Pending Review' },
  APPROVED: { color: 'var(--green)',  bg: 'rgba(52,211,153,0.1)',  label: 'Approved'       },
  REJECTED: { color: 'var(--red)',    bg: 'rgba(248,113,113,0.1)', label: 'Rejected'       },
  FLAGGED:  { color: 'var(--purple)', bg: 'rgba(167,139,250,0.1)','label': 'Flagged'      },
};

const SCOPE_INFO = {
  SCOPE_1: { label: 'Scope 1 — Direct',    color: 'var(--green)',  desc: 'Fuel combustion, company vehicles' },
  SCOPE_2: { label: 'Scope 2 — Energy',    color: 'var(--blue)',   desc: 'Purchased electricity and heat'    },
  SCOPE_3: { label: 'Scope 3 — Value Chain', color: 'var(--purple)', desc: 'Travel, supply chain'             },
};

const ACTION_CONFIG = [
  { action: 'approve', label: 'Approve & Lock', icon: '✓', color: 'var(--green)',  bg: 'rgba(52,211,153,0.12)'  },
  { action: 'flag',    label: 'Flag for Review', icon: '⚑', color: 'var(--purple)', bg: 'rgba(167,139,250,0.12)' },
  { action: 'reject',  label: 'Reject Entry',   icon: '✗', color: 'var(--red)',    bg: 'rgba(248,113,113,0.12)' },
];

/* ── Detail row ─────────────────────────── */
function DetailRow({ label, value, highlight }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? 'var(--bg-hover)' : 'var(--bg-raised)',
        borderRadius: 8, padding: '11px 14px',
        border: `1px solid ${hov ? 'var(--border-glow)' : 'var(--border)'}`,
        transition: 'all 0.15s',
      }}
    >
      <div style={{
        fontSize: 10, fontWeight: 700,
        color: 'var(--text-muted)',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        marginBottom: 4,
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 13, fontWeight: 500,
        color: highlight || 'var(--text-primary)',
        wordBreak: 'break-word',
      }}>
        {value || '—'}
      </div>
    </div>
  );
}

/* ── Audit log item ─────────────────────── */
function AuditItem({ log, index }) {
  const ACTION_COLORS = {
    CREATED:  'var(--blue)',
    APPROVED: 'var(--green)',
    REJECTED: 'var(--red)',
    FLAGGED:  'var(--purple)',
    EDITED:   'var(--amber)',
    LOCKED:   'var(--green)',
  };
  const color = ACTION_COLORS[log.action] || 'var(--text-muted)';

  let note = null;
  if (log.after_value) {
    try {
      const parsed = JSON.parse(log.after_value);
      if (parsed.note) note = parsed.note;
    } catch (_) {}
  }

  return (
    <div
      style={{
        display: 'flex', gap: 12,
        animation: `fadeUp 0.3s ${index * 0.05}s both`,
      }}
    >
      {/* Timeline dot + line */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: color + '20',
          border: `2px solid ${color}50`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 800, color,
          flexShrink: 0,
          boxShadow: `0 0 10px ${color}20`,
        }}>
          {{
            CREATED: '➕', APPROVED: '✓', REJECTED: '✗',
            FLAGGED: '⚑', EDITED: '✎', LOCKED: '🔒',
          }[log.action] || '•'}
        </div>
        <div style={{ width: 1, flex: 1, background: 'var(--border)', marginTop: 4, minHeight: 12 }} />
      </div>

      {/* Content */}
      <div style={{ paddingBottom: 16, flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: note ? 6 : 0 }}>
          <span style={{
            fontSize: 12, fontWeight: 700, color,
            background: color + '12',
            padding: '2px 8px', borderRadius: 5,
            border: `1px solid ${color}25`,
          }}>
            {log.action}
          </span>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500 }}>
              {log.user || 'System'}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
              {log.timestamp ? new Date(log.timestamp).toLocaleString() : '—'}
            </div>
          </div>
        </div>
        {note && (
          <div style={{
            fontSize: 12, color: 'var(--text-secondary)',
            background: 'var(--bg-raised)',
            padding: '8px 10px', borderRadius: 6,
            border: '1px solid var(--border)',
            fontStyle: 'italic',
            marginTop: 6,
          }}>
            "{note}"
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main Modal ─────────────────────────── */
export default function EntryModal({ entryId, onClose, onAction }) {
  const [entry, setEntry]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);
  const [note, setNote]     = useState('');
  const [tab, setTab]       = useState('details');

  const load = async () => {
    setLoading(true);
    try {
      const res = await getEntry(entryId);
      setEntry(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

    useEffect(() => {
    if (entryId) load();
  }, [entryId]); // eslint-disable-line

  const act = async (action) => {
    setActing(action);
    try {
      if (action === 'approve') await approveEntry(entryId, note);
      if (action === 'reject')  await rejectEntry(entryId, note);
      if (action === 'flag')    await flagEntry(entryId, note);
      await load();
      onAction?.();
      setNote('');
    } catch (e) {
      alert(e.response?.data?.error || 'Action failed');
    } finally {
      setActing(null);
    }
  };

  const sc    = entry ? (STATUS_CONFIG[entry.review_status] || { color: 'var(--text-muted)', bg: 'var(--bg-raised)', label: entry.review_status }) : {};
  const scope = entry ? (SCOPE_INFO[entry.scope] || { label: entry.scope, color: 'var(--text-muted)', desc: '' }) : {};
  const co2   = parseFloat(entry?.co2e_kg || 0);

  return (
    /* Backdrop */
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(6px)',
        animation: 'fadeIn 0.2s ease',
      }}
    >
      {/* Modal */}
      <div
        className="modal-animate"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
          width: 700, maxWidth: '95vw',
          maxHeight: '90vh',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
          overflow: 'hidden',
        }}
      >
        {/* ── Header ── */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'var(--bg-raised)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'var(--bg-hover)',
              border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16,
            }}>
              📋
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, color: 'var(--text-primary)' }}>
                Entry Detail
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                {entry ? `ID: ${entry.id?.slice(0, 12)}...` : 'Loading...'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Status pill */}
            {entry && (
              <span style={{
                background: sc.bg, color: sc.color,
                padding: '5px 14px', borderRadius: 999,
                fontSize: 12, fontWeight: 700,
                border: `1px solid ${sc.color}30`,
              }}>
                {sc.label}
              </span>
            )}
            {/* Close */}
            <button
              onClick={onClose}
              style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'var(--bg-hover)',
                border: '1px solid var(--border)',
                color: 'var(--text-muted)',
                fontSize: 16, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.borderColor = 'var(--red)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div style={{
          display: 'flex', gap: 0,
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-raised)',
          flexShrink: 0,
          padding: '0 24px',
        }}>
          {['details', 'audit'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '12px 18px',
                background: 'transparent',
                border: 'none',
                borderBottom: `2px solid ${tab === t ? 'var(--green)' : 'transparent'}`,
                color: tab === t ? 'var(--green)' : 'var(--text-muted)',
                fontWeight: tab === t ? 700 : 400,
                fontSize: 13, cursor: 'pointer',
                transition: 'all 0.2s',
                textTransform: 'capitalize',
                letterSpacing: '0.02em',
                marginBottom: -1,
              }}
              onMouseEnter={e => { if (tab !== t) e.currentTarget.style.color = 'var(--text-secondary)'; }}
              onMouseLeave={e => { if (tab !== t) e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              {t === 'details' ? '📊 Details' : `🕐 Audit Trail ${entry?.audit_trail?.length ? `(${entry.audit_trail.length})` : ''}`}
            </button>
          ))}
        </div>

        {/* ── Body ── */}
        <div
          className="scroll-area"
          style={{ flex: 1, overflowY: 'auto', padding: '24px' }}
        >
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[...Array(6)].map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 60, borderRadius: 8 }} />
              ))}
            </div>
          ) : !entry ? (
            <div style={{ textAlign: 'center', padding: 48, color: 'var(--red)' }}>
              Entry not found
            </div>
          ) : tab === 'details' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* CO2e hero */}
              <div style={{
                background: 'linear-gradient(135deg, #060e1c, #0b1929)',
                border: '1px solid var(--border-glow)',
                borderRadius: 'var(--radius-lg)',
                padding: '24px 28px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{ position: 'absolute', right: -30, top: -30, width: 150, height: 150, borderRadius: '50%', background: 'radial-gradient(circle,rgba(52,211,153,0.08) 0%,transparent 70%)', pointerEvents: 'none' }} />
                <div>
                  <div style={{ fontSize: 10, color: 'var(--green)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
                    Carbon Footprint
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 48, fontWeight: 900,
                      color: co2 > 5000 ? 'var(--red)' : co2 > 1000 ? 'var(--amber)' : 'var(--green)',
                      lineHeight: 1,
                      letterSpacing: '-0.03em',
                    }}>
                      {co2.toFixed(2)}
                    </span>
                    <span style={{ fontSize: 18, color: 'var(--text-muted)', fontWeight: 300 }}>kg CO₂e</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                    Factor: {entry.emission_factor} · Source: {entry.emission_factor_source}
                  </div>
                </div>
                <div>
                  {/* Scope pill */}
                  <div style={{
                    background: scope.color + '15',
                    border: `1px solid ${scope.color}30`,
                    borderRadius: 10, padding: '10px 16px',
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Scope</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: scope.color }}>{scope.label}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{scope.desc}</div>
                  </div>
                </div>
              </div>

              {/* Flags */}
              {(entry.is_flagged_auto || entry.is_locked) && (
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {entry.is_flagged_auto && (
                    <div style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                      <span style={{ fontSize: 16 }}>⚠</span>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--amber)', marginBottom: 1 }}>Auto-Flagged by System</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{entry.flag_reason}</div>
                      </div>
                    </div>
                  )}
                  {entry.is_locked && (
                    <div style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                      <span style={{ fontSize: 16 }}>🔒</span>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)', marginBottom: 1 }}>Locked for Audit</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>This entry cannot be modified</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Detail grid */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
                  Data Lineage
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <DetailRow label="Description"      value={entry.description} />
                  <DetailRow label="Category"         value={entry.category} />
                  <DetailRow label="Source Type"      value={entry.source_type?.replace(/_/g, ' ')} />
                  <DetailRow label="Activity Date"    value={entry.activity_date} />
                  <DetailRow label="Raw Value"        value={`${entry.raw_value} ${entry.raw_unit}`} />
                  <DetailRow label="Normalized"       value={`${parseFloat(entry.normalized_value || 0).toFixed(4)} ${entry.normalized_unit}`} />
                  <DetailRow label="Emission Factor"  value={`${entry.emission_factor} kg CO₂e / ${entry.normalized_unit}`} />
                  <DetailRow label="Factor Source"    value={entry.emission_factor_source} />
                  {entry.period_start && <DetailRow label="Period Start" value={entry.period_start} />}
                  {entry.period_end   && <DetailRow label="Period End"   value={entry.period_end}   />}
                  {entry.review_note  && <DetailRow label="Review Note"  value={entry.review_note} highlight="var(--amber)" />}
                  {entry.reviewed_by  && <DetailRow label="Reviewed By"  value={entry.reviewed_by} />}
                </div>
              </div>

              {/* Actions */}
              {!entry.is_locked && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
                    Take Action
                  </div>

                  {/* Note input */}
                  <textarea
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="Add a note (optional) — will appear in audit trail..."
                    rows={2}
                    style={{
                      width: '100%',
                      background: 'var(--bg-raised)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      color: 'var(--text-primary)',
                      padding: '10px 14px',
                      fontSize: 13, resize: 'vertical',
                      marginBottom: 12, outline: 'none',
                      fontFamily: 'var(--font-body)',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={e => e.target.style.borderColor = 'var(--border-glow)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  />

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                    {ACTION_CONFIG.map(({ action, label, icon, color, bg }) => (
                      <button
                        key={action}
                        disabled={!!acting}
                        onClick={() => act(action)}
                        style={{
                          padding: '12px 0',
                          borderRadius: 10,
                          border: `1px solid ${color}40`,
                          background: acting === action ? bg : 'transparent',
                          color: color,
                          fontWeight: 700, fontSize: 13,
                          cursor: acting ? 'not-allowed' : 'pointer',
                          opacity: acting && acting !== action ? 0.5 : 1,
                          transition: 'all 0.2s',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        }}
                        onMouseEnter={e => {
                          if (!acting) {
                            e.currentTarget.style.background = bg;
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = `0 4px 16px ${color}20`;
                          }
                        }}
                        onMouseLeave={e => {
                          if (acting !== action) {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                          }
                        }}
                      >
                        {acting === action
                          ? <span className="spinner" />
                          : <><span style={{ fontSize: 15 }}>{icon}</span>{label}</>
                        }
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

          ) : (
            /* ── Audit trail tab ── */
            <div>
              {!entry.audit_trail || entry.audit_trail.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                  <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.3 }}>🕐</div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>No audit events yet</div>
                  <div style={{ fontSize: 12 }}>Events will appear here after actions are taken</div>
                </div>
              ) : (
                <div>
                  {entry.audit_trail.map((log, i) => (
                    <AuditItem key={i} log={log} index={i} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}