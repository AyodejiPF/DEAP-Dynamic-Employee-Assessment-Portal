/**
 * SuperAdmin Stub — used by the team for local development.
 *
 * This stub replaces the real SuperAdmin module so that colleagues
 * can develop and run the app without needing access to the real
 * SuperAdmin code. All sensitive operations are replaced with
 * no-ops or mock implementations.
 *
 * The real SuperAdmin module is loaded only when:
 *   1. The build is configured with VITE_SUPERADMIN_SOURCE=real
 *   2. The current user is the Platform Owner
 *
 * Swap strategy:
 *   - In vite.config.ts, alias 'src/superadmin' to 'src/superadmin/stub.ts'
 *     for team builds, and to 'src/superadmin/index.ts' for owner builds.
 *   - Or use dynamic imports with environment variable gating.
 */

/**
 * Returns true only if the user is the Platform Owner.
 * In the stub, this always returns false so SuperAdmin UI is hidden.
 */
export function isPlatformOwner(): false {
  return false
}

/**
 * In the stub, this is a no-op — the team cannot accidentally trigger
 * SuperAdmin operations.
 */
export function requirePlatformOwner(): void {
  throw new Error('SuperAdmin operations are not available in this build.')
}

/** Stub — token operations are unavailable. */
export async function createApiToken(): Promise<void> {
  throw new Error('Token management is not available in this build.')
}

/** Stub — token operations are unavailable. */
export function revokeApiToken(): void {
  throw new Error('Token management is not available in this build.')
}

/** Stub — token operations are unavailable. */
export function rotateApiToken(): void {
  throw new Error('Token management is not available in this build.')
}

/** Stub — token operations are unavailable. */
export function archiveApiToken(): void {
  throw new Error('Token management is not available in this build.')
}

/** Stub — branding operations are unavailable. */
export async function updatePlatformLogo(): Promise<void> {
  throw new Error('Branding management is not available in this build.')
}

/** Stub — branding operations are unavailable. */
export function resetPlatformLogo(): void {
  throw new Error('Branding management is not available in this build.')
}

/** Stub — tester account operations are unavailable. */
export function enableTesterAccount(): undefined {
  return undefined
}

/** Stub — tester account operations are unavailable. */
export function disableTesterAccount(): undefined {
  return undefined
}

/** Stub — tester account operations are unavailable. */
export function generateTesterAccountPassword(): undefined {
  return undefined
}

/** Stub — SuperAdminPanel renders nothing. */
export function SuperAdminPanel(): null {
  return null
}

/** Stub — TokenStudio renders nothing. */
export function TokenStudio(): null {
  return null
}

/** Stub — BrandingControl renders nothing. */
export function BrandingControl(): null {
  return null
}

/** Stub — TesterAccountControl renders nothing. */
export function TesterAccountControl(): null {
  return null
}
