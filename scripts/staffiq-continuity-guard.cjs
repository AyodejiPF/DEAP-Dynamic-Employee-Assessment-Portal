const fs = require('node:fs')
const path = require('node:path')

const defaultPortalUrl = process.env.STAFFIQ_PORTAL_URL || 'https://training-assessment-1c8ef.web.app'
const defaultSnapshotPath = path.resolve(process.cwd(), '.staffiq-continuity', 'predeploy-state.json')
let sessionContextPromise

function usage() {
  console.log([
    'Staffiq continuity guard',
    '',
    'Usage:',
    '  node scripts/staffiq-continuity-guard.cjs snapshot [--url https://...] [--out file.json]',
    '  node scripts/staffiq-continuity-guard.cjs verify [--url https://...] [--before file.json]',
    '',
    'The guard fails if a deployment/run removes users, tests, sessions,',
    'report/audit/analytics events, problem reports, course deployments, learner progress,',
    'mastery/exposure analytics, or training/content relationship records.',
  ].join('\n'))
}

function argValue(args, name, fallback) {
  const index = args.indexOf(name)
  if (index < 0) return fallback
  return args[index + 1] || fallback
}

function sorted(value) {
  return [...value].sort((left, right) => left.localeCompare(right))
}

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  if (!value || typeof value !== 'object') return JSON.stringify(value)
  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
    .join(',')}}`
}

async function getSessionContext(portalUrl) {
  if (process.env.STAFFIQ_LEGACY_STATE_URL) return { headers: {}, tenantId: 'tenant_staffiq_main' }
  if (!sessionContextPromise) {
    sessionContextPromise = (async () => {
      const existingToken = process.env.STAFFIQ_SESSION_TOKEN
      const tenantId = process.env.STAFFIQ_TENANT_ID || 'tenant_staffiq_main'
      if (existingToken) {
        return { headers: { Authorization: `Bearer ${existingToken}`, 'X-Staffiq-Tenant-Id': tenantId }, tenantId }
      }
      const username = process.env.STAFFIQ_ADMIN_USERNAME
      const password = process.env.STAFFIQ_ADMIN_PASSWORD
      const workspace = process.env.STAFFIQ_WORKSPACE || 'staffiq-main'
      if (!username || !password) throw new Error('Set STAFFIQ_ADMIN_USERNAME and STAFFIQ_ADMIN_PASSWORD before running the protected continuity check.')
      const response = await fetch(new URL('/api/staffiq-auth', portalUrl), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', username, password, workspace }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok || !payload.token || !payload.tenant?.tenantId) throw new Error(payload.error || `Continuity sign in failed: ${response.status}`)
      return {
        headers: { Authorization: `Bearer ${payload.token}`, 'X-Staffiq-Tenant-Id': payload.tenant.tenantId },
        tenantId: payload.tenant.tenantId,
      }
    })()
  }
  return sessionContextPromise
}

async function fetchSharedState(portalUrl) {
  const endpoint = process.env.STAFFIQ_LEGACY_STATE_URL || new URL('/api/staffiq-state', portalUrl).toString()
  const context = await getSessionContext(portalUrl)
  const response = await fetch(endpoint, { cache: 'no-store', headers: context.headers })
  if (!response.ok) throw new Error(`Could not fetch Staffiq shared state: ${response.status} ${response.statusText}`)
  const payload = await response.json()
  return payload.state || {}
}

async function fetchCourseImages(portalUrl) {
  if (process.env.STAFFIQ_LEGACY_STATE_URL && !process.env.STAFFIQ_LEGACY_COURSE_IMAGES_URL) return {}
  const endpoint = process.env.STAFFIQ_LEGACY_COURSE_IMAGES_URL || new URL('/api/staffiq-course-images', portalUrl).toString()
  const context = await getSessionContext(portalUrl)
  const response = await fetch(endpoint, { cache: 'no-store', headers: context.headers })
  if (!response.ok) return {}
  const payload = await response.json()
  return payload.images || {}
}

function eventPreservationIds(activeItems, trashRecords, itemType) {
  const activeIds = (Array.isArray(activeItems) ? activeItems : [])
    .filter((item) => item && item.id)
    .map((item) => `${itemType}:${String(item.id)}`)
  const trashIds = (Array.isArray(trashRecords) ? trashRecords : [])
    .filter((record) => record && record.itemType === itemType && record.itemId)
    .map((record) => `${itemType}:${String(record.itemId)}`)
  return sorted(Array.from(new Set([...activeIds, ...trashIds])))
}

function criticalSummary(state, courseImages = {}) {
  const users = Array.isArray(state.users) ? state.users : []
  const tests = Array.isArray(state.tests) ? state.tests : []
  const sessions = Array.isArray(state.sessions) ? state.sessions : []
  const auditEvents = Array.isArray(state.auditEvents) ? state.auditEvents : []
  const analyticsEvents = Array.isArray(state.analyticsEvents) ? state.analyticsEvents : []
  const problemReports = Array.isArray(state.problemReports) ? state.problemReports : []
  const bugAuditLogs = Array.isArray(state.bugAuditLogs) ? state.bugAuditLogs : []
  const contributionPoints = Array.isArray(state.contributionPoints) ? state.contributionPoints : []
  const trashRecords = Array.isArray(state.trashRecords) ? state.trashRecords : []
  const trainingSources = Array.isArray(state.questionBankTrainingSources) ? state.questionBankTrainingSources : []
  const contentModules = Array.isArray(state.trainingContentModules) ? state.trainingContentModules : []
  const metadata = state.questionBankMetadata && typeof state.questionBankMetadata === 'object' ? state.questionBankMetadata : {}
  const permissions = state.permissions && typeof state.permissions === 'object' ? state.permissions : {}
  const deployments = state.courseDeployments && typeof state.courseDeployments === 'object' ? state.courseDeployments : {}
  const progress = state.trainingProgress && typeof state.trainingProgress === 'object' ? state.trainingProgress : {}
  const exposure = state.questionExposureCounts && typeof state.questionExposureCounts === 'object' ? state.questionExposureCounts : {}
  const mastery = state.questionMastery && typeof state.questionMastery === 'object' ? state.questionMastery : {}
  const dashboardLayouts = state.dashboardLayouts && typeof state.dashboardLayouts === 'object' ? state.dashboardLayouts : {}
  const apiTokens = Array.isArray(state.apiTokens) ? state.apiTokens : []
  const protectedCourseImages = Object.fromEntries(
    Object.entries(courseImages).map(([batchId, record]) => [batchId, { courseImageUrl: String(record?.courseImageUrl || '') }]),
  )
  return {
    capturedAt: new Date().toISOString(),
    updatedAt: state.updatedAt,
    users: users.map((user) => {
      const { lastLoginAt: _lastLoginAt, ...continuityProtectedUser } = user
      return {
        id: String(user.id),
        signature: stableStringify(continuityProtectedUser),
      }
    }),
    tests: tests.map((test) => ({
      id: String(test.id),
      name: test.name,
      status: test.status,
      startDate: test.startDate,
      endDate: test.endDate,
      includeInAnalytics: test.includeInAnalytics,
      questionBankId: test.questionBankId,
      assignedUserIds: sorted(Array.isArray(test.assignedUserIds) ? test.assignedUserIds.map(String) : []),
    })),
    sessions: sessions.map((session) => ({
      id: String(session.id),
      testId: session.testId,
      userId: session.userId,
      status: session.status,
      responses: Array.isArray(session.responses) ? session.responses.length : 0,
      score: session.score,
      percentage: session.percentage,
      submittedAt: session.submittedAt,
      completedAt: session.completedAt,
    })),
    auditPreservationIds: eventPreservationIds(auditEvents, trashRecords, 'audit_event'),
    analyticsPreservationIds: eventPreservationIds(analyticsEvents, trashRecords, 'analytics_event'),
    problemReportIds: sorted(problemReports.map((report) => String(report.id)).filter(Boolean)),
    bugAuditLogIds: sorted(bugAuditLogs.map((log) => String(log.id)).filter(Boolean)),
    contributionPointIds: sorted(contributionPoints.map((record) => String(record.id)).filter(Boolean)),
    contributionPointSignature: stableStringify(contributionPoints),
    trashPreservationIds: sorted(
      trashRecords
        .filter((record) => record && record.itemType && record.itemId)
        .map((record) => `${record.itemType}:${String(record.itemId)}`),
    ),
    questionExposureCounts: exposure,
    questionMastery: mastery,
    permissionUserIds: sorted(Object.keys(permissions)),
    permissionSignature: stableStringify(permissions),
    questionBankMetadataIds: sorted(Object.keys(metadata)),
    questionBankTrainingSourceIds: sorted(trainingSources.map((source) => String(source.id)).filter(Boolean)),
    courseDeploymentIds: sorted(Object.keys(deployments)),
    courseDeploymentSignature: stableStringify(deployments),
    courseImageIds: sorted(Object.keys(courseImages)),
    courseImageSignature: stableStringify(protectedCourseImages),
    trainingContentModuleIds: sorted(contentModules.map((module) => String(module.id)).filter(Boolean)),
    trainingProgress: progress,
    dashboardLayoutUserIds: sorted(Object.keys(dashboardLayouts)),
    dashboardLayoutSignature: stableStringify(dashboardLayouts),
    apiTokenIds: sorted(apiTokens.map((token) => String(token.id)).filter(Boolean)),
  }
}

function findById(items) {
  return new Map(items.map((item) => [item.id, item]))
}

function compareSummaries(before, after) {
  const errors = []
  const beforeUsers = findById(before.users || [])
  const afterUsers = findById(after.users || [])
  for (const [id, oldUser] of beforeUsers) {
    const nextUser = afterUsers.get(id)
    if (!nextUser) {
      errors.push(`Missing user record after deployment: ${id}`)
      continue
    }
    if (oldUser.signature !== nextUser.signature) errors.push(`User record changed during deployment: ${id}`)
  }

  const beforeTests = findById(before.tests || [])
  const afterTests = findById(after.tests || [])
  for (const [id, oldTest] of beforeTests) {
    const nextTest = afterTests.get(id)
    if (!nextTest) {
      errors.push(`Missing test after deployment: ${oldTest.name || id} (${id})`)
      continue
    }
    for (const field of ['status', 'startDate', 'endDate', 'includeInAnalytics']) {
      if (oldTest[field] !== nextTest[field]) {
        errors.push(`Test ${oldTest.name || id} changed ${field}: ${oldTest[field]} -> ${nextTest[field]}`)
      }
    }
    if (stableStringify(oldTest.assignedUserIds) !== stableStringify(nextTest.assignedUserIds)) {
      errors.push(`Test ${oldTest.name || id} changed assigned users.`)
    }
  }

  const beforeSessions = findById(before.sessions || [])
  const afterSessions = findById(after.sessions || [])
  for (const [id, oldSession] of beforeSessions) {
    const nextSession = afterSessions.get(id)
    if (!nextSession) {
      errors.push(`Missing learner test session after deployment: ${id}`)
      continue
    }
    if (nextSession.responses < oldSession.responses) errors.push(`Session ${id} lost saved responses.`)
    if (oldSession.status !== nextSession.status && oldSession.status === 'completed') {
      errors.push(`Completed session ${id} changed status: ${oldSession.status} -> ${nextSession.status}`)
    }
  }

  for (const id of before.auditPreservationIds || []) {
    if (!(after.auditPreservationIds || []).includes(id)) errors.push(`Missing audit/report activity data after deployment: ${id}`)
  }
  for (const id of before.analyticsPreservationIds || []) {
    if (!(after.analyticsPreservationIds || []).includes(id)) errors.push(`Missing analytics/report activity data after deployment: ${id}`)
  }
  for (const id of before.problemReportIds || []) {
    if (!(after.problemReportIds || []).includes(id)) errors.push(`Missing user problem report after deployment: ${id}`)
  }
  for (const id of before.bugAuditLogIds || []) {
    if (!(after.bugAuditLogIds || []).includes(id)) errors.push(`Missing bug audit log after deployment: ${id}`)
  }
  for (const id of before.contributionPointIds || []) {
    if (!(after.contributionPointIds || []).includes(id)) errors.push(`Missing contribution point record after deployment: ${id}`)
  }
  const beforeContributionPointSignature = before.contributionPointSignature ?? stableStringify([])
  const afterContributionPointSignature = after.contributionPointSignature ?? stableStringify([])
  if (beforeContributionPointSignature !== afterContributionPointSignature) {
    errors.push('Contribution points changed during deployment.')
  }
  for (const id of before.trashPreservationIds || []) {
    const preservedElsewhere = (after.auditPreservationIds || []).includes(id) || (after.analyticsPreservationIds || []).includes(id)
    if (!preservedElsewhere) errors.push(`Missing recoverable report trash data after deployment: ${id}`)
  }

  for (const [questionId, beforeCount] of Object.entries(before.questionExposureCounts || {})) {
    const afterCount = Number((after.questionExposureCounts || {})[questionId] || 0)
    if (afterCount < Number(beforeCount || 0)) errors.push(`Question exposure analytics regressed for ${questionId}: ${beforeCount} -> ${afterCount}`)
  }

  for (const [userId, beforeCategories] of Object.entries(before.questionMastery || {})) {
    const afterCategories = (after.questionMastery || {})[userId]
    if (!afterCategories) {
      errors.push(`Missing mastery analytics for user after deployment: ${userId}`)
      continue
    }
    for (const [category, beforeMastery] of Object.entries(beforeCategories || {})) {
      const afterMastery = afterCategories[category]
      if (!afterMastery) {
        errors.push(`Missing mastery category after deployment: ${userId}/${category}`)
        continue
      }
      const afterQuestionIds = new Set(Array.isArray(afterMastery.questionIds) ? afterMastery.questionIds : [])
      for (const questionId of Array.isArray(beforeMastery.questionIds) ? beforeMastery.questionIds : []) {
        if (!afterQuestionIds.has(questionId)) errors.push(`Mastery analytics lost question ${questionId} for ${userId}/${category}`)
      }
      if (Number(afterMastery.completedCycles || 0) < Number(beforeMastery.completedCycles || 0)) {
        errors.push(`Mastery cycle count regressed for ${userId}/${category}.`)
      }
    }
  }

  for (const id of before.questionBankMetadataIds || []) {
    if (!(after.questionBankMetadataIds || []).includes(id)) errors.push(`Missing question-bank metadata after deployment: ${id}`)
  }
  for (const id of before.permissionUserIds || []) {
    if (!(after.permissionUserIds || []).includes(id)) errors.push(`Missing permission record after deployment: ${id}`)
  }
  if (before.permissionSignature !== after.permissionSignature) {
    errors.push('Permission mapping changed during deployment.')
  }
  for (const id of before.questionBankTrainingSourceIds || []) {
    if (!(after.questionBankTrainingSourceIds || []).includes(id)) errors.push(`Missing training course source after deployment: ${id}`)
  }
  for (const id of before.courseDeploymentIds || []) {
    if (!(after.courseDeploymentIds || []).includes(id)) errors.push(`Missing course deployment mapping after deployment: ${id}`)
  }
  for (const id of before.trainingContentModuleIds || []) {
    if (!(after.trainingContentModuleIds || []).includes(id)) errors.push(`Missing training content module after deployment: ${id}`)
  }
  for (const id of before.apiTokenIds || []) {
    if (!(after.apiTokenIds || []).includes(id)) errors.push(`Missing API token metadata after deployment: ${id}`)
  }
  for (const id of before.dashboardLayoutUserIds || []) {
    if (!(after.dashboardLayoutUserIds || []).includes(id)) errors.push(`Missing personalised dashboard layout after deployment: ${id}`)
  }
  if (before.dashboardLayoutSignature !== after.dashboardLayoutSignature) {
    errors.push('Personalised dashboard layout data changed during deployment.')
  }
  if (before.courseDeploymentSignature !== after.courseDeploymentSignature) {
    errors.push('Course deployment visibility mapping changed during deployment.')
  }
  for (const id of before.courseImageIds || []) {
    if (!(after.courseImageIds || []).includes(id)) errors.push(`Missing course image asset after deployment: ${id}`)
  }
  if (before.courseImageSignature !== after.courseImageSignature) {
    errors.push('Course image registry changed during deployment.')
  }
  for (const [userId, beforeModules] of Object.entries(before.trainingProgress || {})) {
    const afterModules = (after.trainingProgress || {})[userId]
    if (!afterModules) {
      errors.push(`Missing learner training progress after deployment: ${userId}`)
      continue
    }
    for (const [moduleId, beforeProgress] of Object.entries(beforeModules || {})) {
      const afterProgress = afterModules[moduleId]
      if (!afterProgress) {
        errors.push(`Missing learner module progress after deployment: ${userId}/${moduleId}`)
        continue
      }
      if (Number(afterProgress.progressPercent || 0) < Number(beforeProgress.progressPercent || 0)) {
        errors.push(`Learner progress regressed for ${userId}/${moduleId}: ${beforeProgress.progressPercent}% -> ${afterProgress.progressPercent}%`)
      }
      if (beforeProgress.completed && !afterProgress.completed) {
        errors.push(`Completed learner progress was unset for ${userId}/${moduleId}`)
      }
    }
  }
  return errors
}

async function snapshot(args) {
  const portalUrl = argValue(args, '--url', defaultPortalUrl)
  const outPath = path.resolve(argValue(args, '--out', defaultSnapshotPath))
  const [state, courseImages] = await Promise.all([fetchSharedState(portalUrl), fetchCourseImages(portalUrl)])
  const summary = criticalSummary(state, courseImages)
  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, JSON.stringify({ portalUrl, summary }, null, 2))
  console.log(`Continuity snapshot saved: ${outPath}`)
  console.log(`Users: ${summary.users.length}; tests: ${summary.tests.length}; sessions: ${summary.sessions.length}; analytics events: ${summary.analyticsPreservationIds.length}; audit events: ${summary.auditPreservationIds.length}; problem reports: ${summary.problemReportIds.length}; bug audit logs: ${(summary.bugAuditLogIds || []).length}; contribution records: ${(summary.contributionPointIds || []).length}; dashboard layouts: ${summary.dashboardLayoutUserIds.length}; training sources: ${summary.questionBankTrainingSourceIds.length}; course images: ${summary.courseImageIds.length}`)
}

async function verify(args) {
  const portalUrl = argValue(args, '--url', defaultPortalUrl)
  const beforePath = path.resolve(argValue(args, '--before', defaultSnapshotPath))
  if (!fs.existsSync(beforePath)) throw new Error(`Missing continuity snapshot: ${beforePath}`)
  const before = JSON.parse(fs.readFileSync(beforePath, 'utf8')).summary
  const [state, courseImages] = await Promise.all([fetchSharedState(portalUrl), fetchCourseImages(portalUrl)])
  const after = criticalSummary(state, courseImages)
  const errors = compareSummaries(before, after)
  if (errors.length) {
    console.error('STAFFIQ CONTINUITY GUARD FAILED')
    console.error(errors.map((error) => `- ${error}`).join('\n'))
    process.exit(1)
  }
  console.log('Continuity guard passed. No protected test/content/user state drift detected.')
}

async function main() {
  const [command, ...args] = process.argv.slice(2)
  if (!command || command === '--help' || command === '-h') {
    usage()
    return
  }
  if (command === 'snapshot') return snapshot(args)
  if (command === 'verify') return verify(args)
  throw new Error(`Unknown continuity guard command: ${command}`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
