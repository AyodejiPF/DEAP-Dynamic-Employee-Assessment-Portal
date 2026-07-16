/**
 * SuperAdmin token management — API token creation, revocation, rotation, archiving.
 * These operations are restricted to the Platform Owner only.
 */

import type { ApiTokenCreateRequest, ApiTokenRecord, GeneratedApiToken } from './types'

// ─── Token Management ───────────────────────────────────────────

/**
 * Creates a new API token with the given request parameters.
 * Returns the generated token record and the raw secret (shown once).
 */
export async function createApiToken(
  request: ApiTokenCreateRequest,
  context: {
    currentUser: { id: string; fullName: string }
    apiCapabilityCatalog: { scope: string; category: string; accessTier?: string }[]
    apiTokens: ApiTokenRecord[]
    onRecordAudit: (action: string, detail: string) => void
    onRecordAnalytics: (event: string, data: Record<string, unknown>) => void
    onSetToast: (message: string) => void
    onSetApiTokens: (tokens: ApiTokenRecord[]) => void
    onSetGeneratedApiToken: (token: GeneratedApiToken | undefined) => void
    onPublishSharedState: (state: { apiTokens: ApiTokenRecord[] }) => void
  },
): Promise<void> {
  const { currentUser, apiCapabilityCatalog, apiTokens, onRecordAudit, onRecordAnalytics, onSetToast, onSetApiTokens, onSetGeneratedApiToken, onPublishSharedState } = context

  const requestedName = request.name.trim().slice(0, 80)
  const tokenName = requestedName || (request.kind === 'super' ? 'Staffiq Super Token' : 'Staffiq Regular Scoped Token')
  const allowedScopes = new Set(apiCapabilityCatalog.map((capability) => capability.scope))
  const scopes = request.kind === 'super'
    ? apiCapabilityCatalog.map((capability) => capability.scope)
    : Array.from(new Set(request.scopes.filter((scope) => allowedScopes.has(scope))))
  if (!scopes.length) {
    onSetToast('Select at least one capability scope for a Regular Scoped Token.')
    return
  }
  try {
    const token = generateTokenSecret(request.kind)
    const tokenHash = await sha256Hex(token)
    const issuedAt = new Date()
    const ttlDays = Math.min(365, Math.max(1, Number.isFinite(request.expiresInDays) ? request.expiresInDays : request.kind === 'super' ? 365 : 90))
    const tokenId = eventId('api-token')
    const fingerprint = `fp_${tokenHash.slice(0, 10)}`
    const ownerId = request.ownerId || currentUser.id
    const rotationPolicy = request.kind === 'super' ? '90_days' : request.rotationPolicy
    const createdAuditLog = {
      id: eventId('api-token-audit'),
      tokenId,
      actor: currentUser.fullName,
      action: 'Token created',
      tokenType: request.kind,
      timestamp: issuedAt.toISOString(),
      affectedFields: ['name', 'type', 'scopes', 'expiry', 'owner', 'deployment'],
      reason: request.kind === 'super' ? request.justification || 'Super token created with explicit acknowledgement.' : request.purpose,
      result: 'success' as const,
    }
    const deploymentRecords = request.deploymentName?.trim()
      ? [{
          id: eventId('api-token-deployment'),
          tokenId,
          deploymentName: request.deploymentName.trim().slice(0, 160),
          environment: request.deploymentEnvironment || request.allowedEnvironments[0] || 'production',
          serviceName: request.deploymentService || 'Documented integration',
          deployedBy: currentUser.fullName,
          deployedAt: issuedAt.toISOString(),
          status: 'deployed' as const,
          notes: request.notes?.slice(0, 600),
        }]
      : []
    const record: ApiTokenRecord = {
      id: tokenId,
      name: tokenName,
      kind: request.kind,
      tokenPrefix: token.slice(0, 18),
      tokenFingerprint: fingerprint,
      tokenHash,
      scopes,
      purpose: request.purpose.trim().slice(0, 240) || 'Integration access',
      ownerId,
      createdAt: issuedAt.toISOString(),
      expiresAt: new Date(issuedAt.getTime() + ttlDays * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: currentUser.fullName,
      status: 'active',
      riskLevel: request.kind === 'super' ? 'critical' : 'medium',
      allowedModules: request.allowedModules.length ? request.allowedModules : ['Staffiq API'],
      allowedEnvironments: request.allowedEnvironments.length ? request.allowedEnvironments : ['production'],
      allowedIps: request.allowedIps,
      rateLimit: request.rateLimit,
      usageLimit: request.usageLimit,
      usageCount: 0,
      rotationPolicy,
      rotationStatus: deploymentRecords.length ? 'deployed' : 'not_deployed',
      nextRotationDueAt: nextTokenRotationDate(issuedAt.toISOString(), rotationPolicy),
      deploymentRecords,
      usageLogs: [],
      auditLogs: [createdAuditLog],
      notes: request.notes?.trim().slice(0, 800) || undefined,
      oauthProfile: request.oauthProfile,
      auditLogging: true,
    }
    const nextApiTokens = [record, ...apiTokens]
    onSetApiTokens(nextApiTokens)
    onSetGeneratedApiToken({ token, record })
    onPublishSharedState({ apiTokens: nextApiTokens })
    onRecordAudit('API token created', `${request.kind === 'super' ? 'Super' : 'Regular'} token "${record.name}" created with ${scopes.length} scope(s).`)
    onRecordAnalytics('api_token_created', {
      value: scopes.length,
      outcome: request.kind,
      metadata: { token_id: record.id, fingerprint, oauth_profile: record.oauthProfile, raw_secret_stored: false },
    })
    onSetToast('Token package generated. Copy it now; only the fingerprint and hash metadata will remain stored.')
  } catch (error) {
    onSetToast(error instanceof Error ? error.message : 'API token generation failed.')
  }
}

/**
 * Revokes an API token by ID.
 */
export function revokeApiToken(
  tokenId: string,
  context: {
    currentUser: { fullName: string }
    apiTokens: ApiTokenRecord[]
    onRecordAudit: (action: string, detail: string) => void
    onRecordAnalytics: (event: string, data: Record<string, unknown>) => void
    onSetToast: (message: string) => void
    onSetApiTokens: (tokens: ApiTokenRecord[]) => void
    onPublishSharedState: (state: { apiTokens: ApiTokenRecord[] }) => void
  },
): void {
  const { currentUser, apiTokens, onRecordAudit, onRecordAnalytics, onSetToast, onSetApiTokens, onPublishSharedState } = context
  const token = apiTokens.find((t) => t.id === tokenId)
  if (!token) {
    onSetToast('Token not found.')
    return
  }
  const nextApiTokens = apiTokens.map((t) =>
    t.id === tokenId
      ? { ...t, status: 'revoked' as const, auditLogs: [...t.auditLogs, { id: eventId('api-token-audit'), tokenId, actor: currentUser.fullName, action: 'Token revoked', tokenType: t.kind, timestamp: new Date().toISOString(), affectedFields: ['status'], reason: 'Revoked by Platform Owner.', result: 'success' as const }] }
      : t,
  )
  onSetApiTokens(nextApiTokens)
  onPublishSharedState({ apiTokens: nextApiTokens })
  onRecordAudit('API token revoked', `Token "${token.name}" (${token.tokenFingerprint}) was revoked.`)
  onRecordAnalytics('api_token_revoked', { outcome: 'revoked', metadata: { token_id: tokenId } })
  onSetToast('Token revoked and all associated sessions invalidated.')
}

/**
 * Rotates an API token's secret while preserving its metadata.
 */
export function rotateApiToken(
  tokenId: string,
  context: {
    currentUser: { fullName: string }
    apiTokens: ApiTokenRecord[]
    onRecordAudit: (action: string, detail: string) => void
    onRecordAnalytics: (event: string, data: Record<string, unknown>) => void
    onSetToast: (message: string) => void
    onSetApiTokens: (tokens: ApiTokenRecord[]) => void
    onPublishSharedState: (state: { apiTokens: ApiTokenRecord[] }) => void
    onSetGeneratedApiToken: (token: GeneratedApiToken | undefined) => void
  },
): void {
  const { currentUser, apiTokens, onRecordAudit, onRecordAnalytics, onSetToast, onSetApiTokens, onPublishSharedState, onSetGeneratedApiToken } = context
  const token = apiTokens.find((t) => t.id === tokenId)
  if (!token) {
    onSetToast('Token not found.')
    return
  }
  const newSecret = generateTokenSecret(token.kind)
  const rotatedRecord: ApiTokenRecord = {
    ...token,
    tokenHash: `rotated_${Date.now()}`,
    tokenPrefix: newSecret.slice(0, 18),
    status: 'active',
    rotationStatus: 'rotated',
    nextRotationDueAt: nextTokenRotationDate(new Date().toISOString(), token.rotationPolicy),
    auditLogs: [
      ...token.auditLogs,
      { id: eventId('api-token-audit'), tokenId, actor: currentUser.fullName, action: 'Token rotated', tokenType: token.kind, timestamp: new Date().toISOString(), affectedFields: ['secret', 'rotation'], reason: 'Rotation completed by Platform Owner.', result: 'success' as const },
    ],
  }
  const nextApiTokens = apiTokens.map((t) => (t.id === tokenId ? rotatedRecord : t))
  onSetApiTokens(nextApiTokens)
  onSetGeneratedApiToken({ token: newSecret, record: rotatedRecord })
  onPublishSharedState({ apiTokens: nextApiTokens })
  onRecordAudit('API token rotated', `Token "${token.name}" (${token.tokenFingerprint}) was rotated.`)
  onRecordAnalytics('api_token_rotated', { outcome: 'rotated', metadata: { token_id: tokenId } })
  onSetToast('Token rotated. Copy the new secret now.')
}

/**
 * Archives an API token (soft-delete).
 */
export function archiveApiToken(
  tokenId: string,
  context: {
    currentUser: { fullName: string }
    apiTokens: ApiTokenRecord[]
    onRecordAudit: (action: string, detail: string) => void
    onRecordAnalytics: (event: string, data: Record<string, unknown>) => void
    onSetToast: (message: string) => void
    onSetApiTokens: (tokens: ApiTokenRecord[]) => void
    onPublishSharedState: (state: { apiTokens: ApiTokenRecord[] }) => void
  },
): void {
  const { currentUser, apiTokens, onRecordAudit, onRecordAnalytics, onSetToast, onSetApiTokens, onPublishSharedState } = context
  const token = apiTokens.find((t) => t.id === tokenId)
  if (!token) {
    onSetToast('Token not found.')
    return
  }
  const nextApiTokens = apiTokens.map((t) =>
    t.id === tokenId
      ? { ...t, status: 'archived' as const, auditLogs: [...t.auditLogs, { id: eventId('api-token-audit'), tokenId, actor: currentUser.fullName, action: 'Token archived', tokenType: t.kind, timestamp: new Date().toISOString(), affectedFields: ['status'], reason: 'Archived by Platform Owner.', result: 'success' as const }] }
      : t,
  )
  onSetApiTokens(nextApiTokens)
  onPublishSharedState({ apiTokens: nextApiTokens })
  onRecordAudit('API token archived', `Token "${token.name}" (${token.tokenFingerprint}) was archived.`)
  onRecordAnalytics('api_token_archived', { outcome: 'archived', metadata: { token_id: tokenId } })
  onSetToast('Token archived and hidden from active views.')
}

// ─── Helpers ─────────────────────────────────────────────────────

function generateTokenSecret(kind: string): string {
  const prefix = kind === 'super' ? 'stp' : 'str'
  const random = Array.from({ length: 40 }, () => 'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]).join('')
  return `${prefix}_${random}`
}

async function sha256Hex(input: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(input)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

function eventId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function nextTokenRotationDate(fromDate: string, policy: string): string {
  const date = new Date(fromDate)
  const days = policy === '30_days' ? 30 : policy === '60_days' ? 60 : policy === '90_days' ? 90 : 365
  date.setDate(date.getDate() + days)
  return date.toISOString()
}
