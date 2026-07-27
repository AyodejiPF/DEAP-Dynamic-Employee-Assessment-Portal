import { describe, it, expect } from 'vitest'
import {
  buildReportingChainRule,
  isInReportingChain,
  getAllReportIDs,
  getDirectReportIDs,
  canViewerSeeUser,
  filterUsersForViewer,
  resolveAiAccessTier,
  tierReferencedByQuestion,
  guardAiQuestion,
  findMentionedUserID,
  canViewerDiscussPerson,
  filterAiAnswerToTier,
  AI_UNAVAILABLE_MESSAGE,
  type DirectoryUser,
} from './ai-guard'

// Starter test suite, added 27 Jul 2026, world class readiness pass. StaffiQ
// had zero automated tests anywhere. This file was chosen first because it is
// the newest, most security sensitive code in the app, the hierarchy aware AI
// guard built the same night, and nothing had verified it yet.

const directory: DirectoryUser[] = [
  { userId: 'U1', fullName: 'Amaka Obi', role: 'super_admin' },
  { userId: 'U2', fullName: 'Bola Adeyemi', role: 'admin' },
  { userId: 'U3', fullName: 'Chidi Okafor', role: 'employee', supervisorId: 'U2' },
  { userId: 'U4', fullName: 'Ada Nwosu', role: 'employee', supervisorId: 'U3' },
  { userId: 'U5', fullName: 'Emeka Uche', role: 'employee' },
]

describe('buildReportingChainRule and reporting chain lookups', () => {
  it('finds direct reports only one level deep', () => {
    expect(getDirectReportIDs(directory, 'U2')).toEqual(['U3'])
  })

  it('finds every descendant, direct and indirect', () => {
    expect(getAllReportIDs(directory, 'U2').sort()).toEqual(['U3', 'U4'])
  })

  it('a leaf employee with nobody under them has an empty chain', () => {
    expect(getAllReportIDs(directory, 'U4')).toEqual([])
  })

  it('isInReportingChain matches getAllReportIDs', () => {
    const rule = buildReportingChainRule(directory)
    expect(isInReportingChain(rule, 'U2', 'U4')).toBe(true)
    expect(isInReportingChain(rule, 'U2', 'U5')).toBe(false)
  })

  it('is cycle safe, a user is never their own descendant', () => {
    const cyclicalDirectory: DirectoryUser[] = [
      { userId: 'A', supervisorId: 'B' },
      { userId: 'B', supervisorId: 'A' },
    ]
    const rule = buildReportingChainRule(cyclicalDirectory)
    expect(rule.get('A')?.has('A')).toBe(false)
    expect(rule.get('B')?.has('B')).toBe(false)
  })
})

describe('canViewerSeeUser and filterUsersForViewer', () => {
  it('super_admin sees everyone, unchanged pre-existing behaviour', () => {
    expect(filterUsersForViewer(directory, 'super_admin', 'U1')).toHaveLength(directory.length)
  })

  it('admin sees everyone, unchanged pre-existing behaviour', () => {
    expect(filterUsersForViewer(directory, 'admin', 'U2')).toHaveLength(directory.length)
  })

  it('an employee sees themselves plus everyone junior to them, however deep', () => {
    const visible = filterUsersForViewer(directory, 'employee', 'U2').map((u) => u.userId).sort()
    expect(visible).toEqual(['U2', 'U3', 'U4'])
  })

  it('an employee with nobody under them sees only themselves', () => {
    const visible = filterUsersForViewer(directory, 'employee', 'U5').map((u) => u.userId)
    expect(visible).toEqual(['U5'])
  })

  it('an employee cannot see an unrelated colleague', () => {
    expect(canViewerSeeUser('employee', 'U5', { userId: 'U3', supervisorId: 'U2' })).toBe(false)
  })
})

