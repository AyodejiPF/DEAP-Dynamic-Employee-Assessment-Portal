const { onRequest } = require('firebase-functions/v2/https')
const { onSchedule } = require('firebase-functions/v2/scheduler')
const { defineSecret } = require('firebase-functions/params')
const admin = require('firebase-admin')
const crypto = require('crypto')

if (!admin.apps.length) {
  admin.initializeApp()
}

const perplexityApiKey = defineSecret('PERPLEXITY_API_KEY')
const db = admin.firestore()
const sharedStateRef = db.collection('deapApp').doc('sharedState')
const courseImagesRef = db.collection('deapCourseImages')
const questionBanksRef = db.collection('deapQuestionBanks')
const featureInventoryVersionsRef = db.collection('featureInventoryVersions')
const featureInventoryItemsRef = db.collection('featureInventoryItems')
const featureInventoryScanLogsRef = db.collection('featureInventoryScanLogs')
const featureInventoryExportsRef = db.collection('featureInventoryExports')
const featureInventoryAccessLogsRef = db.collection('featureInventoryAccessLogs')
const problemReportAccessLogsRef = db.collection('problemReportAccessLogs')
const apiTokenRegistryResetAt = Date.parse('2026-05-10T15:17:39.946Z')
const allowedOrigins = new Set([
  'https://training-assessment-1c8ef.web.app',
  'https://training-assessment-1c8ef.firebaseapp.com',
  'http://127.0.0.1:5173',
  'http://localhost:5173',
])

function setCors(req, res, methods = 'POST, OPTIONS') {
  const origin = req.get('origin')
  if (origin && allowedOrigins.has(origin)) {
    res.set('Access-Control-Allow-Origin', origin)
    res.set('Vary', 'Origin')
  }
  res.set('Access-Control-Allow-Methods', methods)
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-DEAP-User-Id, X-DEAP-User-Email, X-DEAP-User-Role, X-DEAP-Owner')
  res.set('Cache-Control', 'no-store')
}

function pickSharedStateFields(value) {
  const source = value && typeof value === 'object' ? value : {}
  const next = {}
  for (const key of [
    'users',
    'permissions',
    'tests',
    'sessions',
    'questionBankTrainingSources',
    'questionBankMetadata',
    'courseDeployments',
    'deletedQuestionBankIds',
    'trainingContentModules',
    'trainingProgress',
    'auditEvents',
    'analyticsEvents',
    'problemReports',
    'affectedAreas',
    'bugAuditLogs',
    'contributionPoints',
    'trashRecords',
    'questionExposureCounts',
    'questionMastery',
    'branding',
    'layoutSettings',
    'dashboardLayouts',
    'apiTokens',
    'updatedAt',
  ]) {
    if (Object.prototype.hasOwnProperty.call(source, key)) next[key] = source[key]
  }
  return next
}

function readSharedStateFromDocument(data) {
  if (!data || typeof data !== 'object') return null
  if (typeof data.stateJson === 'string') {
    try {
      const parsed = JSON.parse(data.stateJson)
      return {
        ...parsed,
        updatedAt: parsed.updatedAt || data.updatedAt,
      }
    } catch {
      return null
    }
  }
  const picked = pickSharedStateFields(data)
  return Object.keys(picked).length ? picked : null
}

function idsFromItems(items) {
  if (!Array.isArray(items)) return new Set()
  return new Set(
    items
      .map((item) => String(item && item.id ? item.id : '').trim())
      .filter(Boolean),
  )
}

function missingIds(existingItems, incomingItems) {
  const existingIds = idsFromItems(existingItems)
  const incomingIds = idsFromItems(incomingItems)
  return Array.from(existingIds).filter((id) => !incomingIds.has(id))
}

function objectMissingKeys(existingObject, incomingObject) {
  if (!existingObject || typeof existingObject !== 'object') return []
  if (!incomingObject || typeof incomingObject !== 'object') return Object.keys(existingObject)
  return Object.keys(existingObject).filter((key) => !Object.prototype.hasOwnProperty.call(incomingObject, key))
}

function trashItemIds(trashRecords, itemType) {
  if (!Array.isArray(trashRecords)) return new Set()
  return new Set(
    trashRecords
      .filter((record) => record && record.itemType === itemType)
      .map((record) => String(record.itemId || '').trim())
      .filter(Boolean),
  )
}

function missingActiveEventIds(existingEvents, incomingEvents, incomingTrashRecords, itemType) {
  const incomingIds = idsFromItems(incomingEvents)
  const preservedInTrash = trashItemIds(incomingTrashRecords, itemType)
  return Array.from(idsFromItems(existingEvents)).filter((id) => !incomingIds.has(id) && !preservedInTrash.has(id))
}

function activeEventIds(events, itemType) {
  return new Set(
    (Array.isArray(events) ? events : [])
      .filter((event) => event && event.id)
      .map((event) => `${itemType}:${String(event.id)}`),
  )
}

function trashRecordPreservedIds(records) {
  return new Set(
    (Array.isArray(records) ? records : [])
      .filter((record) => record && record.itemType && record.itemId)
      .map((record) => `${record.itemType}:${String(record.itemId)}`),
  )
}

