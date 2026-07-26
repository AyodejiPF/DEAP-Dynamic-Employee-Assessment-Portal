/**
 * Client AI Provider Keys — Admin API Endpoints (TypeScript)
 *
 *   POST /api/ai-provider-keys/save
 *   GET  /api/ai-provider-keys/list
 *   POST /api/ai-provider-keys/delete
 *
 * Same CORS, header identity and Platform Owner / Tenant Admin guard as
 * apiKeys/adminEndpoints.ts.
 */

import { onRequest } from 'firebase-functions/v2/https'
import { saveTenantAiProviderKey, listTenantAiProviderKeys, deleteTenantAiProviderKey } from './service'

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
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Staffiq-User-Id, X-Staffiq-User-Role')
  res.set('Cache-Control', 'no-store')
}

function requirePlatformOwnerOrAdmin(req: any, res: any): boolean {
  const userId = req.get('x-staffiq-user-id')
  const role = req.get('x-staffiq-user-role')
  if (userId === 'U001' || role === 'Admin') return true
  res.status(403).json({ message: 'Only a Tenant Admin or the Platform Owner can manage client AI keys.' })
  return false
}

export const staffiqAiProviderKeySave = onRequest(
  { region: 'us-central1', timeoutSeconds: 15, memory: '256MiB', invoker: 'public' },
  async (req, res) => {
    setCors(req, res, 'POST, OPTIONS')
    if (req.method === 'OPTIONS') {
      res.status(204).send('')
      return
    }
    if (!requirePlatformOwnerOrAdmin(req, res)) return

    const tenantId = String(req.body?.tenantId ?? '').trim()
    const clientLabel = String(req.body?.clientLabel ?? '').trim()
    const apiKey = String(req.body?.apiKey ?? '').trim()
    if (!tenantId || !clientLabel || !apiKey) {
      res.status(400).json({ message: 'tenantId, clientLabel and apiKey are all required.' })
      return
    }

    try {
      const actorUserId = String(req.get('x-staffiq-user-id') ?? 'unknown')
      const saved = await saveTenantAiProviderKey(tenantId, clientLabel, apiKey, actorUserId)
      res.status(200).json({ key: saved })
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to save the client AI key.' })
    }
  }
)

export const staffiqAiProviderKeyList = onRequest(
  { region: 'us-central1', timeoutSeconds: 15, memory: '256MiB', invoker: 'public' },
  async (req, res) => {
    setCors(req, res, 'GET, OPTIONS')
    if (req.method === 'OPTIONS') {
      res.status(204).send('')
      return
    }
    if (!requirePlatformOwnerOrAdmin(req, res)) return

    try {
      const keys = await listTenantAiProviderKeys()
      res.status(200).json({ keys })
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to list client AI keys.' })
    }
  }
)

export const staffiqAiProviderKeyDelete = onRequest(
  { region: 'us-central1', timeoutSeconds: 15, memory: '256MiB', invoker: 'public' },
  async (req, res) => {
    setCors(req, res, 'POST, OPTIONS')
    if (req.method === 'OPTIONS') {
      res.status(204).send('')
      return
    }
    if (!requirePlatformOwnerOrAdmin(req, res)) return

    const tenantId = String(req.body?.tenantId ?? '').trim()
    if (!tenantId) {
      res.status(400).json({ message: 'tenantId is required.' })
      return
    }

    try {
      await deleteTenantAiProviderKey(tenantId)
      res.status(200).json({ deleted: true })
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to remove the client AI key.' })
    }
  }
)