describe('resolveAiAccessTier and tierReferencedByQuestion', () => {
  it('maps roles to the correct tier', () => {
    expect(resolveAiAccessTier('super_admin')).toBe('super_admin')
    expect(resolveAiAccessTier('admin')).toBe('admin')
    expect(resolveAiAccessTier('employee')).toBe('public')
    expect(resolveAiAccessTier(null)).toBe('public')
  })

  it('detects a super admin tier keyword', () => {
    expect(tierReferencedByQuestion('How do I see the cross tenant dashboard?')).toBe('super_admin')
  })

  it('detects an admin tier keyword when phrased exactly as the keyword list expects', () => {
    expect(tierReferencedByQuestion('How do I reset password for a user?')).toBe('admin')
  })

  it('KNOWN GAP: a naturally phrased variant of the same question is not detected, keyword matching is phrasing sensitive', () => {
    // "reset a password" does not contain the exact substring "reset password", so this
    // slips through as 'public' even though it is clearly the same admin capability.
    // Found 27 Jul 2026 while writing this suite, not fixed here, logged for a real decision.
    expect(tierReferencedByQuestion('How do I reset a password for a user?')).toBe('public')
  })

  it('falls back to public for an ordinary question', () => {
    expect(tierReferencedByQuestion('What is my next assessment due date?')).toBe('public')
  })
})

describe('guardAiQuestion', () => {
  it('blocks an employee asking an admin tier question', () => {
    const result = guardAiQuestion('How do I reset password?', 'public')
    expect(result.blocked).toBe(true)
    if (result.blocked) expect(result.response.answer).toBe(AI_UNAVAILABLE_MESSAGE)
  })

  it('allows an admin asking an admin tier question', () => {
    const result = guardAiQuestion('How do I reset password?', 'admin')
    expect(result.blocked).toBe(false)
  })

  it('blocks an employee asking about an unrelated named colleague', () => {
    const result = guardAiQuestion('Tell me about Emeka Uche', 'public', {
      viewerUserId: 'U3',
      viewerRole: 'employee',
      directory,
    })
    expect(result.blocked).toBe(true)
  })

  it('allows a manager asking about their own report by name', () => {
    const result = guardAiQuestion('Tell me about Ada Nwosu', 'public', {
      viewerUserId: 'U3',
      viewerRole: 'employee',
      directory,
    })
    expect(result.blocked).toBe(false)
  })

  it('allows asking about yourself by name', () => {
    const result = guardAiQuestion('Tell me about Chidi Okafor', 'public', {
      viewerUserId: 'U3',
      viewerRole: 'employee',
      directory,
    })
    expect(result.blocked).toBe(false)
  })
})

describe('findMentionedUserID', () => {
  it('finds a whole word name match', () => {
    expect(findMentionedUserID('What about Ada Nwosu this week?', directory)).toBe('U4')
  })

  it('does not match a short substring inside another word', () => {
    // "Ada" alone is only 3 characters and must match as a whole word, not part of "Adaeze"
    expect(findMentionedUserID('Adaeze is a different person entirely', directory)).toBeUndefined()
  })

  it('returns undefined when nobody in the directory is named', () => {
    expect(findMentionedUserID('What is the weather like today', directory)).toBeUndefined()
  })
})

describe('canViewerDiscussPerson', () => {
  it('an unknown target user id is allowed through, nothing to protect', () => {
    expect(canViewerDiscussPerson({ userId: 'U3', role: 'employee' }, 'GHOST', directory)).toBe(true)
  })

  it('admin can discuss anyone', () => {
    expect(canViewerDiscussPerson({ userId: 'U2', role: 'admin' }, 'U5', directory)).toBe(true)
  })
})

describe('filterAiAnswerToTier, defence in depth on produced answers', () => {
  it('redacts an answer that leaks an admin tier detail to a public tier viewer', () => {
    const leaky = { answer: 'You can reset password from the admin panel.', citations: [] }
    const filtered = filterAiAnswerToTier(leaky, 'public')
    expect(filtered.answer).toBe(AI_UNAVAILABLE_MESSAGE)
  })

  it('leaves a genuinely public answer untouched', () => {
    const safe = { answer: 'Your next assessment is due Friday.', citations: [] }
    expect(filterAiAnswerToTier(safe, 'public').answer).toBe(safe.answer)
  })
})
