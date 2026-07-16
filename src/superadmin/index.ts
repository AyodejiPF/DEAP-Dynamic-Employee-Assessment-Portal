/**
 * SuperAdmin Module — Isolated Platform Owner functionality.
 *
 * This module contains all code related to Platform Owner / SuperAdmin operations.
 * It is separated so that:
 *   - The rest of the team can develop against the stub (src/superadmin/stub.ts)
 *     without accessing the real implementation.
 *   - Only Ayodeji Falope deploys and modifies the real SuperAdmin code.
 *
 * @packageDocumentation
 */

export { isPlatformOwner, requirePlatformOwner } from './auth'
export { createApiToken, revokeApiToken, rotateApiToken, archiveApiToken } from './tokens'
export { updatePlatformLogo, resetPlatformLogo } from './branding'
export { enableTesterAccount, disableTesterAccount, generateTesterAccountPassword } from './testerAccounts'
export { SuperAdminPanel } from './components/SuperAdminPanel'
export { TokenStudio } from './components/TokenStudio'
export { BrandingControl } from './components/BrandingControl'
export { TesterAccountControl } from './components/TesterAccountControl'

export type { SuperAdminModule } from './types'
