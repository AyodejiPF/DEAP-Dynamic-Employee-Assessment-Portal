/**
 * Client AI Provider Keys — Shared Types (TypeScript)
 *
 * Distinct from apiKeys/ (that module issues OUR keys so clients can call
 * OUR API). This module stores CLIENT owned DeepSeek keys so each tenant's
 * AI calls can bill against their own account instead of the platform's.
 *
 * Until a tenant supplies their own key, calls fall back to the platform
 * default DEEPSEEK_API_KEY (Ayodeji's own account) on the deepseek-chat
 * (V4 Pro) tier. Any tenant specific key saved through the Super Admin tab
 * defaults to deepseek-flash (V4 Flash) on save.
 */

export type DeepSeekModelTier = 'deepseek-chat' | 'deepseek-flash'

export interface TenantAiProviderKeyRecord {
  tenantId: string
  clientLabel: string
  apiKey: string
  model: DeepSeekModelTier
  updatedAt: FirebaseFirestore.Timestamp
  updatedBy: string
}

export interface PublicTenantAiProviderKey extends Omit<TenantAiProviderKeyRecord, 'apiKey'> {
  keyPreview: string
}

export interface ResolvedDeepSeekCredential {
  apiKey: string
  model: DeepSeekModelTier
  source: 'tenant' | 'platform_default'
}
