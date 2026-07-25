/**
 * Client API Keys — Usage Logging and Aggregation (TypeScript)
 *
 * Every authenticated request is counted into a per key, per calendar month
 * aggregate (tenants/{tenantId}/apiKeyUsage/{yearMonth}/keys/{keyId}), the
 * same shape the dashboard reads, and also appended to a flat, rolling
 * event log (apiKeyUsageEvents) used for drill down and reconciliation.
 */

import * as admin from 'firebase-admin'
import type { ApiKeyUsageAggregate } from './types'

let _db: FirebaseFirestore.Firestore | null = null
function db(): FirebaseFirestore.Firestore {
  if (!_db) _db = admin.firestore()
  return _db
}

function currentYearMonth(date = new Date()): string {
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`
}

/** Records one request against a key's monthly aggregate, atomically. */
export async function recordApiKeyUsage(
  tenantId: string,
  keyId: string,
  endpoint: string,
  statusCode: number
): Promise<void> {
  const yearMonth = currentYearMonth()
  const ref = db()
    .collection('tenants')
    .doc(tenantId)
    .collection('apiKeyUsage')
    .doc(yearMonth)
    .collection('keys')
    .doc(keyId)

  await db().runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    const current = (snap.exists ? snap.data() : null) as ApiKeyUsageAggregate | null
    const byEndpoint = { ...(current?.byEndpoint ?? {}) }
    byEndpoint[endpoint] = (byEndpoint[endpoint] ?? 0) + 1
    tx.set(
      ref,
      {
        requestCount: (current?.requestCount ?? 0) + 1,
        errorCount: (current?.errorCount ?? 0) + (statusCode >= 400 ? 1 : 0),
        byEndpoint,
        lastUpdated: admin.firestore.Timestamp.now(),
      },
      { merge: true }
    )
  })

  // Rolling event log, kept for a season for drill down and reconciliation,
  // never hard deleted. Add a Firestore TTL policy on expiresAt the same
  // way ai_usage_events already does, see firestore TTL note in index.ts.
  const expiresAt = admin.firestore.Timestamp.fromMillis(Date.now() + 90 * 24 * 60 * 60 * 1000)
  await db()
    .collection('apiKeyUsageEvents')
    .add({
      tenantId,
      keyId,
      endpoint,
      statusCode,
      timestamp: admin.firestore.Timestamp.now(),
      expiresAt,
    })
    .catch(() => undefined)
}

/** Reads the monthly usage aggregate for one key, for the dashboard and for reconciliation. */
export async function getApiKeyUsageSummary(
  tenantId: string,
  keyId: string,
  yearMonth: string = currentYearMonth()
): Promise<ApiKeyUsageAggregate> {
  const snap = await db()
    .collection('tenants')
    .doc(tenantId)
    .collection('apiKeyUsage')
    .doc(yearMonth)
    .collection('keys')
    .doc(keyId)
    .get()
  return (
    (snap.exists ? (snap.data() as ApiKeyUsageAggregate) : null) ?? {
      requestCount: 0,
      errorCount: 0,
      byEndpoint: {},
      lastUpdated: admin.firestore.Timestamp.now(),
    }
  )
}

/** Reads the monthly usage aggregate for every key belonging to one tenant. */
export async function getTenantApiKeyUsage(
  tenantId: string,
  yearMonth: string = currentYearMonth()
): Promise<Array<{ keyId: string } & ApiKeyUsageAggregate>> {
  const snap = await db()
    .collection('tenants')
    .doc(tenantId)
    .collection('apiKeyUsage')
    .doc(yearMonth)
    .collection('keys')
    .get()
  return snap.docs.map((doc) => ({ keyId: doc.id, ...(doc.data() as ApiKeyUsageAggregate) }))
}

export { currentYearMonth }
