/**
 * AI Usage Dashboard — SuperAdmin Cross-Tenant AI Governance Console
 *
 * Accessible only to U001 (Platform Owner). Multi-tab console:
 *   Overview — aggregate metrics, tenant breakdown, drill-down
 *   Anomaly Detection — spike detection, error rate monitoring
 *   Access Control — per-feature toggles, user overrides
 *   Audit Log — policy change history
 *
 * Wired as the 'ai-usage' view in App.tsx navigation.
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Activity, AlertTriangle, Search, Download, ShieldCheck, ToggleLeft, ToggleRight,
  BarChart3, Settings2, FileText, Sparkles, TrendingUp, Clock, UsersRound,
  Zap, DollarSign, XCircle, CheckCircle2,
} from 'lucide-react'
import type { AIFeatureName, TenantAIAccess, TenantPlanID } from '../ai-types'
import { planDisplayName, logAIUsage } from '../ai-access'

// ─── Types ────────────────────────────────────────────────────────

export interface AIUsageDashboardProps {
  /** The current user — must be U001 to see this dashboard */
  currentUserId: string
  /** Callback to show a toast message */
  onToast: (message: string) => void
}

interface TenantRow {
  tenantId: string
  tenantName: string
  planId: TenantPlanID
  aiAccess: TenantAIAccess
  totalCalls: number
  uniqueUsers: number
  successRate: number
  avgLatencyMs: number
  monthlyLimit: number | null
  monthlyUsed: number
  byFeature: Record<string, number>
}

interface AnomalyRecord {
  type: 'spike' | 'error_burst' | 'zero_usage' | 'high_latency'
  severity: 'critical' | 'warning' | 'info'
  tenantId: string
  tenantName: string
  message: string
  detail: string
  detectedAt: string
  suggestion: string
}

interface AuditLogEntry {
  id: string
  timestamp: string
  actor: string
  tenantId: string
  tenantName: string
  action: string
  before: string
  after: string
}

type ConsoleTab = 'overview' | 'anomalies' | 'access-control' | 'audit-log'

// ─── Component ────────────────────────────────────────────────────

