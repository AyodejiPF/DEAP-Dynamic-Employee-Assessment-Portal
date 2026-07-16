/**
 * AI Access Control — Enforcement Logic
 *
 * Implements the checkAIAccess() decision flow from the AI Governance Blueprint.
 * Adapted for StaffiQ client-side enforcement (server enforcement via Cloud Functions).
 */

import type {
  AIFeatureName,
  AIAccessResult,
  TenantAIAccess,
  UserAIAccess,
  TenantPlanID,
} from './ai-types'
import { PLAN_AI_FEATURES, PLAN_RESTRICTION_MESSAGES } from './ai-types'

// ─── Access Context ───────────────────────────────────────────────

export interface AIAccessContext {
  userId: string
  userRole: string
  tenantPlanId: TenantPlanID
  tenantAIAccess: TenantAIAccess
  userAIAccess: UserAIAccess
  featureName: AIFeatureName
  monthlyLimit: number | null
  monthlyCallsUsed: number
}

// ─── Main Access Check ────────────────────────────────────────────

/**
 * Determines whether a user can access a specific AI feature.
 *
 * Decision flow (in order):
 *   0. SuperAdmin (U001) → always allowed
 *   1. Tenant AI toggle → if disabled, blocked
 *   2. Plan-based gating → Starter/no plan = blocked for all AI
 *   3. User-level override → disabled = blocked, enabled = allowed
 *   4. Monthly quota → exceeded = blocked
 *   5. All checks passed → allowed
 */
export function checkAIAccess(ctx: AIAccessContext): AIAccessResult {
  // RULE 0: SuperAdmin always passes
  if (ctx.userId === 'U001') {
    return { allowed: true }
  }

  // RULE 1: Tenant-level AI toggle
  if (ctx.tenantAIAccess === 'disabled') {
    return {
      allowed: false,
      reason: 'tenant_disabled',
      message: 'AI features are currently paused for your organisation. Contact your workspace admin.',
    }
  }

  // RULE 2: Plan-based gating (when toggle is 'growth_and_above' or default)
  if (ctx.tenantAIAccess === 'growth_and_above' || !ctx.tenantAIAccess) {
    const allowedFeatures = PLAN_AI_FEATURES[ctx.tenantPlanId] ?? []
    if (!allowedFeatures.includes(ctx.featureName)) {
      return {
        allowed: false,
        reason: 'plan_restricted',
        message: PLAN_RESTRICTION_MESSAGES[ctx.featureName] ?? 'This AI feature is not available on your current plan.',
        upgradeCTA: '/pricing',
      }
    }
  }

  // RULE 3: User-level override
  if (ctx.userAIAccess === 'disabled') {
    return {
      allowed: false,
      reason: 'user_disabled',
      message: 'AI access has been restricted for your account. Contact your workspace admin.',
    }
  }

  // RULE 4: Monthly call limit
  if (ctx.monthlyLimit != null && ctx.monthlyCallsUsed >= ctx.monthlyLimit) {
    return {
      allowed: false,
      reason: 'quota_exceeded',
      message: `Your organisation has reached its monthly AI usage limit of ${ctx.monthlyLimit} calls. The limit resets next month.`,
    }
  }

  // ALL CHECKS PASSED
  return { allowed: true }
}

// ─── Feature Access Map ───────────────────────────────────────────

/**
 * Builds a map of all AI features → boolean for the given context.
 * Used by the client-side access-status endpoint.
 */
export function buildFeatureAccessMap(ctx: Omit<AIAccessContext, 'featureName'>): Record<AIFeatureName, boolean> {
  const features: AIFeatureName[] = [
    'admin_chat', 'smart_task', 'ai_insights', 'executive_brief',
    'help_chat', 'codex_repair', 'training_recommend',
  ]

  const map = {} as Record<AIFeatureName, boolean>
  features.forEach((feature) => {
    const result = checkAIAccess({ ...ctx, featureName: feature })
    map[feature] = result.allowed
  })
  return map
}

// ─── AI Usage Logger (client-side) ────────────────────────────────

export interface AIUsageLogParams {
  tenantId: string
  userId: string
  userName: string
  userRole: string
  featureName: AIFeatureName
  provider: string
  model?: string
  success: boolean
  errorMessage?: string
  latencyMs: number
  tokenEstimate?: number
  taskId?: string
  briefSnippet?: string
}

/**
 * Logs an AI usage event. Fire-and-forget — never throws, never blocks.
 * In production, this posts to a Cloud Function endpoint.
 */
export function logAIUsage(params: AIUsageLogParams): void {
  const event = {
    tenantId: params.tenantId,
    userId: params.userId,
    userName: params.userName,
    userRole: params.userRole,
    featureName: params.featureName,
    providerUsed: params.provider,
    modelUsed: params.model ?? null,
    successFlag: params.success,
    errorMessage: params.errorMessage?.slice(0, 300) ?? null,
    latencyMs: params.latencyMs,
    tokenEstimate: params.tokenEstimate ?? null,
    taskId: params.taskId ?? null,
    briefSnippet: params.briefSnippet?.slice(0, 100) ?? null,
    createdAt: new Date().toISOString(),
  }

  // Fire-and-forget POST — do not await
  fetch('/api/ai-usage/log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
    // keepalive ensures the request completes even if the page unloads
    keepalive: true,
  }).catch((err) => {
    console.error('[ai-usage-log] Failed to send usage event:', err)
  })

  // Also log to local storage as a fallback
  try {
    const stored = JSON.parse(localStorage.getItem('staffiq-ai-usage-queue') ?? '[]')
    stored.push(event)
    // Keep only last 50 events in local queue
    if (stored.length > 50) stored.splice(0, stored.length - 50)
    localStorage.setItem('staffiq-ai-usage-queue', JSON.stringify(stored))
  } catch {
    // localStorage might be full or unavailable — ignore
  }
}

// ─── Plan Name Helper ─────────────────────────────────────────────

export function planDisplayName(planId: TenantPlanID): string {
  const names: Record<TenantPlanID, string> = {
    starter: 'Starter',
    growth: 'Growth',
    command: 'Command',
    enterprise: 'Enterprise',
    manual: 'Manual',
  }
  return names[planId] ?? planId
}

// ─── Estimate Tokens ──────────────────────────────────────────────

/** Rough token estimate: ~4 characters ≈ 1 token */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}
