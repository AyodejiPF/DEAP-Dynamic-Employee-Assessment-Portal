/**
 * SuperAdmin authentication and authorisation helpers.
 *
 * ALL owner identity logic is defined in src/superadmin/owner.ts.
 * This file re-exports from there so existing imports continue to work.
 * New code should import directly from './owner'.
 */

// Re-export everything from the single source of truth
export {
  PLATFORM_OWNER,
  isPlatformOwner,
  requirePlatformOwner,
  getOwnerLabel,
  getLegacyLabel,
  isReservedOwnerIdentity,
  OWNER_CAPABILITIES,
  CAPABILITY_MAP,
} from './owner'

export type {
  OwnerIdentity,
  DelegatedRole,
  PlatformGrant,
  BillingCapability,
} from './owner'

// Legacy alias — kept for backward compatibility with existing imports
import { PLATFORM_OWNER } from './owner'
export const OWNER_ROLE = PLATFORM_OWNER.ownerRole
