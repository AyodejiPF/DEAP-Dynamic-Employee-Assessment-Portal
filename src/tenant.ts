export type TenantStatus =
  | 'draft'
  | 'trialling'
  | 'active'
  | 'past_due'
  | 'grace'
  | 'suspended'
  | 'cancelled'
  | 'archived'

export type TenantPlan = 'manual' | 'starter' | 'growth' | 'command'
export type TenantMemberRole = 'owner' | 'admin' | 'manager' | 'member' | 'readonly'
export type TenantAccessState = 'active' | 'grace' | 'blocked'

export interface TenantBranding {
  logoUrl?: string
  primaryColour?: string
  accentColour?: string
}

export interface Tenant {
  id: string
  displayName: string
  slug: string
  portalCode: string
  status: TenantStatus
  plan: TenantPlan
  seatLimit: number
  isolationMode: 'shared_firestore_scoped'
  region: string
  branding?: TenantBranding
  createdBy: string
  createdAt: string
  updatedAt: string
  lastActivityAt?: string
  memberCount?: number
  userCount?: number
}

export interface TenantSession {
  tenantId: string
  displayName: string
  slug: string
  portalCode: string
  status: TenantStatus
  plan: TenantPlan
  memberRole: TenantMemberRole
  accessState: TenantAccessState
  isPlatformOwner: boolean
}

export interface TenantAuditLog {
  id: string
  tenantId: string
  actorUserId: string
  actorRole: string
  action: string
  targetType: string
  targetId: string
  reason?: string
  createdAt: string
}

export type TenantUserStatus = 'active' | 'disabled' | 'suspended' | 'left'
export type TenantUserRole = 'super_admin' | 'admin' | 'employee'

export interface TenantDirectoryUser {
  id: string
  userId: string
  tenantId: string
  email: string
  fullName: string
  displayName: string
  role: TenantUserRole
  jobRole: string
  department: string
  supervisorId?: string
  status: TenantUserStatus
  disabled: boolean
  createdAt?: string
  lastLoginAt?: string
  disabledAt?: string
  disabledReason?: string
}

export interface TenantDirectoryPayload {
  tenants: Tenant[]
  users: TenantDirectoryUser[]
  activeTenant: TenantSession
  auditLogs: TenantAuditLog[]
}

interface TenantAuthPayload<TUser, TState> {
  token: string
  expiresAt: string
  user: TUser
  tenant: TenantSession
  state: TState
}

const activeTenantKey = 'staffiq-active-tenant'
const sessionTokenKey = 'staffiq-tenant-session-token'
const sessionUserKey = 'staffiq-tenant-session-user'
const globalStorageKeys = new Set([
  'staffiq-theme',
  'staffiq-font-scale',
  'staffiq-chats-enabled',
  'staffiq-active-tenant',
  'staffiq-self-repair-notice-seen',
])

function safeTenantId(value: string | undefined): string {
  return String(value || 'tenant_staffiq_main').replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 120)
}

export function getActiveTenant(): TenantSession | undefined {
  try {
    const raw = window.localStorage.getItem(activeTenantKey)
    return raw ? (JSON.parse(raw) as TenantSession) : undefined
  } catch {
    return undefined
  }
}

export function getActiveTenantId(): string {
  return getActiveTenant()?.tenantId || 'tenant_staffiq_main'
}

export function tenantStorageKey(key: string, tenantId = getActiveTenantId()): string {
  if (globalStorageKeys.has(key)) return key
  return `staffiq-tenant:${safeTenantId(tenantId)}:${key.replace(/^staffiq-/, '')}`
}

export function readTenantStored<T>(key: string, fallback: T): T {
  try {
    const scopedKey = tenantStorageKey(key)
    const raw = window.localStorage.getItem(scopedKey)
    if (raw) return JSON.parse(raw) as T

    const isDefaultTenant = getActiveTenantId() === 'tenant_staffiq_main'
    const legacy = isDefaultTenant ? window.localStorage.getItem(key) : null
    if (!legacy) return fallback
    window.localStorage.setItem(scopedKey, legacy)
    return JSON.parse(legacy) as T
  } catch {
    return fallback
  }
}

export function writeTenantStored(key: string, value: unknown): void {
  window.localStorage.setItem(tenantStorageKey(key), JSON.stringify(value))
}

export function removeTenantStored(key: string): void {
  window.localStorage.removeItem(tenantStorageKey(key))
}

export function getSessionToken(): string {
  return window.sessionStorage.getItem(sessionTokenKey) || ''
}

export function readSessionUser<TUser>(): TUser | undefined {
  if (!getSessionToken()) return undefined
  try {
    const raw = window.sessionStorage.getItem(sessionUserKey)
    return raw ? (JSON.parse(raw) as TUser) : undefined
  } catch {
    return undefined
  }
}

function storeAuthenticatedSession<TUser>(payload: Pick<TenantAuthPayload<TUser, unknown>, 'token' | 'tenant' | 'user'>): void {
  window.sessionStorage.setItem(sessionTokenKey, payload.token)
  window.sessionStorage.setItem(sessionUserKey, JSON.stringify(payload.user))
  window.localStorage.setItem(activeTenantKey, JSON.stringify(payload.tenant))
}

export function clearAuthenticatedSession(): void {
  window.sessionStorage.removeItem(sessionTokenKey)
  window.sessionStorage.removeItem(sessionUserKey)
  window.localStorage.removeItem('staffiq-current-user')
}

export async function tenantFetch(path: string, init: RequestInit = {}, tenantId = getActiveTenantId()): Promise<Response> {
  const headers = new Headers(init.headers)
  const token = getSessionToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)
  headers.set('X-Staffiq-Tenant-Id', tenantId)
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  return fetch(path, { ...init, headers, cache: init.cache ?? 'no-store' })
}

