/**
 * AI Usage Dashboard — SuperAdmin Cross-Tenant Analytics
 *
 * Accessible only to U001 (Platform Owner). Displays aggregate metrics,
 * tenant breakdown table, feature distribution, and inline access toggles.
 *
 * Wired as a dedicated view in the SuperAdmin panel.
 */

import { useState, useEffect, useMemo } from 'react'
import { Activity, AlertTriangle, Search, Download, ShieldCheck, ToggleLeft, ToggleRight } from 'lucide-react'
import type { AIUsageEvent, AIFeatureName, TenantAIAccess, TenantPlanID } from '../ai-types'
import { planDisplayName } from '../ai-access'

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

// ─── Component ────────────────────────────────────────────────────

export function AIUsageDashboard({ currentUserId, onToast }: AIUsageDashboardProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [events, setEvents] = useState<AIUsageEvent[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null)
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily')

  // Fetch data on mount
  useEffect(() => {
    if (currentUserId !== 'U001') return
    loadData()
  }, [currentUserId, period])

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const url = new URL('/api/ai-usage', window.location.origin)
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
      name: string
      plan: TenantPlanID
      access: TenantAIAccess
      calls: number
      users: Set<string>
      success: number
      latency: number
      limit: number | null
      used: number
      features: Record<string, number>
    }> = {}

    events.forEach((e) => {
      const tid = e.tenantId || 'unknown'
      if (!byTenant[tid]) {
        byTenant[tid] = {
          name: tid,
          plan: 'starter',
          access: 'growth_and_above',
          calls: 0,
          users: new Set(),
          success: 0,
          latency: 0,
          limit: null,
          used: 0,
          features: {},
        }
      }
      const t = byTenant[tid]
      t.calls++
      t.users.add(e.userId || 'unknown')
      if (e.successFlag) t.success++
      t.latency += e.latencyMs || 0
      t.features[e.featureName] = (t.features[e.featureName] || 0) + 1
    })

    return Object.entries(byTenant).map(([id, data]) => ({
      tenantId: id,
      tenantName: data.name,
      planId: data.plan,
      aiAccess: data.access,
      totalCalls: data.calls,
      uniqueUsers: data.users.size,
      successRate: data.calls > 0 ? Math.round((data.success / data.calls) * 1000) / 10 : 0,
      avgLatencyMs: data.calls > 0 ? Math.round(data.latency / data.calls) : 0,
      monthlyLimit: data.limit,
      monthlyUsed: data.used,
      byFeature: data.features,
    })).sort((a, b) => b.totalCalls - a.totalCalls)
  }, [events])

  // Filtered rows
  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return tenantRows
    const q = searchTerm.toLowerCase()
    return tenantRows.filter((r) =>
      r.tenantId.toLowerCase().includes(q) ||
      r.tenantName.toLowerCase().includes(q)
    )
  }, [tenantRows, searchTerm])

  // Aggregate metrics
  const totalPrompts = events.length
  const uniqueUsers = new Set(events.map((e) => e.userId)).size
  const successCount = events.filter((e) => e.successFlag).length
  const overallSuccessRate = totalPrompts > 0 ? Math.round((successCount / totalPrompts) * 1000) / 10 : 0
  const avgLatency = totalPrompts > 0 ? Math.round(events.reduce((s, e) => s + (e.latencyMs || 0), 0) / totalPrompts) : 0

  // Toggle tenant AI access
  async function toggleTenantAI(tenantId: string, currentAccess: TenantAIAccess) {
    const newAccess: TenantAIAccess = currentAccess === 'disabled' ? 'growth_and_above' : 'disabled'
    try {
      const res = await fetch('/api/admin/ai/tenant-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Staffiq-User-Id': currentUserId,
        },
        body: JSON.stringify({ tenantID: tenantId, access: newAccess }),
      })
      if (!res.ok) throw new Error('Failed to toggle AI access')
      onToast(`AI ${newAccess === 'disabled' ? 'disabled' : 'enabled'} for ${tenantId}`)
      loadData()
    } catch {
      onToast('Failed to update AI access.')
    }
  }

  // Selected tenant detail
  const selectedRow = selectedTenant ? tenantRows.find((r) => r.tenantId === selectedTenant) : null

  // Access denied
  if (currentUserId !== 'U001') {
    return (
      <section className="panel locked-token-panel">
        <ShieldCheck size={42} />
        <h2>AI Usage Dashboard</h2>
        <p>This dashboard is only accessible to the Platform Owner.</p>
      </section>
    )
  }

  return (
    <section className="ai-usage-dashboard">
      {/* Header */}
      <div className="panel-heading-row">
        <div>
          <h2>AI Usage Dashboard</h2>
          <p>Cross-tenant AI consumption analytics — Platform Owner only</p>
        </div>
        <div className="token-toolbar-actions">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as typeof period)}
            style={{ minHeight: 44, borderRadius: 8, border: '1px solid var(--border)', padding: '0 12px' }}
          >
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

      {/* Error state */}
      {error && (
        <div className="live-signal" style={{ marginBottom: 18 }}>
          <span><AlertTriangle size={16} /> {error}</span>
        </div>
      )}

      {/* Loading state */}
      {loading && <p className="hint">Loading AI usage data...</p>}

      {/* Aggregate metrics */}
      <div className="token-summary-grid" style={{ marginBottom: 18 }}>
        <div>
          <span>Total AI Prompts</span>
          <strong>{totalPrompts.toLocaleString()}</strong>
        </div>
        <div>
          <span>Active AI Users</span>
          <strong>{uniqueUsers}</strong>
        </div>
        <div>
          <span>Success Rate</span>
          <strong>{overallSuccessRate}%</strong>
        </div>
        <div>
          <span>Avg Latency</span>
          <strong>{avgLatency}ms</strong>
        </div>
        <div>
          <span>Tenants Using AI</span>
          <strong>{tenantRows.filter((r) => r.totalCalls > 0).length}</strong>
        </div>
        <div>
          <span>Zero-AI Tenants</span>
          <strong>{tenantRows.filter((r) => r.totalCalls === 0).length}</strong>
        </div>
      </div>

      {/* Tenant Breakdown Table */}
      <section className="panel" style={{ overflow: 'hidden' }}>
        <div className="panel-heading-row">
          <div>
            <h2>Tenant Breakdown</h2>
            <p>Click a row to drill down into per-tenant details.</p>
          </div>
          <label className="search-box" style={{ maxWidth: 320 }}>
            <Search size={18} />
            <input
              placeholder="Search tenants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </label>
        </div>

        <div className="table-wrap">
          <table className="tenant-table">
            <thead>
              <tr>
                <th>Tenant</th>
                <th>Plan</th>
                <th>AI Calls</th>
                <th>Users</th>
                <th>Success</th>
                <th>AI Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr
                  key={row.tenantId}
                  className={selectedTenant === row.tenantId ? 'active-tenant-row' : ''}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedTenant(selectedTenant === row.tenantId ? null : row.tenantId)}
                >
                  <td>
                    <strong>{row.tenantName}</strong>
                    <small>{row.tenantId}</small>
                  </td>
                  <td><span className="tenant-status tenant-status-active">{planDisplayName(row.planId)}</span></td>
                  <td><strong>{row.totalCalls}</strong></td>
                  <td>{row.uniqueUsers}</td>
                  <td>{row.totalCalls > 0 ? `${row.successRate}%` : '—'}</td>
                  <td>
                    <span className={`tenant-status ${row.aiAccess === 'disabled' ? 'tenant-status-suspended' : 'tenant-status-active'}`}>
                      {row.aiAccess === 'disabled' ? 'Disabled' : 'Active'}
                    </span>
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <button
                      className={`secondary-button compact`}
                      type="button"
                      onClick={() => toggleTenantAI(row.tenantId, row.aiAccess)}
                    >
                      {row.aiAccess === 'disabled' ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                      {row.aiAccess === 'disabled' ? 'Enable AI' : 'Disable AI'}
                    </button>
                  </td>
                </tr>
              ))}
              {!filteredRows.length && !loading && (
                <tr><td colSpan={7} className="hint">No tenant data matches your search.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Tenant Drill-Down */}
      {selectedRow && (
        <section className="panel" style={{ marginTop: 18 }}>
          <div className="panel-heading-row">
            <div>
              <h2>{selectedRow.tenantName} — AI Usage Details</h2>
              <p>Plan: {planDisplayName(selectedRow.planId)} · {selectedRow.totalCalls} total calls · {selectedRow.uniqueUsers} users</p>
            </div>
          </div>

          {/* Feature distribution */}
          <div className="token-summary-grid" style={{ marginBottom: 14 }}>
            {Object.entries(selectedRow.byFeature)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 6)
              .map(([feature, count]) => (
                <div key={feature}>
                  <span>{formatFeatureName(feature as AIFeatureName)}</span>
                  <strong>{count}</strong>
                </div>
              ))}
          </div>

          {/* Access controls */}
          <div className="tenant-status-editor" style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
            <div>
              <strong>Tenant AI Settings</strong>
              <p className="hint">Toggle AI access or set a monthly call limit for this tenant.</p>
            </div>
            <button
              className={selectedRow.aiAccess === 'disabled' ? 'primary-button' : 'danger-button'}
              type="button"
              onClick={() => toggleTenantAI(selectedRow.tenantId, selectedRow.aiAccess)}
            >
              {selectedRow.aiAccess === 'disabled' ? 'Enable AI' : 'Disable AI'}
            </button>
          </div>
        </section>
      )}
    </section>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────

function formatFeatureName(feature: AIFeatureName): string {
  const names: Record<AIFeatureName, string> = {
    admin_chat: 'Admin Chat',
    smart_task: 'Smart Tasks',
    ai_insights: 'AI Insights',
    executive_brief: 'Executive Brief',
    help_chat: 'Help Chat',
    codex_repair: 'Codex Repair',
    training_recommend: 'Training Plans',
  }
  return names[feature] || feature
}

function exportCSV(events: AIUsageEvent[]): void {
  const headers = ['EventID', 'TenantID', 'UserID', 'UserName', 'FeatureName', 'Provider', 'Success', 'LatencyMs', 'CreatedAt']
  const rows = events.map((e) => [
    e.id, e.tenantId, e.userId, e.userName, e.featureName,
    e.providerUsed, e.successFlag, e.latencyMs, e.createdAt,
  ])
  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `staffiq-ai-usage-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
