/**
 * AI Admin API Endpoints — Cloud Functions (TypeScript)
 *
 * SuperAdmin-only endpoints for managing tenant/user AI access
 * and querying cross-tenant AI usage analytics.
 *
 *   GET  /api/ai-access/status          — client-side access check
 *   POST /api/ai-admin/tenant-access    — toggle tenant AI on/off
 *   POST /api/ai-admin/user-access      — toggle per-user AI override
 *   GET  /api/ai-admin/usage            — query usage events
 */

import { onRequest } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import {
  enforceAIAccess,
  getTenantAIAccess,
  getUserAIAccess,
  getMonthlyCallsUsed,
  getTenantPlan,
  buildAccessContext,
  buildFeatureAccessMap,
} from './accessControl'
import type { AIFeatureName, TenantPlanID } from './types'
import { PLAN_AI_FEATURES } from './types'

// ─── Firestore (lazy init) ─────────────────────────────────────────

const db = admin.firestore()
const tenantsRef = db.collection('tenants')
const usersRef = db.collection('users')
const usageEventsRef = db.collection('ai_usage_events')
const usageSummariesRef = db.collection('ai_usage_summaries')

// ─── Allowed Origins ───────────────────────────────────────────────

const allowedOrigins = new Set([
  'https://training-assessment-1c8ef.web.app',
  'https://training-assessment-1c8ef.firebaseapp.com',
  'https://staffiq.ng',
  'https://www.staffiq.ng',
  'https://staffiq-ng.web.app',
  'https://staffiq-ng.firebaseapp.com',
  'http://127.0.0.1:5173',
  'http://localhost:5173',
])

function setCors(req: any, res: any, methods = 'GET, POST, OPTIONS'): void {
  const origin = req.get('origin')
  if (origin && allowedOrigins.has(origin)) {
    res.set('Access-Control-Allow-Origin', origin)
    res.set('Vary', 'Origin')
  }
  res.set('Access-Control-Allow-Methods', methods)
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Staffiq-Tenant-Id, X-Staffiq-User-Id, X-Staffiq-User-Email, X-Staffiq-User-Role, X-Staffiq-Owner')
  res.set('Cache-Control', 'no-store')
}

// ─── SuperAdmin Guard ──────────────────────────────────────────────

function requireSuperAdmin(req: any, res: any): boolean {
  const userId = req.get('x-staffiq-user-id')
  if (userId !== 'U001') {
    res.status(403).json({ message: 'Only the Super Admin can manage AI access.' })
    return false
  }
  return true
}

// ═══════════════════════════════════════════════════════════════════
// GET /api/ai-access/status — Client-Side Access Check
// ═══════════════════════════════════════════════════════════════════

export const aiAccessStatus = onRequest(
  { region: 'us-central1', timeoutSeconds: 15, memory: '256MiB', invoker: 'public' },
  async (req, res) => {
    setCors(req, res, 'GET, OPTIONS')
    if (req.method === 'OPTIONS') {
      res.status(204).send('')
      return
    }

    try {
      const tenantId = (req.get('x-staffiq-tenant-id') || req.query.tenantId) as string
      const userId = (req.get('x-staffiq-user-id') || req.query.userId || 'guest') as string
      const userRole = (req.get('x-staffiq-user-role') || 'employee') as string

      if (!tenantId) {
        res.status(400).json({ error: 'Tenant ID is required.' })
        return
      }

      const [tenantPlanId, tenantAIAccess, userAIAccess, monthlyCallsUsed] = await Promise.all([
        getTenantPlan(tenantId),
        getTenantAIAccess(tenantId),
        getUserAIAccess(tenantId, userId),
        getMonthlyCallsUsed(tenantId),
      ])

      const baseCtx = { userId, userRole, tenantId, tenantPlanId, tenantAIAccess, userAIAccess, monthlyLimit: null as number | null, monthlyCallsUsed }
      const featureMap = buildFeatureAccessMap(baseCtx)

      const aiEnabled = Object.values(featureMap).some(Boolean)

      // Compute the first block reason for messaging
      let firstBlockReason: string | null = null
      let firstBlockMessage: string | null = null
      let upgradeCTA: string | null = null

      if (!aiEnabled) {
        const allFeatures: AIFeatureName[] = [
          'admin_chat', 'smart_task', 'ai_insights', 'executive_brief',
          'help_chat', 'codex_repair', 'training_recommend',
        ]
        for (const feature of allFeatures) {
          const result = enforceAIAccess({ ...baseCtx, featureName: feature })
          if (!result.allowed) {
            firstBlockReason = result.reason
            firstBlockMessage = result.message
            upgradeCTA = result.upgradeCTA || null
            break
          }
        }
      }

      res.status(200).json({
        aiEnabled,
        reason: firstBlockReason,
        message: firstBlockMessage,
        upgradeCTA,
        features: featureMap,
        planName: tenantPlanId,
        planAllowsAI: PLAN_AI_FEATURES[tenantPlanId]?.length > 0,
        tenantAIAccess,
        userAIAccess,
        monthlyLimit: PLAN_AI_FEATURES[tenantPlanId]?.length > 0 ? (tenantPlanId === 'command' ? 500 : 200) : 0,
        monthlyCallsUsed,
      })
    } catch (error: any) {
      console.error('[ai-access-status] Error:', error.message)
      res.status(500).json({ error: 'Failed to check AI access status.' })
    }
  },
)

