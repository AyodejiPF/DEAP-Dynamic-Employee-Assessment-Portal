/**
 * AI Answer Guard — hierarchy aware visibility + tier guard for StaffiQ's AI assistants.
 *
 * CommonJS sibling of ../src/ai-guard.ts, kept intentionally in step with it.
 * functions/index.js is plain Node CommonJS (no bundler/TS build in front of it),
 * so it cannot `import` a Vite/TypeScript module from src/ directly — this file
 * carries the same logic so it can be `require()`'d authoritatively at request time.
 *
 * Deliberately placed at functions/ai-guard.js (a sibling of functions/index.js),
 * NOT inside functions/lib/ — that directory is the `tsc` build output for
 * functions/src/**\/*.ts (see functions/tsconfig.json outDir), so hand-written
 * source has no business living there.
 *
 * If you change the guard rules, change BOTH this file and src/ai-guard.ts.
 *
 * Additive only: nothing here changes existing behaviour for super_admin/admin,
 * who already saw everyone before this file existed.
 */

'use strict'

// ─── Reporting chain ───────────────────────────────────────────────

/**
 * Builds a Map<userId, Set<descendantUserId>> from a flat user list carrying
 * `userId` and `supervisorId`. Cycle safe: a user can never end up in their
 * own descendant set.
 */
function buildReportingChainRule(users) {
  const list = Array.isArray(users) ? users : []
  const directReports = new Map()
  list.forEach((user) => {
    if (!user || !user.supervisorId) return
    const existing = directReports.get(user.supervisorId) || []
    existing.push(user.userId)
    directReports.set(user.supervisorId, existing)
  })

  const chain = new Map()

  function resolve(rootId) {
    const cached = chain.get(rootId)
    if (cached) return cached
    const descendants = new Set()
    const queue = [...(directReports.get(rootId) || [])]
    while (queue.length > 0) {
      const next = queue.shift()
      if (!next || descendants.has(next) || next === rootId) continue
      descendants.add(next)
      queue.push(...(directReports.get(next) || []))
    }
    chain.set(rootId, descendants)
    return descendants
  }

  list.forEach((user) => user && resolve(user.userId))
  return chain
}

function isInReportingChain(rule, managerUserId, targetUserId) {
  const set = rule.get(managerUserId)
  return Boolean(set && set.has(targetUserId))
}

function canViewerSeeUser(viewerRole, viewerUserId, target, reportingChainRule) {
  if (viewerRole === 'super_admin' || viewerRole === 'admin') return true
  if (viewerUserId === target.userId) return true
  return reportingChainRule ? isInReportingChain(reportingChainRule, viewerUserId, target.userId) : false
}

// ─── AI access tier ────────────────────────────────────────────────

const TIER_RANK = { public: 0, admin: 1, super_admin: 2 }

const AI_UNAVAILABLE_MESSAGE = 'That feature is not available on your account.'

function resolveAiAccessTier(role) {
  if (role === 'super_admin') return 'super_admin'
  if (role === 'admin') return 'admin'
  return 'public'
}

const SUPER_ADMIN_KEYWORDS = [
  'platform owner',
  'super admin',
  'superadmin',
  'api token',
  'token studio',
  'feature inventory',
  'cross tenant',
  'cross-tenant',
  'other workspace',
  'other client',
  'all clients',
  'all workspaces',
  'all tenants',
  'every tenant',
  'grant access',
  'grants panel',
  'move user to another',
  'copy user to another',
]

const ADMIN_KEYWORDS = [
  'manage users',
  'create a user',
  'create user',
  'add a user',
  'deactivate',
  'reset password',
  'branding',
  'question bank',
  'import users',
  'export report',
  'audit log',
  'permission',
  'disable user',
  'delete user',
  'reassign supervisor',
  'change role',
  'company settings',
  'department settings',
]

