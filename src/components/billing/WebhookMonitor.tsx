/**
 * WebhookMonitor — View Paystack/Flutterwave webhook events.
 *
 * Allows Platform Owner and delegated Finance/Support roles to:
 *   - View recent webhook events (last 30 days)
 *   - Filter by event type, status, provider
 *   - Inspect raw payload
 *   - Manually retry failed events
 */

import { useState, useEffect, useCallback } from 'react'

interface WebhookEvent {
  id: string
  provider: 'paystack' | 'flutterwave'
  eventType: string
  status: 'received' | 'processed' | 'failed' | 'retried'
  tenantId?: string
  subscriptionId?: string
  amountKobo?: number
  rawPayload?: string
  error?: string
  createdAt: string
  processedAt?: string
}

interface WebhookMonitorProps {
  tenantId: string
  currentUser: { userId: string; role: string; fullName: string }
}

export function WebhookMonitor({ tenantId, currentUser }: WebhookMonitorProps) {
  const [events, setEvents] = useState<WebhookEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [providerFilter, setProviderFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedEvent, setSelectedEvent] = useState<WebhookEvent | null>(null)
  const [retrying, setRetrying] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const loadEvents = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ tenantId })
      if (providerFilter !== 'all') params.set('provider', providerFilter)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const res = await fetch(`/api/billing/admin/webhooks?${params}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setEvents(data.events ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load webhook events')
    } finally {
      setLoading(false)
    }
  }, [tenantId, providerFilter, statusFilter])

  useEffect(() => { loadEvents() }, [loadEvents])

  const handleRetry = async (eventId: string) => {
    setRetrying(true)
    setError(null)
    setSuccessMsg(null)
    try {
      const res = await fetch('/api/billing/admin/webhooks/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, eventId, actorUserId: currentUser.userId }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error((errData as any).error ?? `HTTP ${res.status}`)
      }
      setSuccessMsg(`Event ${eventId} retried.`)
      await loadEvents()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Retry failed')
    } finally {
      setRetrying(false)
    }
  }

  const formatNaira = (kobo: number) =>
    `₦${(kobo / 100).toLocaleString('en-NG')}`

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString('en-NG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

  const statusClass = (status: string) =>
    ({ received: 'status-info', processed: 'status-good', failed: 'status-bad', retried: 'status-warn' }[status] ?? '')

  if (loading) return <div className="admin-panel"><p>Loading webhook events...</p></div>

  return (
    <div className="admin-panel webhook-monitor">
      <div className="admin-header">
        <h2>Webhook Monitor</h2>
        <button className="btn-secondary" onClick={loadEvents}>Refresh</button>
      </div>

      {error && <div className="admin-error"><p className="error">{error}</p></div>}
      {successMsg && <div className="admin-success"><p>{successMsg}</p></div>}

      {/* Filters */}
      <div className="filter-bar">
        <label>
          Provider:
          <select value={providerFilter} onChange={(e) => setProviderFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="paystack">Paystack</option>
            <option value="flutterwave">Flutterwave</option>
          </select>
        </label>
        <label>
          Status:
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="received">Received</option>
            <option value="processed">Processed</option>
            <option value="failed">Failed</option>
            <option value="retried">Retried</option>
          </select>
        </label>
        <span className="event-count">{events.length} event{events.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Events Table */}
      <table className="admin-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Provider</th>
            <th>Event</th>
            <th>Status</th>
            <th>Amount</th>
            <th>Tenant</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {events.map((evt) => (
            <tr key={evt.id}>
              <td className="timestamp">{formatDate(evt.createdAt)}</td>
              <td>{evt.provider}</td>
              <td className="event-type">{evt.eventType}</td>
              <td>
                <span className={`status-badge ${statusClass(evt.status)}`}>
                  {evt.status}
                </span>
              </td>
              <td>{evt.amountKobo ? formatNaira(evt.amountKobo) : '—'}</td>
              <td>{evt.tenantId ?? '—'}</td>
              <td className="action-cell">
                <button className="btn-small" onClick={() => setSelectedEvent(evt)}>View</button>
                {evt.status === 'failed' && (
                  <button className="btn-small btn-warning" onClick={() => handleRetry(evt.id)} disabled={retrying}>
                    Retry
                  </button>
                )}
              </td>
            </tr>
          ))}
          {events.length === 0 && (
            <tr><td colSpan={7} className="empty">No webhook events found.</td></tr>
          )}
        </tbody>
      </table>

      {/* Event Detail */}
      {selectedEvent && (
        <div className="detail-panel">
          <h3>Event: {selectedEvent.id}</h3>
          <dl className="detail-grid">
            <dt>Type</dt><dd>{selectedEvent.eventType}</dd>
            <dt>Provider</dt><dd>{selectedEvent.provider}</dd>
            <dt>Status</dt><dd>{selectedEvent.status}</dd>
            <dt>Tenant</dt><dd>{selectedEvent.tenantId ?? '—'}</dd>
            <dt>Subscription</dt><dd>{selectedEvent.subscriptionId ?? '—'}</dd>
            <dt>Amount</dt><dd>{selectedEvent.amountKobo ? formatNaira(selectedEvent.amountKobo) : '—'}</dd>
            <dt>Received</dt><dd>{formatDate(selectedEvent.createdAt)}</dd>
            <dt>Processed</dt><dd>{selectedEvent.processedAt ? formatDate(selectedEvent.processedAt) : '—'}</dd>
          </dl>

          {selectedEvent.error && (
            <div className="event-error">
              <strong>Error:</strong> {selectedEvent.error}
            </div>
          )}

          {selectedEvent.rawPayload && (
            <details className="raw-payload">
              <summary>Raw Payload</summary>
              <pre>{JSON.stringify(JSON.parse(selectedEvent.rawPayload), null, 2)}</pre>
            </details>
          )}

          <button className="btn-secondary" onClick={() => setSelectedEvent(null)}>Close</button>
        </div>
      )}
    </div>
  )
}
