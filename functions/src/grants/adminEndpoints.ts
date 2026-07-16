/**
 * Grants — Cloud Function Endpoints
 *
 * HTTP endpoints for managing delegated billing permissions.
 * All endpoints require Platform Owner or appropriate grant.
 *
 * Endpoints:
 *   POST   /api/grants/create   — Platform Owner only
 *   POST   /api/grants/revoke   — Platform Owner only
 *   GET    /api/grants/list     — Platform Owner + billing:view
 */

import * as functions from 'firebase-functions'
import { grantRole, revokeGrant, listGrants } from './grantManagement'
import { isPlatformOwner, PLATFORM_OWNER_NAME, PLATFORM_OWNER_ROLE, PLATFORM_OWNER_USER_ID } from './types'
import type { DelegatedRole, GrantCheckContext } from './types'

// ─── Helpers ─────────────────────────────────────────────────────

function extractCaller(req: functions.https.Request): GrantCheckContext {
  const body = req.body ?? {}
  return {
    userId: body.callerUserId ?? req.headers['x-user-id'] ?? '',
    role: body.callerRole ?? req.headers['x-user-role'] ?? '',
    fullName: body.callerFullName ?? req.headers['x-user-fullname'] ?? '',
  }
}

function requireOwnerOrFail(caller: GrantCheckContext): void {
  if (!isPlatformOwner(caller)) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only the Platform Owner can perform this action.',
    )
  }
}

// ─── Endpoints ───────────────────────────────────────────────────

/**
 * POST /api/grants/create
 * Body: { callerUserId, callerRole, callerFullName, subjectUserId, role, reason, expiresAt? }
 */
export const staffiqGrantCreate = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' })
      return
    }

    const caller = extractCaller(req)
    requireOwnerOrFail(caller)

    const { subjectUserId, role, reason, expiresAt } = req.body
    if (!subjectUserId || !role || !reason) {
      res.status(400).json({ error: 'Missing required fields: subjectUserId, role, reason' })
      return
    }

    const validRoles: DelegatedRole[] = ['billing_admin', 'support', 'finance']
    if (!validRoles.includes(role as DelegatedRole)) {
      res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` })
      return
    }

    const grant = await grantRole({
      caller,
      subjectUserId,
      role: role as DelegatedRole,
      reason,
      expiresAt: expiresAt ?? null,
    })

    res.status(200).json({ status: 'ok', grant })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    const status = message.includes('Only the Platform Owner') ? 403 : 500
    res.status(status).json({ error: message })
  }
})

/**
 * POST /api/grants/revoke
 * Body: { callerUserId, callerRole, callerFullName, grantId, reason }
 */
export const staffiqGrantRevoke = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' })
      return
    }

    const caller = extractCaller(req)
    requireOwnerOrFail(caller)

    const { grantId, reason } = req.body
    if (!grantId || !reason) {
      res.status(400).json({ error: 'Missing required fields: grantId, reason' })
      return
    }

    await revokeGrant({ caller, grantId, reason })

    res.status(200).json({ status: 'ok', message: 'Grant revoked.' })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    const status = message.includes('Only the Platform Owner') ? 403 : 500
    res.status(status).json({ error: message })
  }
})

/**
 * GET /api/grants/list
 * Query: ?status=active|revoked
 */
export const staffiqGrantList = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== 'GET') {
      res.status(405).json({ error: 'Method not allowed' })
      return
    }

    const caller = extractCaller(req)
    const statusFilter = (req.query.status as 'active' | 'revoked' | undefined)

    if (statusFilter && !['active', 'revoked'].includes(statusFilter)) {
      res.status(400).json({ error: 'Invalid status filter. Use "active" or "revoked".' })
      return
    }

    const grants = await listGrants({ caller, statusFilter })

    res.status(200).json({ status: 'ok', grants, count: grants.length })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    const status = message.includes('Insufficient permissions') ? 403 : 500
    res.status(status).json({ error: message })
  }
})
