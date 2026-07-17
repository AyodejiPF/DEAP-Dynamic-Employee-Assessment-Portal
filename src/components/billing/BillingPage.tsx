/**
 * BillingPage — Container for all billing views and modals.
 *
 * Layout:
 *   - BillingDashboard (subscription overview)
 *   - Modals: Upgrade, Downgrade, Cancel
 *   - Admin tabs (Platform Owner / Billing Admin only):
 *     AdminPlanManager, AdminSubscriptionManager, WebhookMonitor
 */

import { useState } from 'react'
import { BillingDashboard } from './BillingDashboard'
import { UpgradeModal } from './UpgradeModal'
import { DowngradeModal } from './DowngradeModal'
import { CancelFlow } from './CancelFlow'
import { AdminPlanManager } from './AdminPlanManager'
import { AdminSubscriptionManager } from './AdminSubscriptionManager'
import { WebhookMonitor } from './WebhookMonitor'

interface BillingPageProps {
  tenantId: string
  currentUser: { userId: string; role: string; fullName: string }
  isPlatformOwner: boolean
  isBillingAdmin: boolean
  onToast: (message: string) => void
}

type BillingModal = 'upgrade' | 'downgrade' | 'cancel' | null
type AdminTab = 'plans' | 'subscriptions' | 'webhooks'

export function BillingPage({
  tenantId,
  currentUser,
  isPlatformOwner,
  isBillingAdmin,
  onToast,
}: BillingPageProps) {
  const [modal, setModal] = useState<BillingModal>(null)
  const [upgradeTarget, setUpgradeTarget] = useState('')
  const [adminTab, setAdminTab] = useState<AdminTab>('subscriptions')

  const showAdmin = isPlatformOwner || isBillingAdmin

  const handleActionComplete = () => {
    setModal(null)
    setUpgradeTarget('')
    onToast('Action completed.')
    // Force BillingDashboard to re-fetch
    window.location.reload()
  }

  return (
    <div className="billing-page">
      <BillingDashboard
        tenantId={tenantId}
        currentUser={currentUser}
      />

      {/* Plan Actions */}
      <div className="billing-actions">
        <button
          className="btn-primary"
          onClick={() => { setUpgradeTarget('growth'); setModal('upgrade') }}
        >
          Upgrade to Growth
        </button>
        <button
          className="btn-primary"
          onClick={() => { setUpgradeTarget('command'); setModal('upgrade') }}
        >
          Upgrade to Command
        </button>
        <button
          className="btn-secondary"
          onClick={() => { setModal('downgrade') }}
        >
          Downgrade
        </button>
        <button
          className="btn-warning"
          onClick={() => { setModal('cancel') }}
        >
          Cancel Plan
        </button>
      </div>

      {/* Modals */}
      {modal === 'upgrade' && upgradeTarget && (
        <UpgradeModal
          tenantId={tenantId}
          currentPlan="starter"
          currentInterval="monthly"
          targetPlan={upgradeTarget}
          targetInterval="monthly"
          onClose={() => { setModal(null); setUpgradeTarget('') }}
          onComplete={handleActionComplete}
        />
      )}
      {modal === 'downgrade' && (
        <DowngradeModal
          tenantId={tenantId}
          currentPlan="growth"
          targetPlan="starter"
          onClose={() => setModal(null)}
          onComplete={handleActionComplete}
        />
      )}
      {modal === 'cancel' && (
        <CancelFlow
          tenantId={tenantId}
          planName="StaffiQ"
          periodEnd={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()}
          onClose={() => setModal(null)}
          onComplete={handleActionComplete}
        />
      )}

      {/* Admin Section */}
      {showAdmin && (
        <div className="billing-admin-section">
          <h3>Billing Administration</h3>
          <div className="admin-tabs">
            <button
              className={`tab ${adminTab === 'subscriptions' ? 'active' : ''}`}
              onClick={() => setAdminTab('subscriptions')}
            >
              Subscriptions
            </button>
            <button
              className={`tab ${adminTab === 'plans' ? 'active' : ''}`}
              onClick={() => setAdminTab('plans')}
            >
              Plans
            </button>
            <button
              className={`tab ${adminTab === 'webhooks' ? 'active' : ''}`}
              onClick={() => setAdminTab('webhooks')}
            >
              Webhooks
            </button>
          </div>

          {adminTab === 'subscriptions' && (
            <AdminSubscriptionManager
              tenantId={tenantId}
              currentUser={currentUser}
            />
          )}
          {adminTab === 'plans' && (
            <AdminPlanManager
              tenantId={tenantId}
              currentUser={currentUser}
            />
          )}
          {adminTab === 'webhooks' && (
            <WebhookMonitor
              tenantId={tenantId}
              currentUser={currentUser}
            />
          )}
        </div>
      )}
    </div>
  )
}
