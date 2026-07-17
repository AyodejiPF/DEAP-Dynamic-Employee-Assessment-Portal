/**
 * BillingDashboard — Tenant subscription management view.
 * Shows current plan, renewal date, invoices, and upgrade/downgrade actions.
 */

import { useState, useEffect } from 'react'

interface SubscriptionInfo {
  planId: string
  planName: string
  billingInterval: 'monthly' | 'annual'
  status: string
  currentPeriodEnd: string
  amount: number
  currency: string
  cancelAtPeriodEnd: boolean
}

interface BillingDashboardProps {
  tenantId: string
  currentUser: { userId: string; role: string; fullName: string }
}

export function BillingDashboard({ tenantId }: BillingDashboardProps) {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchSubscription() {
      try {
        const res = await fetch(`/api/billing/subscription?tenantId=${tenantId}`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        setSubscription(data.subscription)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load subscription')
      } finally {
        setLoading(false)
      }
    }
    fetchSubscription()
  }, [tenantId])

  const formatNaira = (kobo: number) =>
    `₦${(kobo / 100).toLocaleString('en-NG')}`

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' })

  const planLabel = (planId: string) =>
    ({ plan_starter: 'Starter', plan_growth: 'Growth', plan_command: 'Command' }[planId] ?? planId)

  if (loading) return <div className="billing-dashboard"><p>Loading subscription...</p></div>
  if (error) return <div className="billing-dashboard"><p className="error">{error}</p></div>
  if (!subscription) {
    return (
      <div className="billing-dashboard">
        <h2>Billing</h2>
        <p>No active subscription. <a href="/pricing">View plans</a></p>
      </div>
    )
  }

  return (
    <div className="billing-dashboard">
      <h2>Billing</h2>

      <div className="billing-card">
        <div className="billing-plan-info">
          <h3>{planLabel(subscription.planId)} Plan</h3>
          <p className="billing-interval">
            {subscription.billingInterval === 'annual' ? 'Annual' : 'Monthly'} billing
          </p>
        </div>
        <div className="billing-price">
          <span className="price-amount">{formatNaira(subscription.amount)}</span>
          <span className="price-period">/{subscription.billingInterval === 'annual' ? 'year' : 'month'}</span>
        </div>
      </div>

      <div className="billing-details">
        <div className="billing-detail">
          <span className="label">Status</span>
          <span className={`value status-${subscription.status}`}>{subscription.status}</span>
        </div>
        <div className="billing-detail">
          <span className="label">Renews</span>
          <span className="value">{formatDate(subscription.currentPeriodEnd)}</span>
        </div>
        {subscription.cancelAtPeriodEnd && (
          <div className="billing-detail">
            <span className="label">Cancellation</span>
            <span className="value warning">Scheduled for {formatDate(subscription.currentPeriodEnd)}</span>
          </div>
        )}
      </div>

      <div className="billing-actions">
        <a href="/pricing" className="btn-secondary">Change Plan</a>
        {!subscription.cancelAtPeriodEnd && (
          <button className="btn-danger">Cancel Subscription</button>
        )}
      </div>
    </div>
  )
}
