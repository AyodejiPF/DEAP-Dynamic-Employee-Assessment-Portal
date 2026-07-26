/**
 * AI Answer Guard — hierarchy aware visibility + tier guard for StaffiQ's AI assistants.
 *
 * Mirrors the pattern already proven in the sibling app, Task Pulse
 * (src/lib/utils/user-visibility.ts + src/lib/utils/ai-answer-guard.ts), adapted to
 * StaffiQ's actual data model:
 *   - StaffiQ's `User` already carries a self-referencing `supervisorId` field
 *     (see src/App.tsx `interface User`, already used for CSV import and the
 *     Users admin table). This module does not introduce that field — it reuses it.
 *   - StaffiQ's role model stays flat and unchanged: 'super_admin' | 'admin' | 'employee'.
 *     There is no separate "Supervisor" or "CEO" role. Instead, ANY user can be named
 *     as another user's supervisorId, so "is a manager" is a relationship, not a role —
 *     this module reasons purely from the supervisorId graph.
 *   - super_admin and admin already see the full directory in the app today; this
 *     module only adds a narrower allowance so an ordinary employee who has reports
 *     under them may be discussed (by the AI assistant) about their own reports,
 *     without opening visibility to the rest of the company.
 *
 * This file is pure and framework free so it can run in the browser (defence in depth)
 * and has a sibling CommonJS copy at functions/ai-guard.js for the Cloud Functions
 * runtime (authoritative, server-side enforcement) — functions/index.js is plain Node
 * CommonJS and cannot import a Vite/TypeScript module directly, so the logic is
 * duplicated deliberately. Keep both files in step if either changes.
 *
 * Additive only: nothing here changes existing behaviour for super_admin/admin, who
 * already saw everyone before this file existed.
 */

export type StaffiqRole = 'super_admin' | 'admin' | 'employee'

/** Minimal user shape the guard needs. Matches the fields already on src/App.tsx's `User`. */
export interface DirectoryUser {
  userId: string
  fullName?: string | null
  displayName?: string | null
  supervisorId?: string | null
  role?: StaffiqRole | string
}

// ─── Reporting chain ───────────────────────────────────────────────

/**
 * Precomputed reporting chain: for every userId that manages at least one
 * person, the full set of everyone junior to them (direct reports AND their
 * reports, recursively). Built once per user list so repeated lookups do not
 * re-walk the tree. Cycle safe: a user can never end up in their own set.
 */
export type ReportingChainRule = Map<string, Set<string>>

export function buildReportingChainRule<T extends Pick<DirectoryUser, 'userId' | 'supervisorId'>>(
  users: T[],
): ReportingChainRule {
  const directReports = new Map<string, string[]>()
  users.forEach((user) => {
    if (!user.supervisorId) return
    const list = directReports.get(user.supervisorId) ?? []
    list.push(user.userId)
    directReports.set(user.supervisorId, list)
  })

  const chain: ReportingChainRule = new Map()

  function resolve(rootId: string): Set<string> {
    const cached = chain.get(rootId)
    if (cached) return cached

    const descendants = new Set<string>()
    const queue = [...(directReports.get(rootId) ?? [])]
    while (queue.length > 0) {
      const next = queue.shift()
      if (!next || descendants.has(next) || next === rootId) continue
      descendants.add(next)
      queue.push(...(directReports.get(next) ?? []))
    }
    chain.set(rootId, descendants)
    return descendants
  }

  users.forEach((user) => resolve(user.userId))
  return chain
}

/** True when targetUserId is anywhere below managerUserId in the reporting chain. */
export function isInReportingChain(rule: ReportingChainRule, managerUserId: string, targetUserId: string): boolean {
  return rule.get(managerUserId)?.has(targetUserId) ?? false
}

/** Every userId junior to rootUserId, direct or indirect. Convenience wrapper for one-off lookups. */
export function getAllReportIDs<T extends Pick<DirectoryUser, 'userId' | 'supervisorId'>>(
  users: T[],
  rootUserId: string,
): string[] {
  return Array.from(buildReportingChainRule(users).get(rootUserId) ?? [])
}

export function getDirectReportIDs<T extends Pick<DirectoryUser, 'userId' | 'supervisorId'>>(
  users: T[],
  supervisorId: string,
): string[] {
  return users.filter((user) => user.supervisorId === supervisorId).map((user) => user.userId)
}

/**
 * Whether viewerUserId may see targetUser. super_admin/admin see everyone
 * (unchanged, pre-existing behaviour). Anyone may see themselves. Otherwise a
 * viewer sees a target only if the target is somewhere below them in the
 * reporting chain, however many levels deep.
 */
export function canViewerSeeUser(
  viewerRole: StaffiqRole | string | undefined,
  viewerUserId: string,
  target: Pick<DirectoryUser, 'userId' | 'supervisorId'>,
  reportingChainRule?: ReportingChainRule,
): boolean {
  if (viewerRole === 'super_admin' || viewerRole === 'admin') return true
  if (viewerUserId === target.userId) return true
  return reportingChainRule ? isInReportingChain(reportingChainRule, viewerUserId, target.userId) : false
}

export function filterUsersForViewer<T extends DirectoryUser>(
  users: T[],
  viewerRole: StaffiqRole | string | undefined,
  viewerUserId: string,
): T[] {
  const reportingChainRule = buildReportingChainRule(users)
  return users.filter((user) => canViewerSeeUser(viewerRole, viewerUserId, user, reportingChainRule))
}

