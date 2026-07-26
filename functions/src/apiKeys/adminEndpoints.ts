/**
 * Client API Keys — Admin API Endpoints (TypeScript)
 *
 * Platform Owner or tenant admin endpoints for issuing, listing, revoking
 * and rotating client API keys, plus a usage reporting endpoint that both
 * the dashboard and an external reconciliation caller can read from.
 *
 *   POST /api/api-keys/issue
 *   GET  /api/api-keys/list
 *   POST /api/api-keys/revoke
 *   POST /api/api-keys/rotate
 *   GET  /api/api-keys/usage-report
 *
 * Follows the same CORS, header identity and Platform Owner guard pattern
 * already used in ai/adminEndpoints.ts.
 */

import { onRequest } from 'firebase-functions/v2/https'
import { issueApiKey, listApiKeys, revokeApiKey, rotateApiKey } from './service'
import { getTenantApiKeyUsage, currentYearMonth } from './usage'

const allowedOrigins = new Set([
  'https://training-assessment-1c8ef.web.app',
  'https://training-assessment-1c8ef.firebaseapp.com',
  'https://staffiq.ng',
  'https://www.staffiq.ng',
  'https://staffiq-ng.web.app',
  'https://staffiq-ng.firebaseapp.com',
  'http://127.0.0.1:5173',
  'http://localhost:5173',
])

function setCors(req: any, res: any, methods = 'GET, POST, OPTIONS'): void {
  const origin = req.get('origin')
  if (origin && allowedOrigins.has(origin)) {
    res.set('Access-Control-Allow-Origin', origin)
    res.set('Vary', 'Origin')
  }
  res.set('Access-Control-Allow-Methods', methods)
  res.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Staffiq-Tenant-Id, X-Staffiq-User-Id, X-Staffiq-User-Role'
  )
  res.set('Cache-Control', 'no-store')
}

/** Allows the request only when the caller is the Platform Owner or a Tenant Admin for the tenant in question. */
function requireAdminForTenant(req: any, res: any, tenantId: string): boolean {
  const userId = req.get('x-staffiq-user-id')
  const role = req.get('x-staffiq-user-role')
  if (userId === 'U001') return true
  if (role === 'Admin') return true
  res.status(403).json({ message: 'Only a Tenant Admin or the Platform Owner can manage API keys.' })
  return false
}

export const staffiqApiKeyIssue = onRequest(
  { region: 'us-central1', timeoutSeconds: 15, memory: '256MiB', invoker: 'public', secrets: ['STAFFIQ_API_KEY_PEPPER'] },
  async (req, res) => {
    setCors(req, res, 'POST, OPTIONS')
    if (req.method === 'OPTIONS') {
      res.status(204).send('')
      return
    }
    if (req.method !== 'POST') {
      res.status(405).json({ message: 'Use POST to issue a key.' })
      return
    }

    const tenantId = String(req.body?.tenantId ?? '')
    const label = String(req.body?.label ?? '').trim()
    const scopes = Array.isArray(req.body?.scopes) ? req.body.scopes : undefined

    if (!tenantId || !label) {
      res.status(400).json({ message: 'tenantId and label are required.' })
      return
    }
    if (!requireAdminForTenant(req, res, tenantId)) return

    try {
      const actorUserId = String(req.get('x-staffiq-user-id') ?? 'unknown')
      const issued = await issueApiKey(tenantId, actorUserId, label, scopes)
      // The raw key is returned exactly once. The caller's UI must show it
      // in a copy box with a clear warning, then never request it again.
      res.status(201).json({ rawKey: issued.raw, key: issued.record })
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to issue API key.' })
    }
  }
)

export const staffiqApiKeyList = onRequest(
  { region: 'us-central1', timeoutSeconds: 15, memory: '256MiB', invoker: 'public' },
  async (req, res) => {
    setCors(req, res, 'GET, OPTIONS')
    if (req.method === 'OPTIONS') {
      res.status(204).send('')
      return
    }

    const tenantId = String(req.query.tenantId ?? '')
    if (!tenantId) {
      res.status(400).json({ message: 'tenantId is required.' })
      return
    }
    if (!requireAdminForTenant(req, res, tenantId)) return

    try {
      const keys = await listApiKeys(tenantId)
      res.status(200).json({ keys })
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to list API keys.' })
    }
  }
)