function criticalContinuityErrors(existingState, incomingState) {
  if (!existingState || !incomingState) return []
  const errors = []
  if (Array.isArray(incomingState.users) && Array.isArray(existingState.users)) {
    const missingUsers = missingIds(existingState.users, incomingState.users)
    if (missingUsers.length) errors.push(`Incoming state omits existing user record(s): ${missingUsers.slice(0, 8).join(', ')}`)
  }
  const missingPermissionUsers = objectMissingKeys(existingState.permissions, incomingState.permissions)
  if (Object.prototype.hasOwnProperty.call(incomingState, 'permissions') && missingPermissionUsers.length) {
    errors.push(`Incoming state omits existing permission record(s) for user(s): ${missingPermissionUsers.slice(0, 8).join(', ')}`)
  }
  if (Array.isArray(incomingState.tests) && Array.isArray(existingState.tests)) {
    const missingTests = missingIds(existingState.tests, incomingState.tests)
    if (missingTests.length) errors.push(`Incoming state omits existing test record(s): ${missingTests.slice(0, 8).join(', ')}`)
  }
  if (Array.isArray(incomingState.sessions) && Array.isArray(existingState.sessions)) {
    const missingSessions = missingIds(existingState.sessions, incomingState.sessions)
    if (missingSessions.length) errors.push(`Incoming state omits existing test session(s): ${missingSessions.slice(0, 8).join(', ')}`)
  }
  if (Array.isArray(incomingState.trainingContentModules) && Array.isArray(existingState.trainingContentModules)) {
    const missingModules = missingIds(existingState.trainingContentModules, incomingState.trainingContentModules)
    if (missingModules.length) errors.push(`Incoming state omits existing training content module(s): ${missingModules.slice(0, 8).join(', ')}`)
  }
  const missingCourseDeployments = objectMissingKeys(existingState.courseDeployments, incomingState.courseDeployments)
  if (Object.prototype.hasOwnProperty.call(incomingState, 'courseDeployments') && missingCourseDeployments.length) {
    errors.push(`Incoming state omits existing course deployment record(s): ${missingCourseDeployments.slice(0, 8).join(', ')}`)
  }
  const missingTrainingProgressUsers = objectMissingKeys(existingState.trainingProgress, incomingState.trainingProgress)
  if (Object.prototype.hasOwnProperty.call(incomingState, 'trainingProgress') && missingTrainingProgressUsers.length) {
    errors.push(`Incoming state omits learner training progress for user(s): ${missingTrainingProgressUsers.slice(0, 8).join(', ')}`)
  }
  if (Array.isArray(incomingState.auditEvents) && Array.isArray(existingState.auditEvents)) {
    const missingAuditEvents = missingActiveEventIds(existingState.auditEvents, incomingState.auditEvents, incomingState.trashRecords, 'audit_event')
    if (missingAuditEvents.length) errors.push(`Incoming state omits existing audit event(s): ${missingAuditEvents.slice(0, 8).join(', ')}`)
  }
  if (Array.isArray(incomingState.analyticsEvents) && Array.isArray(existingState.analyticsEvents)) {
    const missingAnalyticsEvents = missingActiveEventIds(existingState.analyticsEvents, incomingState.analyticsEvents, incomingState.trashRecords, 'analytics_event')
    if (missingAnalyticsEvents.length) errors.push(`Incoming state omits existing analytics/report event(s): ${missingAnalyticsEvents.slice(0, 8).join(', ')}`)
  }
  if (Array.isArray(incomingState.problemReports) && Array.isArray(existingState.problemReports)) {
    const missingProblemReports = missingIds(existingState.problemReports, incomingState.problemReports)
    if (missingProblemReports.length) errors.push(`Incoming state omits existing problem report(s): ${missingProblemReports.slice(0, 8).join(', ')}`)
  }
  if (Array.isArray(incomingState.bugAuditLogs) && Array.isArray(existingState.bugAuditLogs)) {
    const missingBugAuditLogs = missingIds(existingState.bugAuditLogs, incomingState.bugAuditLogs)
    if (missingBugAuditLogs.length) errors.push(`Incoming state omits existing bug audit log(s): ${missingBugAuditLogs.slice(0, 8).join(', ')}`)
  }
  if (Array.isArray(incomingState.contributionPoints) && Array.isArray(existingState.contributionPoints)) {
    const missingContributionRecords = missingIds(existingState.contributionPoints, incomingState.contributionPoints)
    if (missingContributionRecords.length) errors.push(`Incoming state omits existing contribution point record(s): ${missingContributionRecords.slice(0, 8).join(', ')}`)
  }
  if (Array.isArray(incomingState.trashRecords) && Array.isArray(existingState.trashRecords)) {
    const incomingActiveIds = new Set([
      ...activeEventIds(incomingState.auditEvents, 'audit_event'),
      ...activeEventIds(incomingState.analyticsEvents, 'analytics_event'),
      ...trashRecordPreservedIds(incomingState.trashRecords),
    ])
    const missingTrash = Array.from(trashRecordPreservedIds(existingState.trashRecords)).filter((id) => !incomingActiveIds.has(id))
    if (missingTrash.length) errors.push(`Incoming state omits recoverable report trash item(s): ${missingTrash.slice(0, 8).join(', ')}`)
  }
  const missingExposureKeys = objectMissingKeys(existingState.questionExposureCounts, incomingState.questionExposureCounts)
  if (Object.prototype.hasOwnProperty.call(incomingState, 'questionExposureCounts') && missingExposureKeys.length) {
    errors.push(`Incoming state omits question exposure analytics key(s): ${missingExposureKeys.slice(0, 8).join(', ')}`)
  }
  const missingMasteryUsers = objectMissingKeys(existingState.questionMastery, incomingState.questionMastery)
  if (Object.prototype.hasOwnProperty.call(incomingState, 'questionMastery') && missingMasteryUsers.length) {
    errors.push(`Incoming state omits learner mastery analytics for user(s): ${missingMasteryUsers.slice(0, 8).join(', ')}`)
  }
  const missingDashboardLayouts = objectMissingKeys(existingState.dashboardLayouts, incomingState.dashboardLayouts)
  if (Object.prototype.hasOwnProperty.call(incomingState, 'dashboardLayouts') && missingDashboardLayouts.length) {
    errors.push(`Incoming state omits personalised dashboard layout(s) for user(s): ${missingDashboardLayouts.slice(0, 8).join(', ')}`)
  }
  if (Array.isArray(incomingState.apiTokens) && Array.isArray(existingState.apiTokens)) {
    const missingTokens = missingIds(existingState.apiTokens, incomingState.apiTokens)
    if (missingTokens.length) errors.push(`Incoming state omits existing API token metadata record(s): ${missingTokens.slice(0, 8).join(', ')}`)
  }
  return errors
}

function courseImageDocId(batchId) {
  return crypto.createHash('sha256').update(String(batchId || '')).digest('hex')
}

function questionBankDocId(batchId) {
  return crypto.createHash('sha256').update(String(batchId || '')).digest('hex')
}

function normalizeQuestionBankQuestion(question) {
  if (!question || typeof question !== 'object') return null
  const questionId = String(question.questionId || question.id || '').trim()
  const importBatchId = String(question.importBatchId || '').trim()
  if (!questionId || !importBatchId) return null
  return {
    ...question,
    questionId,
    importBatchId,
  }
}

function normalizeProblemAttachments(attachments) {
  return (Array.isArray(attachments) ? attachments : [])
    .filter((attachment) => attachment && attachment.id && attachment.name && attachment.dataUrl)
    .map((attachment) => ({
      id: String(attachment.id).slice(0, 120),
      name: String(attachment.name).slice(0, 180),
      type: String(attachment.type || 'application/octet-stream').slice(0, 120),
      size: Math.max(0, Math.min(180_000, Number(attachment.size) || 0)),
      dataUrl: String(attachment.dataUrl).startsWith('data:') ? String(attachment.dataUrl).slice(0, 360_000) : '',
      createdAt: typeof attachment.createdAt === 'string' ? attachment.createdAt : new Date().toISOString(),
    }))
    .filter((attachment) => attachment.dataUrl)
    .slice(0, 2)
}

function normalizeBugAuditLog(log) {
  if (!log || typeof log !== 'object') return null
  const id = String(log.id || '').trim()
  const bugReportId = String(log.bugReportId || '').trim()
  if (!id || !bugReportId) return null
  const allowedStatuses = new Set([
    'Submitted',
    'New',
    'Under Review',
    'Needs More Information',
    'Accepted',
    'Approved for Investigation',
    'Investigation in Progress',
    'Fix Proposed',
    'Approved for Repair',
    'Repair in Progress',
    'Testing in Progress',
    'Fixed',
    'Fixed and Monitored',
    'Rejected',
    'Duplicate',
    'Escalated',
    'Closed',
    'Archived',
  ])
  const previousStatus = allowedStatuses.has(log.previousStatus) ? log.previousStatus : undefined
  const newStatus = allowedStatuses.has(log.newStatus) ? log.newStatus : undefined
  return {
    id,
    bugReportId,
    actorUserId: String(log.actorUserId || 'system').slice(0, 140),
    actorRole: ['super_admin', 'admin', 'employee'].includes(log.actorRole) ? log.actorRole : 'employee',
    action: String(log.action || 'Bug workflow updated').slice(0, 180),
    previousStatus,
    newStatus,
    notes: log.notes ? String(log.notes).slice(0, 1200) : undefined,
    createdAt: typeof log.createdAt === 'string' ? log.createdAt : new Date().toISOString(),
  }
}

