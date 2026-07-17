/**
 * DowngradeModal — Plan downgrade confirmation.
 *
 * Downgrades take effect at period end. Shows credit calculation
 * and effective date. Calls /api/billing/schedule-downgrade.
 */

import { useState, useEffect } from 'react'

interface DowngradePreview {
  creditAmount: number
  remainingDays: number
  totalDays: number
  effectiveDate: string
}

interface DowngradeModalProps {
  tenantId: string
  currentPlan: string
  targetPlan: string
  onClose: () => void
  onComplete: () => void
}

export function DowngradeModal({
  tenantId,
  currentPlan,
  targetPlan,
  onClose,
  onComplete,
}: DowngradeModalProps) {
  const [preview, setPreview] = useState<DowngradePreview | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [confirmText, setConfirmText] = useState('')

  useEffect(() => {
    async function loadPreview() {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams({ tenantId, currentPlan, targetPlan })
        const res = await fetch(`/api/billing/preview-downgrade?${params}`)
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error((body as any).error ?? `HTTP ${res.status}`)
        }
        const data = await res.json()
        setPreview(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load preview')
      } finally {
        setLoading(false)
      }
    }
    loadPreview()
  }, [tenantId, currentPlan, targetPlan])

  const handleConfirm = async () => {
    if (confirmText !== 'CONFIRM') return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/billing/schedule-downgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, targetPlan }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error((body as any).error ?? `HTTP ${res.status}`)
      }
      setSuccess(true)
      setTimeout(() => onComplete(), 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Downgrade failed')
    } finally {
      setSubmitting(false)
    }
  }

  const formatNaira = (kobo: number) =>
    `₦${(kobo / 100).toLocaleString('en-NG')}`

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' })

  const planLabel = (id: string) =>
    ({ starter: 'Starter', growth: 'Growth', command: 'Command' }[id] ?? id)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content downgrade-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">×</button>

        <h2>Downgrade Plan</h2>

        {success ? (
          <div className="downgrade-success">
            <p className="success-icon">✓</p>
            <p>
              Downgrade to <strong>{planLabel(targetPlan)}</strong> scheduled.
              Takes effect on <strong>{preview ? formatDate(preview.effectiveDate) : 'period end'}</strong>.
            </p>
          </div>
        ) : loading ? (
          <p className="loading-text">Calculating...</p>
        ) : error ? (
          <div className="downgrade-error">
            <p className="error">{error}</p>
            <button className="btn-secondary" onClick={onClose}>Close</button>
          </div>
        ) : preview ? (
          <>
            <div className="downgrade-summary">
              <div className="plan-change">
                <div className="plan-from">
                  <span className="label">Current</span>
                  <span className="plan">{planLabel(currentPlan)}</span>
                </div>
                <span className="arrow">→</span>
                <div className="plan-to">
                  <span className="label">Downgrade to</span>
                  <span className="plan">{planLabel(targetPlan)}</span>
                </div>
              </div>

              <div className="downgrade-details">
                <p>
                  Your current {planLabel(currentPlan)} plan remains active until{' '}
                  <strong>{formatDate(preview.effectiveDate)}</strong> ({preview.remainingDays} days).
                </p>
                {preview.creditAmount > 0 && (
                  <p className="credit-note">
                    Unused credit of <strong>{formatNaira(preview.creditAmount)}</strong> will be applied to your next invoice.
                  </p>
                )}
              </div>
            </div>

            <div className="downgrade-confirm">
              <label htmlFor="downgrade-confirm-input">
                Type <strong>CONFIRM</strong> to schedule the downgrade:
              </label>
              <input
                id="downgrade-confirm-input"
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="CONFIRM"
                className="confirm-input"
              />
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={onClose} disabled={submitting}>
                Cancel
              </button>
              <button
                className="btn-warning"
                onClick={handleConfirm}
                disabled={submitting || confirmText !== 'CONFIRM'}
              >
                {submitting ? 'Scheduling...' : 'Schedule Downgrade'}
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
