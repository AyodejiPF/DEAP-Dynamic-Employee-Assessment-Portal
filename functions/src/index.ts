/**
 * Cloud Functions — TypeScript Entry Point
 *
 * This module compiles to lib/index.js and can serve as the Firebase Functions
 * deployment entry once migrated. It:
 *   1. Re-exports all existing JavaScript functions from the legacy index.js
 *   2. Exports AI governance functions with proper TypeScript access control
 *   3. Exports Cloud Functions for AI usage logging, admin endpoints, and aggregation
 *
 * Build:  npm run build   (tsc)
 * Deploy: npm run deploy  (firebase deploy --only functions)
 *
 * Note: The current deployment entry is still functions/index.js (plain JS).
 * This TypeScript entry is the authoritative source for AI governance logic.
 * To switch, change package.json "main" from "index.js" to "lib/index.js".
 */

// Re-export ALL legacy JavaScript functions from the existing index.js.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const legacyExports = require('../index.js')

// Re-export every legacy function so they remain deployable
Object.keys(legacyExports).forEach((key) => {
  exports[key] = legacyExports[key]
})

// ─── AI Governance — Core Engine ──────────────────────────────────

export {
  enforceAIAccess,
  getTenantAIAccess,
  getUserAIAccess,
  getMonthlyCallsUsed,
  incrementMonthlyCounter,
  persistUsageEvent,
  getTenantPlan,
  buildAccessContext,
  buildFeatureAccessMap,
} from './ai/accessControl'

export type {
  AIFeatureName,
  TenantPlanID,
  TenantAIAccess,
  UserAIAccess,
  AIBlockReason,
  AIAccessResult,
  AIAccessContext,
  AIUsageEvent,
} from './ai/types'

export {
  PLAN_AI_FEATURES,
  PLAN_RESTRICTION_MESSAGES,
} from './ai/types'

// ─── AI Governance — Cloud Functions ──────────────────────────────

// Usage logging endpoint (POST /api/ai-usage/log)
export { aiUsageLog } from './ai/usageLogger'

// Admin API endpoints
export {
  aiAccessStatus,
  aiAdminTenantAccess,
  aiAdminUserAccess,
  aiAdminUsage,
} from './ai/adminEndpoints'

// Scheduled functions
export {
  aiResetMonthlyCounters,
  aiAggregation,
} from './ai/aggregation'

// ─── Grants — Platform Owner Delegation ──────────────────────────

export {
  grantRole,
  revokeGrant,
  listGrants,
  getUserGrants,
  checkCapability,
  requireCapability,
} from './grants/grantManagement'

export type {
  DelegatedRole,
  BillingCapability,
  PlatformGrant,
  GrantCheckContext,
} from './grants/types'

export {
  CAPABILITY_MAP,
  OWNER_CAPABILITIES,
  isPlatformOwner,
  PLATFORM_OWNER_USER_ID,
  PLATFORM_OWNER_ROLE,
  PLATFORM_OWNER_NAME,
} from './grants/types'

// ─── Grants — Cloud Functions ────────────────────────────────────

export {
  staffiqGrantCreate,
  staffiqGrantRevoke,
  staffiqGrantList,
} from './grants/adminEndpoints'

// ─── Billing — Payment, Proration, Subscription Management ──────

export {
  staffiqWebhookPaystack,
  staffiqCreateCheckout,
  staffiqGetSubscription,
  staffiqPreviewUpgrade,
  staffiqExecuteUpgrade,
  staffiqScheduleDowngrade,
  staffiqCancelSubscription,
} from './billing/endpoints'

export type {
  PaymentProvider,
  CheckoutParams,
  CheckoutSession,
  PaymentVerification,
} from './billing/provider'

export {
  calculateUpgradeProration,
  calculateDowngradeCredit,
  calculateMonthlyToAnnual,
} from './billing/proration'

export {
  assertValidTransition,
  hasFeatureAccess,
  isBillable,
  isRecoverable,
} from './billing/stateMachine'

export type { SubscriptionStatus } from './billing/stateMachine'
