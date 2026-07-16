/**
 * AI Governance — Shared Types (Cloud Functions)
 *
 * Mirrors the client-side ai-types.ts for backend enforcement.
 * Single source of truth for feature names, plan gating, and access decisions.
 */

// ─── Feature Enum ─────────────────────────────────────────────────

export type AIFeatureName =
  | 'admin_chat'           // Perplexity chat in analytics (Growth+)
  | 'smart_task'           // AI task decomposition (Growth+)
  | 'ai_insights'          // AI-powered dashboard insights (Growth+)
  | 'executive_brief'      // One-click admin intelligence brief (Growth+)
  | 'help_chat'            // In-app help assistant (Growth+)
  | 'codex_repair'         // Automated Codex bug repair (Command only)
  | 'training_recommend'   // AI training course recommendations (Command only)

// ─── Plan Gating ───────────────────────────────────────────────────

export type TenantPlanID = 'starter' | 'growth' | 'command' | 'enterprise' | 'manual'

/**
 * Maps each plan to the set of AI features it includes.
 * Starter = none. Growth = core 5. Command = all 7.
 */
export const PLAN_AI_FEATURES: Record<TenantPlanID, AIFeatureName[]> = {
  manual:     [],
  starter:    [],
  growth:     ['admin_chat', 'smart_task', 'ai_insights', 'executive_brief', 'help_chat'],
  command:    ['admin_chat', 'smart_task', 'ai_insights', 'executive_brief', 'help_chat', 'codex_repair', 'training_recommend'],
  enterprise: ['admin_chat', 'smart_task', 'ai_insights', 'executive_brief', 'help_chat', 'codex_repair', 'training_recommend'],
}

// ─── Access Toggles ────────────────────────────────────────────────

export type TenantAIAccess = 'enabled' | 'disabled' | 'growth_and_above'
export type UserAIAccess = 'inherit' | 'enabled' | 'disabled'

// ─── Block Reason ──────────────────────────────────────────────────

export type AIBlockReason =
  | 'tenant_disabled'
  | 'user_disabled'
  | 'plan_restricted'
  | 'feature_disabled'
  | 'quota_exceeded'
  | 'backend_unavailable'

// ─── Access Result ─────────────────────────────────────────────────

export type AIAccessResult =
  | { allowed: true }
  | {
      allowed: false
      reason: AIBlockReason
      message: string
      upgradeCTA?: string
    }

// ─── Context for Access Check ──────────────────────────────────────

export interface AIAccessContext {
  userId: string
  userRole: string
  tenantId: string
  tenantPlanId: TenantPlanID
  tenantAIAccess: TenantAIAccess
  userAIAccess: UserAIAccess
  featureName: AIFeatureName
  monthlyLimit: number | null
  monthlyCallsUsed: number
}

// ─── Plan Restriction Messages ─────────────────────────────────────

export const PLAN_RESTRICTION_MESSAGES: Record<AIFeatureName, string> = {
  admin_chat:         'AI chat requires Growth plan or above',
  smart_task:         'Smart tasks require Growth plan or above',
  ai_insights:        'AI insights require Growth plan or above',
  executive_brief:    'Executive brief requires Growth plan or above',
  help_chat:          'AI help assistant requires Growth plan or above',
  codex_repair:       'Codex repair is exclusive to the Command plan',
  training_recommend: 'AI training recommendations are exclusive to the Command plan',
}

// ─── Usage Event (for logging) ─────────────────────────────────────

export interface AIUsageEvent {
  tenantId: string
  userId: string
  userName: string
  userRole: string
  featureName: AIFeatureName
  providerUsed: string
  modelUsed: string | null
  successFlag: boolean
  errorMessage: string | null
  latencyMs: number
  tokenEstimate: number | null
  taskId: string | null
  briefSnippet: string | null
  createdAt: string
  expiresAt: string  // TTL: 90 days after creation
}
