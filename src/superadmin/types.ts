/**
 * SuperAdmin shared types.
 *
 * These types mirror the relevant interfaces from App.tsx but are defined
 * here to avoid circular dependencies. Keep them in sync with App.tsx.
 */

// ─── Token Types ─────────────────────────────────────────────────

export type TesterAccountKey = 'testadmin' | 'testuser'

export interface TesterAccountOperationResult {
  user: { id: string; userId: string; fullName: string; displayName: string }
  generatedPassword?: string
}

export interface ApiTokenRecord {
  id: string
  name: string
  kind: 'super' | 'regular'
  tokenPrefix: string
  tokenFingerprint: string
  tokenHash: string
  scopes: string[]
  purpose: string
  ownerId: string
  createdAt: string
  expiresAt: string
  createdBy: string
  status: 'active' | 'revoked' | 'archived' | 'expired'
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  allowedModules: string[]
  allowedEnvironments: string[]
  allowedIps: string
  rateLimit?: number
  usageLimit?: number
  usageCount: number
  rotationPolicy: string
  rotationStatus: string
  nextRotationDueAt: string
  deploymentRecords: Array<{
    id: string
    tokenId: string
    deploymentName: string
    environment: string
    serviceName: string
    deployedBy: string
    deployedAt: string
    status: string
    notes?: string
  }>
  usageLogs: Array<Record<string, unknown>>
  auditLogs: Array<{
    id: string
    tokenId: string
    actor: string
    action: string
    tokenType: string
    timestamp: string
    affectedFields: string[]
    reason: string
    result: string
  }>
  notes?: string
  oauthProfile?: boolean
  auditLogging?: boolean
}

export interface GeneratedApiToken {
  token: string
  record: ApiTokenRecord
}

export interface ApiTokenCreateRequest {
  name: string
  kind: 'super' | 'regular'
  scopes: string[]
  oauthProfile?: boolean
  expiresInDays: number
  purpose: string
  ownerId: string
  allowedModules: string[]
  allowedEnvironments: string[]
  allowedIps: string
  rateLimit?: number
  usageLimit?: number
  rotationPolicy: string
  deploymentName: string
  deploymentEnvironment: string
  deploymentService: string
  notes: string
  justification: string
}

// ─── User Type ───────────────────────────────────────────────────

export interface SuperAdminUser {
  id: string
  userId: string
  fullName: string
  displayName: string
  role: string
  department?: string
  jobRole?: string
  disabled?: boolean
  disabledReason?: string
}

// ─── Module Interface ────────────────────────────────────────────

/** The complete SuperAdmin module interface that the main app consumes. */
export interface SuperAdminModule {
  isPlatformOwner: (user: SuperAdminUser | undefined) => boolean
  requirePlatformOwner: (user: SuperAdminUser | undefined) => asserts user is SuperAdminUser
  createApiToken: (request: ApiTokenCreateRequest, context: TokenContext) => Promise<void>
  revokeApiToken: (tokenId: string, context: TokenContext) => void
  rotateApiToken: (tokenId: string, context: TokenContext) => void
  archiveApiToken: (tokenId: string, context: TokenContext) => void
  updatePlatformLogo: (file: File | undefined, context: BrandingContext) => Promise<void>
  resetPlatformLogo: (context: BrandingContext) => void
  enableTesterAccount: (accountKey: TesterAccountKey, generateFreshPassword: boolean, context: TesterContext) => TesterAccountOperationResult | undefined
  disableTesterAccount: (accountKey: TesterAccountKey, context: TesterContext) => TesterAccountOperationResult | undefined
  generateTesterAccountPassword: (accountKey: TesterAccountKey, context: TesterContext) => TesterAccountOperationResult | undefined
}

/** Context passed to token management functions. */
export interface TokenContext {
  currentUser: { id: string; fullName: string }
  apiCapabilityCatalog: { scope: string; category: string; accessTier?: string }[]
  apiTokens: ApiTokenRecord[]
  onRecordAudit: (action: string, detail: string) => void
  onRecordAnalytics: (event: string, data: Record<string, unknown>) => void
  onSetToast: (message: string) => void
  onSetApiTokens: (tokens: ApiTokenRecord[]) => void
  onSetGeneratedApiToken: (token: GeneratedApiToken | undefined) => void
  onPublishSharedState: (state: { apiTokens: ApiTokenRecord[] }) => void
}

/** Context passed to branding functions. */
export interface BrandingContext {
  defaultBranding: { logoUrl: string }
  onSetToast: (message: string) => void
  onSetBranding: (branding: { logoUrl: string }) => void
  onPublishSharedState: (state: { branding: { logoUrl: string } }) => void
  onRecordAudit: (action: string, detail: string) => void
  onRecordAnalytics: (event: string, data: Record<string, unknown>) => void
}

/** Context passed to tester account functions. */
export interface TesterContext {
  users: SuperAdminUser[]
  onSetToast: (message: string) => void
  onSetUsers: (users: SuperAdminUser[]) => void
  onRecordAudit: (action: string, detail: string) => void
}
