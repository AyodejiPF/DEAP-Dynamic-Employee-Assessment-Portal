/**
 * Client AI Provider Keys — Service Layer (TypeScript)
 *
 * Firestore path: tenants/{tenantId}/aiProviderKeys/deepseek
 */

import * as admin from 'firebase-admin'
import type { TenantAiProviderKeyRecord, PublicTenantAiProviderKey, ResolvedDeepSeekCredential } from './types'

let _db: FirebaseFirestore.Firestore | null = null
function db(): FirebaseFirestore.Firestore {
  if (!_db) _db = admin.firestore()
  return _db
}

function preview(apiKey: string): string {
  return apiKey.length <= 8 ? '••••••••' : `${apiKey.slice(0, 6)}••••${apiKey.slice(-4)}`
}

function toPublic(record: TenantAiProviderKeyRecord): PublicTenantAiProviderKey {
  const { apiKey, ...safe } = record
  return { ...safe, keyPreview: preview(apiKey) }
}

/** Saves or replaces a tenant's own DeepSeek key. Always defaults to the flash tier on save. */
export async function saveTenantAiProviderKey(
  tenantId: string,
  clientLabel: string,
  apiKey: string,
  actorUserId: string
): Promise<PublicTenantAiProviderKey> {
  const record: TenantAiProviderKeyRecord = {
    tenantId,
    clientLabel,
    apiKey,
    model: 'deepseek-flash',
    updatedAt: admin.firestore.Timestamp.now(),
    updatedBy: actorUserId,
  }
  await db()
    .collection('tenants')
    .doc(tenantId)
    .collection('aiProviderKeys')
    .doc('deepseek')
    .set(record)
  return toPublic(record)
}

/** Lists every tenant that has its own DeepSeek key configured, newest first. Never returns the raw key. */
export async function listTenantAiProviderKeys(): Promise<PublicTenantAiProviderKey[]> {
  const snap = await db().collectionGroup('aiProviderKeys').orderBy('updatedAt', 'desc').get()
  return snap.docs
    .filter((doc) => doc.id === 'deepseek')
    .map((doc) => toPublic(doc.data() as TenantAiProviderKeyRecord))
}

export async function deleteTenantAiProviderKey(tenantId: string): Promise<void> {
  await db().collection('tenants').doc(tenantId).collection('aiProviderKeys').doc('deepseek').delete()
}

/**
 * Resolves which DeepSeek key and model a given tenant's AI calls should
 * use. Falls back to the platform default (Ayodeji's own account, deepseek
 * chat / V4 Pro tier) until that tenant has saved their own key.
 */
export async function resolveDeepSeekCredential(tenantId: string): Promise<ResolvedDeepSeekCredential> {
  const doc = await db().collection('tenants').doc(tenantId).collection('aiProviderKeys').doc('deepseek').get()
  if (doc.exists) {
    const record = doc.data() as TenantAiProviderKeyRecord
    if (record.apiKey) {
      return { apiKey: record.apiKey, model: record.model, source: 'tenant' }
    }
  }

  const platformKey = process.env.DEEPSEEK_API_KEY
  if (!platformKey) {
    throw new Error('DEEPSEEK_API_KEY is not configured. Set it with: firebase functions:secrets:set DEEPSEEK_API_KEY')
  }
  return { apiKey: platformKey, model: 'deepseek-chat', source: 'platform_default' }
}