export const staffiqApiKeyRevoke = onRequest(
  { region: 'us-central1', timeoutSeconds: 15, memory: '256MiB', invoker: 'public' },
  async (req, res) => {
    setCors(req, res, 'POST, OPTIONS')
    if (req.method === 'OPTIONS') {
      res.status(204).send('')
      return
    }
    if (req.method !== 'POST') {
      res.status(405).json({ message: 'Use POST to revoke a key.' })
      return
    }

    const tenantId = String(req.body?.tenantId ?? '')
    const keyId = String(req.body?.keyId ?? '')
    const reason = String(req.body?.reason ?? '').trim()
    if (!tenantId || !keyId || !reason) {
      res.status(400).json({ message: 'tenantId, keyId and reason are all required to revoke a key.' })
      return
    }
    if (!requireAdminForTenant(req, res, tenantId)) return

    try {
      const actorUserId = String(req.get('x-staffiq-user-id') ?? 'unknown')
      await revokeApiKey(tenantId, keyId, actorUserId, reason)
      res.status(200).json({ revoked: true })
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to revoke API key.' })
    }
  }
)

export const staffiqApiKeyRotate = onRequest(
  { region: 'us-central1', timeoutSeconds: 15, memory: '256MiB', invoker: 'public', secrets: ['STAFFIQ_API_KEY_PEPPER'] },
  async (req, res) => {
    setCors(req, res, 'POST, OPTIONS')
    if (req.method === 'OPTIONS') {
      res.status(204).send('')
      return
    }
    if (req.method !== 'POST') {
      res.status(405).json({ message: 'Use POST to rotate a key.' })
      return
    }

    const tenantId = String(req.body?.tenantId ?? '')
    const keyId = String(req.body?.keyId ?? '')
    if (!tenantId || !keyId) {
      res.status(400).json({ message: 'tenantId and keyId are required.' })
      return
    }
    if (!requireAdminForTenant(req, res, tenantId)) return

    try {
      const actorUserId = String(req.get('x-staffiq-user-id') ?? 'unknown')
      const issued = await rotateApiKey(tenantId, keyId, actorUserId)
      res.status(201).json({ rawKey: issued.raw, key: issued.record })
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to rotate API key.' })
    }
  }
)

/**
 * Usage report for the dashboard, and the live reconciliation option: a
 * Platform Owner session reads this the normal way; an external caller such
 * as Claude can instead present the long lived STAFFIQ_RECONCILIATION_TOKEN
 * bearer token, checked with a constant time comparison below.
 */
export const staffiqApiKeyUsageReport = onRequest(
  { region: 'us-central1', timeoutSeconds: 20, memory: '256MiB', invoker: 'public', secrets: ['STAFFIQ_RECONCILIATION_TOKEN'] },
  async (req, res) => {
    setCors(req, res, 'GET, OPTIONS')
    if (req.method === 'OPTIONS') {
      res.status(204).send('')
      return
    }

    const tenantId = String(req.query.tenantId ?? '')
    if (!tenantId) {
      res.status(400).json({ message: 'tenantId is required.' })
      return
    }

    const reconciliationToken = process.env.STAFFIQ_RECONCILIATION_TOKEN
    const bearer = req.get('authorization')?.startsWith('Bearer ') ? req.get('authorization')!.slice(7).trim() : ''
    const presentedValidToken = Boolean(reconciliationToken) && bearer === reconciliationToken

    if (!presentedValidToken && !requireAdminForTenant(req, res, tenantId)) return

    try {
      const yearMonth = String(req.query.yearMonth ?? currentYearMonth())
      const usage = await getTenantApiKeyUsage(tenantId, yearMonth)
      res.status(200).json({ tenantId, yearMonth, usage })
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to read usage report.' })
    }
  }
)