function normalizeProblemReport(report) {
  if (!report || typeof report !== 'object') return null
  const id = String(report.id || '').trim()
  const reporterId = String(report.reporterId || '').trim()
  const title = String(report.title || '').trim().slice(0, 140)
  if (!id || !reporterId || !title) return null
  const severity = ['low', 'medium', 'high', 'critical'].includes(report.severity) ? report.severity : 'medium'
  const allowedStatuses = new Set([
    'Submitted',
    'New',
    'Under Review',
    'Needs More Information',
    'Accepted',
    'Approved for Investigation',
    'Investigation in Progress',
    'Fix Proposed',
    'Approved for Repair',
    'Repair in Progress',
    'Testing in Progress',
    'Fixed',
    'Fixed and Monitored',
    'Rejected',
    'Duplicate',
    'Escalated',
    'Closed',
    'Archived',
  ])
  const rawStatus = String(report.status || '').trim()
  const status = allowedStatuses.has(rawStatus)
    ? rawStatus
    : rawStatus === 'reviewing'
      ? 'Under Review'
      : rawStatus === 'resolved'
        ? 'Fixed'
        : 'New'
  return {
    id,
    reporterId,
    reporterUserId: report.reporterUserId ? String(report.reporterUserId).slice(0, 80) : undefined,
    reporterEmail: report.reporterEmail ? String(report.reporterEmail).slice(0, 160) : undefined,
    reporterName: String(report.reporterName || 'Unknown user').trim().slice(0, 160),
    reporterRole: ['super_admin', 'admin', 'employee'].includes(report.reporterRole) ? report.reporterRole : 'employee',
    view: String(report.view || 'unknown').trim().slice(0, 80),
    title,
    description: String(report.description || '').trim().slice(0, 2000),
    reportMode: report.reportMode === 'feedback' ? 'feedback' : 'bug',
    category: String(report.category || (report.reportMode === 'feedback' ? 'General comment' : 'Other bug')).trim().slice(0, 120),
    expectedBehaviour: String(report.expectedBehaviour || '').trim().slice(0, 1200),
    actualBehaviour: String(report.actualBehaviour || report.description || '').trim().slice(0, 2000),
    reproductionSteps: String(report.reproductionSteps || '').trim().slice(0, 1600),
    moduleName: String(report.moduleName || report.view || 'Unknown module').trim().slice(0, 120),
    affectedAreaId: report.affectedAreaId ? String(report.affectedAreaId).replace(/[<>]/g, '').trim().slice(0, 120) : undefined,
    affectedAreaText: report.affectedAreaText ? String(report.affectedAreaText).replace(/[<>]/g, '').trim().slice(0, 160) : undefined,
    currentRoute: report.currentRoute ? String(report.currentRoute).replace(/[<>]/g, '').trim().slice(0, 200) : undefined,
    currentPageTitle: report.currentPageTitle ? String(report.currentPageTitle).replace(/[<>]/g, '').trim().slice(0, 160) : undefined,
    browserInfo: report.browserInfo ? String(report.browserInfo).replace(/[<>]/g, '').trim().slice(0, 300) : undefined,
    deviceInfo: report.deviceInfo ? String(report.deviceInfo).replace(/[<>]/g, '').trim().slice(0, 160) : undefined,
    operatingSystemInfo: report.operatingSystemInfo ? String(report.operatingSystemInfo).replace(/[<>]/g, '').trim().slice(0, 160) : undefined,
    consoleError: report.consoleError ? String(report.consoleError).replace(/[<>]/g, '').trim().slice(0, 1200) : undefined,
    additionalComments: report.additionalComments ? String(report.additionalComments).replace(/[<>]/g, '').trim().slice(0, 1600) : undefined,
    pagePath: String(report.pagePath || report.url || '').slice(0, 500),
    userSeverity: ['low', 'medium', 'high', 'critical'].includes(report.userSeverity) ? report.userSeverity : severity,
    systemSuggestedSeverity: ['low', 'medium', 'high', 'critical'].includes(report.systemSuggestedSeverity) ? report.systemSuggestedSeverity : severity,
    adminSeverity: ['low', 'medium', 'high', 'critical'].includes(report.adminSeverity) ? report.adminSeverity : undefined,
    adminPriority: ['urgent', 'high', 'normal', 'low'].includes(report.adminPriority) ? report.adminPriority : 'normal',
    adminDecision: ['pending', 'accepted', 'duplicate', 'rejected', 'abuse', 'repair-approved', 'fixed'].includes(report.adminDecision) ? report.adminDecision : 'pending',
    pointsAwarded: Math.max(0, Number(report.pointsAwarded) || 0),
    pointsReason: report.pointsReason ? String(report.pointsReason).slice(0, 1000) : undefined,
    pointsAwardedAt: report.pointsAwardedAt ? String(report.pointsAwardedAt).slice(0, 80) : undefined,
    severity,
    status,
    createdAt: typeof report.createdAt === 'string' ? report.createdAt : new Date().toISOString(),
    updatedAt: typeof report.updatedAt === 'string' ? report.updatedAt : report.createdAt,
    url: String(report.url || '').slice(0, 500),
    userAgent: String(report.userAgent || '').slice(0, 500),
    syncState: String(report.syncState || 'unknown').slice(0, 40),
    diagnosticSnapshot: report.diagnosticSnapshot && typeof report.diagnosticSnapshot === 'object' ? report.diagnosticSnapshot : undefined,
    attachments: normalizeProblemAttachments(report.attachments),
    duplicateOf: report.duplicateOf ? String(report.duplicateOf).slice(0, 160) : undefined,
    assignedTo: report.assignedTo ? String(report.assignedTo).slice(0, 160) : undefined,
    adminNotes: Array.isArray(report.adminNotes) ? report.adminNotes.map((note) => String(note).slice(0, 1000)).slice(0, 50) : [],
    investigationSummary: report.investigationSummary ? String(report.investigationSummary).slice(0, 4000) : undefined,
    rootCause: report.rootCause ? String(report.rootCause).slice(0, 3000) : undefined,
    fixPlan: report.fixPlan ? String(report.fixPlan).slice(0, 4000) : undefined,
    filesAffected: Array.isArray(report.filesAffected) ? report.filesAffected.map((file) => String(file).slice(0, 260)).slice(0, 30) : [],
    testsPerformed: Array.isArray(report.testsPerformed) ? report.testsPerformed.map((test) => String(test).slice(0, 260)).slice(0, 30) : [],
    verificationResult: report.verificationResult ? String(report.verificationResult).slice(0, 3000) : undefined,
    riskReview: report.riskReview ? String(report.riskReview).slice(0, 3000) : undefined,
    deploymentRecommendation: report.deploymentRecommendation ? String(report.deploymentRecommendation).slice(0, 3000) : undefined,
    finalReport: report.finalReport ? String(report.finalReport).slice(0, 8000) : undefined,
    repairPrompt: report.repairPrompt ? String(report.repairPrompt).slice(0, 12000) : undefined,
    activeTestId: report.activeTestId ? String(report.activeTestId).slice(0, 160) : undefined,
    activeSessionId: report.activeSessionId ? String(report.activeSessionId).slice(0, 160) : undefined,
  }
}

function severityRank(report) {
  return { critical: 0, high: 1, medium: 2, low: 3 }[report.severity] ?? 4
}

function normalizeCourseImageUrl(value) {
  const url = String(value || '').trim()
  if (!url) return ''
  if (url.startsWith('data:image/')) return url
  if (url.startsWith('https://')) return url
  return ''
}

function isFeatureInventoryRequestAuthorized(req) {
  const userId = String(req.get('x-deap-user-id') || '').trim()
  const userEmail = String(req.get('x-deap-user-email') || '').trim().toLowerCase()
  const userRole = String(req.get('x-deap-user-role') || '').trim()
  const owner = String(req.get('x-deap-owner') || '').trim()
  return userId === 'U001' && userRole === 'super_admin' && owner === 'ayodeji_falope' && userEmail === 'admin@iicocece.com'
}

function isProblemReportFeedAuthorized(req) {
  return isFeatureInventoryRequestAuthorized(req)
}

async function writeProblemReportAccessLog(req, success, details = {}) {
  await problemReportAccessLogsRef.add({
    userId: String(req.get('x-deap-user-id') || ''),
    userEmail: String(req.get('x-deap-user-email') || ''),
    action: 'read_problem_report_feed',
    success,
    details,
    createdAt: new Date().toISOString(),
    ipAddress: req.ip || '',
    userAgent: req.get('user-agent') || '',
  })
}

function featureInventorySlug(value) {
  return String(value || 'feature').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 96)
}

function featureInventoryRecord(input, now, versionId) {
  return {
    id: featureInventorySlug(input.title),
    versionId,
    title: input.title,
    classification: input.classification,
    category: input.category,
    description: input.description,
    routePaths: input.routePaths || [],
    componentNames: input.componentNames || [],
    sourceFiles: input.sourceFiles || [],
    userRoles: input.userRoles || [],
    visibility: input.visibility,
    status: input.status || 'confirmed',
    confidenceScore: input.confidenceScore || 95,
    lastDetectedAt: now,
    firstDetectedAt: input.firstDetectedAt || now,
    relatedFeatures: input.relatedFeatures || [],
    exportTags: input.exportTags || [],
  }
}

