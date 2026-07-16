/**
 * AI Access Control — Server-Side Enforcement
 *
 * This is the authoritative backend gate for all AI features.
 * Every AI Cloud Function MUST call `enforceAIAccess()` before processing.
 *
 * Decision flow (in order):
 *   0. SuperAdmin (U001) → always allowed
 *   1. Tenant AI toggle → if disabled, blocked
 *   2. Plan-based gating → Starter = blocked for all AI
 *   3. User-level override → disabled = blocked, enabled = allowed
 *   4. Monthly quota → exceeded = blocked
 */

import * as admin from 'firebase-admin'
import type {
  AIAccessContext,
  AIAccessResult,
  AIBlockReason,
  AIFeatureName,
  TenantPlanID,
  AIUsageEvent,
} from './types'
import {
  PLAN_AI_FEATURES,
  PLAN_RESTRICTION_MESSAGES,
} from './types'

// ─── Firestore refs (lazy — avoids init errors outside Cloud Functions runtime) ──

let _db: FirebaseFirestore.Firestore | null = null
function db(): FirebaseFirestore.Firestore {
  if (!_db) _db = admin.firestore()
  return _db
}

// ─── Core Access Check ─────────────────────────────────────────────

/**
 * Determines whether a user can access a specific AI feature.
 * Run this at the TOP of every AI Cloud Function handler.
 *
 * @returns AIAccessResult — if allowed: false, return the block to the client.
 */
export function enforceAIAccess(ctx: AIAccessContext): AIAccessResult {
  // 0. SuperAdmin bypass
  if (ctx.userId === 'U001') {
    return { allowed: true }
  }

  // 1. Tenant AI toggle
  if (ctx.tenantAIAccess === 'disabled') {
    return {
      allowed: false,
      reason: 'tenant_disabled',
      message: 'AI features are currently disabled for this workspace. Contact your admin to re-enable them.',
    }
  }

  // 2. Plan-based gating
  const allowedFeatures = PLAN_AI_FEATURES[ctx.tenantPlanId] ?? []
  if (!allowedFeatures.includes(ctx.featureName)) {
    return {
      allowed: false,
      reason: 'plan_restricted',
      message: PLAN_RESTRICTION_MESSAGES[ctx.featureName] ?? `This feature requires a higher plan.`,
      upgradeCTA: ctx.tenantPlanId === 'starter'
        ? 'Upgrade to Growth or Command to unlock AI features.'
        : `Upgrade to Command to unlock "${ctx.featureName}".`,
    }
  }

  // 3. User-level override
  if (ctx.userAIAccess === 'disabled') {
    return {
      allowed: false,
      reason: 'user_disabled',
      message: 'AI access has been disabled for your account. Contact your workspace admin.',
    }
  }

  // 4. Monthly quota
  if (ctx.monthlyLimit !== null && ctx.monthlyCallsUsed >= ctx.monthlyLimit) {
    return {
      allowed: false,
      reason: 'quota_exceeded',
      message: `Monthly AI call limit (${ctx.monthlyLimit}) reached. Limit resets at the start of next month.`,
    }
  }

  return { allowed: true }
}

// ─── Tenant-Level AI Status ────────────────────────────────────────

/**
 * Reads the tenant AI access toggle from Firestore.
 * Returns 'enabled' by default if the document or field is missing.
 */
export async function getTenantAIAccess(tenantId: string): Promise<'enabled' | 'disabled'> {
  try {
    const snap = await db()
      .collection('tenants')
      .doc(tenantId)
      .collection('app')
      .doc('settings')
      .get()

    const data = snap.data()
    return data?.aiAccess === 'disabled' ? 'disabled' : 'enabled'
  } catch {
    // If the settings doc doesn't exist, default to enabled
    return 'enabled'
  }
}

/**
 * Reads the per-user AI override from Firestore.
 * Returns 'inherit' by default (follows tenant/plan gating).
 */
export async function getUserAIAccess(
  tenantId: string,
  userId: string,
): Promise<'inherit' | 'enabled' | 'disabled'> {
  try {
    const snap = await db()
      .collection('tenants')
      .doc(tenantId)
      .collection('users')
      .doc(userId)
      .get()

    const data = snap.data()
    const override = data?.aiAccess as string | undefined
    if (override === 'enabled' || override === 'disabled') return override
    return 'inherit'
  } catch {
    return 'inherit'
  }
}

// ─── Quota Tracking ────────────────────────────────────────────────