export async function loginToTenant<TUser, TState>(input: {
  username: string
  password: string
  workspace: string
}): Promise<TenantAuthPayload<TUser, TState>> {
  const response = await fetch('/api/staffiq-auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'login', ...input }),
  })
  const payload = (await response.json().catch(() => ({}))) as TenantAuthPayload<TUser, TState> & { error?: string }
  if (!response.ok) throw new Error(payload.error || 'Sign in could not be completed.')
  storeAuthenticatedSession(payload)
  return payload
}

export async function listTenantDirectory(): Promise<TenantDirectoryPayload> {
  const response = await tenantFetch('/api/staffiq-tenants')
  const payload = (await response.json().catch(() => ({}))) as TenantDirectoryPayload & { error?: string }
  if (!response.ok) throw new Error(payload.error || 'Client workspaces could not be loaded.')
  return payload
}

export async function createTenant(input: {
  displayName: string
  slug?: string
  status: TenantStatus
  plan: TenantPlan
  seatLimit: number
}): Promise<Tenant> {
  const response = await tenantFetch('/api/staffiq-tenants', {
    method: 'POST',
    body: JSON.stringify({ action: 'create', ...input }),
  })
  const payload = (await response.json().catch(() => ({}))) as { tenant?: Tenant; error?: string }
  if (!response.ok || !payload.tenant) throw new Error(payload.error || 'The workspace could not be created.')
  return payload.tenant
}

export async function updateTenantStatus(tenantId: string, status: TenantStatus, reason: string): Promise<Tenant> {
  const response = await tenantFetch('/api/staffiq-tenants', {
    method: 'POST',
    body: JSON.stringify({ action: 'status', tenantId, status, reason }),
  })
  const payload = (await response.json().catch(() => ({}))) as { tenant?: Tenant; error?: string }
  if (!response.ok || !payload.tenant) throw new Error(payload.error || 'Workspace access could not be updated.')
  return payload.tenant
}

export async function createTenantUser(input: {
  tenantId: string
  fullName: string
  displayName: string
  email: string
  role: Exclude<TenantUserRole, 'super_admin'>
  jobRole: string
  department: string
  supervisorId?: string
}): Promise<{ user: TenantDirectoryUser; issuedPassword: string }> {
  const response = await tenantFetch('/api/staffiq-tenants', {
    method: 'POST',
    body: JSON.stringify({ action: 'user_create', ...input }),
  })
  const payload = (await response.json().catch(() => ({}))) as { user?: TenantDirectoryUser; issuedPassword?: string; error?: string }
  if (!response.ok || !payload.user || !payload.issuedPassword) throw new Error(payload.error || 'The user record could not be created.')
  return { user: payload.user, issuedPassword: payload.issuedPassword }
}

export async function updateTenantUserStatus(input: {
  tenantId: string
  userId: string
  status: TenantUserStatus
  reason: string
}): Promise<TenantDirectoryUser> {
  const response = await tenantFetch('/api/staffiq-tenants', {
    method: 'POST',
    body: JSON.stringify({ action: 'user_status', ...input }),
  })
  const payload = (await response.json().catch(() => ({}))) as { user?: TenantDirectoryUser; error?: string }
  if (!response.ok || !payload.user) throw new Error(payload.error || 'The user status could not be updated.')
  return payload.user
}

export async function updateTenantUserRole(input: {
  tenantId: string
  userId: string
  role: Exclude<TenantUserRole, 'super_admin'>
  reason: string
}): Promise<TenantDirectoryUser> {
  const response = await tenantFetch('/api/staffiq-tenants', {
    method: 'POST',
    body: JSON.stringify({ action: 'user_role', ...input }),
  })
  const payload = (await response.json().catch(() => ({}))) as { user?: TenantDirectoryUser; error?: string }
  if (!response.ok || !payload.user) throw new Error(payload.error || 'The user role could not be updated.')
  return payload.user
}

export async function resetTenantUserPassword(input: {
  tenantId: string
  userId: string
  reason: string
}): Promise<{ user: TenantDirectoryUser; issuedPassword: string }> {
  const response = await tenantFetch('/api/staffiq-tenants', {
    method: 'POST',
    body: JSON.stringify({ action: 'user_password', ...input }),
  })
  const payload = (await response.json().catch(() => ({}))) as { user?: TenantDirectoryUser; issuedPassword?: string; error?: string }
  if (!response.ok || !payload.user || !payload.issuedPassword) throw new Error(payload.error || 'The password could not be reset.')
  return { user: payload.user, issuedPassword: payload.issuedPassword }
}

export async function switchTenant<TUser>(tenantId: string): Promise<void> {
  const response = await tenantFetch('/api/staffiq-tenants', {
    method: 'POST',
    body: JSON.stringify({ action: 'switch', tenantId }),
  })
  const payload = (await response.json().catch(() => ({}))) as TenantAuthPayload<TUser, unknown> & { error?: string }
  if (!response.ok) throw new Error(payload.error || 'The workspace could not be opened.')
  storeAuthenticatedSession(payload)
}

export function workspaceFromLocation(): string {
  const params = new URLSearchParams(window.location.search)
  const queryWorkspace = params.get('workspace') || params.get('tenant')
  if (queryWorkspace) return queryWorkspace
  const pathParts = window.location.pathname.split('/').filter(Boolean)
  if (pathParts[0] === 'w' && pathParts[1]) return pathParts[1]
  return getActiveTenant()?.slug || 'staffiq-main'
}
