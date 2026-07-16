/**
 * SuperAdmin tester account management.
 * These operations are restricted to the Platform Owner only.
 */

import type { SuperAdminUser, TesterAccountKey, TesterAccountOperationResult } from './types'

/**
 * Enables a tester account. If generateFreshPassword is true, also generates a new password.
 */
export function enableTesterAccount(
  accountKey: TesterAccountKey,
  generateFreshPassword: boolean,
  context: {
    users: SuperAdminUser[]
    onSetToast: (message: string) => void
    onSetUsers: (users: SuperAdminUser[]) => void
    onRecordAudit: (action: string, detail: string) => void
  },
): TesterAccountOperationResult | undefined {
  const { users, onSetToast, onSetUsers, onRecordAudit } = context
  void generateFreshPassword
  const user = users.find((u) => u.userId === accountKey)
  if (!user) {
    onSetToast('Tester account not found.')
    return
  }
  const updatedUser = { ...user, disabled: false, disabledReason: undefined }
  const nextUsers = users.map((u) => (u.id === user.id ? updatedUser : u))
  onSetUsers(nextUsers)
  onRecordAudit('Tester account enabled', `Tester account "${user.fullName}" (${user.userId}) was enabled.`)
  onSetToast(`Tester account "${user.fullName}" enabled.`)
  return { user: updatedUser }
}

/**
 * Disables a tester account.
 */
export function disableTesterAccount(
  accountKey: TesterAccountKey,
  context: {
    users: SuperAdminUser[]
    onSetToast: (message: string) => void
    onSetUsers: (users: SuperAdminUser[]) => void
    onRecordAudit: (action: string, detail: string) => void
  },
): TesterAccountOperationResult | undefined {
  const { users, onSetToast, onSetUsers, onRecordAudit } = context
  const user = users.find((u) => u.userId === accountKey)
  if (!user) {
    onSetToast('Tester account not found.')
    return
  }
  const updatedUser = { ...user, disabled: true, disabledReason: 'Disabled by Platform Owner.' }
  const nextUsers = users.map((u) => (u.id === user.id ? updatedUser : u))
  onSetUsers(nextUsers)
  onRecordAudit('Tester account disabled', `Tester account "${user.fullName}" (${user.userId}) was disabled.`)
  onSetToast(`Tester account "${user.fullName}" disabled.`)
  return { user: updatedUser }
}

/**
 * Generates a new password for a tester account.
 */
export function generateTesterAccountPassword(
  accountKey: TesterAccountKey,
  context: {
    users: SuperAdminUser[]
    onSetToast: (message: string) => void
    onRecordAudit: (action: string, detail: string) => void
  },
): TesterAccountOperationResult | undefined {
  const { users, onSetToast, onRecordAudit } = context
  const user = users.find((u) => u.userId === accountKey)
  if (!user) {
    onSetToast('Tester account not found.')
    return
  }
  const newPassword = generatePassword()
  onRecordAudit('Tester password generated', `New password generated for "${user.fullName}" (${user.userId}).`)
  onSetToast(`New password generated for "${user.fullName}".`)
  return { user, generatedPassword: newPassword }
}

function generatePassword(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  return Array.from({ length: 16 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}
