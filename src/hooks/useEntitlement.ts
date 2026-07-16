/**
 * Entitlement Hook — Client-Side
 *
 * React hook for checking feature access on the client.
 * Mirrors the useAIAccess pattern from src/components/AiGate.tsx
 * with 5-minute sessionStorage caching.
 *
 * Usage:
 *   const { allowed, reason } = useEntitlement('ai_insights', currentUser, activeTenant)
 */

import { useState, useEffect, useCallback } from 'react'

interface EntitlementResult {
  allowed: boolean
  reason?: string
  planName?: string
  loading: boolean
  error?: string
}

const CACHE_PREFIX = 'staffiq-entitlement:'
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

function getCached(featureKey: string, tenantId: string): EntitlementResult | null {
  try {
    const key = `${CACHE_PREFIX}${tenantId}:${featureKey}`
    const cached = sessionStorage.getItem(key)
    if (!cached) return null
    const parsed = JSON.parse(cached)
    if (Date.now() - parsed.timestamp > CACHE_TTL_MS) {
      sessionStorage.removeItem(key)
      return null
    }
    return { ...parsed.data, loading: false }
  } catch {
    return null
  }
}

function setCache(featureKey: string, tenantId: string, data: EntitlementResult): void {
  try {
    const key = `${CACHE_PREFIX}${tenantId}:${featureKey}`
    sessionStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }))
  } catch {
    // sessionStorage full — silently skip caching
  }
}

export function useEntitlement(
  featureKey: string,
  currentUser: { userId: string; role: string; fullName: string } | undefined,
  activeTenant: { tenantId: string } | undefined,
): EntitlementResult {
  const [result, setResult] = useState<EntitlementResult>(() => {
    if (!activeTenant) return { allowed: false, loading: false, error: 'No active tenant' }
    const cached = getCached(featureKey, activeTenant.tenantId)
    if (cached) return cached
    return { allowed: false, loading: true }
  })

  const checkEntitlement = useCallback(async () => {
    if (!currentUser || !activeTenant) {
      setResult({ allowed: false, loading: false, error: 'Not authenticated' })
      return
    }

    // Platform Owner bypass (client-side)
    if (
      currentUser.userId === 'U001' &&
      currentUser.role === 'super_admin' &&
      currentUser.fullName.trim().toLowerCase() === 'ayodeji falope'
    ) {
      const r: EntitlementResult = { allowed: true, loading: false }
      setCache(featureKey, activeTenant.tenantId, r)
      setResult(r)
      return
    }

    try {
      // Fetch entitlements from the server
      const res = await fetch(
        `/api/entitlements/check?tenantId=${activeTenant.tenantId}&featureKey=${featureKey}`,
        { headers: { 'Content-Type': 'application/json' } },
      )

      if (!res.ok) {
        throw new Error(`Entitlement check failed: ${res.status}`)
      }

      const data = await res.json()
      const r: EntitlementResult = {
        allowed: data.allowed === true,
        reason: data.reason,
        planName: data.planName,
        loading: false,
      }

      setCache(featureKey, activeTenant.tenantId, r)
      setResult(r)
    } catch (err) {
      const r: EntitlementResult = {
        allowed: false,
        loading: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      }
      setResult(r)
    }
  }, [featureKey, currentUser, activeTenant])

  useEffect(() => {
    if (result.loading) {
      checkEntitlement()
    }
  }, [result.loading, checkEntitlement])

  return result
}

/**
 * Invalidate entitlement cache — call after plan change, payment, or admin override.
 */
export function invalidateEntitlementCache(tenantId: string, featureKey?: string): void {
  try {
    if (featureKey) {
      sessionStorage.removeItem(`${CACHE_PREFIX}${tenantId}:${featureKey}`)
    } else {
      // Invalidate all entitlements for this tenant
      const keys = Object.keys(sessionStorage)
      for (const key of keys) {
        if (key.startsWith(`${CACHE_PREFIX}${tenantId}:`)) {
          sessionStorage.removeItem(key)
        }
      }
    }
  } catch {
    // Ignore
  }
}
