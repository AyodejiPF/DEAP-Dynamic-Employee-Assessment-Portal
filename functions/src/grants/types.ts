/**
 * Grants — Shared Types (Backend)
 *
 * Platform Owner can delegate billing duties to trusted staff
 * without making them owners. Every billing endpoint checks
 * the caller against active grants.
 */

// ─── Delegated Roles ─────────────────────────────────────────────

export type DelegatedRole = 'billing_admin' | 'support' | 'finance'

// ─── Billing Capabilities ────────────────────────────────────────

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

// ─── Capability Map (which roles get which capabilities) ─────────

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

// All capabilities the Platform Owner has.
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

// ─── Platform Grant Record ───────────────────────────────────────

export interface PlatformGrant {
  grantId: string
  subjectUserId: string
  role: DelegatedRole
  grantedBy: string        // must be 'U001'
  grantedAt: string        // ISO timestamp
  expiresAt: string | null
  status: 'active' | 'revoked'
  reason: string
  appId: 'staffiq' | 'taskpulse'
}

// ─── Platform Owner Identity ─────────────────────────────────────

export const PLATFORM_OWNER_USER_ID = 'U001'
export const PLATFORM_OWNER_ROLE = 'super_admin'
export const PLATFORM_OWNER_NAME = 'ayodeji falope'

// ─── Context for Permission Checks ───────────────────────────────

export interface GrantCheckContext {
  userId: string
  role: string
  fullName: string
}

/**
 * Returns true if the caller is the Platform Owner.
 */
export function isPlatformOwner(ctx: GrantCheckContext): boolean {
  return (
    ctx.userId === PLATFORM_OWNER_USER_ID &&
    ctx.role === PLATFORM_OWNER_ROLE &&
    ctx.fullName.trim().toLowerCase() === PLATFORM_OWNER_NAME
  )
}
