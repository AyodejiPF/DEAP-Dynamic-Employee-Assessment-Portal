/**
 * Billing Cloud Functions — HTTP Endpoints
 *
 * Endpoints:
 *   POST   /api/webhooks/paystack     — Paystack webhook receiver
 *   POST   /api/billing/checkout       — Create checkout session
 *   GET    /api/billing/subscription   — Get tenant subscription
 *   POST   /api/billing/preview-upgrade — Preview proration
 *   POST   /api/billing/upgrade        — Execute upgrade
 *   POST   /api/billing/downgrade      — Schedule downgrade
 *   POST   /api/billing/cancel         — Cancel subscription
 */

import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import { paystackProvider } from './paystack'
import { calculateUpgradeProration } from './proration'
import { assertValidTransition, type SubscriptionStatus } from './stateMachine'
import type { CheckoutParams } from './provider'

// ─── Firestore ───────────────────────────────────────────────────

let _db: FirebaseFirestore.Firestore | null = null
function db(): FirebaseFirestore.Firestore {
  if (!_db) _db = admin.firestore()
  return _db
}

// ─── Helpers ─────────────────────────────────────────────────────

interface TenantSubscription {
  subscriptionId: string
  tenantId: string
  planId: string
  planVersionId: string | null
  billingInterval: 'monthly' | 'annual'
  status: SubscriptionStatus
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  cancelledAt: string | null
  providerSubscriptionId: string | null
  amount: number // kobo
  currency: string
  createdAt: string
  updatedAt: string
}

async function getSubscription(tenantId: string): Promise<TenantSubscription | null> {
  const snapshot = await db()
    .collection('subscriptions')
    .where('tenantId', '==', tenantId)
    .where('status', 'in', ['active', 'trialing', 'past_due', 'grace', 'cancel_scheduled'])
    .limit(1)
    .get()

  if (snapshot.empty) return null
  return snapshot.docs[0].data() as TenantSubscription
}

// ─── Webhook Handler ─────────────────────────────────────────────

/**
 * POST /api/webhooks/paystack
 * Receives charge.success, invoice.create, subscription.disable etc.
 */
export const staffiqWebhookPaystack = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' })
      return
    }

    // Verify signature
    const signature = req.headers['x-paystack-signature'] as string
    if (!signature) {
      res.status(401).json({ error: 'Missing signature' })
      return
    }

    const rawBody = JSON.stringify(req.body)
    if (!paystackProvider.verifyWebhookSignature(rawBody, signature)) {
      res.status(401).json({ error: 'Invalid signature' })
      return
    }

    // Idempotency check
    const eventId = paystackProvider.getEventId(req.body)
    const existingEvent = await db()
      .collection('webhookEvents')
      .where('providerEventId', '==', eventId)
      .limit(1)
      .get()

    if (!existingEvent.empty) {
      res.status(200).json({ status: 'already_processed' })
      return
    }

    // Store raw webhook
    await db().collection('webhookEvents').add({
      provider: 'paystack',
      providerEventId: eventId,
      eventType: paystackProvider.getEventType(req.body),
      rawPayload: JSON.stringify(req.body),
      signatureVerified: true,
      processed: true,
      createdAt: new Date().toISOString(),
    })

    // Process by event type
    const eventType = paystackProvider.getEventType(req.body)

    if (eventType === 'charge.success') {
      // Payment confirmed — activate subscription
      const data = (req.body as Record<string, unknown>).data as Record<string, unknown>
      const metadata = (data?.metadata ?? {}) as Record<string, string>
      const tenantId = metadata?.tenantId

      if (tenantId) {
        // Record payment transaction
        await db().collection('paymentTransactions').add({
          tenantId,
          provider: 'paystack',
          providerTransactionId: String(data?.reference ?? ''),
          amount: Number(data?.amount ?? 0),
          currency: 'NGN',
          status: 'success',
          paymentMethod: String(data?.channel ?? ''),
          createdAt: new Date().toISOString(),
        })

        // Create or update subscription
        const subSnap = await db()
          .collection('subscriptions')
          .where('tenantId', '==', tenantId)
          .limit(1)
          .get()

        const planId = metadata?.planId ?? 'plan_growth'
        const billingInterval = (metadata?.billingInterval as 'monthly' | 'annual') ?? 'monthly'
        const periodStart = new Date()
        const periodEnd = new Date(periodStart)
        if (billingInterval === 'annual') {
          periodEnd.setFullYear(periodEnd.getFullYear() + 1)
        } else {
          periodEnd.setMonth(periodEnd.getMonth() + 1)
        }

        if (subSnap.empty) {
          // New subscription
          const subRef = db().collection('subscriptions').doc()
          await subRef.set({
            subscriptionId: subRef.id,
            tenantId,
            planId,
            planVersionId: null,
            billingInterval,
            status: 'active',
            currentPeriodStart: periodStart.toISOString(),
            currentPeriodEnd: periodEnd.toISOString(),
            cancelAtPeriodEnd: false,
            cancelledAt: null,
            providerSubscriptionId: String((data?.subscription as Record<string, unknown>)?.subscription_code ?? ''),
            amount: Number(data?.amount ?? 0),
            currency: 'NGN',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
        } else {
          // Update existing — extend period
          await subSnap.docs[0].ref.update({
            status: 'active',
            currentPeriodEnd: periodEnd.toISOString(),
            updatedAt: new Date().toISOString(),
          } as unknown as FirebaseFirestore.UpdateData<FirebaseFirestore.DocumentData>)
        }
      }
    }

    res.status(200).json({ status: 'ok' })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Webhook error:', message)
    res.status(500).json({ error: message })
  }
})

