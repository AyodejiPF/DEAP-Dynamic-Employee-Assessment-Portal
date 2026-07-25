/**
 * Client API Keys — Service Layer (TypeScript)
 *
 * Every client (tenant) can be issued one or more API keys. Only a salted
 * hash of the key is ever stored, the raw value is returned to the caller
 * once, at issue time, and never again. Keys are never hard deleted, they
 * are revoked with a reason and an actor, matching the platform's existing
 * zero data loss policy for user and audit records.
 *
 * Firestore paths:
 *   tenants/{tenantId}/apiKeys/{keyId}
 */

import * as admin from 'firebase-admin'
import * as crypto from 'crypto'
import type { ApiKeyRecord, PublicApiKeyRecord } from './types'

let _db: FirebaseFirestore.Firestore | null = null
function db(): FirebaseFirestore.Firestore {
  if (!_db) _db = admin.firestore()
  return _db
}

/** Reads the server side pepper used to hash API keys. Never logged, never returned. */
function getPepper(): string {
  const pepper = process.env.STAFFIQ_API_KEY_PEPPER
  if (!pepper) {
    throw new Error(
      'STAFFIQ_API_KEY_PEPPER is not configured. Set it with: firebase functions:secrets:set STAFFIQ_API_KEY_PEPPER'
    )
  }
  return pepper
}

function generateRawKey(): { raw: string; prefix: string } {
  const bytes = crypto.randomBytes(32)
  const raw = 'rs_live_' + bytes.toString('base64url')
  return { raw, prefix: raw.slice(0, 16) }
}

function hashKey(raw: string): string {
  return crypto.createHmac('sha256', getPepper()).update(raw).digest('hex')
}

function toPublic(keyId: string, record: ApiKeyRecord): PublicApiKeyRecord {
  const { hashedSecret: _hashedSecret, ...safe } = record
  return { keyId, ...safe }
}

/** Issues a new API key for a tenant. Returns the raw key exactly once. */
export async function issueApiKey(
  tenantId: string,
  actorUserId: string,
  label: string,
  scopes: string[] = ['read:reports']
): Promise<{ raw: string; keyId: string; record: PublicApiKeyRecord }> {
  const { raw, prefix } = generateRawKey()
  const record: ApiKeyRecord = {
    tenantId,
    label,
    keyPrefix: prefix,
    hashedSecret: hashKey(raw),
    scopes,
    status: 'active',
    createdAt: admin.firestore.Timestamp.now(),
    createdBy: actorUserId,
  }
  const ref = await db()
    .collection('tenants')
    .doc(tenantId)
    .collection('apiKeys')
    .add(record)
  return { raw, keyId: ref.id, record: toPublic(ref.id, record) }
}

/** Lists every key for a tenant, newest first. Never returns the raw key or its hash. */
export async function listApiKeys(tenantId: string): Promise<PublicApiKeyRecord[]> {
  const snap = await db()
    .collection('tenants')
    .doc(tenantId)
    .collection('apiKeys')
    .orderBy('createdAt', 'desc')
    .get()
  return snap.docs.map((doc) => toPublic(doc.id, doc.data() as ApiKeyRecord))
}

/**
 * Revokes a key. The record is kept forever for audit purposes, only its
 * status changes, consistent with the platform's permanent record policy.
 */
export async function revokeApiKey(
  tenantId: string,
  keyId: string,
  actorUserId: string,
  reason: string
): Promise<void> {
  if (!reason || !reason.trim()) {
    throw new Error('A reason is required to revoke an API key.')
  }
  await db()
    .collection('tenants')
    .doc(tenantId)
    .collection('apiKeys')
    .doc(keyId)
    .update({
      status: 'revoked',
      revokedAt: admin.firestore.Timestamp.now(),
      revokedBy: actorUserId,
      revokedReason: reason,
    })
}

/** Issues a replacement key and revokes the old one, with no gap in access. */
export async function rotateApiKey(
  tenantId: string,
  keyId: string,
  actorUserId: string
): Promise<{ raw: string; keyId: string; record: PublicApiKeyRecord }> {
  const oldSnap = await db().collection('tenants').doc(tenantId).collection('apiKeys').doc(keyId).get()
  if (!oldSnap.exists) throw new Error('API key not found.')
  const oldRecord = oldSnap.data() as ApiKeyRecord
  const issued = await issueApiKey(tenantId, actorUserId, `${oldRecord.label} (rotated)`, oldRecord.scopes)
  await revokeApiKey(tenantId, keyId, actorUserId, `Rotated, replaced by key ${issued.keyId}`)
  return issued
}

/** Resolves an active key by its raw value. Used by the request validating middleware. */
export async function resolveActiveKeyByRaw(
  raw: string
): Promise<{ tenantId: string; keyId: string; record: PublicApiKeyRecord } | null> {
  if (!raw || !raw.startsWith('rs_live_')) return null
  const prefix = raw.slice(0, 16)
  const matches = await db()
    .collectionGroup('apiKeys')
    .where('keyPrefix', '==', prefix)
    .where('status', '==', 'active')
    .limit(1)
    .get()
  if (matches.empty) return null

  const doc = matches.docs[0]
  const record = doc.data() as ApiKeyRecord
  if (record.hashedSecret !== hashKey(raw)) return null

  const tenantId = doc.ref.parent.parent?.id
  if (!tenantId) return null

  doc.ref.update({ lastUsedAt: admin.firestore.Timestamp.now() }).catch(() => undefined)
  return { tenantId, keyId: doc.id, record: toPublic(doc.id, record) }
}
