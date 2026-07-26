/**
 * Client AI Provider Key Pool — Shared Types (TypeScript)
 *
 * Distinct from apiKeys/ (that module issues OUR keys so clients can call
 * OUR API). This module holds a platform level pool of up to 10 DeepSeek
 * keys that Ayodeji himself uploads and names, each assignable to one
 * tenant at a time. Whichever tenant a key is assigned to bills its AI
 * calls against that key on the "V4 Flash" tier. Any tenant without an
 * assigned key keeps sharing the platform default DEEPSEEK_API_KEY on the
 * "V4 Pro" tier.
 *
 * DeepSeek's public API (chat completions, models, user balance only, see
 * api-docs.deepseek.com) has no endpoint to rename a key's display name on
 * platform.deepseek.com. Renaming there is only possible through DeepSeek's
 * own dashboard UI. So every key tracks a portalSyncStatus: whenever the
 * internal label changes, the status resets to 'needs_portal_update' until
 * Ayodeji (or Claude, driving a live browser session on his behalf) has
 * actually renamed the matching key on DeepSeek's dashboard and it is
 * marked synced.
 */

export const MAX_POOL_KEYS_PER_PROJECT = 10

export type DeepSeekModelTier = 'deepseek-chat' | 'deepseek-flash'

export type PortalSyncStatus = 'synced' | 'needs_portal_update'

export interface ApiKeyPoolRecord {
  keyId: string
  label: string
  apiKey: string
  assignedTenantId: string | null
  assignedTenantLabel: string | null
  portalSyncStatus: PortalSyncStatus
  portalSyncedAt: FirebaseFirestore.Timestamp | null
  createdAt: FirebaseFirestore.Timestamp
  updatedAt: FirebaseFirestore.Timestamp
  updatedBy: string
}

export interface PublicApiKeyPoolEntry extends Omit<ApiKeyPoolRecord, 'apiKey'> {
  keyPreview: string
}

export interface ResolvedDeepSeekCredential {
  apiKey: string
  model: DeepSeekModelTier
  source: 'tenant' | 'platform_default'
  keyId?: string
  label?: string
}
