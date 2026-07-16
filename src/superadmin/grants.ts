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

export async function fetchGrants(statusFilter?: 'active' | 'revoked'): Promise<PlatformGrant[]> {
  const url = statusFilter ? `${BASE}/list?status=${statusFilter}` : `${BASE}/list`
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Failed to fetch grants: ${res.statusText}`)
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
  const res = await fetch(`${BASE}/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      callerUserId: caller.userId,
      callerRole: caller.role,
      callerFullName: caller.fullName,
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
  const res = await fetch(`${BASE}/revoke`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      callerUserId: caller.userId,
      callerRole: caller.role,
      callerFullName: caller.fullName,
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