function baseFeatureInventoryItems(now, versionId) {
  const f = (input) => featureInventoryRecord(input, now, versionId)
  return [
    ['Super Admin private Feature Inventory', 'specific', 'Super Admin tools', 'Ayodeji-only registry of detected features with scan history, exports, Firebase preservation, and local download support.', ['feature-inventory'], ['FeatureInventoryPanel'], ['src/App.tsx', 'functions/index.js'], ['super_admin'], 'super_admin', 100],
    ['Dashboard workspace', 'specific', 'Dashboard and workspace', 'Role-aware dashboard with metrics, assessment activity, contribution badge, user state, and operational summaries.', ['dashboard'], ['Dashboard'], ['src/App.tsx'], ['super_admin', 'admin', 'employee'], 'public_user', 100],
    ['Persistent personalised dashboard layout', 'generic', 'Dashboard and workspace', 'User-specific dashboard arrangement model with cloud-aware restoration and protected layout state.', ['dashboard'], ['Dashboard'], ['src/App.tsx'], ['super_admin', 'admin', 'employee'], 'public_user', 88, 'strongly_implied'],
    ['Training content portal', 'specific', 'Learning content', 'Learning management workspace for imported question banks, course images, content modules, and deployment visibility.', ['training'], ['TrainingPortal'], ['src/App.tsx'], ['super_admin', 'admin'], 'admin', 100],
    ['Question Bank management', 'specific', 'Assessment authoring', 'Question import, metadata management, deletion preservation, bundled banks, and export support.', ['questions'], ['QuestionBank'], ['src/App.tsx'], ['super_admin', 'admin'], 'admin', 100],
    ['Assessment lifecycle management', 'specific', 'Tests and assessments', 'Create, schedule, launch, archive, lock, and preserve assessment status across updates.', ['tests'], ['TestsPanel'], ['src/App.tsx'], ['super_admin', 'admin'], 'admin', 100],
    ['Employee assessment taking flow', 'specific', 'Tests and assessments', 'Employee test launch, answer capture, timed progression, hints, reveals, and final result calculation.', ['my-tests', 'taking-test', 'result'], ['MyTests', 'TestTakingView', 'ResultView'], ['src/App.tsx'], ['employee'], 'public_user', 100],
    ['Per-test Results button', 'specific', 'Reports and analytics', 'Each launched or taken test exposes a Results action for that particular assessment attempt.', ['my-tests', 'my-results'], ['MyTests', 'MyResults'], ['src/App.tsx'], ['employee', 'admin', 'super_admin'], 'public_user', 96],
    ['All Employees reports default', 'specific', 'Reports and analytics', 'Reports selector defaults to All Employees and renders all employee reports down the page.', ['reports'], ['ReportsPanel'], ['src/App.tsx'], ['super_admin', 'admin'], 'admin', 95],
    ['AI Analytics dashboard', 'specific', 'Reports and analytics', 'AI-assisted analytics workspace with recommendations, performance interpretation, and risk signals.', ['analytics'], ['AnalyticsPanel'], ['src/App.tsx', 'functions/index.js'], ['super_admin', 'admin'], 'admin', 96],
    ['Employee management and permissions', 'specific', 'Authentication and access', 'User directory, role management, permission assignment, credential export, and access control surfaces.', ['employees'], ['EmployeesPanel'], ['src/App.tsx'], ['super_admin', 'admin'], 'admin', 100],
    ['Super Admin Bug Reports gateway', 'specific', 'Feedback and bug reporting', 'Controlled bug review, approval, audit, repair-status, and Super Admin governance workflow.', ['bug-reports'], ['SuperAdminBugReports'], ['src/App.tsx'], ['super_admin'], 'super_admin', 100],
    ['Gamified Bug Report and Feedback tab', 'specific', 'Feedback and bug reporting', 'Authenticated users submit bugs or feedback, attach evidence, and receive contribution points and badges.', ['bug-feedback'], ['BugReportFeedbackCenter'], ['src/App.tsx'], ['super_admin', 'admin', 'employee'], 'public_user', 100],
    ['Contribution points and badge system', 'generic', 'Gamification', 'Contribution point ledger, badge progression, useful report scoring, duplicate handling, and dashboard badge display.', ['dashboard', 'bug-feedback'], ['ContributionBadgeCard'], ['src/App.tsx'], ['super_admin', 'admin', 'employee'], 'public_user', 95],
    ['Notification and activity ledger', 'generic', 'Notifications', 'Super Admin notification area and audit-oriented activity visibility for important app events.', ['notifications'], ['NotificationsPanel'], ['src/App.tsx'], ['super_admin'], 'super_admin', 92],
    ['Settings and branding controls', 'generic', 'Settings', 'Application configuration controls including branding, layout width, accessibility preferences, and feature toggles.', ['settings'], ['SettingsPanel'], ['src/App.tsx'], ['super_admin', 'admin'], 'admin', 92],
    ['Learning and Help centre', 'generic', 'Help and support', 'Contextual help and learning support route for all authenticated users.', ['help'], ['HelpCenter'], ['src/App.tsx'], ['super_admin', 'admin', 'employee'], 'public_user', 94],
    ['API capability inventory export', 'generic', 'Export and printing', 'Downloadable API capability inventory for system governance and integration review.', ['settings'], ['ApiCapabilityInventory'], ['src/App.tsx'], ['super_admin'], 'super_admin', 92],
    ['Firebase shared state synchronisation', 'generic', 'Data management', 'Serverless API preserving shared LMS state with destructive-change detection and Firestore storage.', ['/api/deap-state'], ['deapState'], ['functions/index.js'], ['system'], 'system_only', 100],
    ['Course image registry', 'generic', 'File upload and download', 'Dedicated course image persistence endpoint to avoid losing training visuals during deployments.', ['/api/deap-course-images'], ['deapCourseImages'], ['functions/index.js'], ['super_admin', 'admin'], 'admin', 100],
    ['Question bank Firestore registry', 'specific', 'Data management', 'Persistent question bank storage separate from local browser state, with metadata and deletion preservation.', ['/api/deap-question-banks'], ['deapQuestionBanks'], ['functions/index.js'], ['super_admin', 'admin'], 'admin', 100],
    ['Problem report API feed', 'generic', 'Feedback and bug reporting', 'Read-only support feed endpoint exposing submitted reports to authorised operational tooling.', ['/api/deap-problem-reports'], ['deapProblemReports'], ['functions/index.js'], ['super_admin'], 'super_admin', 95],
    ['Token introspection and API governance', 'generic', 'Security and permissions', 'Super Admin API token registry and introspection workflow for controlled automation access.', ['/api/deap-token/introspect'], ['deapTokenIntrospection'], ['functions/index.js'], ['super_admin'], 'super_admin', 95],
    ['Continuity snapshot and verification scripts', 'generic', 'Backup and recovery', 'Pre/post deployment continuity scripts protecting users, tests, sessions, reports, analytics, content, and bug data.', ['scripts'], ['continuity:snapshot', 'continuity:verify'], ['package.json', 'scripts'], ['system'], 'system_only', 92],
    ['Soft delete and trash preservation model', 'generic', 'Data management', 'Recoverability-first model for deleted, archived, hidden, and deprecated user data.', ['settings', 'functions'], ['trashRecords'], ['src/App.tsx', 'functions/index.js'], ['super_admin'], 'super_admin', 86, 'strongly_implied'],
    ['Theme, font scale, and accessibility controls', 'generic', 'Accessibility', 'Theme toggle, font scaling, focus-friendly controls, and responsive sidebar appearance controls.', ['global shell'], ['AppearanceControls'], ['src/App.tsx', 'src/App.css'], ['super_admin', 'admin', 'employee'], 'public_user', 95],
    ['Responsive sidebar navigation', 'generic', 'Navigation and layout', 'Role-aware responsive navigation with admin, employee, universal, and participation routes.', ['global shell'], ['Sidebar'], ['src/App.tsx', 'src/App.css'], ['super_admin', 'admin', 'employee'], 'public_user', 100],
    ['3D application icon system', 'generic', 'Visual design patterns', 'Theme-compatible boxed 3D SVG icon family used across navigation, metrics, pages, cards, and empty states.', ['global shell'], ['DeapIcon'], ['src/App.tsx', 'src/App.css'], ['super_admin', 'admin', 'employee'], 'public_user', 95],
    ['Responsive accordion-ready content model', 'generic', 'Forms and inputs', 'Accordion and collapsible content patterns for dense administrative and reporting interfaces.', ['multiple'], ['Collapsible sections'], ['src/App.tsx', 'src/App.css'], ['super_admin', 'admin', 'employee'], 'public_user', 78, 'strongly_implied'],
    ['Report and analytics data preservation', 'specific', 'Data preservation', 'Reports, analytics, progress, score, and attempt data protected from accidental reset or overwrite during app changes.', ['reports', 'analytics'], ['ReportsPanel', 'AnalyticsPanel'], ['src/App.tsx', 'functions/index.js'], ['super_admin', 'admin'], 'admin', 94],
    ['Authentication login workflow', 'generic', 'Authentication and access', 'Role-aware login and route redirection workflow for Super Admin, admins, and employees.', ['login'], ['LoginView'], ['src/App.tsx'], ['super_admin', 'admin', 'employee'], 'public_user', 100],
    ['Search and filtering controls', 'generic', 'Search and filtering', 'Reusable search boxes, select filters, table filters, and report selectors across the application.', ['questions', 'reports', 'bug-reports', 'feature-inventory'], ['DataTable', 'search-box'], ['src/App.tsx', 'src/App.css'], ['super_admin', 'admin', 'employee'], 'public_user', 92],
    ['Data tables and enterprise lists', 'generic', 'Tables and lists', 'Reusable dense DataTable component for reports, users, bug reports, versions, and inventory records.', ['multiple'], ['DataTable'], ['src/App.tsx'], ['super_admin', 'admin', 'employee'], 'public_user', 100],
    ['Export utilities', 'generic', 'Export and printing', 'Browser-safe JSON, CSV, XLSX, HTML, DOCX, PDF-like, Markdown, and TXT export helpers.', ['reports', 'settings', 'feature-inventory'], ['downloadJsonFile', 'downloadTextFile', 'loadSpreadsheetTools'], ['src/App.tsx'], ['super_admin', 'admin'], 'admin', 96],
  ].map(([title, classification, category, description, routePaths, componentNames, sourceFiles, userRoles, visibility, confidenceScore, status]) =>
    f({ title, classification, category, description, routePaths, componentNames, sourceFiles, userRoles, visibility, confidenceScore, status }),
  )
}