/**
 * Reads the current month's AI call count for a tenant.
 * Uses a monthly counter document keyed by YYYY-MM.
 */
export async function getMonthlyCallsUsed(tenantId: string): Promise<number> {
  const now = new Date()
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  try {
    const snap = await db()
      .collection('tenants')
      .doc(tenantId)
      .collection('app')
      .doc('ai_monthly_counter')
      .get()

    const data = snap.data()
    if (data?.monthKey === monthKey) {
      return typeof data.count === 'number' ? data.count : 0
    }
    return 0 // New month — reset
  } catch {
    return 0
  }
}

/**
 * Increments the monthly AI call counter atomically.
 * Fire-and-forget — does not throw.
 */
export async function incrementMonthlyCounter(tenantId: string): Promise<void> {
  const now = new Date()
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  try {
    const ref = db()
      .collection('tenants')
      .doc(tenantId)
      .collection('app')
      .doc('ai_monthly_counter')

    await db().runTransaction(async (tx) => {
      const snap = await tx.get(ref)
      const data = snap.data()

      if (data?.monthKey === monthKey) {
        tx.update(ref, { count: admin.firestore.FieldValue.increment(1) })
      } else {
        tx.set(ref, { monthKey, count: 1 })
      }
    })
  } catch {
    // Silently fail — quota tracking is best-effort
  }
}

// ─── Usage Event Persistence ───────────────────────────────────────

/**
 * Persists an AI usage event to Firestore for analytics.
 * Sets a 90-day TTL via expiresAt.
 * Fire-and-forget — never throws.
 */
export async function persistUsageEvent(event: Omit<AIUsageEvent, 'createdAt' | 'expiresAt'>): Promise<void> {
  const now = new Date()
  const expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000) // +90 days

  const doc: AIUsageEvent = {
    ...event,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  }

  try {
    await db().collection('ai_usage_events').add(doc)
  } catch {
    // Fire-and-forget — log to console for debugging
    console.warn('Failed to persist AI usage event:', event.featureName, event.tenantId)
  }
}

// ─── Plan Resolution ───────────────────────────────────────────────

/**
 * Reads the active tenant plan from Firestore.
 * Returns 'starter' by default.
 */
export async function getTenantPlan(tenantId: string): Promise<TenantPlanID> {
  try {
    const snap = await db()
      .collection('tenants')
      .doc(tenantId)
      .get()

    const data = snap.data()
    const plan = data?.plan as string | undefined
    if (plan === 'growth' || plan === 'command' || plan === 'enterprise' || plan === 'manual') return plan
    return 'starter'
  } catch {
    return 'starter'
  }
}

// ─── Convenience: Full Context Builder ─────────────────────────────

/**
 * Builds a complete AIAccessContext from tenant + user IDs.
 * Use this at the top of every AI function handler.
 */
export async function buildAccessContext(params: {
  tenantId: string
  userId: string
  userRole: string
  featureName: AIFeatureName
}): Promise<AIAccessContext> {
  const { tenantId, userId, userRole, featureName } = params

  const [tenantPlanId, tenantAIAccess, userAIAccess, monthlyCallsUsed] = await Promise.all([
    getTenantPlan(tenantId),
    getTenantAIAccess(tenantId),
    getUserAIAccess(tenantId, userId),
    getMonthlyCallsUsed(tenantId),
  ])

  const planFeatures = PLAN_AI_FEATURES[tenantPlanId] ?? []
  const monthlyLimit = planFeatures.length > 0 ? (tenantPlanId === 'command' ? 500 : 200) : 0

  return {
    userId,
    userRole,
    tenantPlanId,
    tenantAIAccess,
    userAIAccess,
    featureName,
    monthlyLimit,
    monthlyCallsUsed,
  }
}

// ─── Bulk Access Map Builder ───────────────────────────────────────

/**
 * Builds a feature → allowed map for all 7 features.
 * Useful for admin dashboards and status APIs.
 */
export function buildFeatureAccessMap(
  ctx: Omit<AIAccessContext, 'featureName'>,
): Record<AIFeatureName, boolean> {
  const allFeatures: AIFeatureName[] = [
    'admin_chat', 'smart_task', 'ai_insights', 'executive_brief',
    'help_chat', 'codex_repair', 'training_recommend',
  ]

  const map = {} as Record<AIFeatureName, boolean>
  allFeatures.forEach((feature) => {
    const result = enforceAIAccess({ ...ctx, featureName: feature })
    map[feature] = result.allowed
  })
  return map
}
