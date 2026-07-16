/**
 * Cloud Functions — TypeScript Entry Point
 *
 * This module compiles to lib/index.js and serves as the Firebase Functions
 * deployment entry. It:
 *   1. Re-exports all existing JavaScript functions from the legacy index.js
 *   2. Exports AI governance functions with proper access control
 *
 * Build:  npm run build   (tsc)
 * Deploy: npm run deploy  (firebase deploy --only functions)
 */

// Re-export ALL legacy JavaScript functions from the existing index.js.
// The compiled output is at ../index.js (sibling to lib/).
// eslint-disable-next-line @typescript-eslint/no-var-requires
const legacyExports = require('../index.js')

// Re-export every legacy function so they remain deployable
Object.keys(legacyExports).forEach((key) => {
  exports[key] = legacyExports[key]
})

// ─── AI Governance Functions (TypeScript) ──────────────────────────

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
