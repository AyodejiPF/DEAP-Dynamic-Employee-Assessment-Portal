/**
 * Client API Keys — Scheduled Usage Snapshot (TypeScript)
 *
 * Writes a plain JSON usage summary, across every tenant and every key, to
 * Cloud Storage once a day. This is the safe reconciliation path: reading
 * this file needs no live database password and no standing credential,
 * it is just a file an authorised reader can open.
 *
 *   staffiqApiKeyUsageSnapshot — runs daily at 06:00 Lagos time
 */

import { onSchedule } from 'firebase-functions/v2/scheduler'
import * as admin from 'firebase-admin'
import type { ApiKeyUsageSnapshot, ApiKeyUsageSnapshotEntry, ApiKeyRecord } from './types'
import { currentYearMonth } from './usage'

function db(): FirebaseFirestore.Firestore {
  return admin.firestore()
}

export const staffiqApiKeyUsageSnapshot = onSchedule(
  {
    schedule: '0 6 * * *',
    timeZone: 'Africa/Lagos',
    timeoutSeconds: 300,
    memory: '256MiB',
  },
  async () => {
    const yearMonth = currentYearMonth()
    const snapshot: ApiKeyUsageSnapshot = {
      generatedAt: new Date().toISOString(),
      yearMonth,
      tenants: {},
    }

    const tenantRefs = await db().collection('tenants').listDocuments()

    for (const tenantRef of tenantRefs) {
      const keysSnap = await tenantRef.collection('apiKeys').where('status', '==', 'active').get()
      if (keysSnap.empty) continue

      const entries: ApiKeyUsageSnapshotEntry[] = []
      for (const keyDoc of keysSnap.docs) {
        const record = keyDoc.data() as ApiKeyRecord
        const usageSnap = await tenantRef
          .collection('apiKeyUsage')
          .doc(yearMonth)
          .collection('keys')
          .doc(keyDoc.id)
          .get()
        const usage = usageSnap.exists ? usageSnap.data() : null
        entries.push({
          tenantId: tenantRef.id,
          keyId: keyDoc.id,
          label: record.label,
          requestCount: (usage?.requestCount as number) ?? 0,
          errorCount: (usage?.errorCount as number) ?? 0,
          byEndpoint: (usage?.byEndpoint as Record<string, number>) ?? {},
        })
      }
      if (entries.length > 0) snapshot.tenants[tenantRef.id] = entries
    }

    const bucket = admin.storage().bucket()
    await bucket
      .file(`reports/apiKeyUsageSnapshot_${yearMonth}.json`)
      .save(JSON.stringify(snapshot, null, 2), { contentType: 'application/json' })

    console.log(`[api-key-usage-snapshot] Wrote snapshot for ${Object.keys(snapshot.tenants).length} tenant(s), ${yearMonth}.`)
  }
)
