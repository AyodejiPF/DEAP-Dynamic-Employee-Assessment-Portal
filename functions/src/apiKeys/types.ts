/**
 * Client API Keys — Shared Types (TypeScript)
 *
 * One tenant (client) can hold more than one key, for example a production
 * key and a sandbox key. Every key is tied to exactly one tenant so usage
 * can always be reported back per client, never mixed across clients.
 */

export type ApiKeyStatus = 'active' | 'revoked'

export interface ApiKeyRecord {
  tenantId: string
  label: string
  keyPrefix: string
  hashedSecret: string
  scopes: string[]
  status: ApiKeyStatus
  createdAt: FirebaseFirestore.Timestamp
  createdBy: string
  revokedAt?: FirebaseFirestore.Timestamp
  revokedBy?: string
  revokedReason?: string
  lastUsedAt?: FirebaseFirestore.Timestamp
}

export interface PublicApiKeyRecord extends Omit<ApiKeyRecord, 'hashedSecret'> {
  keyId: string
}

export interface ApiKeyUsageAggregate {
  requestCount: number
  errorCount: number
  byEndpoint: Record<string, number>
  lastUpdated: FirebaseFirestore.Timestamp
}

export interface ApiKeyUsageSnapshotEntry {
  tenantId: string
  keyId: string
  label: string
  requestCount: number
  errorCount: number
  byEndpoint: Record<string, number>
}

export interface ApiKeyUsageSnapshot {
  generatedAt: string
  yearMonth: string
  tenants: Record<string, ApiKeyUsageSnapshotEntry[]>
}
