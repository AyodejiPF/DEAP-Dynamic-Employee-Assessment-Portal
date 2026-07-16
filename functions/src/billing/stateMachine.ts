/**
 * Subscription State Machine
 *
 * 12 states with defined valid transitions.
 * The state machine ensures subscriptions never enter invalid states.
 *
 * States:
 *   draft → checkout_pending → payment_pending → active → past_due → grace → suspended
 *   active → cancel_scheduled → cancelled
 *   trialing → active (on payment) or expired
 *   active → disputed → suspended (if lost) or active (if won)
 */

// ─── States ──────────────────────────────────────────────────────

export type SubscriptionStatus =
  | 'draft'
  | 'checkout_pending'
  | 'payment_pending'
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'grace'
  | 'suspended'
  | 'cancel_scheduled'
  | 'cancelled'
  | 'expired'
  | 'disputed'

// ─── Feature Access by State ─────────────────────────────────────

export const FEATURE_ACCESS_MAP: Record<SubscriptionStatus, boolean> = {
  draft: false,
  checkout_pending: false,
  payment_pending: false,
  trialing: true,
  active: true,
  past_due: true,       // Full access during retries
  grace: true,           // Full access with warning banner
  suspended: false,
  cancel_scheduled: true, // Full access until period end
  cancelled: false,
  expired: false,
  disputed: false,       // Suspended during review
}

// ─── Valid Transitions ───────────────────────────────────────────

export const VALID_TRANSITIONS: Record<SubscriptionStatus, SubscriptionStatus[]> = {
  draft: ['checkout_pending'],
  checkout_pending: ['payment_pending', 'expired'],
  payment_pending: ['active', 'past_due', 'expired'],
  trialing: ['active', 'expired', 'cancelled'],
  active: ['past_due', 'cancel_scheduled', 'cancelled', 'disputed'],
  past_due: ['grace', 'active', 'suspended'],
  grace: ['active', 'suspended'],
  suspended: ['active', 'cancelled'],
  cancel_scheduled: ['cancelled', 'active'], // active = reactivation
  cancelled: ['active'], // reactivation within 30 days
  expired: ['checkout_pending'], // retry
  disputed: ['active', 'suspended'],
}

// ─── State Labels ────────────────────────────────────────────────

export const STATE_LABELS: Record<SubscriptionStatus, string> = {
  draft: 'Draft',
  checkout_pending: 'Checkout Pending',
  payment_pending: 'Payment Pending',
  trialing: 'Trial',
  active: 'Active',
  past_due: 'Past Due',
  grace: 'Grace Period',
  suspended: 'Suspended',
  cancel_scheduled: 'Cancellation Scheduled',
  cancelled: 'Cancelled',
  expired: 'Expired',
  disputed: 'Disputed',
}

// ─── State Guard ─────────────────────────────────────────────────

/**
 * Check if a transition is valid. Throws if not.
 */
export function assertValidTransition(
  from: SubscriptionStatus,
  to: SubscriptionStatus,
): void {
  const allowed = VALID_TRANSITIONS[from]
  if (!allowed || !allowed.includes(to)) {
    throw new Error(
      `Invalid subscription state transition: ${STATE_LABELS[from]} → ${STATE_LABELS[to]}`,
    )
  }
}

/**
 * Returns true if the subscription grants feature access.
 */
export function hasFeatureAccess(status: SubscriptionStatus): boolean {
  return FEATURE_ACCESS_MAP[status] ?? false
}

/**
 * Returns true if the subscription is in a billable state.
 */
export function isBillable(status: SubscriptionStatus): boolean {
  return ['active', 'past_due', 'grace', 'cancel_scheduled'].includes(status)
}

/**
 * Returns true if the subscription is in a recoverable failed state.
 */
export function isRecoverable(status: SubscriptionStatus): boolean {
  return ['past_due', 'grace', 'suspended'].includes(status)
}