async function latestFeatureInventoryVersion() {
  const snapshot = await featureInventoryVersionsRef.orderBy('createdAt', 'desc').limit(1).get()
  if (snapshot.empty) return null
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() }
}

function featureSignature(item) {
  return JSON.stringify({
    title: item.title,
    classification: item.classification,
    category: item.category,
    description: item.description,
    routePaths: item.routePaths,
    componentNames: item.componentNames,
    sourceFiles: item.sourceFiles,
    userRoles: item.userRoles,
    visibility: item.visibility,
    status: item.status,
  })
}

async function createFeatureInventoryVersion({ createdBy = 'scheduled_scan', createdByUserId } = {}) {
  const now = new Date().toISOString()
  const previous = await latestFeatureInventoryVersion()
  const versionNumber = Number(previous?.versionNumber || 0) + 1
  const versionId = `feature-inventory-${now.replace(/[-:.]/g, '').slice(0, 15)}-v${String(versionNumber).padStart(4, '0')}`
  const items = baseFeatureInventoryItems(now, versionId)
  let addedCount = items.length
  let removedCount = 0
  let changedCount = 0
  let unchangedCount = 0
  if (previous?.id) {
    const previousSnapshot = await featureInventoryItemsRef.where('versionId', '==', previous.id).get()
    const previousMap = new Map(previousSnapshot.docs.map((doc) => [doc.data().id || doc.id, featureSignature(doc.data())]))
    const currentIds = new Set(items.map((item) => item.id))
    addedCount = items.filter((item) => !previousMap.has(item.id)).length
    removedCount = Array.from(previousMap.keys()).filter((id) => !currentIds.has(id)).length
    items.forEach((item) => {
      if (!previousMap.has(item.id)) return
      if (previousMap.get(item.id) === featureSignature(item)) unchangedCount += 1
      else changedCount += 1
    })
  }
  const version = {
    id: versionId,
    versionNumber,
    createdAt: now,
    createdBy,
    createdByUserId: createdByUserId || null,
    totalFeatureCount: items.length,
    specificFeatureCount: items.filter((item) => item.classification === 'specific').length,
    genericFeatureCount: items.filter((item) => item.classification === 'generic').length,
    addedCount,
    removedCount,
    changedCount,
    unchangedCount,
    scanStatus: 'complete',
    formatsGenerated: [],
    firebaseStoragePaths: {},
    notes: 'Generated by secure feature inventory scanner.',
  }
  const batch = db.batch()
  batch.set(featureInventoryVersionsRef.doc(versionId), version)
  items.forEach((item) => batch.set(featureInventoryItemsRef.doc(`${versionId}_${item.id}`), item))
  batch.set(featureInventoryScanLogsRef.doc(), {
    versionId,
    createdAt: now,
    createdBy,
    status: 'complete',
    message: `Feature scan completed with ${items.length} detected feature(s).`,
  })
  await batch.commit()
  return { version, items }
}

async function getFeatureInventoryPayload(versionId) {
  let versionSnapshot = versionId ? await featureInventoryVersionsRef.doc(versionId).get() : null
  if (!versionSnapshot || !versionSnapshot.exists) {
    const latest = await latestFeatureInventoryVersion()
    if (!latest) {
      const created = await createFeatureInventoryVersion({ createdBy: 'scheduled_scan' })
      versionSnapshot = await featureInventoryVersionsRef.doc(created.version.id).get()
    } else {
      versionSnapshot = await featureInventoryVersionsRef.doc(latest.id).get()
    }
  }
  const version = { id: versionSnapshot.id, ...versionSnapshot.data() }
  const [itemsSnapshot, versionsSnapshot, logsSnapshot, exportsSnapshot] = await Promise.all([
    featureInventoryItemsRef.where('versionId', '==', version.id).get(),
    featureInventoryVersionsRef.orderBy('createdAt', 'desc').limit(20).get(),
    featureInventoryScanLogsRef.orderBy('createdAt', 'desc').limit(20).get(),
    featureInventoryExportsRef.orderBy('createdAt', 'desc').limit(20).get(),
  ])
  return {
    generatedAt: new Date().toISOString(),
    version,
    items: itemsSnapshot.docs.map((doc) => ({ id: doc.data().id || doc.id, ...doc.data() })).sort((left, right) => left.title.localeCompare(right.title)),
    versions: versionsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
    scanLogs: logsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
    exports: exportsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
  }
}

async function writeFeatureInventoryAccessLog(req, action, success, details = {}) {
  await featureInventoryAccessLogsRef.add({
    userId: String(req.get('x-deap-user-id') || ''),
    userEmail: String(req.get('x-deap-user-email') || ''),
    action,
    success,
    details,
    createdAt: new Date().toISOString(),
    ipAddress: req.ip || '',
    userAgent: req.get('user-agent') || '',
  })
}

exports.deapFeatureInventory = onRequest(
  {
    region: 'us-central1',
    timeoutSeconds: 300,
    memory: '512MiB',
    invoker: 'public',
  },
  async (req, res) => {
    setCors(req, res, 'GET, POST, OPTIONS')
    if (req.method === 'OPTIONS') {
      res.status(204).send('')
      return
    }
    const requestPath = `${req.path || ''} ${req.originalUrl || ''} ${req.url || ''}`
    const action = requestPath.includes('/download') ? 'download' : requestPath.includes('/refresh') ? 'refresh' : requestPath.includes('/export') ? 'export' : 'read'
    if (!isFeatureInventoryRequestAuthorized(req)) {
      await writeFeatureInventoryAccessLog(req, action, false, { reason: 'unauthorised' }).catch(() => undefined)
      res.status(403).json({ error: 'Feature Inventory is restricted to Ayodeji Falope Super Admin.' })
      return
    }
    try {
      if (req.method === 'GET' && action === 'download') {
        const exportIdFromPath = requestPath.match(/export\/([^/\s?]+)\/download/)?.[1]
        const exportId = String(req.query.exportId || exportIdFromPath || '').trim()
        if (!exportId) {
          res.status(400).json({ error: 'exportId is required.' })
          return
        }
        const exportSnapshot = await featureInventoryExportsRef.doc(exportId).get()
        if (!exportSnapshot.exists) {
          res.status(404).json({ error: 'Export not found.' })
          return
        }
        const exportData = exportSnapshot.data()
        const bucket = admin.storage().bucket()
        const signedUrls = {}
        for (const [format, storagePath] of Object.entries(exportData.storagePaths || {})) {
          const [url] = await bucket.file(storagePath).getSignedUrl({
            action: 'read',
            expires: Date.now() + 15 * 60 * 1000,
          })
          signedUrls[format] = url
        }
        await writeFeatureInventoryAccessLog(req, 'download', true, { exportId })
        res.json({ id: exportId, ...exportData, signedUrls })
        return
      }
      if (req.method === 'GET') {
        await writeFeatureInventoryAccessLog(req, 'read', true)
        res.json(await getFeatureInventoryPayload(req.query.versionId ? String(req.query.versionId) : undefined))
        return
      }
      if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' })
        return
      }
      if (action === 'refresh') {
        const created = await createFeatureInventoryVersion({
          createdBy: 'manual_refresh',
          createdByUserId: String(req.get('x-deap-user-id') || ''),
        })
        await writeFeatureInventoryAccessLog(req, 'refresh', true, { versionId: created.version.id })
        res.json(await getFeatureInventoryPayload(created.version.id))
        return
      }
      if (action === 'export') {
        const versionId = String(req.body?.versionId || '').trim()
        const exportFiles = Array.isArray(req.body?.exportFiles) ? req.body.exportFiles.slice(0, 16) : []
        if (!versionId || !exportFiles.length) {
          res.status(400).json({ error: 'versionId and exportFiles are required.' })
          return
        }
        const createdAt = new Date().toISOString()
        const storagePaths = {}
        const fileNames = []
        const bucket = admin.storage().bucket()
        for (const file of exportFiles) {
          const format = String(file.format || '').replace(/[^a-z0-9]/gi, '').toLowerCase()
          const safeFormat = format || 'txt'
          const rawFileName = String(file.fileName || `feature-inventory.${safeFormat}`).replace(new RegExp(`\\.${safeFormat}$`, 'i'), '')
          const safeFileName = `${featureInventorySlug(rawFileName) || 'feature-inventory'}.${safeFormat}`
          const storagePath = `private_feature_inventory/${versionId}/${safeFileName}`
          const buffer = Buffer.from(String(file.contentBase64 || ''), 'base64')
          await bucket.file(storagePath).save(buffer, {
            metadata: {
              contentType: String(file.mimeType || 'application/octet-stream'),
              metadata: {
                versionId,
                createdBy: 'ayodeji_falope',
                private: 'true',
              },
            },
          })
          storagePaths[format] = storagePath
          fileNames.push(safeFileName)
        }
        const exportRecord = {
          versionId,
          createdAt,
          formats: Object.keys(storagePaths),
          fileNames,
          storagePaths,
          itemCount: Math.max(0, Number(req.body?.itemCount) || 0),
          status: 'complete',
        }
        await featureInventoryExportsRef.add(exportRecord)
        await featureInventoryVersionsRef.doc(versionId).set(
          {
            formatsGenerated: admin.firestore.FieldValue.arrayUnion(...Object.keys(storagePaths)),
            firebaseStoragePaths: storagePaths,
          },
          { merge: true },
        )
        await writeFeatureInventoryAccessLog(req, 'export', true, { versionId, formats: Object.keys(storagePaths) })
        res.json(await getFeatureInventoryPayload(versionId))
        return
      }
      res.status(400).json({ error: 'Unsupported feature inventory action.' })
    } catch (error) {
      await writeFeatureInventoryAccessLog(req, action, false, { error: error.message }).catch(() => undefined)
      res.status(500).json({ error: 'Feature inventory operation failed.', detail: error.message })
    }
  },
)

