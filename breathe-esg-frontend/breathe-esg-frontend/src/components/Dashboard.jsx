import { useEffect, useState } from 'react';
import api from '../services/api';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

const SCOPE_COLORS = ['#34d399', '#60a5fa', '#a78bfa'];

/* ── Custom tooltip ─────────────────────── */
const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-raised)',
      border: '1px solid var(--border-glow)',
      borderRadius: 10, padding: '10px 14px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
      fontSize: 12,
    }}>
      {label && <div style={{ color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600 }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || 'var(--green)', fontWeight: 700, display: 'flex', gap: 8 }}>
          <span>{p.name}:</span>
          <span>{typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</span>
        </div>
      ))}
    </div>
  );
};

/* ── Stat card ──────────────────────────── */
function StatCard({ label, value, color, icon, subtitle, delay }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className={`fade-up-delay${delay}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered
          ? `linear-gradient(135deg, ${color}08, var(--bg-card))`
          : 'var(--bg-card)',
        border: `1px solid ${hovered ? color + '35' : 'var(--border)'}`,
        borderRadius: 'var(--radius-lg)',
        padding: '22px 24px',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow: hovered ? `0 12px 40px ${color}15` : 'none',
        cursor: 'default',
      }}
    >
      {/* Glow orb */}
      <div style={{
        position: 'absolute', top: -30, right: -30,
        width: 100, height: 100, borderRadius: '50%',
        background: color + (hovered ? '25' : '12'),
        filter: 'blur(24px)',
        transition: 'all 0.3s',
      }} />

      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18, position: 'relative' }}>
        <div style={{
          fontSize: 10, fontWeight: 700,
          color: 'var(--text-muted)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}>
          {label}
        </div>
        <div style={{
          width: 36, height: 36,
          borderRadius: 10,
          background: color + (hovered ? '25' : '15'),
          border: `1px solid ${color}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 17,
          transition: 'all 0.3s',
          transform: hovered ? 'scale(1.1) rotate(5deg)' : 'scale(1) rotate(0deg)',
        }}>
          {icon}
        </div>
      </div>

      {/* Value */}
      <div
        className="counter"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 42, fontWeight: 800,
          color: color,
          lineHeight: 1,
          marginBottom: 8,
          letterSpacing: '-0.02em',
          position: 'relative',
        }}
      >
        {value}
      </div>

      {/* Subtitle */}
      <div style={{ fontSize: 12, color: 'var(--text-muted)', position: 'relative' }}>
        {subtitle}
      </div>

      {/* Bottom accent line */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: 2,
        background: `linear-gradient(90deg, ${color}, transparent)`,
        opacity: hovered ? 1 : 0,
        transition: 'opacity 0.3s',
      }} />
    </div>
  );
}

/* ── Batch row ──────────────────────────── */
function BatchRow({ batch, index }) {
  const [hovered, setHovered] = useState(false);

  const statusColor = {
    COMPLETED: 'var(--green)',
    FAILED:    'var(--red)',
    PROCESSING:'var(--amber)',
    PENDING:   'var(--text-muted)',
  }[batch.status] || 'var(--text-muted)';

  const sourceLabel = {
    SAP_FUEL:            'SAP Fuel',
    UTILITY_ELECTRICITY: 'Utility',
    TRAVEL:              'Travel',
  }[batch.source_type] || batch.source_type;

  const sourceColor = {
    SAP_FUEL:            'var(--green)',
    UTILITY_ELECTRICITY: 'var(--blue)',
    TRAVEL:              'var(--purple)',
  }[batch.source_type] || 'var(--text-muted)';

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: '160px 1fr 110px 60px 60px 60px',
        gap: 16, padding: '14px 24px',
        alignItems: 'center',
        borderBottom: '1px solid var(--border)',
        background: hovered ? 'var(--bg-hover)' : 'transparent',
        transition: 'background 0.15s',
        animation: `fadeUp 0.4s ${index * 0.06}s both`,
      }}
    >
      <div>
        <span style={{
          fontSize: 11, fontWeight: 700,
          color: sourceColor,
          background: sourceColor + '15',
          padding: '3px 10px', borderRadius: 999,
          border: `1px solid ${sourceColor}25`,
        }}>
          {sourceLabel}
        </span>
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {batch.file_name}
      </div>
      <div>
        <span style={{
          background: statusColor + '18',
          color: statusColor,
          padding: '3px 10px',
          borderRadius: 999, fontSize: 11, fontWeight: 700,
          border: `1px solid ${statusColor}25`,
        }}>
          {batch.status}
        </span>
      </div>
      <div style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: 13 }}>{batch.total_rows}</div>
      <div style={{ color: 'var(--green)', fontWeight: 700, textAlign: 'center', fontSize: 13 }}>{batch.successful_rows}</div>
      <div style={{
        color: batch.failed_rows > 0 ? 'var(--red)' : 'var(--text-muted)',
        fontWeight: batch.failed_rows > 0 ? 700 : 400,
        textAlign: 'center', fontSize: 13,
      }}>
        {batch.failed_rows}
      </div>
    </div>
  );
}

