/**
 * VersionTrackerPanel — Super Admin only.
 *
 * Mirrors Task Pulse's "Version Tracker and Feature Update" page
 * (src/app/(protected)/admin/change-catalog/page.tsx) with StaffiQ's own,
 * honestly-sourced entries from src/data/changeCatalog.ts (itself sourced
 * from docs/agents/AGENT-COMMS.md).
 *
 * Self-contained inline styles are used deliberately, same reasoning as the
 * sibling FeatureParityPanel.tsx: this panel should not depend on either
 * app's CSS framework or assume any particular StaffiQ design system class
 * names, since src/superadmin/ is meant to stay independently reviewable.
 */

import { Fragment, useMemo, useState, type CSSProperties, type FormEvent } from 'react'
import {
  CHANGE_CATALOG_ENTRIES,
  answerChangeCatalogQuestion,
  getChangeCatalogCategoryCounts,
  getChangeCatalogEntriesSortedByDate,
  getChangeTypeCounts,
  getLatestChangeCatalogEntry,
  type ChangeCatalogAnswer,
  type ChangeCatalogEntry,
  type ChangeType,
} from '../../data/changeCatalog'

const ALL_TYPE = 'All' as const
const ALL_CATEGORY = 'All'

function formatDate(isoDate: string): string {
  if (!isoDate) return '—'
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const TYPE_COLORS: Record<ChangeType, { bg: string; fg: string; border: string }> = {
  'New Feature': { bg: '#eff6ff', fg: '#1e40af', border: '#bfdbfe' },
  'Improved Feature': { bg: '#fffbeb', fg: '#92400e', border: '#fde68a' },
  'Bug Fix': { bg: '#fef2f2', fg: '#991b1b', border: '#fecaca' },
  Other: { bg: '#f8fafc', fg: '#475569', border: '#e2e8f0' },
}

const STATUS_COLORS: Record<string, { bg: string; fg: string; border: string }> = {
  Live: { bg: '#ecfdf5', fg: '#065f46', border: '#a7f3d0' },
  'Pending Deployment': { bg: '#fff7ed', fg: '#9a3412', border: '#fed7aa' },
  Historical: { bg: '#f8fafc', fg: '#64748b', border: '#e2e8f0' },
}

function Pill({ label, colors }: { label: string; colors: { bg: string; fg: string; border: string } }) {
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
        fontWeight: 700,
        padding: '2px 10px',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  )
}