// ═══════════════════════════════════════════════════════════════════
// POST /api/ai-admin/tenant-access — Toggle Tenant AI
// ═══════════════════════════════════════════════════════════════════

export const aiAdminTenantAccess = onRequest(
  { region: 'us-central1', timeoutSeconds: 30, memory: '256MiB', invoker: 'public' },
  async (req, res) => {
    setCors(req, res, 'POST, OPTIONS')
    if (req.method === 'OPTIONS') {
      res.status(204).send('')
      return
    }

    if (!requireSuperAdmin(req, res)) return

    try {
      const { tenantID: targetTenantId, access, monthlyLimit } = req.body || {}

      if (!targetTenantId || !['enabled', 'disabled', 'growth_and_above'].includes(access)) {
        res.status(400).json({ error: 'tenantID and valid access level (enabled|disabled|growth_and_above) are required.' })
        return
      }

      const update: Record<string, any> = { AIAccess: access }
      if (monthlyLimit !== undefined) {
        update.AIMonthlyCallLimit = monthlyLimit === null ? null : Math.max(0, Number(monthlyLimit) || 0)
      }

      await tenantsRef.doc(targetTenantId).update(update)

      res.status(200).json({
        success: true,
        tenantID: targetTenantId,
        access,
        monthlyLimit: monthlyLimit ?? null,
      })
    } catch (error: any) {
      console.error('[ai-admin-tenant] Error:', error.message)
      res.status(500).json({ error: 'Failed to update tenant AI access.' })
    }
  },
)

// ═══════════════════════════════════════════════════════════════════
// POST /api/ai-admin/user-access — Toggle Per-User AI Override
// ═══════════════════════════════════════════════════════════════════

export const aiAdminUserAccess = onRequest(
  { region: 'us-central1', timeoutSeconds: 30, memory: '256MiB', invoker: 'public' },
  async (req, res) => {
    setCors(req, res, 'POST, OPTIONS')
    if (req.method === 'OPTIONS') {
      res.status(204).send('')
      return
    }

    if (!requireSuperAdmin(req, res)) return

    try {
      const { userID: targetUserId, access } = req.body || {}

      if (!targetUserId || !['inherit', 'enabled', 'disabled'].includes(access)) {
        res.status(400).json({ error: 'userID and valid access level (inherit|enabled|disabled) are required.' })
        return
      }

      await usersRef.doc(targetUserId).set({ AIAccess: access }, { merge: true })

      res.status(200).json({ success: true, userID: targetUserId, access })
    } catch (error: any) {
      console.error('[ai-admin-user] Error:', error.message)
      res.status(500).json({ error: 'Failed to update user AI access.' })
    }
  },
)

// ═══════════════════════════════════════════════════════════════════
// GET /api/ai-admin/usage — Query AI Usage Events
// ═══════════════════════════════════════════════════════════════════

export const aiAdminUsage = onRequest(
  { region: 'us-central1', timeoutSeconds: 60, memory: '512MiB', invoker: 'public' },
  async (req, res) => {
    setCors(req, res, 'GET, OPTIONS')
    if (req.method === 'OPTIONS') {
      res.status(204).send('')
      return
    }

    if (!requireSuperAdmin(req, res)) return

    try {
      const {
        tenantID,
        period,
        from,
        to,
        feature,
        userID,
        limit: limitParam,
      } = req.query as Record<string, string | undefined>

      const limit = Math.min(Number(limitParam) || 100, 1000)

      let query: FirebaseFirestore.Query = usageEventsRef
        .orderBy('CreatedAt', 'desc')
        .limit(limit)

      if (tenantID) query = query.where('TenantID', '==', tenantID)
      if (feature) query = query.where('FeatureName', '==', feature)
      if (userID) query = query.where('UserID', '==', userID)

      const snapshot = await query.get()
      const events = snapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          eventID: doc.id,
          ...data,
          CreatedAt: data.CreatedAt?.toDate?.()?.toISOString?.() ?? data.CreatedAt,
        }
      })

      // Fetch summaries if period specified
      let summaries: any[] = []
      if (period && tenantID) {
        const summarySnap = await usageSummariesRef
          .where('TenantID', '==', tenantID)
          .where('Period', '==', period)
          .orderBy('PeriodKey', 'desc')
          .limit(5)
          .get()

        summaries = summarySnap.docs.map((doc) => doc.data())
      }

      const totalCalls = events.length
      const successCalls = events.filter((e: any) => e.SuccessFlag).length

      res.status(200).json({
        events,
        summaries,
        totals: {
          totalCalls,
          successRate: totalCalls > 0 ? Math.round((successCalls / totalCalls) * 1000) / 10 : 0,
        },
      })
    } catch (error: any) {
      console.error('[ai-admin-usage] Error:', error.message)
      res.status(500).json({ error: 'Failed to query AI usage.' })
    }
  },
)