exports.deapFeatureInventoryDailyScan = onSchedule(
  {
    region: 'us-central1',
    schedule: 'every day 02:30',
    timeZone: 'Africa/Lagos',
    timeoutSeconds: 300,
    memory: '512MiB',
  },
  async () => {
    await createFeatureInventoryVersion({ createdBy: 'scheduled_scan' })
  },
)

exports.deapState = onRequest(
  {
    region: 'us-central1',
    timeoutSeconds: 60,
    memory: '512MiB',
    invoker: 'public',
  },
  async (req, res) => {
    setCors(req, res, 'GET, POST, OPTIONS')
    if (req.method === 'OPTIONS') {
      res.status(204).send('')
      return
    }
    try {
      if (req.method === 'GET') {
        const snapshot = await sharedStateRef.get()
        res.json({ state: snapshot.exists ? readSharedStateFromDocument(snapshot.data()) : null })
        return
      }
      if (req.method !== 'POST') {
        res.status(405).json({ error: 'Use GET or POST for DEAP shared state.' })
        return
      }
      const payload = JSON.stringify(req.body ?? {})
      if (payload.length > 1_500_000) {
        res.status(413).json({ error: 'Shared state payload is too large.' })
        return
      }
      const snapshot = await sharedStateRef.get()
      const existingState = snapshot.exists ? readSharedStateFromDocument(snapshot.data()) : null
      const incomingState = pickSharedStateFields(req.body?.state)
      const continuityErrors = criticalContinuityErrors(existingState, incomingState)
      if (continuityErrors.length) {
        res.status(409).json({
          error: 'Continuity guard blocked this shared-state write because it could remove live production records.',
          details: continuityErrors,
        })
        return
      }
      const state = {
        ...(existingState && typeof existingState === 'object' ? pickSharedStateFields(existingState) : {}),
        ...incomingState,
      }
      state.updatedAt = typeof state.updatedAt === 'string' ? state.updatedAt : new Date().toISOString()
      await sharedStateRef.set(
        {
          stateJson: JSON.stringify(state),
          updatedAt: state.updatedAt,
        },
        { merge: true },
      )
      res.json({ ok: true, updatedAt: state.updatedAt })
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Shared state request failed.' })
    }
  },
)

exports.deapCourseImages = onRequest(
  {
    region: 'us-central1',
    timeoutSeconds: 60,
    memory: '512MiB',
    invoker: 'public',
  },
  async (req, res) => {
    setCors(req, res, 'GET, POST, OPTIONS')
    if (req.method === 'OPTIONS') {
      res.status(204).send('')
      return
    }
    try {
      if (req.method === 'GET') {
        const snapshot = await courseImagesRef.limit(1000).get()
        const images = {}
        snapshot.forEach((doc) => {
          const data = doc.data() || {}
          const batchId = String(data.batchId || '').trim()
          const courseImageUrl = normalizeCourseImageUrl(data.courseImageUrl)
          if (batchId && courseImageUrl) {
            images[batchId] = {
              courseImageUrl,
              updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : undefined,
            }
          }
        })
        res.json({ images })
        return
      }
      if (req.method !== 'POST') {
        res.status(405).json({ error: 'Use GET or POST for DEAP course images.' })
        return
      }
      const batchId = String(req.body?.batchId || '').trim()
      const courseImageUrl = normalizeCourseImageUrl(req.body?.courseImageUrl)
      const updatedAt = typeof req.body?.updatedAt === 'string' ? req.body.updatedAt : new Date().toISOString()
      if (!batchId) {
        res.status(400).json({ error: 'Missing question bank id for course image.' })
        return
      }
      if (!courseImageUrl) {
        res.status(400).json({ error: 'Missing course image.' })
        return
      }
      if (JSON.stringify(req.body || {}).length > 950_000) {
        res.status(413).json({ error: 'Course image payload is too large.' })
        return
      }
      await courseImagesRef.doc(courseImageDocId(batchId)).set(
        {
          batchId,
          courseImageUrl,
          updatedAt,
        },
        { merge: true },
      )
      res.json({ ok: true, batchId, updatedAt })
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Course image request failed.' })
    }
  },
)

exports.deapQuestionBanks = onRequest(
  {
    region: 'us-central1',
    timeoutSeconds: 120,
    memory: '1GiB',
    invoker: 'public',
  },
  async (req, res) => {
    setCors(req, res, 'GET, POST, OPTIONS')
    if (req.method === 'OPTIONS') {
      res.status(204).send('')
      return
    }
    try {
      if (req.method === 'GET') {
        const rawBatchIds = Array.isArray(req.query.batchId) ? req.query.batchId : req.query.batchId ? [req.query.batchId] : []
        const batchIds = rawBatchIds.map((batchId) => String(batchId || '').trim()).filter(Boolean)
        if (!batchIds.length) {
          const snapshot = await questionBanksRef.limit(250).get()
          const banks = []
          snapshot.forEach((doc) => {
            const data = doc.data() || {}
            banks.push({
              batchId: String(data.batchId || ''),
              updatedAt: data.updatedAt,
              questionCount: Number(data.questionCount || 0),
              chunkCount: Number(data.chunkCount || 0),
              questions: [],
            })
          })
          res.json({ banks })
          return
        }

        const banks = []
        for (const batchId of batchIds) {
          const bankRef = questionBanksRef.doc(questionBankDocId(batchId))
          const bankSnapshot = await bankRef.get()
          if (!bankSnapshot.exists) {
            banks.push({ batchId, questions: [], questionCount: 0, chunkCount: 0 })
            continue
          }
          const bank = bankSnapshot.data() || {}
          const activeVersion = String(bank.activeVersion || '')
          const chunkSnapshot = await bankRef.collection('chunks').get()
          const chunks = []
          chunkSnapshot.forEach((doc) => {
            const data = doc.data() || {}
            if (String(data.version || '') !== activeVersion) return
            chunks.push({
              index: Number(data.index || 0),
              questions: Array.isArray(data.questions) ? data.questions : [],
            })
          })
          chunks.sort((left, right) => left.index - right.index)
          banks.push({
            batchId,
            updatedAt: bank.updatedAt,
            questionCount: Number(bank.questionCount || 0),
            chunkCount: Number(bank.chunkCount || chunks.length),
            questions: chunks.flatMap((chunk) => chunk.questions).map(normalizeQuestionBankQuestion).filter(Boolean),
          })
        }
        res.json({ banks })
        return
      }

      if (req.method !== 'POST') {
        res.status(405).json({ error: 'Use GET or POST for DEAP question banks.' })
        return
      }
      const payloadSize = JSON.stringify(req.body || {}).length
      if (payloadSize > 8_000_000) {
        res.status(413).json({ error: 'Question bank payload is too large.' })
        return
      }
      const batchId = String(req.body?.batchId || '').trim()
      const updatedAt = typeof req.body?.updatedAt === 'string' ? req.body.updatedAt : new Date().toISOString()
      const questions = (Array.isArray(req.body?.questions) ? req.body.questions : [])
        .map(normalizeQuestionBankQuestion)
        .filter((question) => question && question.importBatchId === batchId)
      if (!batchId) {
        res.status(400).json({ error: 'Missing question bank id.' })
        return
      }
      if (!questions.length) {
        res.status(400).json({ error: 'No valid questions supplied for this question bank.' })
        return
      }

      const version = crypto.createHash('sha256').update(`${batchId}:${updatedAt}:${questions.length}:${Date.now()}`).digest('hex')
      const chunkSize = 50
      const chunks = []
      for (let index = 0; index < questions.length; index += chunkSize) {
        chunks.push(questions.slice(index, index + chunkSize))
      }
      const bankRef = questionBanksRef.doc(questionBankDocId(batchId))
      const batch = db.batch()
      batch.set(
        bankRef,
        {
          batchId,
          activeVersion: version,
          questionCount: questions.length,
          chunkCount: chunks.length,
          updatedAt,
        },
        { merge: true },
      )
      chunks.forEach((chunk, index) => {
        batch.set(bankRef.collection('chunks').doc(`${version}-${String(index).padStart(4, '0')}`), {
          version,
          index,
          questionCount: chunk.length,
          questions: chunk,
          updatedAt,
        })
      })
      await batch.commit()
      res.json({ ok: true, batchId, questionCount: questions.length, chunkCount: chunks.length, updatedAt })
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Question bank request failed.' })
    }
  },
)