// ─── Checkout ────────────────────────────────────────────────────

/**
 * POST /api/billing/checkout
 * Body: { tenantId, planId, billingInterval, email, callbackUrl, amount, currency }
 */
export const staffiqCreateCheckout = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' })
      return
    }

    const params: CheckoutParams = {
      amount: req.body.amount,
      currency: req.body.currency ?? 'NGN',
      email: req.body.email,
      tenantId: req.body.tenantId,
      planId: req.body.planId,
      billingInterval: req.body.billingInterval ?? 'monthly',
      callbackUrl: req.body.callbackUrl,
      couponCode: req.body.couponCode,
      metadata: req.body.metadata,
    }

    if (!params.amount || !params.email || !params.tenantId || !params.planId) {
      res.status(400).json({ error: 'Missing required fields: amount, email, tenantId, planId' })
      return
    }

    const session = await paystackProvider.createCheckout(params)

    res.status(200).json({ status: 'ok', session })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    res.status(500).json({ error: message })
  }
})

// ─── Subscription ────────────────────────────────────────────────

/**
 * GET /api/billing/subscription?tenantId=xxx
 */
export const staffiqGetSubscription = functions.https.onRequest(async (req, res) => {
  try {
    const tenantId = req.query.tenantId as string
    if (!tenantId) {
      res.status(400).json({ error: 'Missing tenantId query parameter' })
      return
    }

    const sub = await getSubscription(tenantId)
    if (!sub) {
      res.status(200).json({ status: 'ok', subscription: null })
      return
    }

    res.status(200).json({ status: 'ok', subscription: sub })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    res.status(500).json({ error: message })
  }
})

// ─── Proration Preview ───────────────────────────────────────────

/**
 * POST /api/billing/preview-upgrade
 * Body: { tenantId, newPlanId, newPrice (kobo), newBillingInterval }
 */
export const staffiqPreviewUpgrade = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' })
      return
    }

    const { tenantId, newPlanId, newPrice, newBillingInterval } = req.body
    if (!tenantId || !newPlanId || !newPrice) {
      res.status(400).json({ error: 'Missing required fields: tenantId, newPlanId, newPrice' })
      return
    }

    const sub = await getSubscription(tenantId)
    if (!sub) {
      res.status(404).json({ error: 'No active subscription found' })
      return
    }

    const result = calculateUpgradeProration({
      currentPrice: sub.amount,
      newPrice,
      currentPeriodStart: sub.currentPeriodStart,
      currentPeriodEnd: sub.currentPeriodEnd,
    })

    res.status(200).json({ status: 'ok', proration: result })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    res.status(500).json({ error: message })
  }
})

// ─── Execute Upgrade ─────────────────────────────────────────────

/**
 * POST /api/billing/upgrade
 * Body: { tenantId, newPlanId, newPrice (kobo), newBillingInterval,
 *         authorizationCode, email }
 */
