/**
 * Entitlement HTTP Endpoint — Cloud Function
 *
 * GET /api/entitlements/check?tenantId=xxx&featureKey=yyy
 *
 * Returns { allowed: boolean, reason?: string, planName?: string }
 * Platform Owner (U001) always returns allowed:true.
 */

const functions = require('firebase-functions')
const admin = require('firebase-admin')

exports.staffiqEntitlementsCheck = functions.https.onRequest(
  { timeoutSeconds: 30, memory: '256MiB', invoker: 'public' },
  async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*')
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    res.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
    if (req.method === 'OPTIONS') { res.status(204).send(''); return }

    try {
      const db = admin.firestore()
      const tenantId = req.query.tenantId
      const featureKey = req.query.featureKey
      const userId = req.query.userId || ''

      if (!tenantId || !featureKey) {
        res.status(400).json({ error: 'Missing tenantId or featureKey' })
        return
      }

      // Platform Owner bypass
      if (userId === 'U001') {
        res.status(200).json({ allowed: true })
        return
      }

      // Get active subscription
      const subSnap = await db.collection('subscriptions')
        .where('tenantId', '==', tenantId)
        .where('status', 'in', ['active', 'trialing', 'past_due', 'grace', 'cancel_scheduled'])
        .limit(1)
        .get()

      if (subSnap.empty) {
        res.status(200).json({ allowed: false, reason: 'no_active_subscription' })
        return
      }

      const sub = subSnap.docs[0].data()
      const planId = sub.planId || 'plan_starter'

      // Check plan entitlements
      const entSnap = await db.collection('planEntitlements')
        .where('planId', '==', planId)
        .where('featureKey', '==', featureKey)
        .limit(1)
        .get()

      if (entSnap.empty) {
        res.status(200).json({ allowed: false, reason: 'feature_not_in_plan', planName: planId })
        return
      }

      const ent = entSnap.docs[0].data()
      if (!ent.isEnabled) {
        res.status(200).json({ allowed: false, reason: 'feature_disabled', planName: planId })
        return
      }

      // Check admin overrides
      const overrideSnap = await db.collection('entitlementOverrides')
        .where('tenantId', '==', tenantId)
        .where('featureKey', '==', featureKey)
        .limit(1)
        .get()

      if (!overrideSnap.empty) {
        const ov = overrideSnap.docs[0].data()
        res.status(200).json({ allowed: ov.isEnabled === true, reason: ov.isEnabled ? undefined : 'admin_override_disabled', planName: planId })
        return
      }

      res.status(200).json({ allowed: true, planName: planId })
    } catch (error) {
      console.error('[entitlements-check]', error.message)
      res.status(500).json({ error: error.message })
    }
  },
)
