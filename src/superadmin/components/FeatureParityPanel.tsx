/**
 * FeatureParityPanel — Super Admin only.
 *
 * Replaces the four tab TASKPULSE_STAFFIQ_FEATURE_PARITY_AUDIT.xlsx workbook
 * with one dynamic, filterable, in app record, shared in spirit with the
 * identical component mounted in Task Pulse. Every feature, its status in
 * each app, and the Super Admin console comparison live on this single page,
 * no tab switching inside it. Source of truth is src/data/featureParity.ts,
 * which is code verified against both apps. Keep that file in step with
 * Task Pulse's copy at src/lib/data/feature-parity.ts whenever either app's
 * features change.
 *
 * Self-contained inline styles are used deliberately so this panel does not
 * depend on TaskPulse's Tailwind classes or assume any particular StaffiQ
 * design system class names.
 */

import { useMemo, useState } from 'react'
import {
  FEATURE_PARITY_ROWS,
  SUPER_ADMIN_PARITY_ROWS,
  FEATURE_PARITY_SOURCE_NOTE,
  type FeatureParityRow,
  type ParityStatus,
} from '../../data/featureParity'

const ALL = 'All'

const STATUS_COLORS: Record<ParityStatus, { bg: string; fg: string; border: string }> = {
  live: { bg: '#ecfdf5', fg: '#065f46', border: '#a7f3d0' },
  partial: { bg: '#fffbeb', fg: '#92400e', border: '#fde68a' },
  absent: { bg: '#f8fafc', fg: '#64748b', border: '#e2e8f0' },
  unconfirmed: { bg: '#eff6ff', fg: '#1e40af', border: '#bfdbfe' },
}

function StatusPill({ status, label }: { status: ParityStatus; label: string }) {
  const colors = STATUS_COLORS[status]
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        borderRadius: 999,
        border: `1px solid ${colors.border}`,
        background: colors.bg,
        color: colors.fg,
        fontSize: 12,
        fontWeight: 600,
        padding: '2px 10px',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  )
}

function uniqueSorted(values: string[]): string[] {
  return [ALL, ...Array.from(new Set(values)).sort()]
}

