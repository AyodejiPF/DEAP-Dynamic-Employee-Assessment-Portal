/**
 * Platform Owner Contract — Single Source of Truth
 *
 * This module defines the ONE authoritative Platform Owner identity
 * and is the only place where owner checks should be defined.
 * Every other module must import from here — never duplicate the check.
 *
 * The Platform Owner is a reserved identity:
 * - userId is always 'U001'
 * - role is always 'super_admin'
 * - fullName must match 'ayodeji falope' (case-insensitive, trimmed)
 *
 * Forward compatibility: appId field is stored on all audit/grant records
 * so the future Fourth Gear Luffy SuperAdmin can federate both products.
 */

// ─── Constants ───────────────────────────────────────────────────

export const PLATFORM_OWNER = {
  userId: 'U001',
  ownerRole: 'super_admin',        // canonical role value
  fullNameLower: 'ayodeji falope', // defence against role spoofing
  appId: 'staffiq',                // for cross-product federation
} as const

// ─── Types ───────────────────────────────────────────────────────

export interface OwnerIdentity {
  userId: string
  role: string
  fullName: string
}

// ─── Core Guards ─────────────────────────────────────────────────

/**
 * Returns true ONLY for the single Platform Owner identity.
 * Never data-driven. Never per-tenant. Never configurable.
 */
export function isPlatformOwner(user: OwnerIdentity | undefined | null): boolean {
  if (!user) return false
  return (
    user.userId === PLATFORM_OWNER.userId &&
    user.role === PLATFORM_OWNER.ownerRole &&
    user.fullName.trim().toLowerCase() === PLATFORM_OWNER.fullNameLower
  )
}

/**
 * Server guard. Throws if the caller is not the Platform Owner.
 * Use this at the TOP of every owner-only Cloud Function or server endpoint.
 */
export function requirePlatformOwner(user: OwnerIdentity | undefined | null): asserts user is OwnerIdentity {
  if (!isPlatformOwner(user)) {
    throw new Error('Only the Platform Owner can perform this action.')
  }
}

// ─── Display Helpers ─────────────────────────────────────────────

/**
 * Returns the human-readable label for the owner role.
 */
export function getOwnerLabel(): string {
  return 'Platform Owner'
}

/**
 * Returns the legacy display alias (kept for backward compatibility).
 */
export function getLegacyLabel(): string {
  return 'Super Admin'
}

// ─── Reserved Identity Guard ─────────────────────────────────────

/**
 * Returns true if a userId or role represents the reserved Platform Owner
 * identity, meaning it must NEVER be assigned to another user.
 */
export function isReservedOwnerIdentity(params: {
  userId?: string
  role?: string
}): boolean {
  if (params.userId === PLATFORM_OWNER.userId) return true
  if (params.role === PLATFORM_OWNER.ownerRole) return true
  return false
}

// ─── Grant Role Types ────────────────────────────────────────────

export type DelegatedRole = 'billing_admin' | 'support' | 'finance'

export interface PlatformGrant {
  grantId: string
  subjectUserId: string
  role: DelegatedRole
  grantedBy: string        // must be U001
  grantedAt: string        // ISO timestamp
  expiresAt: string | null
  status: 'active' | 'revoked'
  reason: string
  appId: 'staffiq' | 'taskpulse'
}

// ─── Capability Map ──────────────────────────────────────────────

export type BillingCapability =
  | 'plans:create_draft'
  | 'plans:publish'
  | 'plans:archive'
  | 'subscriptions:assign'
  | 'subscriptions:change'
  | 'entitlements:override'
  | 'credits:apply'
  | 'refunds:issue'
  | 'billing:view'
  | 'billing:export'
  | 'grants:manage'

export const CAPABILITY_MAP: Record<DelegatedRole, BillingCapability[]> = {
  billing_admin: [
    'plans:create_draft',
    'subscriptions:assign',
    'subscriptions:change',
    'entitlements:override',
    'credits:apply',
    'billing:view',
    'billing:export',
  ],
  support: [
    'subscriptions:change',
    'billing:view',
  ],
  finance: [
    'credits:apply',
    'refunds:issue',
    'billing:view',
    'billing:export',
  ],
}

/**
 * All capabilities the Platform Owner has (everything).
 */
export const OWNER_CAPABILITIES: BillingCapability[] = [
  'plans:create_draft',
  'plans:publish',
  'plans:archive',
  'subscriptions:assign',
  'subscriptions:change',
  'entitlements:override',
  'credits:apply',
  'refunds:issue',
  'billing:view',
  'billing:export',
  'grants:manage',
]
