/**
 * Client AI Provider Key Pool — Admin API Endpoints (TypeScript)
 *
 *   POST /api/ai-provider-keys/create
 *   GET  /api/ai-provider-keys/list
 *   POST /api/ai-provider-keys/relabel
 *   POST /api/ai-provider-keys/assign
 *   POST /api/ai-provider-keys/unassign
 *   POST /api/ai-provider-keys/mark-synced
 *   POST /api/ai-provider-keys/delete
 *
 * Same CORS, header identity and Platform Owner / Tenant Admin guard as
 * apiKeys/adminEndpoints.ts.
 */

import { onRequest } from 'firebase-functions/v2/https'
import {
  createPoolKey,
  listPoolKeys,
  relabelPoolKey,
  assignPoolKey,
  unassignPoolKey,
  markPoolKeyPortalSynced,
  deletePoolKey,
  ApiKeyPoolLimitError,
  ApiKeyPoolAssignedError,
} from './service'

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

function handleServiceError(res: any, error: unknown, fallback: string): void {
  if (error instanceof ApiKeyPoolLimitError || error instanceof ApiKeyPoolAssignedError) {
    res.status(400).json({ message: error.message })
    return
  }
  res.status(500).json({ message: error instanceof Error ? error.message : fallback })
}

export const staffiqAiKeyPoolCreate = onRequest(
  { region: 'us-central1', timeoutSeconds: 15, memory: '256MiB', invoker: 'public' },
  async (req, res) => {
    setCors(req, res, 'POST, OPTIONS')
    if (req.method === 'OPTIONS') {
      res.status(204).send('')
      return
    }
    if (!requirePlatformOwnerOrAdmin(req, res)) return

    const label = String(req.body?.label ?? '').trim()
    const apiKey = String(req.body?.apiKey ?? '').trim()
    if (!label || !apiKey) {
      res.status(400).json({ message: 'label and apiKey are both required.' })
      return
    }

    try {
      const actorUserId = String(req.get('x-staffiq-user-id') ?? 'unknown')
      const created = await createPoolKey(label, apiKey, actorUserId)
      res.status(201).json({ key: created })
    } catch (error) {
      handleServiceError(res, error, 'Failed to add this key to the pool.')
    }
  }
)

export const staffiqAiKeyPoolList = onRequest(
  { region: 'us-central1', timeoutSeconds: 15, memory: '256MiB', invoker: 'public' },
  async (req, res) => {
    setCors(req, res, 'GET, OPTIONS')
    if (req.method === 'OPTIONS') {
      res.status(204).send('')
      return
    }
    if (!requirePlatformOwnerOrAdmin(req, res)) return

    try {
      const keys = await listPoolKeys()
      res.status(200).json({ keys })
    } catch (error) {
      handleServiceError(res, error, 'Failed to list the key pool.')
    }
  }
)

export const staffiqAiKeyPoolRelabel = onRequest(
  { region: 'us-central1', timeoutSeconds: 15, memory: '256MiB', invoker: 'public' },
  async (req, res) => {
    setCors(req, res, 'POST, OPTIONS')
    if (req.method === 'OPTIONS') {
      res.status(204).send('')
      return
    }
    if (!requirePlatformOwnerOrAdmin(req, res)) return

    const keyId = String(req.body?.keyId ?? '').trim()
    const label = String(req.body?.label ?? '').trim()
    if (!keyId || !label) {
      res.status(400).json({ message: 'keyId and label are both required.' })
      return
    }

    try {
      const actorUserId = String(req.get('x-staffiq-user-id') ?? 'unknown')
      const updated = await relabelPoolKey(keyId, label, actorUserId)
      res.status(200).json({ key: updated })
    } catch (error) {
      handleServiceError(res, error, 'Failed to rename this key.')
    }
  }
)

export const staffiqAiKeyPoolAssign = onRequest(
  { region: 'us-central1', timeoutSeconds: 15, memory: '256MiB', invoker: 'public' },
  async (req, res) => {
    setCors(req, res, 'POST, OPTIONS')
    if (req.method === 'OPTIONS') {
      res.status(204).send('')
      return
    }
    if (!requirePlatformOwnerOrAdmin(req, res)) return

    const keyId = String(req.body?.keyId ?? '').trim()
    const tenantId = String(req.body?.tenantId ?? '').trim()
    const tenantLabel = String(req.body?.tenantLabel ?? '').trim()
    if (!keyId || !tenantId || !tenantLabel) {
      res.status(400).json({ message: 'keyId, tenantId and tenantLabel are all required.' })
      return
    }

    try {
      const actorUserId = String(req.get('x-staffiq-user-id') ?? 'unknown')
      const updated = await assignPoolKey(keyId, tenantId, tenantLabel, actorUserId)
      res.status(200).json({ key: updated })
    } catch (error) {
      handleServiceError(res, error, 'Failed to assign this key.')
    }
  }
)

export const staffiqAiKeyPoolUnassign = onRequest(
  { region: 'us-central1', timeoutSeconds: 15, memory: '256MiB', invoker: 'public' },
  async (req, res) => {
    setCors(req, res, 'POST, OPTIONS')
    if (req.method === 'OPTIONS') {
      res.status(204).send('')
      return
    }
    if (!requirePlatformOwnerOrAdmin(req, res)) return

    const keyId = String(req.body?.keyId ?? '').trim()
    if (!keyId) {
      res.status(400).json({ message: 'keyId is required.' })
      return
    }

    try {
      const actorUserId = String(req.get('x-staffiq-user-id') ?? 'unknown')
      const updated = await unassignPoolKey(keyId, actorUserId)
      res.status(200).json({ key: updated })
    } catch (error) {
      handleServiceError(res, error, 'Failed to unassign this key.')
    }
  }
)

export const staffiqAiKeyPoolMarkSynced = onRequest(
  { region: 'us-central1', timeoutSeconds: 15, memory: '256MiB', invoker: 'public' },
  async (req, res) => {
    setCors(req, res, 'POST, OPTIONS')
    if (req.method === 'OPTIONS') {
      res.status(204).send('')
      return
    }
    if (!requirePlatformOwnerOrAdmin(req, res)) return

    const keyId = String(req.body?.keyId ?? '').trim()
    if (!keyId) {
      res.status(400).json({ message: 'keyId is required.' })
      return
    }

    try {
      const actorUserId = String(req.get('x-staffiq-user-id') ?? 'unknown')
      const updated = await markPoolKeyPortalSynced(keyId, actorUserId)
      res.status(200).json({ key: updated })
    } catch (error) {
      handleServiceError(res, error, 'Failed to mark this key as synced.')
    }
  }
)

export const staffiqAiKeyPoolDelete = onRequest(
  { region: 'us-central1', timeoutSeconds: 15, memory: '256MiB', invoker: 'public' },
  async (req, res) => {
    setCors(req, res, 'POST, OPTIONS')
    if (req.method === 'OPTIONS') {
      res.status(204).send('')
      return
    }
    if (!requirePlatformOwnerOrAdmin(req, res)) return

    const keyId = String(req.body?.keyId ?? '').trim()
    if (!keyId) {
      res.status(400).json({ message: 'keyId is required.' })
      return
    }

    try {
      await deletePoolKey(keyId)
      res.status(200).json({ deleted: true })
    } catch (error) {
      handleServiceError(res, error, 'Failed to remove this key.')
    }
  }
)
