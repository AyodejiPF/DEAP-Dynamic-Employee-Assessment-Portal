/**
 * Client AI Provider Key Pool — Service Layer (TypeScript)
 *
 * Firestore path: aiProviderKeyPool/{keyId}  (platform level, not per tenant)
 */

import * as admin from 'firebase-admin'
import type { ApiKeyPoolRecord, PublicApiKeyPoolEntry, ResolvedDeepSeekCredential } from './types'
import { MAX_POOL_KEYS_PER_PROJECT } from './types'

let _db: FirebaseFirestore.Firestore | null = null
function db(): FirebaseFirestore.Firestore {
  if (!_db) _db = admin.firestore()
  return _db
}

function poolCollection() {
  return db().collection('aiProviderKeyPool')
}

function preview(apiKey: string): string {
  return apiKey.length <= 8 ? '••••••••' : `${apiKey.slice(0, 6)}••••${apiKey.slice(-4)}`
}

function toPublic(record: ApiKeyPoolRecord): PublicApiKeyPoolEntry {
  const { apiKey, ...safe } = record
  return { ...safe, keyPreview: preview(apiKey) }
}

export class ApiKeyPoolLimitError extends Error {}
export class ApiKeyPoolAssignedError extends Error {}

/** Adds a new key to the pool. Enforces the 10 key ceiling. */
export async function createPoolKey(
  label: string,
  apiKey: string,
  actorUserId: string
): Promise<PublicApiKeyPoolEntry> {
  const existing = await poolCollection().get()
  if (existing.size >= MAX_POOL_KEYS_PER_PROJECT) {
    throw new ApiKeyPoolLimitError(`This project already has ${MAX_POOL_KEYS_PER_PROJECT} keys, the maximum allowed. Remove one before adding another.`)
  }

  const now = admin.firestore.Timestamp.now()
  const ref = poolCollection().doc()
  const record: ApiKeyPoolRecord = {
    keyId: ref.id,
    label,
    apiKey,
    assignedTenantId: null,
    assignedTenantLabel: null,
    portalSyncStatus: 'needs_portal_update',
    portalSyncedAt: null,
    createdAt: now,
    updatedAt: now,
    updatedBy: actorUserId,
  }
  await ref.set(record)
  return toPublic(record)
}

/** Lists every key in the pool, newest first. Never returns the raw key. */
export async function listPoolKeys(): Promise<PublicApiKeyPoolEntry[]> {
  const snap = await poolCollection().orderBy('createdAt', 'desc').get()
  return snap.docs.map((doc) => toPublic(doc.data() as ApiKeyPoolRecord))
}

/** Renames a key's internal label. Marks the portal name as out of sync until confirmed. */
export async function relabelPoolKey(
  keyId: string,
  label: string,
  actorUserId: string
): Promise<PublicApiKeyPoolEntry> {
  const ref = poolCollection().doc(keyId)
  const doc = await ref.get()
  if (!doc.exists) throw new Error('That key no longer exists.')

  const now = admin.firestore.Timestamp.now()
  await ref.update({
    label,
    portalSyncStatus: 'needs_portal_update',
    portalSyncedAt: null,
    updatedAt: now,
    updatedBy: actorUserId,
  })
  const updated = (await ref.get()).data() as ApiKeyPoolRecord
  return toPublic(updated)
}

/** Marks a key's portal name as confirmed synced with DeepSeek's own dashboard. */
export async function markPoolKeyPortalSynced(keyId: string, actorUserId: string): Promise<PublicApiKeyPoolEntry> {
  const ref = poolCollection().doc(keyId)
  const doc = await ref.get()
  if (!doc.exists) throw new Error('That key no longer exists.')

  const now = admin.firestore.Timestamp.now()
  await ref.update({ portalSyncStatus: 'synced', portalSyncedAt: now, updatedAt: now, updatedBy: actorUserId })
  const updated = (await ref.get()).data() as ApiKeyPoolRecord
  return toPublic(updated)
}

/** Assigns a key to a tenant. Clears any other key previously assigned to that same tenant. */
export async function assignPoolKey(
  keyId: string,
  tenantId: string,
  tenantLabel: string,
  actorUserId: string
): Promise<PublicApiKeyPoolEntry> {
  const ref = poolCollection().doc(keyId)
  const doc = await ref.get()
  if (!doc.exists) throw new Error('That key no longer exists.')

  const batch = db().batch()
  const now = admin.firestore.Timestamp.now()

  const previouslyAssigned = await poolCollection().where('assignedTenantId', '==', tenantId).get()
  previouslyAssigned.docs.forEach((otherDoc) => {
    if (otherDoc.id === keyId) return
    batch.update(otherDoc.ref, {
      assignedTenantId: null,
      assignedTenantLabel: null,
      updatedAt: now,
      updatedBy: actorUserId,
    })
  })

  batch.update(ref, {
    assignedTenantId: tenantId,
    assignedTenantLabel: tenantLabel,
    updatedAt: now,
    updatedBy: actorUserId,
  })
  await batch.commit()

  const updated = (await ref.get()).data() as ApiKeyPoolRecord
  return toPublic(updated)
}

/** Unassigns a key. That tenant falls back to the shared platform key. */
export async function unassignPoolKey(keyId: string, actorUserId: string): Promise<PublicApiKeyPoolEntry> {
  const ref = poolCollection().doc(keyId)
  const doc = await ref.get()
  if (!doc.exists) throw new Error('That key no longer exists.')

  const now = admin.firestore.Timestamp.now()
  await ref.update({ assignedTenantId: null, assignedTenantLabel: null, updatedAt: now, updatedBy: actorUserId })
  const updated = (await ref.get()).data() as ApiKeyPoolRecord
  return toPublic(updated)
}

/** Deletes a key from the pool entirely. Refuses while still assigned, unassign first. */
export async function deletePoolKey(keyId: string): Promise<void> {
  const ref = poolCollection().doc(keyId)
  const doc = await ref.get()
  if (!doc.exists) return
  const record = doc.data() as ApiKeyPoolRecord
  if (record.assignedTenantId) {
    throw new ApiKeyPoolAssignedError(`This key is still assigned to ${record.assignedTenantLabel ?? record.assignedTenantId}. Unassign it first.`)
  }
  await ref.delete()
}

/**
 * Resolves which DeepSeek key and model a given tenant's AI calls should
 * use. Falls back to the platform default (Ayodeji's own account, deepseek
 * chat / V4 Pro tier) until a pool key has been assigned to that tenant.
 */
export async function resolveDeepSeekCredential(tenantId: string): Promise<ResolvedDeepSeekCredential> {
  const assigned = await poolCollection().where('assignedTenantId', '==', tenantId).limit(1).get()
  if (!assigned.empty) {
    const record = assigned.docs[0].data() as ApiKeyPoolRecord
    if (record.apiKey) {
      return { apiKey: record.apiKey, model: 'deepseek-flash', source: 'tenant', keyId: record.keyId, label: record.label }
    }
  }

  const platformKey = process.env.DEEPSEEK_API_KEY
  if (!platformKey) {
    throw new Error('DEEPSEEK_API_KEY is not configured. Set it with: firebase functions:secrets:set DEEPSEEK_API_KEY')
  }
  return { apiKey: platformKey, model: 'deepseek-chat', source: 'platform_default' }
}
