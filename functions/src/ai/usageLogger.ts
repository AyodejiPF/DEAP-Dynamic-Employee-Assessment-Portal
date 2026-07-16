/**
 * AI Usage Logger — Cloud Function (TypeScript)
 *
 * HTTP endpoint that receives AI usage events from the client-side
 * logAIUsage() function and persists them to Firestore.
 *
 * POST /api/ai-usage/log
 *
 * Firestore collection: ai_usage_events
 * TTL: 90 days (set via gcloud firestore fields ttls)
 */

import { onRequest } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import type { AIFeatureName } from './types'

// ─── Firestore (lazy init) ─────────────────────────────────────────

const db = admin.firestore()
const usageEventsRef = db.collection('ai_usage_events')

// ─── Allowed Origins ───────────────────────────────────────────────

const allowedOrigins = new Set([
  'https://training-assessment-1c8ef.web.app',
  'https://training-assessment-1c8ef.firebaseapp.com',
  'https://staffiq.ng',
  'https://www.staffiq.ng',
  'https://staffiq-ng.web.app',
  'https://staffiq-ng.firebaseapp.com',
  'http://127.0.0.1:5173',
  'http://localhost:5173',
])

function setCors(req: any, res: any, methods = 'POST, OPTIONS'): void {
  const origin = req.get('origin')
  if (origin && allowedOrigins.has(origin)) {
    res.set('Access-Control-Allow-Origin', origin)
    res.set('Vary', 'Origin')
  }
  res.set('Access-Control-Allow-Methods', methods)
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Staffiq-Tenant-Id, X-Staffiq-User-Id, X-Staffiq-User-Email, X-Staffiq-User-Role, X-Staffiq-Owner')
  res.set('Cache-Control', 'no-store')
}

// ─── Request Body ──────────────────────────────────────────────────

interface UsageLogBody {
  tenantId: string
  userId: string
  userName?: string
  userRole?: string
  featureName: AIFeatureName
  providerUsed?: string
  modelUsed?: string | null
  successFlag?: boolean
  errorMessage?: string | null
  latencyMs?: number
  tokenEstimate?: number | null
  taskId?: string | null
  briefSnippet?: string | null
}

// ─── Handler ───────────────────────────────────────────────────────

export const aiUsageLog = onRequest(
  { region: 'us-central1', timeoutSeconds: 30, memory: '256MiB', invoker: 'public' },
  async (req, res) => {
    setCors(req, res, 'POST, OPTIONS')
    if (req.method === 'OPTIONS') {
      res.status(204).send('')
      return
    }

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed. Use POST.' })
      return
    }

    try {
      const event = req.body as UsageLogBody

      if (!event || !event.tenantId || !event.userId) {
        res.status(400).json({ error: 'tenantId and userId are required.' })
        return
      }

      // Generate 90-day TTL
      const now = new Date()
      const expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)

      await usageEventsRef.add({
        TenantID: event.tenantId,
        UserID: event.userId,
        UserName: event.userName || 'Unknown',
        UserRole: event.userRole || 'employee',
        FeatureName: event.featureName || 'unknown',
        ProviderUsed: event.providerUsed || 'unknown',
        ModelUsed: event.modelUsed || null,
        SuccessFlag: event.successFlag !== false,
        ErrorMessage: (event.errorMessage || '').slice(0, 300) || null,
        LatencyMs: event.latencyMs || 0,
        TokenEstimate: event.tokenEstimate || null,
        TaskID: event.taskId || null,
        BriefSnippet: (event.briefSnippet || '').slice(0, 100) || null,
        CreatedAt: admin.firestore.FieldValue.serverTimestamp(),
        ExpiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
      })

      res.status(201).json({ logged: true })
    } catch (error: any) {
      console.error('[ai-usage-log] Write failed:', error.message)
      res.status(500).json({ error: 'Failed to log AI usage.' })
    }
  },
)
