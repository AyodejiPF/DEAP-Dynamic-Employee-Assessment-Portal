/**
 * Client API Keys — Request Validating Middleware (TypeScript)
 *
 * Attach this in front of any future externally facing endpoint that should
 * require a client API key instead of a normal signed in session. Rejects
 * before the route handler runs, then logs usage against the resolved key.
 *
 * Usage:
 *   app.get('/external/v1/reports', validateApiKey, myHandler)
 *   // myHandler can read (req as ApiKeyRequest).apiKey.tenantId
 */

import type { Request, Response, NextFunction } from 'express'
import { resolveActiveKeyByRaw } from './service'
import { recordApiKeyUsage } from './usage'
import type { PublicApiKeyRecord } from './types'

export interface ApiKeyRequest extends Request {
  apiKey?: { tenantId: string; keyId: string; record: PublicApiKeyRecord }
}

function readSuppliedKey(req: Request): string | undefined {
  const header = req.header('X-Api-Key')
  if (header) return header.trim()
  const auth = req.header('Authorization')
  if (auth?.startsWith('Bearer ')) return auth.slice(7).trim()
  return undefined
}

export async function validateApiKey(req: ApiKeyRequest, res: Response, next: NextFunction): Promise<void> {
  const supplied = readSuppliedKey(req)
  if (!supplied) {
    res.status(401).json({ error: 'Missing API key. Send it as X-Api-Key or as a Bearer token.' })
    return
  }

  const resolved = await resolveActiveKeyByRaw(supplied)
  if (!resolved) {
    res.status(401).json({ error: 'Invalid or revoked API key.' })
    return
  }

  req.apiKey = resolved

  res.on('finish', () => {
    void recordApiKeyUsage(resolved.tenantId, resolved.keyId, req.path, res.statusCode)
  })

  next()
}