// ─── AI access tier ────────────────────────────────────────────────

/** Ordered tiers. Higher index means more access. */
export type AiAccessTier = 'public' | 'admin' | 'super_admin'

const TIER_RANK: Record<AiAccessTier, number> = {
  public: 0,
  admin: 1,
  super_admin: 2,
}

/** The ONLY sentence shown for an above-tier question or an out-of-reach person. No upward disclosure. */
export const AI_UNAVAILABLE_MESSAGE = 'That feature is not available on your account.'

export function resolveAiAccessTier(role: StaffiqRole | string | null | undefined): AiAccessTier {
  if (role === 'super_admin') return 'super_admin'
  if (role === 'admin') return 'admin'
  return 'public'
}

/** Keyword signals for questions that name a Super Admin (Platform Owner) capability. */
export const SUPER_ADMIN_KEYWORDS = [
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

/** Keyword signals for questions that name an Admin capability. */
export const ADMIN_KEYWORDS = [
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

/** Determine the highest tier a free-text question refers to. */
export function tierReferencedByQuestion(question: string): AiAccessTier {
  const text = ` ${question.toLowerCase()} `
  if (SUPER_ADMIN_KEYWORDS.some((word) => text.includes(word))) return 'super_admin'
  if (ADMIN_KEYWORDS.some((word) => text.includes(word))) return 'admin'
  return 'public'
}

/** Shape shared by both StaffiQ AI endpoints (helpIntelligence, analyticsIntelligence). */
export interface AiGuardResponse {
  answer: string
  model?: string
  citations: string[]
}

/** Build the neutral refusal response. Same shape as a normal answer. */
export function buildUnavailableResponse(): AiGuardResponse {
  return { answer: AI_UNAVAILABLE_MESSAGE, citations: [] }
}

// ─── Named person guard (org chart aware) ─────────────────────────
//
// The keyword tiers above answer "does this question touch an admin or super
// admin FEATURE". This section answers a different question: "does this
// question touch a specific PERSON's information the caller has no reach
// over". An ordinary employee must not get a colleague's or a stranger's
// personal data back through the assistant; an employee who has reports may
// see their own information plus everyone junior to them; admin and
// super_admin see everyone (unchanged from today).

/**
 * Finds the first user in the directory whose full name or display name is
 * named as a whole word in the question. Deliberately conservative: names
 * shorter than 3 characters are skipped, and matches are whole-word only, so
 * an ordinary sentence does not accidentally trip a false match.
 */
export function findMentionedUserID(question: string, directory: DirectoryUser[]): string | undefined {
  const text = question.toLowerCase()
  const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  for (const user of directory) {
    const candidates = [user.fullName, user.displayName].filter(
      (value): value is string => typeof value === 'string' && value.trim().length >= 3,
    )
    for (const candidate of candidates) {
      const pattern = new RegExp(`\\b${escape(candidate.trim().toLowerCase())}\\b`)
      if (pattern.test(text)) return user.userId
    }
  }
  return undefined
}

/**
 * Whether viewer may have the assistant discuss targetUserId's information.
 * super_admin and admin see everyone (unchanged from today). Anyone below
 * that sees themselves plus everyone junior to them in the reporting chain,
 * however many levels deep.
 */
export function canViewerDiscussPerson(
  viewer: { userId: string; role?: StaffiqRole | string },
  targetUserId: string,
  directory: DirectoryUser[],
  reportingChainRule?: ReportingChainRule,
): boolean {
  if (viewer.role === 'super_admin' || viewer.role === 'admin') return true
  const target = directory.find((user) => user.userId === targetUserId)
  if (!target) return true // unknown person referenced — nothing to protect, let the tier guard decide
  const chainRule = reportingChainRule ?? buildReportingChainRule(directory)
  return canViewerSeeUser(viewer.role, viewer.userId, target, chainRule)
}

/** Context needed to run the named-person check. Optional so existing callers keep working unchanged. */
export interface PersonGuardContext {
  viewerUserId: string
  viewerRole?: StaffiqRole | string
  directory: DirectoryUser[]
}

/**
 * Pre-check a question before calling the model. If the question references
 * a tier strictly above the caller, or names a specific person the caller
 * has no reach over, block with the neutral response so no model output
 * (which might leak) is ever produced.
 */
export function guardAiQuestion(
  question: string,
  viewerTier: AiAccessTier,
  personContext?: PersonGuardContext,
): { blocked: true; response: AiGuardResponse } | { blocked: false } {
  const referenced = tierReferencedByQuestion(question)
  if (TIER_RANK[referenced] > TIER_RANK[viewerTier]) {
    return { blocked: true, response: buildUnavailableResponse() }
  }

  if (personContext) {
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
 * Defence in depth on a produced answer: if the answer text itself
 * references a tier above the caller, or names a person outside the
 * caller's reach, fall back to the neutral response instead of returning it.
 */
export function filterAiAnswerToTier(
  answer: AiGuardResponse,
  viewerTier: AiAccessTier,
  personContext?: PersonGuardContext,
): AiGuardResponse {
  const textReferenced = tierReferencedByQuestion(answer.answer)
  if (TIER_RANK[textReferenced] > TIER_RANK[viewerTier]) {
    return buildUnavailableResponse()
  }

  if (personContext) {
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
