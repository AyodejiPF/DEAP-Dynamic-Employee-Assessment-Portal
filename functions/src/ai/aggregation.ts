/**
 * AI Usage Aggregation — Scheduled Cloud Functions (TypeScript)
 *
 * Two scheduled functions:
 *   1. staffiqAIResetMonthlyCounters — runs 1st of each month at 01:00 Lagos
 *   2. staffiqAIAggregation — runs hourly to compile usage summaries
 *
 * Schedule (cron, Africa/Lagos):
 *   - Monthly reset:  "0 1 1 * *"   (01:00 on 1st of every month)
 *   - Hourly aggregation: "0 * * * *"  (top of every hour)
 */

import { onSchedule } from 'firebase-functions/v2/scheduler'
import * as admin from 'firebase-admin'

const db = admin.firestore()
const usageEventsRef = db.collection('ai_usage_events')
const usageSummariesRef = db.collection('ai_usage_summaries')

// ═══════════════════════════════════════════════════════════════════
// Monthly Counter Reset
// ═══════════════════════════════════════════════════════════════════

export const aiResetMonthlyCounters = onSchedule(
  {
    schedule: '0 1 1 * *',
    timeZone: 'Africa/Lagos',
    timeoutSeconds: 300,
    memory: '256MiB',
  },
  async () => {
    try {
      const tenants = await db
        .collection('tenants')
        .where('AICurrentMonthCalls', '>', 0)
        .get()

      if (tenants.empty) {
        console.log('[ai-reset] No tenants with AI usage this month.')
        return
      }

      const batch = db.batch()
      let count = 0
      tenants.forEach((doc) => {
        batch.update(doc.ref, { AICurrentMonthCalls: 0 })
        count++
      })

      await batch.commit()
      console.log(`[ai-reset] Reset AI counters for ${count} tenants.`)
    } catch (error: any) {
      console.error('[ai-reset] Failed:', error.message)
    }
  },
)

// ═══════════════════════════════════════════════════════════════════
// Hourly Aggregation
// ═══════════════════════════════════════════════════════════════════

export const aiAggregation = onSchedule(
  {
    schedule: '0 * * * *',
    timeZone: 'Africa/Lagos',
    timeoutSeconds: 300,
    memory: '512MiB',
  },
  async () => {
    try {
      const now = new Date()
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

      const snapshot = await usageEventsRef
        .where('CreatedAt', '>=', admin.firestore.Timestamp.fromDate(oneHourAgo))
        .get()

      if (snapshot.empty) {
        console.log('[ai-aggregation] No new events in the last hour.')
        return
      }

      // Group events by tenant + feature
      const groups = new Map<string, {
        tenantId: string
        tenantName: string
        featureName: string
        period: string
        periodKey: string
        totalCalls: number
        successCalls: number
        totalLatencyMs: number
        totalTokens: number
        uniqueUsers: Set<string>
      }>()

      snapshot.forEach((doc) => {
        const event = doc.data()
        const tenantId = event.TenantID || 'unknown'
        const featureName = event.FeatureName || 'unknown'
        const key = `${tenantId}::${featureName}`

        let group = groups.get(key)
        if (!group) {
          group = {
            tenantId,
            tenantName: event.TenantName || tenantId,
            featureName,
            period: 'hourly',
            periodKey: now.toISOString().slice(0, 13), // YYYY-MM-DDTHH
            totalCalls: 0,
            successCalls: 0,
            totalLatencyMs: 0,
            totalTokens: 0,
            uniqueUsers: new Set(),
          }
          groups.set(key, group)
        }

        group.totalCalls += 1
        if (event.SuccessFlag) group.successCalls += 1
        group.totalLatencyMs += event.LatencyMs || 0
        group.totalTokens += event.TokenEstimate || 0
        if (event.UserID) group.uniqueUsers.add(event.UserID)
      })

      // Write summaries
      const batch = db.batch()
      groups.forEach((group) => {
        const docRef = usageSummariesRef.doc()
        batch.set(docRef, {
          TenantID: group.tenantId,
          TenantName: group.tenantName,
          FeatureName: group.featureName,
          Period: group.period,
          PeriodKey: group.periodKey,
          TotalCalls: group.totalCalls,
          SuccessCalls: group.successCalls,
          SuccessRate: group.totalCalls > 0
            ? Math.round((group.successCalls / group.totalCalls) * 1000) / 10
            : 0,
          AvgLatencyMs: group.totalCalls > 0
            ? Math.round(group.totalLatencyMs / group.totalCalls)
            : 0,
          TotalTokens: group.totalTokens,
          UniqueUsers: group.uniqueUsers.size,
          AggregatedAt: admin.firestore.FieldValue.serverTimestamp(),
        })
      })

      await batch.commit()
      console.log(`[ai-aggregation] Wrote ${groups.size} summary documents from ${snapshot.size} events.`)
    } catch (error: any) {
      console.error('[ai-aggregation] Failed:', error.message)
    }
  },
)