function tierReferencedByQuestion(question) {
  const text = ` ${String(question || '').toLowerCase()} `
  if (SUPER_ADMIN_KEYWORDS.some((word) => text.includes(word))) return 'super_admin'
  if (ADMIN_KEYWORDS.some((word) => text.includes(word))) return 'admin'
  return 'public'
}

function buildUnavailableResponse() {
  return { answer: AI_UNAVAILABLE_MESSAGE, citations: [] }
}

// ─── Named person guard (org chart aware) ─────────────────────────

function findMentionedUserID(question, directory) {
  const text = String(question || '').toLowerCase()
  const escape = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const list = Array.isArray(directory) ? directory : []

  for (const user of list) {
    if (!user) continue
    const candidates = [user.fullName, user.displayName].filter(
      (value) => typeof value === 'string' && value.trim().length >= 3,
    )
    for (const candidate of candidates) {
      const pattern = new RegExp(`\\b${escape(candidate.trim().toLowerCase())}\\b`)
      if (pattern.test(text)) return user.userId
    }
  }
  return undefined
}

function canViewerDiscussPerson(viewer, targetUserId, directory, reportingChainRule) {
  if (viewer.role === 'super_admin' || viewer.role === 'admin') return true
  const list = Array.isArray(directory) ? directory : []
  const target = list.find((user) => user && user.userId === targetUserId)
  if (!target) return true // unknown person referenced — nothing to protect, let the tier guard decide
  const chainRule = reportingChainRule || buildReportingChainRule(list)
  return canViewerSeeUser(viewer.role, viewer.userId, target, chainRule)
}

/**
 * Pre-check a question before calling the model. personContext is optional:
 * { viewerUserId, viewerRole, directory: [{ userId, fullName, displayName, supervisorId, role }] }
 * Returns { blocked: true, response } or { blocked: false }.
 */
function guardAiQuestion(question, viewerTier, personContext) {
  const referenced = tierReferencedByQuestion(question)
  if (TIER_RANK[referenced] > TIER_RANK[viewerTier]) {
    return { blocked: true, response: buildUnavailableResponse() }
  }

  if (personContext && Array.isArray(personContext.directory) && personContext.directory.length) {
    const mentioned = findMentionedUserID(question, personContext.directory)
    if (mentioned && mentioned !== personContext.viewerUserId) {
      const allowed = canViewerDiscussPerson(
        { userId: personContext.viewerUserId, role: personContext.viewerRole },
        mentioned,
        personContext.directory,
      )
      if (!allowed) return { blocked: true, response: buildUnavailableResponse() }
    }
  }

  return { blocked: false }
}

/**
 * Defence in depth on a produced answer: if the answer text references a
 * tier above the caller, or names a person outside the caller's reach, fall
 * back to the neutral response instead of returning it. `answer` is
 * { answer: string, model?: string, citations: string[] }.
 */
function filterAiAnswerToTier(answer, viewerTier, personContext) {
  const textReferenced = tierReferencedByQuestion(answer.answer)
  if (TIER_RANK[textReferenced] > TIER_RANK[viewerTier]) {
    return buildUnavailableResponse()
  }

  if (personContext && Array.isArray(personContext.directory) && personContext.directory.length) {
    const mentioned = findMentionedUserID(answer.answer, personContext.directory)
    if (mentioned && mentioned !== personContext.viewerUserId) {
      const allowed = canViewerDiscussPerson(
        { userId: personContext.viewerUserId, role: personContext.viewerRole },
        mentioned,
        personContext.directory,
      )
      if (!allowed) return buildUnavailableResponse()
    }
  }

  return answer
}

module.exports = {
  AI_UNAVAILABLE_MESSAGE,
  buildReportingChainRule,
  isInReportingChain,
  canViewerSeeUser,
  resolveAiAccessTier,
  tierReferencedByQuestion,
  buildUnavailableResponse,
  findMentionedUserID,
  canViewerDiscussPerson,
  guardAiQuestion,
  filterAiAnswerToTier,
  SUPER_ADMIN_KEYWORDS,
  ADMIN_KEYWORDS,
}