export function VersionTrackerPanel() {
  const [activeCategory, setActiveCategory] = useState<string>(ALL_CATEGORY)
  const [activeType, setActiveType] = useState<'All' | ChangeType>(ALL_TYPE)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState<ChangeCatalogAnswer | null>(null)

  const latest = useMemo(() => getLatestChangeCatalogEntry(), [])
  const categoryCounts = useMemo(() => getChangeCatalogCategoryCounts(), [])
  const typeCounts = useMemo(() => getChangeTypeCounts(), [])
  const sortedEntries = useMemo(() => getChangeCatalogEntriesSortedByDate(), [])

  const visibleEntries = useMemo(() => {
    return sortedEntries.filter((entry) => {
      const matchesCategory = activeCategory === ALL_CATEGORY || entry.categories.includes(activeCategory)
      const matchesType = activeType === ALL_TYPE || entry.changeType === activeType
      return matchesCategory && matchesType
    })
  }, [sortedEntries, activeCategory, activeType])

  function handleAsk(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setAnswer(answerChangeCatalogQuestion(question))
  }

  function jumpTo(entry: ChangeCatalogEntry) {
    setActiveCategory(ALL_CATEGORY)
    setActiveType(ALL_TYPE)
    setExpanded(entry.version)
    document.getElementById(`version-tracker-row-${entry.version}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const cardStyle: CSSProperties = { border: '1px solid #e2e8f0', borderRadius: 12, padding: 12, background: '#f8fafc' }
  const chipStyle = (active: boolean): CSSProperties => ({
    borderRadius: 999,
    padding: '6px 12px',
    fontSize: 12,
    fontWeight: 700,
    border: active ? '1px solid #0f172a' : '1px solid #e2e8f0',
    background: active ? '#0f172a' : '#f8fafc',
    color: active ? '#ffffff' : '#475569',
    cursor: 'pointer',
  })
  const tableWrapStyle: CSSProperties = { overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 12 }
  const thStyle: CSSProperties = {
    textAlign: 'left',
    padding: '8px 12px',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    color: '#64748b',
    background: '#f1f5f9',
    whiteSpace: 'nowrap',
  }
  const tdStyle: CSSProperties = { textAlign: 'left', padding: '8px 12px', fontSize: 14, verticalAlign: 'top', borderTop: '1px solid #e2e8f0' }

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Version Tracker and Feature Update</h2>
          <p style={{ marginTop: 6, maxWidth: 680, fontSize: 14, color: '#64748b' }}>
            Every recorded StaffiQ change, with an exact date, and whether it was a new feature, an improved feature, a
            bug fix, or another kind of change. Sourced from docs/agents/AGENT-COMMS.md — each row links back to its
            evidence. Ask the box below a question and it answers only from this catalogue.
          </p>
        </div>
        <span style={{ alignSelf: 'flex-start', borderRadius: 999, border: '1px solid #e2e8f0', background: '#f8fafc', padding: '4px 12px', fontSize: 12, fontWeight: 600, color: '#64748b' }}>
          Super Admin only
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        <div style={cardStyle}>
          <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>Entries recorded</p>
          <p style={{ fontSize: 22, fontWeight: 700, margin: '4px 0 0' }}>{CHANGE_CATALOG_ENTRIES.length}</p>
        </div>
        <div style={cardStyle}>
          <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>Latest</p>
          <p style={{ fontSize: 16, fontWeight: 700, margin: '4px 0 0' }}>{latest.version}</p>
          <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>{latest.title} — {formatDate(latest.date)}</p>
        </div>
        <div style={cardStyle}>
          <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>Status</p>
          <p style={{ fontSize: 16, fontWeight: 700, margin: '4px 0 0' }}>{latest.status}</p>
          <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>{latest.changeType}</p>
        </div>
      </div>

      <div style={{ ...cardStyle, background: '#ffffff' }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Ask the Version Tracker</h3>
        <p style={{ marginTop: 4, fontSize: 13, color: '#64748b' }}>
          Scoped only to this catalogue — for example "what shipped in July", "show me bug fixes", or "what changed
          about AI access". This is an instant keyword match against the recorded entries, not a model call, so it
          never invents a version that was not recorded here.
        </p>
        <form onSubmit={handleAsk} style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            type="text"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Ask about a version, a month, or a change type..."
            style={{ flex: '1 1 260px', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }}
          />
          <button
            type="submit"
            style={{ borderRadius: 8, border: 'none', background: '#0f172a', color: '#fff', padding: '8px 16px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
          >
            Ask
          </button>
        </form>
        {answer && (
          <div style={{ marginTop: 12, borderRadius: 12, border: '1px solid #e2e8f0', background: '#f8fafc', padding: 12 }}>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: '#0f172a' }}>{answer.answer}</p>
            {answer.matches.length > 0 && (
              <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {answer.matches.map((entry) => (
                  <button
                    key={entry.version}
                    type="button"
                    onClick={() => jumpTo(entry)}
                    style={{ borderRadius: 999, border: '1px solid #e2e8f0', background: '#fff', padding: '4px 10px', fontSize: 12, fontWeight: 700, color: '#334155', cursor: 'pointer' }}
                  >
                    {entry.version} · {formatDate(entry.date)}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <h3 style={{ fontSize: 13, fontWeight: 700, margin: 0, textTransform: 'uppercase', letterSpacing: 0.4, color: '#475569' }}>Filter by change type</h3>
          <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <button type="button" style={chipStyle(activeType === ALL_TYPE)} onClick={() => setActiveType(ALL_TYPE)}>All</button>
            {typeCounts.map((item) => (
              <button key={item.changeType} type="button" style={chipStyle(activeType === item.changeType)} onClick={() => setActiveType(item.changeType)}>
                {item.changeType} ({item.count})
              </button>
            ))}
          </div>
        </div>
        <div>
          <h3 style={{ fontSize: 13, fontWeight: 700, margin: 0, textTransform: 'uppercase', letterSpacing: 0.4, color: '#475569' }}>Filter by change area</h3>
          <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <button type="button" style={chipStyle(activeCategory === ALL_CATEGORY)} onClick={() => setActiveCategory(ALL_CATEGORY)}>All</button>
            {categoryCounts.map((item) => (
              <button key={item.category} type="button" style={chipStyle(activeCategory === item.category)} onClick={() => setActiveCategory(item.category)}>
                {item.category} ({item.count})
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={tableWrapStyle}>
        <table style={{ width: '100%', minWidth: 900, borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={thStyle}>Date</th>
              <th style={thStyle}>Version</th>
              <th style={thStyle}>Title</th>
              <th style={thStyle}>Type</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle} />
            </tr>
          </thead>
          <tbody>
            {visibleEntries.map((entry) => {
              const isOpen = expanded === entry.version
              return (
                <Fragment key={entry.version}>
                  <tr id={`version-tracker-row-${entry.version}`}>
                    <td style={{ ...tdStyle, whiteSpace: 'nowrap', color: '#64748b' }}>{formatDate(entry.date)}</td>
                    <td style={{ ...tdStyle, whiteSpace: 'nowrap', fontWeight: 700 }}>{entry.version}</td>
                    <td style={tdStyle}>{entry.title}</td>
                    <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}><Pill label={entry.changeType} colors={TYPE_COLORS[entry.changeType]} /></td>
                    <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                      <Pill label={entry.status} colors={STATUS_COLORS[entry.status] ?? STATUS_COLORS.Historical} />
                    </td>
                    <td style={{ ...tdStyle, whiteSpace: 'nowrap', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => setExpanded(isOpen ? null : entry.version)}
                        style={{ border: 'none', background: 'none', color: '#0f172a', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
                      >
                        {isOpen ? 'Hide' : 'Details'}
                      </button>
                    </td>
                  </tr>
                  {isOpen && (
                    <tr>
                      <td colSpan={6} style={{ ...tdStyle, background: '#f8fafc' }}>
                        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 0.8fr)' }}>
                          <div>
                            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: '#334155' }}>{entry.summary}</p>
                            <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                              {entry.categories.map((category) => (
                                <span key={category} style={{ borderRadius: 999, border: '1px solid #e2e8f0', padding: '2px 10px', fontSize: 11, fontWeight: 600, color: '#64748b' }}>
                                  {category}
                                </span>
                              ))}
                            </div>
                            <h4 style={{ marginTop: 12, marginBottom: 6, fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Changes</h4>
                            <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
                              {entry.changes.map((change) => (
                                <li key={change} style={{ fontSize: 13, lineHeight: 1.5, color: '#475569' }}>{change}</li>
                              ))}
                            </ul>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <div style={{ borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', padding: 12 }}>
                              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, color: '#94a3b8' }}>Learning and Help</p>
                              <p style={{ margin: '6px 0 0', fontSize: 13, lineHeight: 1.5, color: '#475569' }}>{entry.learningAndHelp}</p>
                            </div>
                            <div style={{ borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', padding: 12 }}>
                              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, color: '#94a3b8' }}>Deployment Note</p>
                              <p style={{ margin: '6px 0 0', fontSize: 13, lineHeight: 1.5, color: '#475569' }}>{entry.deploymentNote}</p>
                            </div>
                            <div style={{ borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', padding: 12 }}>
                              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, color: '#94a3b8' }}>Evidence Source</p>
                              <p style={{ margin: '6px 0 0', fontSize: 13, lineHeight: 1.5, color: '#475569' }}>{entry.source}</p>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
            {visibleEntries.length === 0 && (
              <tr>
                <td colSpan={6} style={{ ...tdStyle, textAlign: 'center', color: '#64748b' }}>No entries match this filter.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
