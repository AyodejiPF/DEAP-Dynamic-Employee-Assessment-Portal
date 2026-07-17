/**
 * UpgradeModal — Plan upgrade confirmation with proration preview.
 *
 * Shows: current plan → new plan, prorated amount, effective date.
 * Calls /api/billing/preview-upgrade then /api/billing/execute-upgrade.
 */

import { useState, useEffect } from 'react'

interface UpgradePreview {
  chargeNow: number
  unusedCurrent: number
  newProrated: number
  remainingDays: number
  totalDays: number
}

interface UpgradeModalProps {
  tenantId: string
  currentPlan: string
  currentInterval: 'monthly' | 'annual'
  targetPlan: string
  targetInterval: 'monthly' | 'annual'
  onClose: () => void
  onComplete: () => void
}

export function UpgradeModal({
  tenantId,
  currentPlan,
  currentInterval,
  targetPlan,
  targetInterval,
  onClose,
  onComplete,
}: UpgradeModalProps) {
  const [preview, setPreview] = useState<UpgradePreview | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    async function loadPreview() {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams({
          tenantId,
          currentPlan,
          currentInterval,
          targetPlan,
          targetInterval,
        })
        const res = await fetch(`/api/billing/preview-upgrade?${params}`)
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
  }, [tenantId, currentPlan, currentInterval, targetPlan, targetInterval])

  const handleConfirm = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/billing/execute-upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          targetPlan,
          targetInterval,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error((body as any).error ?? `HTTP ${res.status}`)
      }
      setSuccess(true)
      setTimeout(() => onComplete(), 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upgrade failed')
    } finally {
      setSubmitting(false)
    }
  }

  const formatNaira = (kobo: number) =>
    `₦${(kobo / 100).toLocaleString('en-NG')}`

  const planLabel = (id: string) =>
    ({ starter: 'Starter', growth: 'Growth', command: 'Command' }[id] ?? id)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content upgrade-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">×</button>

        <h2>Upgrade Plan</h2>

        {success ? (
          <div className="upgrade-success">
            <p className="success-icon">✓</p>
            <p>Upgrade to <strong>{planLabel(targetPlan)}</strong> successful!</p>
          </div>
        ) : loading ? (
          <p className="loading-text">Calculating proration...</p>
        ) : error ? (
          <div className="upgrade-error">
            <p className="error">{error}</p>
            <button className="btn-secondary" onClick={onClose}>Close</button>
          </div>
        ) : preview ? (
          <>
            <div className="upgrade-summary">
              <div className="plan-change">
                <div className="plan-from">
                  <span className="label">Current</span>
                  <span className="plan">{planLabel(currentPlan)}</span>
                  <span className="interval">{currentInterval}</span>
                </div>
                <span className="arrow">→</span>
                <div className="plan-to">
                  <span className="label">New</span>
                  <span className="plan">{planLabel(targetPlan)}</span>
                  <span className="interval">{targetInterval}</span>
                </div>
              </div>

              {preview.chargeNow > 0 && (
                <div className="proration-details">
                  <p className="proration-header">Prorated charge for remaining {preview.remainingDays} days:</p>
                  <div className="proration-line">
                    <span>New plan ({preview.remainingDays} days)</span>
                    <span>{formatNaira(preview.newProrated)}</span>
                  </div>
                  <div className="proration-line">
                    <span>Unused credit</span>
                    <span>− {formatNaira(preview.unusedCurrent)}</span>
                  </div>
                  <div className="proration-line total">
                    <span>Amount due now</span>
                    <span>{formatNaira(preview.chargeNow)}</span>
                  </div>
                </div>
              )}

              {preview.chargeNow === 0 && (
                <p className="no-charge">No immediate charge — new rate applies at renewal.</p>
              )}
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={onClose} disabled={submitting}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleConfirm} disabled={submitting}>
                {submitting ? 'Processing...' : preview.chargeNow > 0 ? `Pay ${formatNaira(preview.chargeNow)}` : 'Confirm Upgrade'}
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
