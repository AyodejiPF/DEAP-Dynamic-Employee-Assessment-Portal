/**
 * Entitlement Resolution Service — Server-Side
 *
 * Resolves what features a tenant can access based on their
 * active subscription plan, entitlements, and admin overrides.
 *
 * Platform Owner (U001) always passes every check.
 * Pattern mirrors functions/src/ai/accessControl.ts.
 */

import * as admin from 'firebase-admin'
import { isPlatformOwner, PLATFORM_OWNER_USER_ID } from '../grants/types'
import { hasFeatureAccess, type SubscriptionStatus } from './stateMachine'

// ─── Firestore ───────────────────────────────────────────────────

let _db: FirebaseFirestore.Firestore | null = null
function db(): FirebaseFirestore.Firestore {
  if (!_db) _db = admin.firestore()
  return _db
}

// ─── Types ───────────────────────────────────────────────────────

export interface EntitlementMap {
  [featureKey: string]: {
    enabled: boolean
    quotaLimit: number | null
    quotaUsed: number
    source: 'plan' | 'override' | 'default'
    planName?: string
  }
}

export interface EntitlementContext {
  tenantId: string
  userId: string
}

// ─── Cache ───────────────────────────────────────────────────────

const entitlementCache = new Map<string, { data: EntitlementMap; expiresAt: number }>()
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

function getCached(tenantId: string): EntitlementMap | null {
  const entry = entitlementCache.get(tenantId)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    entitlementCache.delete(tenantId)
    return null
  }
  return entry.data
}

function setCache(tenantId: string, data: EntitlementMap): void {
  entitlementCache.set(tenantId, { data, expiresAt: Date.now() + CACHE_TTL_MS })
}

/** Invalidate cache for a tenant — call on subscription change, payment, or admin override. */
export function invalidateEntitlementCache(tenantId: string): void {
  entitlementCache.delete(tenantId)
}

// ─── Core Resolution ─────────────────────────────────────────────

/**
 * Resolve all feature entitlements for a tenant.
 * Platform Owner (U001) always gets everything enabled.
 */
export async function resolveEntitlements(ctx: EntitlementContext): Promise<EntitlementMap> {
  // Platform Owner bypass
  if (ctx.userId === PLATFORM_OWNER_USER_ID) {
    return ALL_FEATURES_MAP
  }

  // Check cache
  const cached = getCached(ctx.tenantId)
  if (cached) return cached

  // Get subscription
  const subSnap = await db()
    .collection('subscriptions')
    .where('tenantId', '==', ctx.tenantId)
    .where('status', 'in', ['active', 'trialing', 'past_due', 'grace', 'cancel_scheduled'])
    .limit(1)
    .get()

  if (subSnap.empty) {
    // No active subscription — return defaults (Starter features)
    const defaults = DEFAULT_ENTITLEMENTS
    setCache(ctx.tenantId, defaults)
    return defaults
  }

  const sub = subSnap.docs[0].data()
  const planId = sub.planId || 'plan_starter'

  // Get plan entitlements
  const entSnap = await db()
    .collection('planEntitlements')
    .where('planId', '==', planId)
    .get()

  const entitlements: EntitlementMap = { ...DEFAULT_ENTITLEMENTS }

  entSnap.forEach((doc) => {
    const ent = doc.data()
    entitlements[ent.featureKey] = {
      enabled: ent.isEnabled === true,
      quotaLimit: ent.quotaLimit ?? null,
      quotaUsed: 0, // Will be populated with usage data
      source: 'plan',
      planName: planId,
    }
  })

  // Apply admin overrides (take precedence over plan entitlements)
  const overrideSnap = await db()
    .collection('entitlementOverrides')
    .where('tenantId', '==', ctx.tenantId)
    .get()

  overrideSnap.forEach((doc) => {
    const ov = doc.data()
    entitlements[ov.featureKey] = {
      enabled: ov.isEnabled === true,
      quotaLimit: ov.quotaLimit ?? null,
      quotaUsed: entitlements[ov.featureKey]?.quotaUsed ?? 0,
      source: 'override',
    }
  })

  // If subscription is not in a feature-access state, disable everything
  if (!hasFeatureAccess(sub.status as SubscriptionStatus)) {
    for (const key of Object.keys(entitlements)) {
      entitlements[key].enabled = false
    }
  }

  setCache(ctx.tenantId, entitlements)
  return entitlements
}

/**
 * Check a single feature entitlement.
 */
export async function checkEntitlement(
  ctx: EntitlementContext & { featureKey: string },
): Promise<{ allowed: boolean; reason?: string }> {
  // Platform Owner always passes
  if (ctx.userId === PLATFORM_OWNER_USER_ID) {
    return { allowed: true }
  }

  const entitlements = await resolveEntitlements(ctx)
  const ent = entitlements[ctx.featureKey]

  if (!ent || !ent.enabled) {
    return { allowed: false, reason: 'feature_not_in_plan' }
  }

  if (ent.quotaLimit != null && ent.quotaUsed >= ent.quotaLimit) {
    return { allowed: false, reason: 'quota_exceeded' }
  }

  return { allowed: true }
}

// ─── Default Entitlements (Starter plan) ─────────────────────────

const DEFAULT_ENTITLEMENTS: EntitlementMap = {
  user_management: { enabled: true, quotaLimit: null, quotaUsed: 0, source: 'default' },
  training_assessments: { enabled: true, quotaLimit: null, quotaUsed: 0, source: 'default' },
  question_banks: { enabled: true, quotaLimit: null, quotaUsed: 0, source: 'default' },
  core_reporting: { enabled: true, quotaLimit: null, quotaUsed: 0, source: 'default' },
  analytics: { enabled: false, quotaLimit: null, quotaUsed: 0, source: 'default' },
  ai_insights: { enabled: false, quotaLimit: null, quotaUsed: 0, source: 'default' },
  ai_help_chat: { enabled: false, quotaLimit: null, quotaUsed: 0, source: 'default' },
  smart_task: { enabled: false, quotaLimit: null, quotaUsed: 0, source: 'default' },
  codex_repair: { enabled: false, quotaLimit: null, quotaUsed: 0, source: 'default' },
  custom_content: { enabled: false, quotaLimit: null, quotaUsed: 0, source: 'default' },
  multi_branch: { enabled: false, quotaLimit: null, quotaUsed: 0, source: 'default' },
  advanced_governance: { enabled: false, quotaLimit: null, quotaUsed: 0, source: 'default' },
  implementation_support: { enabled: false, quotaLimit: null, quotaUsed: 0, source: 'default' },
}

const ALL_FEATURES_MAP: EntitlementMap = {}
for (const key of Object.keys(DEFAULT_ENTITLEMENTS)) {
  ALL_FEATURES_MAP[key] = { enabled: true, quotaLimit: null, quotaUsed: 0, source: 'default' }
}