export const staffiqExecuteUpgrade = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' })
      return
    }

    const { tenantId, newPlanId, newPrice, newBillingInterval, authorizationCode, email } = req.body
    if (!tenantId || !newPlanId || !newPrice) {
      res.status(400).json({ error: 'Missing required fields' })
      return
    }

    const sub = await getSubscription(tenantId)
    if (!sub) {
      res.status(404).json({ error: 'No active subscription found' })
      return
    }

    // Calculate proration
    const proration = calculateUpgradeProration({
      currentPrice: sub.amount,
      newPrice,
      currentPeriodStart: sub.currentPeriodStart,
      currentPeriodEnd: sub.currentPeriodEnd,
    })

    // Charge if needed
    if (proration.chargeNow > 0 && authorizationCode && email) {
      try {
        await paystackProvider.chargeAuthorization({
          amount: proration.chargeNow,
          currency: sub.currency,
          authorizationCode,
          email,
          metadata: {
            tenantId,
            reason: 'upgrade_proration',
            oldPlanId: sub.planId,
            newPlanId,
          },
        })
      } catch (err) {
        res.status(402).json({
          error: 'Payment failed. You remain on your current plan.',
          detail: err instanceof Error ? err.message : 'Unknown error',
        })
        return
      }
    }

    // Update subscription
    const subRef = db().collection('subscriptions').where('subscriptionId', '==', sub.subscriptionId).limit(1)
    const subSnap = await subRef.get()

    if (!subSnap.empty) {
      await subSnap.docs[0].ref.update({
        planId: newPlanId,
        billingInterval: newBillingInterval ?? sub.billingInterval,
        amount: newPrice,
        updatedAt: new Date().toISOString(),
      } as unknown as FirebaseFirestore.UpdateData<FirebaseFirestore.DocumentData>)
    }

    // Audit
    await db().collection('auditLogs').add({
      appId: 'staffiq',
      actor: tenantId,
      action: 'upgrade_subscription',
      targetType: 'subscription',
      targetId: sub.subscriptionId,
      before: { planId: sub.planId, amount: sub.amount },
      after: { planId: newPlanId, amount: newPrice },
      reason: 'Tenant-initiated upgrade',
      createdAt: new Date().toISOString(),
    })

    res.status(200).json({
      status: 'ok',
      message: 'Plan upgraded successfully.',
      proration,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    res.status(500).json({ error: message })
  }
})

// ─── Schedule Downgrade ──────────────────────────────────────────

/**
 * POST /api/billing/downgrade
 * Body: { tenantId, newPlanId, newPrice }
 */
export const staffiqScheduleDowngrade = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' })
      return
    }

    const { tenantId, newPlanId, newPrice } = req.body
    if (!tenantId || !newPlanId) {
      res.status(400).json({ error: 'Missing required fields' })
      return
    }

    const sub = await getSubscription(tenantId)
    if (!sub) {
      res.status(404).json({ error: 'No active subscription found' })
      return
    }

    // Schedule at period end — no immediate charge
    const subRef = db().collection('subscriptions').where('subscriptionId', '==', sub.subscriptionId).limit(1)
    const subSnap = await subRef.get()

    if (!subSnap.empty) {
      await subSnap.docs[0].ref.update({
        cancelAtPeriodEnd: false, // Not cancelling, just changing plan
        // Store scheduled downgrade in metadata
        scheduledDowngradePlanId: newPlanId,
        scheduledDowngradePrice: newPrice ?? sub.amount,
        updatedAt: new Date().toISOString(),
      } as unknown as FirebaseFirestore.UpdateData<FirebaseFirestore.DocumentData>)
    }

    // Audit
    await db().collection('auditLogs').add({
      appId: 'staffiq',
      actor: tenantId,
      action: 'schedule_downgrade',
      targetType: 'subscription',
      targetId: sub.subscriptionId,
      before: { planId: sub.planId },
      after: { scheduledPlanId: newPlanId, effectiveAt: sub.currentPeriodEnd },
      reason: 'Tenant-initiated downgrade',
      createdAt: new Date().toISOString(),
    })

    res.status(200).json({
      status: 'ok',
      message: `Your plan will change at the end of your current billing period (${sub.currentPeriodEnd}).`,
      effectiveDate: sub.currentPeriodEnd,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    res.status(500).json({ error: message })
  }
})

// ─── Cancel ──────────────────────────────────────────────────────

/**
 * POST /api/billing/cancel
 * Body: { tenantId, reason }
 */
export const staffiqCancelSubscription = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' })
      return
    }

    const { tenantId, reason } = req.body
    if (!tenantId) {
      res.status(400).json({ error: 'Missing tenantId' })
      return
    }

    const sub = await getSubscription(tenantId)
    if (!sub) {
      res.status(404).json({ error: 'No active subscription found' })
      return
    }

    const subRef = db().collection('subscriptions').where('subscriptionId', '==', sub.subscriptionId).limit(1)
    const subSnap = await subRef.get()

    if (!subSnap.empty) {
      await subSnap.docs[0].ref.update({
        cancelAtPeriodEnd: true,
        cancelledAt: new Date().toISOString(),
        cancelReason: reason ?? '',
        updatedAt: new Date().toISOString(),
      } as unknown as FirebaseFirestore.UpdateData<FirebaseFirestore.DocumentData>)
    }

    // Audit
    await db().collection('auditLogs').add({
      appId: 'staffiq',
      actor: tenantId,
      action: 'cancel_subscription',
      targetType: 'subscription',
      targetId: sub.subscriptionId,
      before: { status: sub.status },
      after: { status: 'cancel_scheduled', effectiveAt: sub.currentPeriodEnd },
      reason: reason ?? 'No reason provided',
      createdAt: new Date().toISOString(),
    })

    res.status(200).json({
      status: 'ok',
      message: `Subscription will be cancelled at the end of your billing period (${sub.currentPeriodEnd}).`,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    res.status(500).json({ error: message })
  }
})