/* ── Progress bar ───────────────────────── */
function ProgressBar({ label, value, total, color }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color }}>
          {value}
          <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: 4 }}>({pct}%)</span>
        </span>
      </div>
      <div style={{
        height: 7, background: 'var(--bg-raised)',
        borderRadius: 4, overflow: 'hidden',
        border: '1px solid var(--border)',
      }}>
        <div style={{
          height: '100%',
          width: animated ? `${pct}%` : '0%',
          background: `linear-gradient(90deg, ${color}99, ${color})`,
          borderRadius: 4,
          transition: 'width 1s cubic-bezier(0.16,1,0.3,1)',
          boxShadow: `0 0 10px ${color}60`,
        }} />
      </div>
    </div>
  );
}

/* ── Main Dashboard ─────────────────────── */
export default function Dashboard({ onNavigate }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Changed getDashboard() to api.get() so it attaches your JWT
    api.get('/review/dashboard?organization_id=bdd9be7c-d742-4c79-9371-902c02aa3872')
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 130, borderRadius: 'var(--radius-lg)' }} />
        ))}
      </div>
      <div className="skeleton" style={{ height: 180, borderRadius: 'var(--radius-lg)' }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="skeleton" style={{ height: 240, borderRadius: 'var(--radius-lg)' }} />
        <div className="skeleton" style={{ height: 240, borderRadius: 'var(--radius-lg)' }} />
      </div>
    </div>
  );

  if (!data) return (
    <div style={{ textAlign: 'center', padding: 80 }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>⚡</div>
      <div style={{ fontSize: 16, color: 'var(--red)', fontWeight: 600 }}>Backend not reachable</div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>
        Make sure Spring Boot is running on port 8080
      </div>
    </div>
  );

  const { review_summary: rs, co2e_by_scope: co2e, recent_batches } = data;
  const total = parseFloat(co2e?.total_kg   || 0);
  const s1    = parseFloat(co2e?.scope_1_kg || 0);
  const s2    = parseFloat(co2e?.scope_2_kg || 0);
  const s3    = parseFloat(co2e?.scope_3_kg || 0);
  const totalEntries = (rs.pending + rs.approved + rs.flagged + rs.rejected) || 1;

  const scopeChartData = [
    { name: 'Scope 1', value: s1 },
    { name: 'Scope 2', value: s2 },
    { name: 'Scope 3', value: s3 },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Stat cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
        <StatCard delay={1} label="Pending Review" value={rs.pending}    color="var(--amber)"  icon="⏳" subtitle="Awaiting analyst decision" />
        <StatCard delay={2} label="Approved"       value={rs.approved}   color="var(--green)"  icon="✓"  subtitle="Locked for audit" />
        <StatCard delay={3} label="Flagged"        value={rs.flagged}    color="var(--purple)" icon="⚑"  subtitle="Needs clarification" />
        <StatCard delay={4} label="Auto-Flagged"   value={rs.suspicious} color="var(--red)"    icon="⚠"  subtitle="System anomaly detected" />
      </div>

      {/* ── CO2e hero panel ── */}
      <div
        className="fade-up-delay2"
        style={{
          background: 'linear-gradient(135deg, #060e1c 0%, #0b1929 40%, #06111e 100%)',
          border: '1px solid var(--border-glow)',
          borderRadius: 'var(--radius-xl)',
          padding: '36px 44px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 0 60px rgba(52,211,153,0.08)',
        }}
      >
        {/* Decorative orbs */}
        <div style={{ position: 'absolute', right: -80, top: -80, width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(52,211,153,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', left: '30%', bottom: -60, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(96,165,250,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', right: '20%', top: '20%', width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,139,250,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', animation: 'pulse-dot 2s infinite' }} />
              Total Approved CO₂e
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 20 }}>
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: 72, fontWeight: 900,
                color: total > 0 ? 'var(--green)' : 'var(--text-muted)',
                lineHeight: 1,
                letterSpacing: '-0.04em',
                textShadow: total > 0 ? '0 0 40px rgba(52,211,153,0.3)' : 'none',
                transition: 'all 0.5s',
              }}>
                {total.toLocaleString('en-IN', { maximumFractionDigits: 1 })}
              </span>
              <span style={{ fontSize: 22, color: 'var(--text-muted)', fontWeight: 300 }}>kg CO₂e</span>
            </div>

            {/* Scope pills */}
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              {[
                ['Scope 1', s1, 'var(--green)'],
                ['Scope 2', s2, 'var(--blue)'],
                ['Scope 3', s3, 'var(--purple)'],
              ].map(([label, val, color]) => (
                <div key={label} style={{
                  background: color + '12',
                  border: `1px solid ${color}25`,
                  borderRadius: 10,
                  padding: '8px 16px',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = color + '22'; e.currentTarget.style.borderColor = color + '50'; }}
                onMouseLeave={e => { e.currentTarget.style.background = color + '12'; e.currentTarget.style.borderColor = color + '25'; }}
                >
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{label}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color, fontFamily: 'var(--font-display)' }}>
                    {val.toFixed(1)}
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400, marginLeft: 3 }}>kg</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Scope bar chart */}
          <div style={{ width: 240, height: 130, flexShrink: 0 }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8, textAlign: 'center' }}>
              By Scope (kg CO₂e)
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scopeChartData} barSize={32} barCategoryGap="25%">
                <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip content={<ChartTip />} cursor={{ fill: 'rgba(255,255,255,0.02)', radius: 4 }} />
                <Bar dataKey="value" name="CO₂e" radius={[5, 5, 0, 0]}>
                  {scopeChartData.map((_, i) => (
                    <Cell key={i} fill={SCOPE_COLORS[i]} opacity={0.9} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Middle row: Review breakdown + Scope detail ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Review breakdown */}
        <div
          className="fade-up-delay2 glow-hover"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: 24,
          }}
        >
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', marginBottom: 3 }}>
              Review Breakdown
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Entry status distribution</div>
          </div>

          <ProgressBar label="Pending"  value={rs.pending}  total={totalEntries} color="var(--amber)"  />
          <ProgressBar label="Approved" value={rs.approved} total={totalEntries} color="var(--green)"  />
          <ProgressBar label="Flagged"  value={rs.flagged}  total={totalEntries} color="var(--purple)" />
          <ProgressBar label="Rejected" value={rs.rejected} total={totalEntries} color="var(--red)"    />

          {rs.pending > 0 && (
            <button
              onClick={() => onNavigate('entries')}
              className="btn-primary"
              style={{
                marginTop: 20, width: '100%',
                padding: '12px 0', fontSize: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: '0 4px 20px rgba(52,211,153,0.25)',
              }}
            >
              <span>Review {rs.pending} Pending</span>
              <span style={{ fontSize: 16 }}>→</span>
            </button>
          )}
        </div>

        {/* Scope breakdown */}
        <div
          className="fade-up-delay3 glow-hover"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: 24,
          }}
        >
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', marginBottom: 3 }}>
              Emissions by Scope
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Approved entries only · GHG Protocol</div>
          </div>

          {total === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.3, animation: 'float 3s ease-in-out infinite' }}>📊</div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>No approved emissions yet</div>
              <div style={{ fontSize: 12 }}>Approve entries to see CO₂e breakdown</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                ['Scope 1', 'Direct Emissions',   s1, 'var(--green)',  'Fuel combustion, company vehicles'],
                ['Scope 2', 'Purchased Energy',   s2, 'var(--blue)',   'Electricity, heat, cooling'],
                ['Scope 3', 'Value Chain',         s3, 'var(--purple)', 'Business travel, supply chain'],
              ].map(([scope, label, val, color, desc]) => (
                <div
                  key={scope}
                  style={{
                    background: 'var(--bg-raised)',
                    borderRadius: 10, padding: '14px 18px',
                    border: '1px solid var(--border)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    transition: 'all 0.2s',
                    cursor: 'default',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = color + '40'; e.currentTarget.style.background = color + '06'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-raised)'; }}
                >
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 2 }}>{scope} — {label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{desc}</div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color }}>
                    {val.toFixed(0)}
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400, marginLeft: 3 }}>kg</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Recent batches table ── */}
      <div
        className="fade-up-delay4 glow-hover"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', marginBottom: 2 }}>
              Recent Ingestion Batches
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Last 5 file uploads</div>
          </div>
          <button
            onClick={() => onNavigate('upload')}
            style={{
              padding: '8px 18px', borderRadius: 8,
              background: 'var(--bg-raised)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
              fontSize: 13, fontWeight: 600,
              transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-glow)'; e.currentTarget.style.color = 'var(--green)'; e.currentTarget.style.background = 'var(--green-glow)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'var(--bg-raised)'; }}
          >
            <span style={{ fontSize: 15 }}>+</span> Upload New
          </button>
        </div>

        {/* Table head */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '160px 1fr 110px 60px 60px 60px',
          gap: 16, padding: '10px 24px',
          background: 'var(--bg-raised)',
          borderBottom: '1px solid var(--border)',
          fontSize: 10, fontWeight: 700,
          color: 'var(--text-muted)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}>
          <span>Source</span>
          <span>File</span>
          <span>Status</span>
          <span style={{ textAlign: 'center' }}>Total</span>
          <span style={{ textAlign: 'center', color: 'var(--green)' }}>OK</span>
          <span style={{ textAlign: 'center', color: 'var(--red)' }}>Fail</span>
        </div>

        {recent_batches.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.3 }}>📂</div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>No uploads yet</div>
            <div style={{ fontSize: 12 }}>Upload your first file to get started</div>
          </div>
        ) : (
          recent_batches.map((b, i) => <BatchRow key={b.id} batch={b} index={i} />)
        )}
      </div>
    </div>
  );
}