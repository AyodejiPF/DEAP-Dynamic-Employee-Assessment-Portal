/**
 * SuperAdmin authentication and authorisation helpers.
 * These verify that the current user is the Platform Owner before
 * allowing access to sensitive operations.
 */

import type { SuperAdminUser } from './types'

/** The single Platform Owner role value. */
export const OWNER_ROLE = 'super_admin'

/**
 * Returns true if the given user is the Platform Owner.
 * Checks both role and identity to prevent role-spoofing.
 */
export function isPlatformOwner(user: SuperAdminUser | undefined): boolean {
  return Boolean(
    user &&
      user.role === OWNER_ROLE &&
      user.userId === 'U001' &&
      user.fullName.trim().toLowerCase() === 'ayodeji falope',
  )
}

/**
 * Throws if the given user is not the Platform Owner.
 * Use this to guard SuperAdmin operations server-side or in critical paths.
 */
export function requirePlatformOwner(user: SuperAdminUser | undefined): asserts user is SuperAdminUser {
  if (!isPlatformOwner(user)) {
    throw new Error('Only the Platform Owner can perform this action.')
  }
}

/**
 * Returns the display label for the owner role.
 */
export function getOwnerLabel(): string {
  return 'Platform Owner'
}