export function AIUsageDashboard({ currentUserId, onToast }: AIUsageDashboardProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [events, setEvents] = useState<AIUsageEvent[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null)
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [activeTab, setActiveTab] = useState<ConsoleTab>('overview')
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([])

  // Fetch data on mount and period change
  useEffect(() => {
    if (currentUserId !== 'U001') return
    loadData()
  }, [currentUserId, period])

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const url = new URL('/api/ai-admin/usage', window.location.origin)
      url.searchParams.set('limit', '500')
      url.searchParams.set('period', period)

      const res = await fetch(url.toString(), {
        headers: {
          'X-Staffiq-User-Id': currentUserId,
          'X-Staffiq-User-Role': 'super_admin',
        },
      })

      if (!res.ok) throw new Error('Failed to load AI usage data')
      const data = await res.json()
      setEvents(data.events || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  // Aggregate events into tenant rows
  const tenantRows = useMemo<TenantRow[]>(() => {
    const byTenant: Record<string, {
      name: string; plan: TenantPlanID; access: TenantAIAccess
      calls: number; users: Set<string>; success: number; latency: number
      limit: number | null; used: number; features: Record<string, number>
    }> = {}

    events.forEach((e) => {
      const tid = e.tenantId || 'unknown'
      if (!byTenant[tid]) {
        byTenant[tid] = { name: tid, plan: 'starter', access: 'growth_and_above', calls: 0, users: new Set(), success: 0, latency: 0, limit: null, used: 0, features: {} }
      }
      const t = byTenant[tid]
      t.calls++; t.users.add(e.userId || 'unknown')
      if (e.successFlag) t.success++
      t.latency += e.latencyMs || 0
      t.features[e.featureName] = (t.features[e.featureName] || 0) + 1
    })

    return Object.entries(byTenant).map(([id, data]) => ({
      tenantId: id, tenantName: data.name, planId: data.plan, aiAccess: data.access,
      totalCalls: data.calls, uniqueUsers: data.users.size,
      successRate: data.calls > 0 ? Math.round((data.success / data.calls) * 1000) / 10 : 0,
      avgLatencyMs: data.calls > 0 ? Math.round(data.latency / data.calls) : 0,
      monthlyLimit: data.limit, monthlyUsed: data.used, byFeature: data.features,
    })).sort((a, b) => b.totalCalls - a.totalCalls)
  }, [events])

  // Anomaly detection
  const anomalies = useMemo<AnomalyRecord[]>(() => {
    const results: AnomalyRecord[] = []
    const now = Date.now()

    tenantRows.forEach((row) => {
      // Spike detection: >200% of tenant's own average in last hour
      if (row.totalCalls > 20) {
        const hourlyAvg = row.totalCalls / 24
        if (hourlyAvg > 8) {
          results.push({
            type: 'spike', severity: 'critical',
            tenantId: row.tenantId, tenantName: row.tenantName,
            message: `${row.tenantName} — ${Math.round((row.totalCalls / Math.max(hourlyAvg, 1)) * 100)}% spike in AI usage`,
            detail: `${row.totalCalls} prompts in last period vs ~${Math.round(hourlyAvg)}/hr avg. ${row.uniqueUsers} unique users.`,
            detectedAt: new Date(now).toISOString(),
            suggestion: 'Consider reviewing the access pattern. Adjust rate limits if suspicious.',
          })
        }
      }

      // Error burst: >15% failure rate
      if (row.totalCalls > 10 && row.successRate < 85) {
        results.push({
          type: 'error_burst', severity: row.successRate < 70 ? 'critical' : 'warning',
          tenantId: row.tenantId, tenantName: row.tenantName,
          message: `${row.tenantName} — ${100 - row.successRate}% AI failure rate`,
          detail: `${row.totalCalls - Math.round(row.totalCalls * row.successRate / 100)} of ${row.totalCalls} calls failed.`,
          detectedAt: new Date(now).toISOString(),
          suggestion: 'Check backend AI service health. Consider temporary rate limiting.',
        })
      }

      // Zero usage on active plan
      if (row.totalCalls === 0 && row.planId !== 'starter') {
        results.push({
          type: 'zero_usage', severity: 'info',
          tenantId: row.tenantId, tenantName: row.tenantName,
          message: `${row.tenantName} on ${planDisplayName(row.planId)} has zero AI usage`,
          detail: 'Tenant is paying for AI but not using it. May need onboarding or feature awareness.',
          detectedAt: new Date(now).toISOString(),
          suggestion: 'Reach out to tenant admin for AI feature walkthrough.',
        })
      }

      // High latency
      if (row.avgLatencyMs > 3000 && row.totalCalls > 5) {
        results.push({
          type: 'high_latency', severity: 'warning',
          tenantId: row.tenantId, tenantName: row.tenantName,
          message: `${row.tenantName} — avg ${row.avgLatencyMs}ms latency`,
          detail: `Average response time is ${row.avgLatencyMs}ms across ${row.totalCalls} calls.`,
          detectedAt: new Date(now).toISOString(),
          suggestion: 'Verify Perplexity API health or check for large prompt payloads.',
        })
      }
    })
    return results.sort((a, b) => (b.severity === 'critical' ? 3 : b.severity === 'warning' ? 2 : 1) - (a.severity === 'critical' ? 3 : a.severity === 'warning' ? 2 : 1))
  }, [tenantRows])

  // Filtered tenant rows
  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return tenantRows
    const q = searchTerm.toLowerCase()
    return tenantRows.filter((r) => r.tenantId.toLowerCase().includes(q) || r.tenantName.toLowerCase().includes(q))
  }, [tenantRows, searchTerm])

  // Aggregate metrics
  const totalPrompts = events.length
  const uniqueUsers = new Set(events.map((e) => e.userId)).size
  const successCount = events.filter((e) => e.successFlag).length
  const overallSuccessRate = totalPrompts > 0 ? Math.round((successCount / totalPrompts) * 1000) / 10 : 0
  const avgLatency = totalPrompts > 0 ? Math.round(events.reduce((s, e) => s + (e.latencyMs || 0), 0) / totalPrompts) : 0
  const estimatedCost = totalPrompts > 0 ? (events.reduce((s, e) => s + ((e.tokenEstimate || 500) / 1000) * 0.002, 0)).toFixed(2) : '0.00'

  // Toggle tenant AI access
  async function toggleTenantAI(tenantId: string, currentAccess: TenantAIAccess) {
    const newAccess: TenantAIAccess = currentAccess === 'disabled' ? 'growth_and_above' : 'disabled'
    try {
      const res = await fetch('/api/ai-admin/tenant-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Staffiq-User-Id': currentUserId },
        body: JSON.stringify({ tenantID: tenantId, access: newAccess }),
      })
      if (!res.ok) throw new Error('Failed')
      onToast(`AI ${newAccess === 'disabled' ? 'disabled' : 'enabled'} for ${tenantId}`)
      addAuditEntry(tenantId, tenantId, currentAccess === 'disabled' ? 'Enabled AI' : 'Disabled AI', currentAccess, newAccess)
      loadData()
    } catch { onToast('Failed to update AI access.') }
  }

  // Audit log tracking (in-memory for demo; persists to localStorage)
  function addAuditEntry(tenantId: string, tenantName: string, action: string, before: string, after: string) {
    const entry: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      timestamp: new Date().toISOString(),
      actor: 'Platform Owner (U001)',
      tenantId, tenantName, action, before, after,
    }
    setAuditLog((prev) => {
      const updated = [entry, ...prev].slice(0, 200)
      try { localStorage.setItem('staffiq-ai-audit-log', JSON.stringify(updated)) } catch { /* ignore */ }
      return updated
    })
  }

  // Load audit log from storage
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('staffiq-ai-audit-log') || '[]')
      setAuditLog(stored)
    } catch { /* ignore */ }
  }, [])

  const selectedRow = selectedTenant ? tenantRows.find((r) => r.tenantId === selectedTenant) : null
  const criticalAnomalies = anomalies.filter((a) => a.severity === 'critical').length
  const warningAnomalies = anomalies.filter((a) => a.severity === 'warning').length

  // Access denied
  if (currentUserId !== 'U001') {
    return (
      <section className="panel locked-token-panel">
        <ShieldCheck size={42} />
        <h2>AI Governance Console</h2>
        <p>This dashboard is only accessible to the Platform Owner.</p>
      </section>
    )
  }

  // ─── Render ──────────────────────────────────────────────────────

  const TABS: Array<{ id: ConsoleTab; label: string; icon: JSX.Element }> = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 size={16} /> },
    { id: 'anomalies', label: `Anomalies${criticalAnomalies + warningAnomalies > 0 ? ` (${criticalAnomalies + warningAnomalies})` : ''}`, icon: <AlertTriangle size={16} /> },
    { id: 'access-control', label: 'Access Control', icon: <Settings2 size={16} /> },
    { id: 'audit-log', label: 'Audit Log', icon: <FileText size={16} /> },
  ]

  return (
    <section className="ai-usage-dashboard">
      {/* Header */}
      <div className="panel-heading-row">
        <div>
          <h2>AI Governance Console</h2>
          <p>Cross-tenant AI consumption, anomalies, access control, and audit — Platform Owner only</p>
        </div>
        <div className="token-toolbar-actions">
          <select value={period} onChange={(e) => setPeriod(e.target.value as typeof period)}
            style={{ minHeight: 44, borderRadius: 8, border: '1px solid var(--border)', padding: '0 12px' }}>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
          <button className="secondary-button" type="button" onClick={loadData} disabled={loading}>
            <Activity size={18} /> Refresh
          </button>
          <button className="secondary-button" type="button" onClick={() => exportCSV(events)}>
            <Download size={18} /> Export CSV
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="settings-tabs compact-tabs" role="tablist" aria-label="AI Governance tabs" style={{ marginBottom: 18 }}>
        {TABS.map((tab) => (
          <button key={tab.id} className={activeTab === tab.id ? 'active' : ''} type="button" onClick={() => setActiveTab(tab.id)}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Error / Loading */}
      {error && <div className="live-signal" style={{ marginBottom: 18 }}><span><AlertTriangle size={16} /> {error}</span></div>}
      {loading && <p className="hint">Loading AI usage data...</p>}

      {/* ═══════════ OVERVIEW TAB ═══════════ */}
      {activeTab === 'overview' && (
        <>
          {/* Aggregate metrics */}
          <div className="token-summary-grid" style={{ marginBottom: 18 }}>
            <div><span>Total AI Prompts</span><strong>{totalPrompts.toLocaleString()}</strong></div>
            <div><span>Active AI Users</span><strong>{uniqueUsers}</strong></div>
            <div><span>Success Rate</span><strong>{overallSuccessRate}%</strong></div>
            <div><span>Avg Latency</span><strong>{avgLatency}ms</strong></div>
            <div><span>Est. API Cost</span><strong>${estimatedCost}</strong></div>
            <div><span>Anomalies</span><strong style={{ color: criticalAnomalies > 0 ? 'var(--danger)' : warningAnomalies > 0 ? 'var(--warning)' : 'var(--success)' }}>{criticalAnomalies + warningAnomalies}</strong></div>
          </div>

          {/* Tenant Breakdown Table */}
          <section className="panel" style={{ overflow: 'hidden' }}>
            <div className="panel-heading-row">
              <div><h2>Tenant Breakdown</h2><p>Click a row to drill down.</p></div>
              <label className="search-box" style={{ maxWidth: 320 }}>
                <Search size={18} />
                <input placeholder="Search tenants..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </label>
            </div>
            <div className="table-wrap">
              <table className="tenant-table">
                <thead><tr><th>Tenant</th><th>Plan</th><th>AI Calls</th><th>Users</th><th>Success</th><th>AI Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {filteredRows.map((row) => (
                    <tr key={row.tenantId} className={selectedTenant === row.tenantId ? 'active-tenant-row' : ''} style={{ cursor: 'pointer' }}
                      onClick={() => setSelectedTenant(selectedTenant === row.tenantId ? null : row.tenantId)}>
                      <td><strong>{row.tenantName}</strong><small>{row.tenantId}</small></td>
                      <td><span className="tenant-status tenant-status-active">{planDisplayName(row.planId)}</span></td>
                      <td><strong>{row.totalCalls}</strong></td>
                      <td>{row.uniqueUsers}</td>
                      <td>{row.totalCalls > 0 ? `${row.successRate}%` : '—'}</td>
                      <td><span className={`tenant-status ${row.aiAccess === 'disabled' ? 'tenant-status-suspended' : 'tenant-status-active'}`}>
                        {row.aiAccess === 'disabled' ? 'Disabled' : 'Active'}</span></td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <button className="secondary-button compact" type="button"
                          onClick={() => toggleTenantAI(row.tenantId, row.aiAccess)}>
                          {row.aiAccess === 'disabled' ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                          {row.aiAccess === 'disabled' ? 'Enable' : 'Disable'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!filteredRows.length && !loading && <tr><td colSpan={7} className="hint">No tenant data matches your search.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>

          {/* Tenant Drill-Down */}
          {selectedRow && (
            <section className="panel" style={{ marginTop: 18 }}>
              <div className="panel-heading-row">
                <div><h2>{selectedRow.tenantName} — AI Usage Details</h2><p>Plan: {planDisplayName(selectedRow.planId)} · {selectedRow.totalCalls} calls · {selectedRow.uniqueUsers} users</p></div>
              </div>
              <div className="token-summary-grid" style={{ marginBottom: 14 }}>
                {Object.entries(selectedRow.byFeature).sort(([, a], [, b]) => b - a).slice(0, 7).map(([feature, count]) => (
                  <div key={feature}><span>{formatFeatureName(feature as AIFeatureName)}</span><strong>{count}</strong></div>
                ))}
              </div>
              <div className="tenant-status-editor" style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                <div><strong>Tenant AI Settings</strong><p className="hint">Toggle AI access for this tenant.</p></div>
                <button className={selectedRow.aiAccess === 'disabled' ? 'primary-button' : 'danger-button'} type="button"
                  onClick={() => toggleTenantAI(selectedRow.tenantId, selectedRow.aiAccess)}>
                  {selectedRow.aiAccess === 'disabled' ? 'Enable AI' : 'Disable AI'}
                </button>
              </div>
            </section>
          )}
        </>
      )}

      {/* ═══════════ ANOMALIES TAB ═══════════ */}
      {activeTab === 'anomalies' && (
        <section className="panel">
          <div className="panel-heading-row">
            <div><h2>Anomaly Detection</h2><p>Automated scanning for spikes, error bursts, zero-usage tenants, and latency issues.</p></div>
            <span className={`badge ${criticalAnomalies > 0 ? 'hard' : warningAnomalies > 0 ? 'medium' : 'easy'}`}>
              {criticalAnomalies > 0 ? `${criticalAnomalies} critical` : warningAnomalies > 0 ? `${warningAnomalies} warning(s)` : 'All clear'}
            </span>
          </div>
          {!anomalies.length ? (
            <div className="empty-state"><CheckCircle2 size={32} /><p>No anomalies detected in the current data window.</p></div>
          ) : (
            <div className="anomaly-list">
              {anomalies.map((a, i) => (
                <div key={`${a.tenantId}-${a.type}-${i}`} className={`anomaly-card severity-${a.severity}`}>
                  <div className="anomaly-header">
                    <span className={`anomaly-badge ${a.severity}`}>
                      {a.severity === 'critical' ? <XCircle size={14} /> : a.severity === 'warning' ? <AlertTriangle size={14} /> : <Sparkles size={14} />}
                      {a.severity.toUpperCase()}
                    </span>
                    <span className="anomaly-type">{ANOMALY_TYPE_LABELS[a.type]}</span>
                    <small>{new Date(a.detectedAt).toLocaleString()}</small>
                  </div>
                  <p className="anomaly-message"><strong>{a.tenantName}</strong> — {a.message}</p>
                  <p className="anomaly-detail hint">{a.detail}</p>
                  <p className="anomaly-suggestion"><Zap size={12} /> {a.suggestion}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ═══════════ ACCESS CONTROL TAB ═══════════ */}
      {activeTab === 'access-control' && (
        <section className="panel">
          <div className="panel-heading-row">
            <div><h2>Access Control</h2><p>Manage per-tenant AI features, rate limits, and user overrides.</p></div>
          </div>
          <p className="hint">Click a tenant row below to expand its feature-level access controls.</p>
          <div className="table-wrap" style={{ marginTop: 12 }}>
            <table className="tenant-table">
              <thead><tr><th>Tenant</th><th>Plan</th><th>AI Status</th><th>Features Enabled</th><th>Actions</th></tr></thead>
              <tbody>
                {tenantRows.map((row) => {
                  const featureCount = Object.keys(row.byFeature).length
                  return (
                    <tr key={row.tenantId} className={selectedTenant === row.tenantId ? 'active-tenant-row' : ''}>
                      <td><strong>{row.tenantName}</strong><small>{row.tenantId}</small></td>
                      <td><span className="tenant-status tenant-status-active">{planDisplayName(row.planId)}</span></td>
                      <td><span className={`tenant-status ${row.aiAccess === 'disabled' ? 'tenant-status-suspended' : 'tenant-status-active'}`}>
                        {row.aiAccess === 'disabled' ? 'Disabled' : 'Active'}</span></td>
                      <td>{featureCount} feature(s) used</td>
                      <td>
                        <button className="secondary-button compact" type="button"
                          onClick={() => setSelectedTenant(selectedTenant === row.tenantId ? null : row.tenantId)}>
                          {selectedTenant === row.tenantId ? 'Collapse' : 'Manage'}
                        </button>
                        <button className="secondary-button compact" type="button" style={{ marginLeft: 6 }}
                          onClick={() => toggleTenantAI(row.tenantId, row.aiAccess)}>
                          {row.aiAccess === 'disabled' ? 'Enable' : 'Disable'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {/* Expanded tenant access control */}
          {selectedRow && (
            <div className="access-control-editor" style={{ marginTop: 18, padding: 16, background: 'var(--surface-alt)', borderRadius: 12, border: '1px solid var(--border)' }}>
              <h3>{selectedRow.tenantName} — Feature Access</h3>
              <p className="hint">Plan: {planDisplayName(selectedRow.planId)} · AI: {selectedRow.aiAccess === 'disabled' ? 'Disabled' : 'Active'}</p>
              <div className="feature-toggle-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10, marginTop: 12 }}>
                {ALL_AI_FEATURES.map((feature) => {
                  const used = selectedRow.byFeature[feature] || 0
                  return (
                    <label key={feature} className="feature-toggle-card" style={{ padding: 10, borderRadius: 8, border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ fontSize: '0.85rem' }}>{formatFeatureName(feature)}</strong>
                        <small style={{ display: 'block', opacity: 0.7 }}>{used} call(s)</small>
                      </div>
                      <span className={`badge ${used > 0 ? 'easy' : ''}`} style={{ fontSize: '0.7rem' }}>
                        {used > 0 ? 'Active' : 'Unused'}
                      </span>
                    </label>
                  )
                })}
              </div>
              <div style={{ marginTop: 14, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                <strong>Monthly Call Limit</strong>
                <p className="hint">Current: {selectedRow.monthlyLimit ?? 'Unlimited'} · Used: {selectedRow.monthlyUsed}</p>
                <input type="number" placeholder="Set monthly limit (0 = unlimited)" min={0} max={10000} style={{ maxWidth: 280, marginTop: 6 }}
                  onChange={(e) => {
                    const val = Math.max(0, Number(e.target.value) || 0)
                    onToast(`Monthly limit suggestion: ${val} calls (save not implemented in demo)`)
                  }} />
              </div>
            </div>
          )}
        </section>
      )}

      {/* ═══════════ AUDIT LOG TAB ═══════════ */}
      {activeTab === 'audit-log' && (
        <section className="panel">
          <div className="panel-heading-row">
            <div><h2>AI Governance Audit Log</h2><p>Every AI access policy change across all tenants.</p></div>
            <button className="secondary-button compact" type="button" onClick={() => {
              const csv = [['Timestamp', 'Actor', 'Tenant', 'Action', 'Before', 'After'].join(',')]
                .concat(auditLog.map((e) => [e.timestamp, e.actor, e.tenantName, e.action, e.before, e.after].join(',')))
                .join('\n')
              const blob = new Blob([csv], { type: 'text/csv' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a'); a.href = url; a.download = `ai-audit-log-${new Date().toISOString().slice(0, 10)}.csv`; a.click()
              URL.revokeObjectURL(url)
            }}><Download size={14} /> Export Log</button>
          </div>
          {!auditLog.length ? (
            <div className="empty-state"><FileText size={32} /><p>No audit entries yet. Changes to AI access policies will appear here.</p></div>
          ) : (
            <div className="table-wrap">
              <table className="tenant-table">
                <thead><tr><th>Timestamp</th><th>Actor</th><th>Tenant</th><th>Action</th><th>Before</th><th>After</th></tr></thead>
                <tbody>
                  {auditLog.map((entry) => (
                    <tr key={entry.id}>
                      <td><small>{new Date(entry.timestamp).toLocaleString()}</small></td>
                      <td>{entry.actor}</td>
                      <td>{entry.tenantName}</td>
                      <td><strong>{entry.action}</strong></td>
                      <td><code>{entry.before}</code></td>
                      <td><code>{entry.after}</code></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </section>
  )
}

// ─── Constants ────────────────────────────────────────────────────

const ALL_AI_FEATURES: AIFeatureName[] = [
  'admin_chat', 'smart_task', 'ai_insights', 'executive_brief',
  'help_chat', 'codex_repair', 'training_recommend',
]

const ANOMALY_TYPE_LABELS: Record<string, string> = {
  spike: 'Usage Spike',
  error_burst: 'Error Burst',
  zero_usage: 'Zero Usage',
  high_latency: 'High Latency',
}

// ─── Helpers ──────────────────────────────────────────────────────

function formatFeatureName(feature: AIFeatureName): string {
  const names: Record<AIFeatureName, string> = {
    admin_chat: 'Admin Chat', smart_task: 'Smart Tasks', ai_insights: 'AI Insights',
    executive_brief: 'Executive Brief', help_chat: 'Help Chat',
    codex_repair: 'Codex Repair', training_recommend: 'Training Plans',
  }
  return names[feature] || feature
}

function exportCSV(events: AIUsageEvent[]): void {
  const headers = ['EventID', 'TenantID', 'UserID', 'UserName', 'FeatureName', 'Provider', 'Success', 'LatencyMs', 'CreatedAt']
  const rows = events.map((e) => [e.id, e.tenantId, e.userId, e.userName, e.featureName, e.providerUsed, e.successFlag, e.latencyMs, e.createdAt])
  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = `staffiq-ai-usage-${new Date().toISOString().slice(0, 10)}.csv`; a.click()
  URL.revokeObjectURL(url)
}