exports.deapProblemReports = onRequest(
  {
    region: 'us-central1',
    timeoutSeconds: 30,
    memory: '256MiB',
    invoker: 'public',
  },
  async (req, res) => {
    setCors(req, res, 'GET, OPTIONS')
    if (req.method === 'OPTIONS') {
      res.status(204).send('')
      return
    }
    if (req.method !== 'GET') {
      res.status(405).json({ error: 'Use GET for DEAP problem reports.' })
      return
    }
    if (!isProblemReportFeedAuthorized(req)) {
      await writeProblemReportAccessLog(req, false, { reason: 'unauthorised' }).catch(() => undefined)
      res.status(403).json({ error: 'Problem report feed is restricted to Ayodeji Falope Super Admin.' })
      return
    }
    try {
      const snapshot = await sharedStateRef.get()
      const state = snapshot.exists ? readSharedStateFromDocument(snapshot.data()) : null
      const reports = (Array.isArray(state?.problemReports) ? state.problemReports : [])
        .map(normalizeProblemReport)
        .filter(Boolean)
        .sort((left, right) => severityRank(left) - severityRank(right) || Date.parse(right.createdAt) - Date.parse(left.createdAt))
      const terminalStatuses = new Set(['Fixed', 'Fixed and Monitored', 'Rejected', 'Duplicate', 'Closed', 'Archived'])
      const requestedStatus = String(req.query.status || 'Approved for Investigation').trim()
      const codexReadyStatuses = new Set(['Approved for Investigation', 'Investigation in Progress', 'Fix Proposed', 'Approved for Repair', 'Repair in Progress', 'Testing in Progress'])
      const filteredReports = requestedStatus.toLowerCase() === 'all'
        ? reports
        : requestedStatus === 'Approved for Investigation'
          ? reports.filter((report) => codexReadyStatuses.has(report.status))
        : reports.filter((report) => report.status === requestedStatus)
      await writeProblemReportAccessLog(req, true, { requestedStatus, returnedCount: filteredReports.length, totalCount: reports.length }).catch(() => undefined)
      res.json({
        generatedAt: new Date().toISOString(),
        monitor: 'codex-problem-report-intake',
        source: 'deap-shared-state',
        totalCount: reports.length,
        openCount: reports.filter((report) => !terminalStatuses.has(report.status)).length,
        reports: filteredReports,
      })
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Problem report request failed.' })
    }
  },
)

function hashTokenSecret(value) {
  return crypto.createHash('sha256').update(value).digest('hex')
}

function bearerTokenFromRequest(req) {
  const authorization = String(req.get('authorization') || '')
  if (authorization.toLowerCase().startsWith('bearer ')) return authorization.slice(7).trim()
  return String(req.body?.token || '').trim()
}

function safeTokenLogValue(value, maxLength = 180) {
  return String(value || '')
    .replace(/[<>]/g, '')
    .replace(/[\r\n\t]+/g, ' ')
    .trim()
    .slice(0, maxLength)
}

function tokenRiskLevel(token) {
  const now = Date.now()
  const expiresAt = token?.expiresAt ? Date.parse(token.expiresAt) : 0
  const rotationDue = token?.nextRotationDueAt ? Date.parse(token.nextRotationDueAt) : 0
  const scopes = Array.isArray(token?.scopes) ? token.scopes : []
  const deployments = Array.isArray(token?.deploymentRecords) ? token.deploymentRecords : []
  const logs = Array.isArray(token?.usageLogs) ? token.usageLogs : []
  if (token?.kind === 'super' || (Number.isFinite(expiresAt) && expiresAt < now) || logs.some((log) => ['denied', 'failed', 'expired', 'revoked', 'rate_limited'].includes(log?.outcome))) return 'critical'
  if (!token?.ownerId || !deployments.length || (Number.isFinite(rotationDue) && rotationDue < now)) return 'high'
  if (scopes.length > 8 || !token?.lastUsedAt) return 'medium'
  return 'low'
}

