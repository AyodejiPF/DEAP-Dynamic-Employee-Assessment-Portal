/**
 * Grant Management — Server-Side Enforcement
 *
 * Handles creating, revoking, and checking delegated billing grants.
 * Only the Platform Owner (U001) can create or revoke grants.
 * Every billing endpoint MUST call checkCapability() before processing.
 */

import * as admin from 'firebase-admin'
import type {
  DelegatedRole,
  BillingCapability,
  PlatformGrant,
  GrantCheckContext,
} from './types'
import {
  CAPABILITY_MAP,
  OWNER_CAPABILITIES,
  isPlatformOwner,
  PLATFORM_OWNER_USER_ID,
} from './types'

// ─── Firestore ───────────────────────────────────────────────────

let _db: FirebaseFirestore.Firestore | null = null
function db(): FirebaseFirestore.Firestore {
  if (!_db) _db = admin.firestore()
  return _db
}

const GRANTS_COLLECTION = 'platformGrants'
const AUDIT_COLLECTION = 'auditLogs'

// ─── Grant CRUD ──────────────────────────────────────────────────

/**
 * Grant a delegated role to a user. Only the Platform Owner can call this.
 */
export async function grantRole(params: {
  caller: GrantCheckContext
  subjectUserId: string
  role: DelegatedRole
  reason: string
  expiresAt?: string | null
}): Promise<PlatformGrant> {
  // Only Platform Owner can grant roles
  if (!isPlatformOwner(params.caller)) {
    throw new Error('Only the Platform Owner can grant delegated roles.')
  }

  const grantRef = db().collection(GRANTS_COLLECTION).doc()
  const grant: PlatformGrant = {
    grantId: grantRef.id,
    subjectUserId: params.subjectUserId,
    role: params.role,
    grantedBy: PLATFORM_OWNER_USER_ID,
    grantedAt: new Date().toISOString(),
    expiresAt: params.expiresAt ?? null,
    status: 'active',
    reason: params.reason,
    appId: 'staffiq',
  }

  await grantRef.set(grant as unknown as FirebaseFirestore.DocumentData)

  // Audit log
  await db().collection(AUDIT_COLLECTION).add({
    appId: 'staffiq',
    actor: params.caller.userId,
    action: 'grant_role',
    targetType: 'platformGrant',
    targetId: grant.grantId,
    before: null,
    after: {
      subjectUserId: params.subjectUserId,
      role: params.role,
      status: 'active',
    },
    reason: params.reason,
    createdAt: new Date().toISOString(),
  })

  return grant
}

/**
 * Revoke an active grant. Only the Platform Owner can call this.
 */
export async function revokeGrant(params: {
  caller: GrantCheckContext
  grantId: string
  reason: string
}): Promise<void> {
  if (!isPlatformOwner(params.caller)) {
    throw new Error('Only the Platform Owner can revoke delegated roles.')
  }

  const grantRef = db().collection(GRANTS_COLLECTION).doc(params.grantId)
  const grantSnap = await grantRef.get()

  if (!grantSnap.exists) {
    throw new Error(`Grant ${params.grantId} not found.`)
  }

  await grantRef.update({
    status: 'revoked',
  } as unknown as FirebaseFirestore.UpdateData<FirebaseFirestore.DocumentData>)

  // Audit log
  await db().collection(AUDIT_COLLECTION).add({
    appId: 'staffiq',
    actor: params.caller.userId,
    action: 'revoke_grant',
    targetType: 'platformGrant',
    targetId: params.grantId,
    before: { status: 'active' },
    after: { status: 'revoked' },
    reason: params.reason,
    createdAt: new Date().toISOString(),
  })
}

/**
 * List all grants (active and revoked). Accessible to Platform Owner
 * and anyone with billing:view capability.
 */
export async function listGrants(params: {
  caller: GrantCheckContext
  statusFilter?: 'active' | 'revoked'
}): Promise<PlatformGrant[]> {
  const hasAccess =
    isPlatformOwner(params.caller) ||
    (await checkCapability(params.caller, 'billing:view'))

  if (!hasAccess) {
    throw new Error('Insufficient permissions to view grants.')
  }

  let query: FirebaseFirestore.Query = db().collection(GRANTS_COLLECTION)
  if (params.statusFilter) {
    query = query.where('status', '==', params.statusFilter)
  }

  const snapshot = await query.get()
  return snapshot.docs.map((doc) => doc.data() as PlatformGrant)
}

/**
 * Get all active grants for a specific user.
 */
export async function getUserGrants(userId: string): Promise<PlatformGrant[]> {
  const snapshot = await db()
    .collection(GRANTS_COLLECTION)
    .where('subjectUserId', '==', userId)
    .where('status', '==', 'active')
    .get()

  return snapshot.docs.map((doc) => doc.data() as PlatformGrant)
}

// ─── Capability Checking ─────────────────────────────────────────

/**
 * Check if a caller has a specific billing capability.
 * Platform Owner always has ALL capabilities.
 * Delegated users are checked against their active grants.
 */
export async function checkCapability(
  caller: GrantCheckContext,
  capability: BillingCapability,
): Promise<boolean> {
  // Platform Owner always passes
  if (isPlatformOwner(caller)) return true

  // Owner capabilities include everything
  if (OWNER_CAPABILITIES.includes(capability) && isPlatformOwner(caller)) {
    return true
  }

  // Check grants for delegated users
  const grants = await getUserGrants(caller.userId)

  for (const grant of grants) {
    if (grant.status !== 'active') continue
    if (grant.expiresAt && new Date(grant.expiresAt) < new Date()) continue

    const roleCapabilities = CAPABILITY_MAP[grant.role]
    if (roleCapabilities.includes(capability)) return true
  }

  return false
}

/**
 * Require a capability. Throws if the caller lacks it.
 */
export async function requireCapability(
  caller: GrantCheckContext,
  capability: BillingCapability,
): Promise<void> {
  const hasCap = await checkCapability(caller, capability)
  if (!hasCap) {
    throw new Error(
      `Missing required capability: ${capability}. ` +
      `User ${caller.userId} does not have this permission.`,
    )
  }
}
