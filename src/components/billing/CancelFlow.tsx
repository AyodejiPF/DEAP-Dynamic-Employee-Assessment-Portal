/**
 * CancelFlow — Multi-step cancellation wizard.
 *
 * Step 1: Reason collection + optional feedback
 * Step 2: Confirmation with consequences
 * Step 3: Done with reactivation window
 *
 * Calls /api/billing/cancel-subscription.
 */

import { useState } from 'react'

interface CancelFlowProps {
  tenantId: string
  planName: string
  periodEnd: string
  onClose: () => void
  onComplete: () => void
}

type CancelStep = 'reason' | 'confirm' | 'done'

const CANCEL_REASONS = [
  'Too expensive',
  'Missing feature',
  'Not using enough',
  'Found alternative',
  'Poor experience',
  'Temporary — will return',
  'Other',
]

export function CancelFlow({ tenantId, planName, periodEnd, onClose, onComplete }: CancelFlowProps) {
  const [step, setStep] = useState<CancelStep>('reason')
  const [reason, setReason] = useState('')
  const [feedback, setFeedback] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/billing/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, reason, feedback }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error((body as any).error ?? `HTTP ${res.status}`)
      }
      setStep('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cancellation failed')
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content cancel-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">×</button>

        {step === 'reason' && (
          <>
            <h2>Cancel {planName} Plan</h2>
            <p className="cancel-intro">
              We're sorry to see you go. Please tell us why — it helps us improve.
            </p>

            <div className="cancel-reasons">
              <label>Reason for cancelling:</label>
              <div className="reason-options">
                {CANCEL_REASONS.map((r) => (
                  <label key={r} className={`reason-chip ${reason === r ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="cancel-reason"
                      value={r}
                      checked={reason === r}
                      onChange={() => setReason(r)}
                    />
                    {r}
                  </label>
                ))}
              </div>
            </div>

            <div className="cancel-feedback">
              <label htmlFor="cancel-feedback">Additional feedback (optional):</label>
              <textarea
                id="cancel-feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={3}
                placeholder="Tell us more about your experience..."
              />
            </div>

            {error && <p className="error">{error}</p>}

            <div className="modal-actions">
              <button className="btn-secondary" onClick={onClose}>Keep Plan</button>
              <button
                className="btn-warning"
                onClick={() => setStep('confirm')}
                disabled={!reason}
              >
                Continue
              </button>
            </div>
          </>
        )}

        {step === 'confirm' && (
          <>
            <h2>Confirm Cancellation</h2>

            <div className="cancel-consequences">
              <p>
                You'll lose access to <strong>{planName}</strong> features after{' '}
                <strong>{formatDate(periodEnd)}</strong>.
              </p>
              <ul>
                <li>Your data will be preserved for 30 days.</li>
                <li>You can reactivate within 30 days without data loss.</li>
                <li>After 30 days, all tenant data will be permanently deleted.</li>
              </ul>
            </div>

            {error && <p className="error">{error}</p>}

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setStep('reason')} disabled={submitting}>
                Back
              </button>
              <button
                className="btn-danger"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? 'Cancelling...' : 'Yes, Cancel My Plan'}
              </button>
            </div>
          </>
        )}

        {step === 'done' && (
          <>
            <h2>Plan Cancelled</h2>
            <p>Your {planName} plan has been cancelled.</p>
            <p>Access continues until <strong>{formatDate(periodEnd)}</strong>.</p>
            <p className="reactivation-note">
              You can reactivate your plan from your Billing dashboard within 30 days.
            </p>
            <button className="btn-primary" onClick={onComplete}>Done</button>
          </>
        )}
      </div>
    </div>
  )
}