exports.deapTokenIntrospection = onRequest(
  {
    region: 'us-central1',
    timeoutSeconds: 30,
    memory: '256MiB',
    invoker: 'public',
  },
  async (req, res) => {
    setCors(req, res)
    if (req.method === 'OPTIONS') {
      res.status(204).send('')
      return
    }
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Use POST for DEAP token introspection.' })
      return
    }

    const tokenSecret = bearerTokenFromRequest(req)
    if (!tokenSecret) {
      res.status(401).json({ active: false, error: 'Bearer token is required.' })
      return
    }

    try {
      const snapshot = await sharedStateRef.get()
      const state = snapshot.exists ? readSharedStateFromDocument(snapshot.data()) : null
      const tokenHash = hashTokenSecret(tokenSecret)
      const tokens = Array.isArray(state?.apiTokens)
        ? state.apiTokens.filter((candidate) => {
            const createdAt = candidate?.createdAt ? Date.parse(candidate.createdAt) : 0
            return Number.isFinite(createdAt) && createdAt >= apiTokenRegistryResetAt
          })
        : []
      const token = tokens.find((candidate) => candidate?.tokenHash === tokenHash)
      const now = Date.now()
      const expiresAt = token?.expiresAt ? new Date(token.expiresAt).getTime() : 0
      const active = Boolean(token && token.status === 'active' && expiresAt > now)
      const requiredScope = String(req.body?.requiredScope || '').trim()
      const scopes = Array.isArray(token?.scopes) ? token.scopes : []
      const allowed = active && (!requiredScope || scopes.includes(requiredScope))
      const failureReason = !token
        ? 'token_not_found'
        : token.status === 'revoked'
          ? 'token_revoked'
          : token.status === 'archived'
            ? 'token_archived'
            : expiresAt <= now
              ? 'token_expired'
              : requiredScope && !scopes.includes(requiredScope)
                ? 'missing_required_scope'
                : undefined

      if (token && state) {
        try {
          const timestamp = new Date().toISOString()
          const usageLog = {
            id: `usage_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
            tokenId: token.id,
            endpoint: safeTokenLogValue(req.body?.endpoint || req.path || '/api/deap-token/introspect', 240),
            method: safeTokenLogValue(req.body?.method || req.method || 'POST', 12).toUpperCase(),
            module: safeTokenLogValue(req.body?.module || 'Token introspection', 120),
            environment: safeTokenLogValue(req.body?.environment || 'production', 80),
            ipAddress: safeTokenLogValue(req.get('x-forwarded-for') || req.ip || '', 80),
            userAgent: safeTokenLogValue(req.get('user-agent') || '', 200),
            timestamp,
            outcome: allowed ? 'allowed' : token.status === 'revoked' ? 'revoked' : expiresAt <= now ? 'expired' : 'denied',
            responseStatus: allowed ? 200 : 401,
            failureReason,
          }
          const nextTokens = tokens.map((candidate) => {
            if (candidate?.id !== token.id) return candidate
            const existingLogs = Array.isArray(candidate.usageLogs) ? candidate.usageLogs : []
            const nextUsageLogs = [usageLog, ...existingLogs].slice(0, 80)
            const nextUsageCount = Math.max(0, Number(candidate.usageCount || 0)) + 1
            return {
              ...candidate,
              usageCount: nextUsageCount,
              firstUsedAt: candidate.firstUsedAt || timestamp,
              lastUsedAt: timestamp,
              usageLogs: nextUsageLogs,
              riskLevel: tokenRiskLevel({ ...candidate, usageCount: nextUsageCount, lastUsedAt: timestamp, usageLogs: nextUsageLogs }),
            }
          })
          const nextState = {
            ...state,
            apiTokens: nextTokens,
            updatedAt: timestamp,
          }
          await sharedStateRef.set(
            {
              stateJson: JSON.stringify(nextState),
              updatedAt: timestamp,
            },
            { merge: true },
          )
        } catch (logError) {
          console.error('Token usage log failed', logError)
        }
      }

      res.status(allowed ? 200 : 401).json({
        active,
        allowed,
        requiredScope: requiredScope || undefined,
        token: token
          ? {
              id: token.id,
              name: token.name,
              kind: token.kind,
              fingerprint: token.tokenFingerprint,
              scopes,
              accessTier: token.kind === 'super' ? 'SUPER_ADMIN' : 'CUSTOM',
              createdAt: token.createdAt,
              expiresAt: token.expiresAt,
              auditLogging: token.auditLogging !== false,
              oauthProfile: Boolean(token.oauthProfile),
            }
          : undefined,
      })
    } catch (error) {
      res.status(500).json({ active: false, error: error instanceof Error ? error.message : 'Token introspection failed.' })
    }
  },
)

function trimPayload(payload) {
  const cloned = JSON.parse(JSON.stringify(payload))
  while (JSON.stringify(cloned).length > 150000) {
    const samples = cloned.questionBankContext?.relevantQuestionSamples
    if (Array.isArray(samples) && samples.length > 8) {
      cloned.questionBankContext.relevantQuestionSamples = samples.slice(0, Math.ceil(samples.length / 2))
      continue
    }
    const history = cloned.chatHistory
    if (Array.isArray(history) && history.length > 4) {
      cloned.chatHistory = history.slice(Math.floor(history.length / 2))
      continue
    }
    const trend = cloned.analytics?.trend
    if (Array.isArray(trend) && trend.length > 10) {
      cloned.analytics.trend = trend.slice(-10)
      continue
    }
    break
  }
  return cloned
}

exports.analyticsIntelligence = onRequest(
  {
    region: 'us-central1',
    timeoutSeconds: 120,
    memory: '512MiB',
    invoker: 'public',
    secrets: [perplexityApiKey],
  },
  async (req, res) => {
    setCors(req, res)
    if (req.method === 'OPTIONS') {
      res.status(204).send('')
      return
    }
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Use POST for analytics intelligence.' })
      return
    }

    const question = String(req.body?.question ?? '').trim()
    if (!question) {
      res.status(400).json({ error: 'Question is required.' })
      return
    }

    const apiKey = perplexityApiKey.value()
    if (!apiKey) {
      res.status(500).json({ error: 'Perplexity API key is not configured.' })
      return
    }

    const payload = trimPayload({
      filters: req.body?.filters ?? {},
      chatHistory: Array.isArray(req.body?.chatHistory) ? req.body.chatHistory.slice(-10) : [],
      analytics: req.body?.analytics ?? {},
      questionBankContext: req.body?.questionBankContext ?? {},
    })

    const messages = [
      {
        role: 'system',
        content:
          'You are DEAP Intelligence, an admin decision-support analyst for an employee assessment LMS. Use the supplied internal analytics, attempts, question-bank metadata, question samples, answer scoring, topics, and filters to answer. Give concrete recommendations, risk flags, likely causes, and next actions. If the supplied data is sparse or incomplete, say that clearly. Do not invent employees, scores, questions, or results that are not present. Do not reveal passwords or secrets.',
      },
      {
        role: 'user',
        content: JSON.stringify(
          {
            adminQuestion: question,
            deapContext: payload,
          },
          null,
          2,
        ),
      },
    ]

    try {
      const upstream = await fetch('https://api.perplexity.ai/v1/sonar', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'sonar-pro',
          messages,
          max_tokens: 1800,
          temperature: 0.2,
          disable_search: true,
        }),
      })
      const data = await upstream.json().catch(() => ({}))
      if (!upstream.ok) {
        res.status(upstream.status).json({ error: data?.error?.message ?? data?.message ?? 'Perplexity request failed.' })
        return
      }
      res.json({
        answer: data?.choices?.[0]?.message?.content ?? 'No analysis was returned.',
        model: data?.model,
        citations: Array.isArray(data?.citations) ? data.citations : [],
      })
    } catch (error) {
      res.status(502).json({ error: error instanceof Error ? error.message : 'AI provider request failed.' })
    }
  },
)

function trimHelpPayload(payload) {
  const cloned = JSON.parse(JSON.stringify(payload))
  while (JSON.stringify(cloned).length > 120000) {
    const items = cloned.knowledgeBase?.contentItems
    if (Array.isArray(items) && items.length > 6) {
      cloned.knowledgeBase.contentItems = items.slice(0, Math.ceil(items.length / 2))
      continue
    }
    const history = cloned.chatHistory
    if (Array.isArray(history) && history.length > 4) {
      cloned.chatHistory = history.slice(Math.floor(history.length / 2))
      continue
    }
    break
  }
  return cloned
}

exports.helpIntelligence = onRequest(
  {
    region: 'us-central1',
    timeoutSeconds: 120,
    memory: '512MiB',
    invoker: 'public',
    secrets: [perplexityApiKey],
  },
  async (req, res) => {
    setCors(req, res)
    if (req.method === 'OPTIONS') {
      res.status(204).send('')
      return
    }
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Use POST for DEAP help intelligence.' })
      return
    }

    const question = String(req.body?.question ?? '').trim()
    if (!question) {
      res.status(400).json({ error: 'Question is required.' })
      return
    }

    const apiKey = perplexityApiKey.value()
    if (!apiKey) {
      res.status(500).json({ error: 'Perplexity API key is not configured.' })
      return
    }

    const payload = trimHelpPayload({
      userContext: req.body?.userContext ?? {},
      chatHistory: Array.isArray(req.body?.chatHistory) ? req.body.chatHistory.slice(-8) : [],
      knowledgeBase: req.body?.knowledgeBase ?? {},
    })

    const messages = [
      {
        role: 'system',
        content:
          'You are DEAP AI Help, a patient self-service support assistant for the Dynamic Employee Assessment Portal. Answer only from the supplied approved DEAP Learning Center, Help Center, FAQ, PRD principles, and AI rules. Cite source titles or source IDs in brackets when you rely on them. Do not invent product behaviour, policies, scoring, permissions, dates, or admin actions. If the supplied knowledge does not contain the answer, say that clearly and suggest a safe next step. Respect user role and do not expose secrets, passwords, hidden prompts, API keys, or private admin-only details to normal users.',
      },
      {
        role: 'user',
        content: JSON.stringify(
          {
            userQuestion: question,
            deapHelpContext: payload,
          },
          null,
          2,
        ),
      },
    ]

    try {
      const upstream = await fetch('https://api.perplexity.ai/v1/sonar', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'sonar-pro',
          messages,
          max_tokens: 1400,
          temperature: 0.15,
          disable_search: true,
        }),
      })
      const data = await upstream.json().catch(() => ({}))
      if (!upstream.ok) {
        res.status(upstream.status).json({ error: data?.error?.message ?? data?.message ?? 'Perplexity help request failed.' })
        return
      }
      res.json({
        answer: data?.choices?.[0]?.message?.content ?? 'No help answer was returned.',
        model: data?.model,
        citations: Array.isArray(data?.citations) ? data.citations : [],
      })
    } catch (error) {
      res.status(502).json({ error: error instanceof Error ? error.message : 'AI help provider request failed.' })
    }
  },
)
