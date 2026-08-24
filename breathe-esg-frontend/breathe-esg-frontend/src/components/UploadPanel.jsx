import { useState } from 'react';
import api from '../services/api';

const SOURCES = [
  {
    value: 'SAP_FUEL',
    label: 'SAP Fuel & Procurement',
    desc: 'CSV flat file export from SAP MB51 transaction',
    icon: '🏭',
    color: 'var(--green)',
    tags: ['Diesel', 'Petrol', 'Natural Gas'],
  },
  {
    value: 'UTILITY_ELECTRICITY',
    label: 'Utility Electricity',
    desc: 'Portal CSV export from utility provider',
    icon: '⚡',
    color: 'var(--blue)',
    tags: ['kWh', 'MWh', 'Grid Zones'],
  },
  {
    value: 'TRAVEL',
    label: 'Corporate Travel',
    desc: 'Concur / Navan CSV trip report export',
    icon: '✈️',
    color: 'var(--purple)',
    tags: ['Flights', 'Hotels', 'Ground'],
  },
];

export default function UploadPanel({ onSuccess }) {
  const [sourceType, setSourceType] = useState('SAP_FUEL');
  const [file, setFile]             = useState(null);
  const [loading, setLoading]       = useState(false);
  const [result, setResult]         = useState(null);
  const [error, setError]           = useState(null);
  const [dragOver, setDragOver]     = useState(false);
  const [progress, setProgress]     = useState(0);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);
    setError(null);
    setProgress(0);

    // Fake progress animation
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 85) { clearInterval(interval); return p; }
        return p + Math.random() * 15;
      });
    }, 200);

    try {
      // 1. Create a new FormData object
      const formData = new FormData();
      
      // 2. Append the file and the source type to it
      formData.append('file', file);
      formData.append('source_type', sourceType);

      // 3. Send it securely using your api instance. 
      // Note: Axios automatically sets the multipart/form-data headers when you pass FormData!
      const res = await api.post('/ingest/upload?organization_id=bdd9be7c-d742-4c79-9371-902c02aa3872', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
      });

      clearInterval(interval);
      setProgress(100);
      setTimeout(() => {
        setResult(res.data);
        setFile(null);
        setProgress(0);
        if (onSuccess) onSuccess();
      }, 400);
    } catch (e) {
      clearInterval(interval);
      setProgress(0);
      setError(e.response?.data?.error || 'Upload failed. Check backend connection.');
    } finally {
      setLoading(false);
    }
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && f.name.endsWith('.csv')) {
      setFile(f);
      setResult(null);
      setError(null);
    }
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f) {
      setFile(f);
      setResult(null);
      setError(null);
    }
  };

  const activeSource = SOURCES.find(s => s.value === sourceType);

  return (
    <div style={{ maxWidth: 740 }}>

      {/* ── Source selector ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{
          fontSize: 11, fontWeight: 700, color: 'var(--text-muted)',
          letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ display: 'inline-block', width: 16, height: 1, background: 'var(--border)' }} />
          Step 1 — Select Data Source
          <span style={{ display: 'inline-block', flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {SOURCES.map((s, idx) => {
            const active = sourceType === s.value;
            return (
              <div
                key={s.value}
                onClick={() => { setSourceType(s.value); setResult(null); setError(null); }}
                className={`fade-up-delay${idx + 1}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 18,
                  padding: '16px 20px',
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${active ? s.color + '55' : 'var(--border)'}`,
                  background: active
                    ? `linear-gradient(135deg, ${s.color}0c, ${s.color}04)`
                    : 'var(--bg-card)',
                  cursor: 'pointer',
                  transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
                  transform: active ? 'translateX(4px)' : 'translateX(0)',
                  boxShadow: active ? `0 4px 20px ${s.color}12` : 'none',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={e => {
                  if (!active) {
                    e.currentTarget.style.borderColor = s.color + '30';
                    e.currentTarget.style.background  = 'var(--bg-hover)';
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.background  = 'var(--bg-card)';
                  }
                }}
              >
                {/* Active left bar */}
                {active && (
                  <div style={{
                    position: 'absolute', left: 0, top: '10%', bottom: '10%',
                    width: 3, borderRadius: '0 3px 3px 0',
                    background: s.color,
                    boxShadow: `0 0 12px ${s.color}`,
                  }} />
                )}

                {/* Icon */}
                <div style={{
                  width: 48, height: 48, borderRadius: 14,
                  background: active ? s.color + '20' : 'var(--bg-raised)',
                  border: `1px solid ${active ? s.color + '35' : 'var(--border)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, flexShrink: 0,
                  transition: 'all 0.25s',
                  transform: active ? 'scale(1.05)' : 'scale(1)',
                }}>
                  {s.icon}
                </div>

                {/* Text */}
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontWeight: 700, fontSize: 14,
                    color: active ? s.color : 'var(--text-primary)',
                    marginBottom: 3, transition: 'color 0.2s',
                  }}>
                    {s.label}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
                    {s.desc}
                  </div>
                  {/* Tags */}
                  <div style={{ display: 'flex', gap: 6 }}>
                    {s.tags.map(tag => (
                      <span key={tag} style={{
                        fontSize: 10, fontWeight: 600,
                        color: active ? s.color : 'var(--text-muted)',
                        background: active ? s.color + '12' : 'var(--bg-raised)',
                        padding: '2px 7px', borderRadius: 4,
                        border: `1px solid ${active ? s.color + '25' : 'var(--border)'}`,
                        transition: 'all 0.2s',
                      }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Radio */}
                <div style={{
                  width: 20, height: 20, borderRadius: '50%',
                  border: `2px solid ${active ? s.color : 'var(--text-muted)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s', flexShrink: 0,
                }}>
                  {active && (
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: s.color,
                      boxShadow: `0 0 8px ${s.color}`,
                    }} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Drop zone ── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{
          fontSize: 11, fontWeight: 700, color: 'var(--text-muted)',
          letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ display: 'inline-block', width: 16, height: 1, background: 'var(--border)' }} />
          Step 2 — Upload File
          <span style={{ display: 'inline-block', flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById('csv-input').click()}
          style={{
            border: `2px dashed ${
              dragOver ? activeSource.color
              : file    ? activeSource.color + '80'
              : 'var(--border)'
            }`,
            borderRadius: 'var(--radius-lg)',
            padding: '44px 32px',
            textAlign: 'center',
            background: dragOver
              ? activeSource.color + '08'
              : file ? activeSource.color + '05' : 'var(--bg-card)',
            cursor: 'pointer',
            transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <input
            id="csv-input"
            type="file"
            accept=".csv"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />

          {file ? (
            <div className="fade-up">
              <div style={{
                width: 56, height: 56, borderRadius: 16,
                background: activeSource.color + '18',
                border: `1px solid ${activeSource.color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 14px',
                fontSize: 26,
              }}>
                📄
              </div>
              <div style={{ fontWeight: 700, color: activeSource.color, fontSize: 16, marginBottom: 4 }}>
                {file.name}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
                {(file.size / 1024).toFixed(1)} KB · {file.type || 'text/csv'}
              </div>
              <span style={{
                fontSize: 11, color: 'var(--text-muted)',
                background: 'var(--bg-raised)',
                border: '1px solid var(--border)',
                padding: '4px 12px', borderRadius: 999,
              }}>
                Click to change file
              </span>
            </div>
          ) : (
            <div>
              <div style={{
                width: 56, height: 56, borderRadius: 16,
                background: 'var(--bg-raised)',
                border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 14px',
                fontSize: 26,
                transition: 'all 0.2s',
                animation: dragOver ? 'float 1s ease-in-out infinite' : 'none',
              }}>
                {dragOver ? '📂' : '📁'}
              </div>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 15, marginBottom: 6 }}>
                {dragOver ? 'Drop it here!' : 'Drag & drop your CSV file'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                or click to browse · .csv files only
              </div>
              <span style={{
                fontSize: 11, color: activeSource.color,
                background: activeSource.color + '12',
                border: `1px solid ${activeSource.color}25`,
                padding: '4px 14px', borderRadius: 999,
                fontWeight: 600,
              }}>
                {activeSource.icon} {activeSource.label} format expected
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Upload button ── */}
      <div style={{ marginBottom: 20 }}>
        <button
          onClick={handleUpload}
          disabled={!file || loading}
          className={file && !loading ? 'btn-primary' : ''}
          style={{
            width: '100%',
            padding: '15px 0',
            borderRadius: 'var(--radius-md)',
            background: (!file || loading) ? 'var(--bg-raised)' : undefined,
            color: (!file || loading) ? 'var(--text-muted)' : undefined,
            fontWeight: 800, fontSize: 15,
            cursor: (!file || loading) ? 'not-allowed' : 'pointer',
            boxShadow: (file && !loading) ? '0 6px 24px rgba(52,211,153,0.3)' : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            border: (!file || loading) ? '1px solid var(--border)' : 'none',
            letterSpacing: '-0.01em',
          }}
        >
          {loading ? (
            <>
              <span className="spinner" />
              Processing file...
            </>
          ) : (
            <>
              <span style={{ fontSize: 18 }}>⬆</span>
              Upload & Ingest
            </>
          )}
        </button>

        {/* Progress bar */}
        {loading && (
          <div style={{ marginTop: 10 }}>
            <div style={{
              height: 4, background: 'var(--bg-raised)',
              borderRadius: 2, overflow: 'hidden',
              border: '1px solid var(--border)',
            }}>
              <div style={{
                height: '100%',
                width: `${progress}%`,
                background: 'linear-gradient(90deg, var(--green-dim), var(--green))',
                borderRadius: 2,
                transition: 'width 0.3s ease',
                boxShadow: '0 0 8px rgba(52,211,153,0.5)',
              }} />
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5, textAlign: 'center' }}>
              Parsing rows and normalizing data... {Math.round(progress)}%
            </div>
          </div>
        )}
      </div>

      {/* ── Success result ── */}
      {result && (
        <div
          className="fade-up"
          style={{
            background: 'linear-gradient(135deg, rgba(52,211,153,0.08), rgba(52,211,153,0.03))',
            border: '1px solid rgba(52,211,153,0.25)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px 28px',
          }}
        >
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            marginBottom: 20,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'rgba(52,211,153,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16,
            }}>
              ✓
            </div>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--green)', fontSize: 15 }}>
                File processed successfully
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Entries added to review queue
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
            {[
              { label: 'Total Rows',  value: result.total,      color: 'var(--text-primary)', icon: '📊' },
              { label: 'Successful',  value: result.success,    color: 'var(--green)',         icon: '✓'  },
              { label: 'Failed',      value: result.failed,     color: 'var(--red)',           icon: '✗'  },
              { label: 'Suspicious',  value: result.suspicious, color: 'var(--amber)',         icon: '⚠'  },
            ].map(item => (
              <div
                key={item.label}
                style={{
                  background: 'var(--bg-raised)',
                  borderRadius: 10, padding: '14px 16px',
                  border: '1px solid var(--border)',
                  textAlign: 'center',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = item.color + '40'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={{ fontSize: 20, marginBottom: 6 }}>{item.icon}</div>
                <div style={{
                  fontSize: 28, fontWeight: 800,
                  color: item.color,
                  fontFamily: 'var(--font-display)',
                  lineHeight: 1, marginBottom: 4,
                }}>
                  {item.value}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div
          className="fade-up"
          style={{
            background: 'rgba(248,113,113,0.06)',
            border: '1px solid rgba(248,113,113,0.25)',
            borderRadius: 'var(--radius-md)',
            padding: '16px 20px',
            display: 'flex', alignItems: 'flex-start', gap: 10,
          }}
        >
          <span style={{ fontSize: 18, flexShrink: 0 }}>⚠</span>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--red)', fontSize: 13, marginBottom: 2 }}>Upload Failed</div>
            <div style={{ color: 'var(--red)', fontSize: 12, opacity: 0.8 }}>{error}</div>
          </div>
        </div>
      )}
    </div>
  );
}