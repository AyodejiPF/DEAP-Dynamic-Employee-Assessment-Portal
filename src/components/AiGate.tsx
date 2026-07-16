/**
 * AiGate — Conditional AI Access UI Component
 *
 * Wraps AI-triggering UI elements and handles all 5 disabled states:
 *   - plan_restricted (Starter plan → upgrade CTA)
 *   - tenant_disabled (admin toggled off)
 *   - user_disabled (per-user override)
 *   - quota_exceeded (monthly limit hit)
 *   - backend_unavailable (temporary)
 */

import { type ReactNode, useState, useEffect } from 'react'
import { Lock, AlertCircle, Clock3 } from 'lucide-react'
import type { AIFeatureName, AIAccessResult, AIBlockReason } from '../ai-types'
import { checkAIAccess, type AIAccessContext } from '../ai-access'

// ─── Component Props ──────────────────────────────────────────────

export interface AiGateProps {
  /** Which AI feature this gate protects */
  feature: AIFeatureName
  /** Access context for the current user/tenant */
  context: Omit<AIAccessContext, 'featureName'>
  /** Content to render when AI is allowed */
  children: ReactNode
  /** Optional custom fallback for denied state */
  fallback?: ReactNode
  /** Show upgrade nudge for plan-restricted users */
  showUpsell?: boolean
  /** Called when access is denied (for analytics) */
  onAccessDenied?: (result: AIAccessResult) => void
  /** CSS class for the wrapper */
  className?: string
}

// ─── Component ────────────────────────────────────────────────────

export function AiGate({
  feature,
  context,
  children,
  fallback,
  showUpsell = true,
  onAccessDenied,
  className = '',
}: AiGateProps) {
  const [backendDown, setBackendDown] = useState(false)

  // Check AI backend health on mount (optional)
  useEffect(() => {
    let cancelled = false
    fetch('/api/ai-usage/health', { method: 'HEAD' })
      .then((res) => {
        if (!cancelled) setBackendDown(!res.ok)
      })
      .catch(() => {
        if (!cancelled) setBackendDown(true)
      })
    return () => { cancelled = true }
  }, [])

  const result = checkAIAccess({ ...context, featureName: feature })

  // Allowed — render children
  if (result.allowed) {
    return <>{children}</>
  }

  // Backend unavailable overrides other states
  if (backendDown) {
    onAccessDenied?.({ allowed: false, reason: 'backend_unavailable', message: '' })
    if (fallback) return <>{fallback}</>
    return (
      <AiBlockedState
        reason="backend_unavailable"
        message="AI is temporarily unavailable. Please try again in a moment."
        feature={feature}
      />
    )
  }

  onAccessDenied?.(result)

  // Custom fallback
  if (fallback) return <>{fallback}</>

  // Default blocked states
  return (
    <AiBlockedState
      reason={result.reason}
      message={result.message}
      feature={feature}
      upgradeCTA={showUpsell ? result.upgradeCTA : undefined}
      className={className}
    />
  )
}

// ─── Blocked State Sub-Component ──────────────────────────────────

interface AiBlockedStateProps {
  reason: AIBlockReason
  message: string
  feature: AIFeatureName
  upgradeCTA?: string
  className?: string
}

function AiBlockedState({ reason, message, feature, upgradeCTA, className = '' }: AiBlockedStateProps) {
  const icon = reason === 'plan_restricted' ? <Lock size={16} />
    : reason === 'quota_exceeded' ? <Clock3 size={16} />
    : reason === 'backend_unavailable' ? <AlertCircle size={16} />
    : <Lock size={16} />

  return (
    <div className={`ai-gate-blocked ${className}`} data-ai-reason={reason}>
      <button
        type="button"
        className="ai-btn-disabled"
        disabled
        aria-label={message}
        title={message}
      >
        {icon}
        <span>{getButtonLabel(feature)}</span>
      </button>
      {upgradeCTA && reason === 'plan_restricted' && (
        <a href={upgradeCTA} className="ai-upgrade-cta">
          Upgrade to unlock AI features →
        </a>
      )}
      {reason === 'quota_exceeded' && (
        <p className="ai-quota-note">Contact your admin to increase the monthly limit.</p>
      )}
    </div>
  )
}

// ─── Button Labels ────────────────────────────────────────────────

function getButtonLabel(feature: AIFeatureName): string {
  const labels: Record<AIFeatureName, string> = {
    admin_chat: 'AI Analytics Chat',
    smart_task: 'Generate SMART Draft',
    ai_insights: 'AI Skill Insights',
    executive_brief: 'Generate Executive Brief',
    help_chat: 'AI Help Assistant',
    codex_repair: 'Generate Repair Prompt',
    training_recommend: 'AI Training Plan',
  }
  return labels[feature] ?? 'AI Feature'
}

// ─── useAIAccess Hook ─────────────────────────────────────────────

interface UseAIAccessReturn {
  /** Whether ANY AI feature is enabled for this user */
  aiEnabled: boolean
  /** Per-feature access map */
  features: Record<AIFeatureName, boolean>
  /** The full access context */
  context: Omit<AIAccessContext, 'featureName'>
  /** Check a specific feature */
  canUse: (feature: AIFeatureName) => boolean
  /** Why AI is blocked (if it is) */
  blockReason?: AIBlockReason
  /** Human-readable block message */
  blockMessage?: string
}

/**
 * React hook for checking AI access. Cached for the session.
 * Call this once at the page/feature level and pass `context` to <AiGate>.
 */
export function useAIAccess(
  ctx: Omit<AIAccessContext, 'featureName'>,
): UseAIAccessReturn {
  const allFeatures: AIFeatureName[] = [
    'admin_chat', 'smart_task', 'ai_insights', 'executive_brief',
    'help_chat', 'codex_repair', 'training_recommend',
  ]

  const featureMap = {} as Record<AIFeatureName, boolean>
  let firstBlock: AIAccessResult | undefined

  allFeatures.forEach((feature) => {
    const result = checkAIAccess({ ...ctx, featureName: feature })
    featureMap[feature] = result.allowed
    if (!result.allowed && !firstBlock) {
      firstBlock = result
    }
  })

  const aiEnabled = allFeatures.some((f) => featureMap[f])

  return {
    aiEnabled,
    features: featureMap,
    context: ctx,
    canUse: (feature) => featureMap[feature] ?? false,
    blockReason: firstBlock?.allowed === false ? firstBlock.reason : undefined,
    blockMessage: firstBlock?.allowed === false ? firstBlock.message : undefined,
  }
}

export default AiGate