export function FeatureParityPanel() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState(ALL)
  const [verdict, setVerdict] = useState(ALL)

  const categories = useMemo(() => uniqueSorted(FEATURE_PARITY_ROWS.map(r => r.category)), [])
  const verdicts = useMemo(() => uniqueSorted(FEATURE_PARITY_ROWS.map(r => r.verdict)), [])

  const filteredRows: FeatureParityRow[] = useMemo(() => {
    const term = search.trim().toLowerCase()
    return FEATURE_PARITY_ROWS.filter(row => {
      if (category !== ALL && row.category !== category) return false
      if (verdict !== ALL && row.verdict !== verdict) return false
      if (!term) return true
      return (
        row.feature.toLowerCase().includes(term) ||
        row.description.toLowerCase().includes(term) ||
        row.why.toLowerCase().includes(term) ||
        row.category.toLowerCase().includes(term)
      )
    })
  }, [search, category, verdict])

  const totals = useMemo(() => {
    const exclusiveTaskPulse = FEATURE_PARITY_ROWS.filter(r => r.taskPulseStatus === 'live' && r.staffiqStatus === 'absent').length
    const exclusiveStaffiq = FEATURE_PARITY_ROWS.filter(r => r.staffiqStatus === 'live' && r.taskPulseStatus === 'absent').length
    const inBoth = FEATURE_PARITY_ROWS.filter(r => r.taskPulseStatus === 'live' && r.staffiqStatus === 'live').length
    return { total: FEATURE_PARITY_ROWS.length, exclusiveTaskPulse, exclusiveStaffiq, inBoth }
  }, [])

  const cardStyle: React.CSSProperties = {
    border: '1px solid #e2e8f0',
    borderRadius: 12,
    padding: 12,
    background: '#f8fafc',
  }
  const inputStyle: React.CSSProperties = {
    padding: '8px 12px',
    borderRadius: 8,
    border: '1px solid #cbd5e1',
    fontSize: 14,
  }
  const tableWrapStyle: React.CSSProperties = {
    overflowX: 'auto',
    border: '1px solid #e2e8f0',
    borderRadius: 12,
  }
  const thStyle: React.CSSProperties = {
    textAlign: 'left',
    padding: '8px 12px',
    fontSize: 11,
    textTransform: 'uppercase',
    color: '#64748b',
    background: '#f1f5f9',
    whiteSpace: 'nowrap',
  }
  const tdStyle: React.CSSProperties = {
    textAlign: 'left',
    padding: '8px 12px',
    fontSize: 14,
    verticalAlign: 'top',
    borderTop: '1px solid #e2e8f0',
  }

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Feature Parity — StaffiQ vs Task Pulse</h2>
          <p style={{ marginTop: 6, maxWidth: 640, fontSize: 14, color: '#64748b' }}>{FEATURE_PARITY_SOURCE_NOTE}</p>
        </div>
        <span style={{ alignSelf: 'flex-start', borderRadius: 999, border: '1px solid #e2e8f0', background: '#f8fafc', padding: '4px 12px', fontSize: 12, fontWeight: 600, color: '#64748b' }}>
          Super Admin only
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        <div style={cardStyle}>
          <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>Total features tracked</p>
          <p style={{ fontSize: 22, fontWeight: 700, margin: '4px 0 0' }}>{totals.total}</p>
        </div>
        <div style={cardStyle}>
          <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>Exclusive to Task Pulse</p>
          <p style={{ fontSize: 22, fontWeight: 700, margin: '4px 0 0' }}>{totals.exclusiveTaskPulse}</p>
        </div>
        <div style={cardStyle}>
          <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>Exclusive to StaffiQ</p>
          <p style={{ fontSize: 22, fontWeight: 700, margin: '4px 0 0' }}>{totals.exclusiveStaffiq}</p>
        </div>
        <div style={cardStyle}>
          <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>Live in both</p>
          <p style={{ fontSize: 22, fontWeight: 700, margin: '4px 0 0' }}>{totals.inBoth}</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        <input
          type="search"
          value={search}
          onChange={event => setSearch(event.target.value)}
          placeholder="Search feature, description, or reason..."
          style={{ ...inputStyle, flex: '1 1 240px' }}
          aria-label="Search feature parity records"
        />
        <select value={category} onChange={event => setCategory(event.target.value)} style={inputStyle} aria-label="Filter by category">
          {categories.map(option => <option key={option} value={option}>{option === ALL ? 'All categories' : option}</option>)}
        </select>
        <select value={verdict} onChange={event => setVerdict(event.target.value)} style={inputStyle} aria-label="Filter by verdict">
          {verdicts.map(option => <option key={option} value={option}>{option === ALL ? 'All verdicts' : option}</option>)}
        </select>
      </div>

      <div style={tableWrapStyle}>
        <table style={{ width: '100%', minWidth: 900, borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={thStyle}>Category</th>
              <th style={thStyle}>Feature</th>
              <th style={thStyle}>Task Pulse</th>
              <th style={thStyle}>StaffiQ</th>
              <th style={thStyle}>Verdict</th>
              <th style={thStyle}>Why</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row, index) => (
              <tr key={`${row.category}-${row.feature}-${index}`}>
                <td style={{ ...tdStyle, whiteSpace: 'nowrap', color: '#64748b' }}>{row.category}</td>
                <td style={{ ...tdStyle, fontWeight: 600 }}>
                  {row.feature}
                  <p style={{ marginTop: 4, fontSize: 12, fontWeight: 400, color: '#64748b' }}>{row.description}</p>
                </td>
                <td style={tdStyle}><StatusPill status={row.taskPulseStatus} label={row.taskPulseStatusLabel} /></td>
                <td style={tdStyle}><StatusPill status={row.staffiqStatus} label={row.staffiqStatusLabel} /></td>
                <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{row.verdict}</td>
                <td style={{ ...tdStyle, color: '#64748b' }}>{row.why}</td>
              </tr>
            ))}
            {filteredRows.length === 0 && (
              <tr>
                <td colSpan={6} style={{ ...tdStyle, textAlign: 'center', color: '#64748b' }}>No features match this search or filter.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div>
        <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Super Admin console, side by side</h3>
        <p style={{ marginTop: 4, fontSize: 13, color: '#64748b' }}>Same page. The filters above do not apply here by design, this is a short, always visible reference list.</p>
        <div style={{ ...tableWrapStyle, marginTop: 10 }}>
          <table style={{ width: '100%', minWidth: 900, borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Console area</th>
                <th style={thStyle}>Task Pulse</th>
                <th style={thStyle}>StaffiQ</th>
                <th style={thStyle}>Note</th>
              </tr>
            </thead>
            <tbody>
              {SUPER_ADMIN_PARITY_ROWS.map((row, index) => (
                <tr key={`${row.area}-${index}`}>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>{row.area}</td>
                  <td style={{ ...tdStyle, color: '#64748b' }}>
                    <span style={{ fontWeight: 600, color: '#0f172a' }}>{row.taskPulse}</span>
                    {row.taskPulseDetail && <p style={{ marginTop: 4 }}>{row.taskPulseDetail}</p>}
                  </td>
                  <td style={{ ...tdStyle, color: '#64748b' }}>
                    <span style={{ fontWeight: 600, color: '#0f172a' }}>{row.staffiq}</span>
                    {row.staffiqDetail && <p style={{ marginTop: 4 }}>{row.staffiqDetail}</p>}
                  </td>
                  <td style={{ ...tdStyle, color: '#64748b' }}>{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
