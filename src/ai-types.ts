/**
 * AI Usage Analytics & Access Control — Type Definitions
 *
 * Based on the TaskPulse AI Governance Blueprint (2026-07-16).
 * Adapted for StaffiQ React + Vite + Firebase architecture.
 */

// ─── Feature Enum ─────────────────────────────────────────────────

export type AIFeatureName =
  | 'admin_chat'               // Analytics intelligence chat (Perplexity)
  | 'smart_task'               // Smart task generation
  | 'ai_insights'              // Skill gap analysis & recommendations
  | 'executive_brief'          // AI executive brief generation
  | 'help_chat'                // Employee help/intelligence chat
  | 'codex_repair'             // Codex bug repair prompt generation
  | 'training_recommend'       // AI training recommendations

// ─── Access Control ───────────────────────────────────────────────

export type TenantAIAccess = 'enabled' | 'disabled' | 'growth_and_above'

export type UserAIAccess = 'inherit' | 'enabled' | 'disabled'

export type AIAccessResult =
  | { allowed: true }
  | {
      allowed: false
      reason: AIBlockReason
      message: string
      upgradeCTA?: string
    }

export type AIBlockReason =
  | 'tenant_disabled'      // Admin toggled AI off for entire workspace
  | 'user_disabled'        // User-level override blocks this user
  | 'plan_restricted'      // Starter plan doesn't include this feature
  | 'feature_disabled'     // Specific feature not in allowed list
  | 'quota_exceeded'       // Monthly call limit reached
  | 'backend_unavailable'  // AI service is temporarily down

// ─── Plan-based Feature Mapping ───────────────────────────────────

export type TenantPlanID = 'starter' | 'growth' | 'command' | 'enterprise' | 'manual'

/** Which AI features are available on each plan */
export const PLAN_AI_FEATURES: Record<TenantPlanID, AIFeatureName[]> = {
  starter:    [],
  manual:     [],
  growth:     ['admin_chat', 'smart_task', 'ai_insights', 'executive_brief', 'help_chat', 'training_recommend'],
  command:    ['admin_chat', 'smart_task', 'ai_insights', 'executive_brief', 'help_chat', 'training_recommend', 'codex_repair'],
  enterprise: ['admin_chat', 'smart_task', 'ai_insights', 'executive_brief', 'help_chat', 'training_recommend', 'codex_repair'],
}

// ─── Plan Restriction Messages ────────────────────────────────────

export const PLAN_RESTRICTION_MESSAGES: Record<AIFeatureName, string> = {
  admin_chat:          'AI-powered analytics chat is available on the Growth plan (N12,500/user/month) and above.',
  smart_task:          'AI-powered task drafting is available on the Growth plan (N12,500/user/month) and above.',
  ai_insights:         'AI-powered skill gap analysis is available on the Growth plan and above.',
  executive_brief:     'AI-generated executive briefs are available on the Growth plan and above.',
  help_chat:           'AI-powered help is available on the Growth plan and above.',
  codex_repair:        'AI-powered bug repair is available on the Command plan (N15,000/user/month) and above.',
  training_recommend:  'AI training recommendations are available on the Growth plan and above.',
}

// ─── Usage Event (immutable log) ──────────────────────────────────

export interface AIUsageEvent {
  id: string                    // Auto-generated
  tenantId: string
  userId: string
  userName: string
  userRole: string
  featureName: AIFeatureName
  providerUsed: string          // 'Perplexity' | 'DeepSeek' | 'fallback'
  modelUsed?: string            // e.g., 'sonar-pro'
  successFlag: boolean
  errorMessage?: string
  latencyMs: number
  tokenEstimate?: number
  taskId?: string               // Linked task ID (for smart_task)
  briefSnippet?: string         // First 100 chars of prompt
  createdAt: string             // ISO 8601
}

// ─── Usage Summary (aggregated) ───────────────────────────────────

export interface AIUsageSummary {
  tenantId: string
  period: 'daily' | 'weekly' | 'monthly'
  periodKey: string             // '2026-07-16' | '2026-W29' | '2026-07'
  totalCalls: number
  successCalls: number
  failedCalls: number
  byFeature: Record<string, number>
  byUser: Record<string, number>
  totalLatencyMs: number
  totalTokens: number
  updatedAt: string
}

// ─── Tenant AI Settings ───────────────────────────────────────────

export interface TenantAISettings {
  aiAccess: TenantAIAccess
  aiMonthlyCallLimit: number | null   // null = unlimited
  aiCurrentMonthCalls: number
}

// ─── User AI Override ─────────────────────────────────────────────

export interface UserAIOverride {
  aiAccess: UserAIAccess
}

// ─── Access Status Response (client-side) ─────────────────────────

export interface AIAccessStatus {
  aiEnabled: boolean
  reason?: AIBlockReason
  message?: string
  upgradeCTA?: string
  features: Record<AIFeatureName, boolean>
  planName: string
  planAllowsAI: boolean
  tenantAIAccess: TenantAIAccess
  userAIAccess: UserAIAccess
  monthlyLimit: number | null
  monthlyCallsUsed: number
}
