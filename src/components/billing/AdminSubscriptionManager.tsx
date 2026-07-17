/**
 * AdminSubscriptionManager — Super admin view for managing tenant subscriptions.
 *
 * Allows Platform Owner and delegated Billing Admins to:
 *   - Search subscriptions by tenant
 *   - View full subscription details
 *   - Manually transition states (e.g., resolve disputes, extend grace)
 *   - Issue credits and refunds
 */

import { useState, useEffect, useCallback } from 'react'

interface SubRecord {
  subscriptionId: string
  tenantId: string
  tenantName: string
  planId: string
  billingInterval: 'monthly' | 'annual'
  status: string
  amountKobo: number
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  createdAt: string
  paymentProvider: string
  providerSubscriptionId?: string
}

interface AdminSubscriptionManagerProps {
  tenantId: string
  currentUser: { userId: string; role: string; fullName: string }
}

export function AdminSubscriptionManager({ tenantId, currentUser }: AdminSubscriptionManagerProps) {
  const [subscriptions, setSubscriptions] = useState<SubRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<SubRecord | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Status transition
  const [transitionTarget, setTransitionTarget] = useState('')
  const [transitionNote, setTransitionNote] = useState('')
  const [transitioning, setTransitioning] = useState(false)

  const loadSubscriptions = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/billing/admin/subscriptions?tenantId=${tenantId}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setSubscriptions(data.subscriptions ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load subscriptions')
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  useEffect(() => { loadSubscriptions() }, [loadSubscriptions])

  const handleTransition = async () => {
    if (!selected || !transitionTarget) return
    setTransitioning(true)
    setError(null)
    setSuccessMsg(null)
    try {
      const res = await fetch('/api/billing/admin/subscriptions/transition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          subscriptionId: selected.subscriptionId,
          newStatus: transitionTarget,
          note: transitionNote,
          actorUserId: currentUser.userId,
        }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error((errData as any).error ?? `HTTP ${res.status}`)
      }
      setSuccessMsg(`Subscription ${selected.subscriptionId} → ${transitionTarget}`)
      setTransitionTarget('')
      setTransitionNote('')
      await loadSubscriptions()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transition failed')
    } finally {
      setTransitioning(false)
    }
  }

  const formatNaira = (kobo: number) =>
    `₦${(kobo / 100).toLocaleString('en-NG')}`

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' })

  const statusClass = (status: string) =>
    ({ active: 'status-good', past_due: 'status-warn', grace: 'status-warn',
       suspended: 'status-bad', cancelled: 'status-bad', expired: 'status-bad',
       cancel_scheduled: 'status-warn', trialing: 'status-info' }[status] ?? '')

  const filtered = subscriptions.filter((s) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      s.tenantId.toLowerCase().includes(q) ||
      s.tenantName.toLowerCase().includes(q) ||
      s.subscriptionId.toLowerCase().includes(q) ||
      s.status.toLowerCase().includes(q)
    )
  })

  if (loading) return <div className="admin-panel"><p>Loading subscriptions...</p></div>

  return (
    <div className="admin-panel subscription-manager">
      <div className="admin-header">
        <h2>Subscription Manager</h2>
      </div>

      {error && <div className="admin-error"><p className="error">{error}</p></div>}
      {successMsg && <div className="admin-success"><p>{successMsg}</p></div>}

      {/* Search */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search by tenant, subscription ID, or status..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Subscription Table */}
      <table className="admin-table">
        <thead>
          <tr>
            <th>Tenant</th>
            <th>Plan</th>
            <th>Interval</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Period End</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((sub) => (
            <tr key={sub.subscriptionId}>
              <td>{sub.tenantName}</td>
              <td>{sub.planId}</td>
              <td>{sub.billingInterval}</td>
              <td>{formatNaira(sub.amountKobo)}</td>
              <td>
                <span className={`status-badge ${statusClass(sub.status)}`}>
                  {sub.status}
                </span>
              </td>
              <td>{formatDate(sub.currentPeriodEnd)}</td>
              <td>
                <button className="btn-small" onClick={() => setSelected(sub)}>View</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Detail Panel */}
      {selected && (
        <div className="detail-panel">
          <h3>Subscription: {selected.subscriptionId}</h3>
          <dl className="detail-grid">
            <dt>Tenant</dt><dd>{selected.tenantName} ({selected.tenantId})</dd>
            <dt>Plan</dt><dd>{selected.planId} ({selected.billingInterval})</dd>
            <dt>Amount</dt><dd>{formatNaira(selected.amountKobo)}</dd>
            <dt>Status</dt><dd>{selected.status}</dd>
            <dt>Period</dt><dd>{formatDate(selected.currentPeriodStart)} – {formatDate(selected.currentPeriodEnd)}</dd>
            <dt>Auto-cancel</dt><dd>{selected.cancelAtPeriodEnd ? 'Yes' : 'No'}</dd>
            <dt>Provider</dt><dd>{selected.paymentProvider}</dd>
            <dt>Created</dt><dd>{formatDate(selected.createdAt)}</dd>
          </dl>

          {/* Manual Status Transition */}
          <div className="transition-control">
            <h4>Manual Status Transition</h4>
            <select value={transitionTarget} onChange={(e) => setTransitionTarget(e.target.value)}>
              <option value="">Select new status...</option>
              <option value="active">Active</option>
              <option value="past_due">Past Due</option>
              <option value="grace">Grace</option>
              <option value="suspended">Suspended</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <input
              type="text"
              placeholder="Reason / note (required)"
              value={transitionNote}
              onChange={(e) => setTransitionNote(e.target.value)}
            />
            <button
              className="btn-warning"
              onClick={handleTransition}
              disabled={transitioning || !transitionTarget || !transitionNote}
            >
              {transitioning ? 'Processing...' : 'Transition'}
            </button>
          </div>

          <button className="btn-secondary" onClick={() => setSelected(null)}>Close</button>
        </div>
      )}
    </div>
  )
}
