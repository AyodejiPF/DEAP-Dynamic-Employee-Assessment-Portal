/**
 * Grants — Client-Side Helpers
 *
 * Provides hooks and utilities for the Platform Owner and delegated
 * staff to manage billing permissions from the SuperAdmin panel.
 */

import {
  PLATFORM_OWNER,
  isPlatformOwner,
  type OwnerIdentity,
  type DelegatedRole,
  type PlatformGrant,
  type BillingCapability,
  CAPABILITY_MAP,
  OWNER_CAPABILITIES,
} from './owner'
import { tenantFetch } from '../tenant'

// ─── Re-exports ─────────────────────────────────────────────────

export {
  PLATFORM_OWNER,
  isPlatformOwner,
  CAPABILITY_MAP,
  OWNER_CAPABILITIES,
}

export type {
  OwnerIdentity,
  DelegatedRole,
  PlatformGrant,
  BillingCapability,
}

// ─── Grant API Helpers ───────────────────────────────────────────

const BASE = '/api/grants'

// NOTE: the `caller` parameter is retained for call site compatibility but is NO
// LONGER sent to the server. The server derives the caller's identity solely from
// the HMAC signed session attached by tenantFetch (Authorization: Bearer <token>).
// Self asserted identity in the request body is ignored by the server.

export async function fetchGrants(statusFilter?: 'active' | 'revoked'): Promise<PlatformGrant[]> {
  const url = statusFilter ? `${BASE}/list?status=${statusFilter}` : `${BASE}/list`
  const res = await tenantFetch(url)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error ?? `Failed to fetch grants: ${res.statusText}`)
  }
  const data = await res.json()
  return data.grants as PlatformGrant[]
}

export async function createGrant(
  caller: OwnerIdentity,
  subjectUserId: string,
  role: DelegatedRole,
  reason: string,
  expiresAt?: string,
): Promise<PlatformGrant> {
  void caller
  const res = await tenantFetch(`${BASE}/create`, {
    method: 'POST',
    body: JSON.stringify({
      subjectUserId,
      role,
      reason,
      expiresAt: expiresAt ?? null,
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error ?? 'Failed to create grant')
  }
  const data = await res.json()
  return data.grant as PlatformGrant
}

export async function revokeGrant(
  caller: OwnerIdentity,
  grantId: string,
  reason: string,
): Promise<void> {
  void caller
  const res = await tenantFetch(`${BASE}/revoke`, {
    method: 'POST',
    body: JSON.stringify({
      grantId,
      reason,
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error ?? 'Failed to revoke grant')
  }
}

// ─── Role Display Helpers ────────────────────────────────────────

export const ROLE_LABELS: Record<DelegatedRole, string> = {
  billing_admin: 'Billing Admin',
  support: 'Support',
  finance: 'Finance',
}

export const ROLE_DESCRIPTIONS: Record<DelegatedRole, string> = {
  billing_admin: 'Create plan drafts, assign subscriptions, override entitlements, apply credits, view and export billing data.',
  support: 'Change tenant subscriptions, view billing history.',
  finance: 'Apply credits, issue refunds, view and export billing data.',
}
