const fs = require('node:fs')
const path = require('node:path')

const defaultPortalUrl = process.env.DEAP_PORTAL_URL || 'https://iicocece-assessment.web.app'
const defaultSnapshotPath = path.resolve(process.cwd(), '.deap-continuity', 'predeploy-state.json')

function usage() {
  console.log([
    'DEAP continuity guard',
    '',
    'Usage:',
    '  node scripts/deap-continuity-guard.cjs snapshot [--url https://...] [--out file.json]',
    '  node scripts/deap-continuity-guard.cjs verify [--url https://...] [--before file.json]',
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

async function fetchSharedState(portalUrl) {
  const endpoint = new URL('/api/deap-state', portalUrl).toString()
  const response = await fetch(endpoint, { cache: 'no-store' })
  if (!response.ok) throw new Error(`Could not fetch DEAP shared state: ${response.status} ${response.statusText}`)
  const payload = await response.json()
  return payload.state || {}
}

async function fetchCourseImages(portalUrl) {
  const endpoint = new URL('/api/deap-course-images', portalUrl).toString()
  const response = await fetch(endpoint, { cache: 'no-store' })
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
  const trashRecords = Array.isArray(state.trashRecords) ? state.trashRecords : []
  const trainingSources = Array.isArray(state.questionBankTrainingSources) ? state.questionBankTrainingSources : []
  const contentModules = Array.isArray(state.trainingContentModules) ? state.trainingContentModules : []
  const metadata = state.questionBankMetadata && typeof state.questionBankMetadata === 'object' ? state.questionBankMetadata : {}
  const permissions = state.permissions && typeof state.permissions === 'object' ? state.permissions : {}
  const deployments = state.courseDeployments && typeof state.courseDeployments === 'object' ? state.courseDeployments : {}
  const progress = state.trainingProgress && typeof state.trainingProgress === 'object' ? state.trainingProgress : {}
  const exposure = state.questionExposureCounts && typeof state.questionExposureCounts === 'object' ? state.questionExposureCounts : {}
  const mastery = state.questionMastery && typeof state.questionMastery === 'object' ? state.questionMastery : {}
  const apiTokens = Array.isArray(state.apiTokens) ? state.apiTokens : []
  return {
    capturedAt: new Date().toISOString(),
    updatedAt: state.updatedAt,
    users: users.map((user) => ({
      id: String(user.id),
      signature: stableStringify(user),
    })),
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
    courseImageSignature: stableStringify(courseImages),
    trainingContentModuleIds: sorted(contentModules.map((module) => String(module.id)).filter(Boolean)),
    trainingProgress: progress,
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
  console.log(`Users: ${summary.users.length}; tests: ${summary.tests.length}; sessions: ${summary.sessions.length}; analytics events: ${summary.analyticsPreservationIds.length}; audit events: ${summary.auditPreservationIds.length}; problem reports: ${summary.problemReportIds.length}; training sources: ${summary.questionBankTrainingSourceIds.length}; course images: ${summary.courseImageIds.length}`)
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
    console.error('DEAP CONTINUITY GUARD FAILED')
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
