const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8')
}

function requirePattern(source, pattern, message) {
  if (!pattern.test(source)) throw new Error(message)
}

const functionsSource = read('functions/index.js')
const appSource = read('src/App.tsx')
const tenantSource = read('src/tenant.ts')
const firebaseConfig = JSON.parse(read('firebase.json'))
const firestoreRules = read('firestore.rules')

requirePattern(functionsSource, /const staffiqSessionSecret = defineSecret\('STAFFIQ_SESSION_SECRET'\)/, 'Signed session secret is not configured.')
requirePattern(functionsSource, /function verifyTenantSession\(/, 'Tenant session verification is missing.')
requirePattern(functionsSource, /tenantRef\(tenantId\)\.collection\('app'\)\.doc\('sharedState'\)/, 'Tenant scoped state path is missing.')
requirePattern(functionsSource, /tenantRef\(tenantId\)\.collection\('questionBanks'\)/, 'Tenant scoped question banks are missing.')
requirePattern(functionsSource, /tenantRef\(tenantId\)\.collection\('courseImages'\)/, 'Tenant scoped course images are missing.')
requirePattern(functionsSource, /requested workspace does not match your signed session/i, 'Tenant claim mismatch protection is missing.')
requirePattern(functionsSource, /mergeEmployeeState\(/, 'Employee write isolation is missing.')
requirePattern(functionsSource, /action === 'user_create'/, 'Cross tenant user creation is missing.')
requirePattern(functionsSource, /action === 'user_status'/, 'Permanent user status management is missing.')
requirePattern(functionsSource, /action === 'user_role'/, 'Tenant role management is missing.')
requirePattern(functionsSource, /StaffiQ never deletes user records/, 'Backend user deletion protection is missing.')
// Firestore collection rename cutover (2026-07-26, see
// docs/STAFFIQ_FIRESTORE_COLLECTION_RENAME_MIGRATION_PLAN.md): reads now come from the
// staffiqLegacy* names, verified backfilled and byte-for-byte matching the deap* originals.
// The deap* refs stay declared in functions/index.js (untouched, unused for reads) as the
// dual-write safety net target and because the old collections themselves are retained for
// the retention window -- so this gate checks both: the new names are wired up for reads, and
// the old collection references have not been deleted out from under the safety net.
requirePattern(functionsSource, /migratedFrom: 'staffiqLegacyApp\/sharedState'/, 'Non destructive legacy state migration is missing.')
requirePattern(functionsSource, /newLegacySharedStateRef = db\.collection\('staffiqLegacyApp'\)\.doc\('sharedState'\)/, 'Renamed legacy shared state source is missing.')
requirePattern(functionsSource, /newLegacyCourseImagesRef = db\.collection\('staffiqLegacyCourseImages'\)/, 'Renamed legacy course image migration source is missing.')
requirePattern(functionsSource, /legacyCourseImagesRef = db\.collection\('deapCourseImages'\)/, 'Original legacy course image collection reference (retained as dual-write safety net) is missing.')
requirePattern(functionsSource, /migration\.courseImagesMigratedAt/, 'Course image migration completion tracking is missing.')
requirePattern(functionsSource, /newLegacyQuestionBanksRef = db\.collection\('staffiqLegacyQuestionBanks'\)/, 'Renamed legacy question bank migration source is missing.')
requirePattern(functionsSource, /legacyQuestionBanksRef = db\.collection\('deapQuestionBanks'\)/, 'Original legacy question bank collection reference (retained as dual-write safety net) is missing.')
requirePattern(functionsSource, /migration\.questionBanksMigratedAt/, 'Question bank migration completion tracking is missing.')
requirePattern(appSource, /TenantManagementPanel/, 'Tenant management interface is missing.')
requirePattern(appSource, /Workspace code/, 'Workspace selection at sign in is missing.')
requirePattern(appSource, /No user deletion/, 'Permanent user record notice is missing.')
requirePattern(appSource, /All tenant users/, 'Cross workspace user directory is missing.')
requirePattern(tenantSource, /staffiq-tenant:\$\{safeTenantId\(tenantId\)\}/, 'Tenant scoped browser cache keys are missing.')
requirePattern(tenantSource, /window\.sessionStorage\.setItem\(sessionTokenKey/, 'Session token is not stored in session storage.')
requirePattern(firestoreRules, /allow read, write: if false;/, 'Direct Firestore browser access must remain denied.')

const rewrites = firebaseConfig.hosting?.rewrites || []
for (const [source, functionName] of [
  ['/api/staffiq-auth', 'staffiqAuth'],
  ['/api/staffiq-tenants', 'staffiqTenants'],
  ['/api/staffiq-state', 'staffiqState'],
]) {
  const match = rewrites.find((rewrite) => rewrite.source === source && rewrite.function === functionName)
  if (!match) throw new Error(`Missing Firebase rewrite for ${source}.`)
}

console.log('Tenant architecture verification passed.')
console.log('Checked signed sessions, server tenant matching, scoped state, scoped assets, membership controls, browser cache isolation, legacy migration and Firebase routes.')
