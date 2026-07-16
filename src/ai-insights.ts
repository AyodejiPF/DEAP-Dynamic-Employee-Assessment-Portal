/**
 * AI Insights Module — Client-side intelligence engine.
 *
 * Provides AI-powered analysis using the existing assessment data:
 *   1. Skill gap detection per user / department
 *   2. Training path recommendations mapped to weak areas
 *   3. Executive brief generation (plain-language analytics summary)
 *   4. Intervention risk priority ranking
 *
 * These functions work without a deployed AI backend — they use statistical
 * analysis, pattern detection, and template-based generation from live data.
 * When the AI backend is deployed, they can be enhanced with LLM enrichment.
 */

// ─── Local type mirroring App.tsx User interface ──────────────────

interface User {
  id: string
  fullName: string
  department: string
  role: string
  disabled?: boolean
}

// ─── Re-exported interfaces (mirrors App.tsx types) ────────────────

export interface AiSkillGap {
  userId: string
  userName: string
  department: string
  topic: string
  averageScore: number
  attempts: number
  gapSeverity: 'critical' | 'high' | 'medium' | 'low'
  lastTestedAt?: string
}

export interface AiTrainingRecommendation {
  userId: string
  userName: string
  department: string
  weakTopics: string[]
  suggestedCourses: string[]
  recommendedAction: string
  priority: number
}

export interface AiExecutiveBrief {
  generatedAt: string
  summary: string
  keyFindings: string[]
  riskAreas: string[]
  recommendations: string[]
  stats: {
    totalUsers: number
    activeTestTakers: number
    averageScore: number
    passRate: number
    criticalGapCount: number
  }
}

export interface AiRiskProfile {
  userId: string
  userName: string
  department: string
  riskLevel: 'critical' | 'high' | 'medium' | 'low'
  riskScore: number
  reasons: string[]
  recommendedIntervention: string
}

// ─── Internal types ────────────────────────────────────────────────

interface SessionInput {
  userId: string
  testId?: string
  score?: string
  maxScore?: string
  percentage?: string
  passed?: boolean
  status?: string
  completedAt?: string
  responses?: Array<{
    questionId: string
    selectedOption?: string
    isCorrect?: boolean
    score?: string
    maxScore?: string
    hintUsed?: boolean
    answerRevealed?: boolean
    topicTag?: string
  }>
}

interface QuestionInput {
  questionId: string
  topicTag: string
  difficulty: string
}

// ─── Skill Gap Analyzer ────────────────────────────────────────────

/**
 * Analyzes test sessions to identify skill gaps per user.
 * Returns gaps sorted by severity (critical first).
 */
export function analyzeSkillGaps(
  users: User[],
  sessions: SessionInput[],
  questions: QuestionInput[],
): AiSkillGap[] {
  const questionTopicMap = new Map(questions.map((q) => [q.questionId, q.topicTag]))
  const gaps: AiSkillGap[] = []

  users
    .filter((user) => user.role === 'employee')
    .forEach((user) => {
      const userSessions = sessions.filter((s) => s.userId === user.id && s.status === 'completed')
      if (!userSessions.length) return

      // Collect all responses with topic tags
      const topicScores = new Map<string, { total: number; count: number; lastDate: string }>()

      userSessions.forEach((session) => {
        ;(session.responses ?? []).forEach((response) => {
          const topic = questionTopicMap.get(response.questionId) ?? 'General'
          const score = Number(response.score ?? 0)
          const maxScore = Number(response.maxScore ?? 1)
          const normalized = maxScore > 0 ? score / maxScore : 0

          const existing = topicScores.get(topic)
          if (existing) {
            existing.total += normalized
            existing.count += 1
            if (session.completedAt && session.completedAt > existing.lastDate) {
              existing.lastDate = session.completedAt
            }
          } else {
            topicScores.set(topic, {
              total: normalized,
              count: 1,
              lastDate: session.completedAt ?? '',
            })
          }
        })
      })

      topicScores.forEach((data, topic) => {
        const averageScore = data.count > 0 ? data.total / data.count : 0
        const percentage = Math.round(averageScore * 100)

        let gapSeverity: AiSkillGap['gapSeverity']
        if (percentage < 40) gapSeverity = 'critical'
        else if (percentage < 55) gapSeverity = 'high'
        else if (percentage < 70) gapSeverity = 'medium'
        else gapSeverity = 'low'

        // Only report real gaps (below 70%)
        if (percentage < 70) {
          gaps.push({
            userId: user.id,
            userName: user.fullName,
            department: user.department,
            topic,
            averageScore: percentage,
            attempts: data.count,
            gapSeverity,
            lastTestedAt: data.lastDate || undefined,
          })
        }
      })
    })

  return gaps.sort((a, b) => {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
    return severityOrder[a.gapSeverity] - severityOrder[b.gapSeverity]
  })
}

// ─── Training Path Recommender ─────────────────────────────────────

/**
 * Recommends training actions based on identified skill gaps.
 */
export function recommendTraining(
  gaps: AiSkillGap[],
  availableTopics: string[],
): AiTrainingRecommendation[] {
  const userGaps = new Map<string, AiSkillGap[]>()

  gaps.forEach((gap) => {
    const existing = userGaps.get(gap.userId)
    if (existing) existing.push(gap)
    else userGaps.set(gap.userId, [gap])
  })

  const recommendations: AiTrainingRecommendation[] = []

  userGaps.forEach((userGapList, userId) => {
    const sortedGaps = userGapList.sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3 }
      return order[a.gapSeverity] - order[b.gapSeverity]
    })

    const weakTopics = sortedGaps.slice(0, 3).map((g) => g.topic)
    const criticalCount = sortedGaps.filter((g) => g.gapSeverity === 'critical').length
    const highCount = sortedGaps.filter((g) => g.gapSeverity === 'high').length

    // Match weak topics to available training topics
    const matchedCourses = weakTopics
      .filter((topic) => availableTopics.some((t) => t.toLowerCase().includes(topic.toLowerCase())))
      .map((topic) => `Training: ${topic} mastery`)

    let recommendedAction: string
    if (criticalCount > 0) {
      recommendedAction = `Urgent: Assign remedial training for ${weakTopics.slice(0, 2).join(' and ')} before next assessment cycle.`
    } else if (highCount > 0) {
      recommendedAction = `Schedule targeted practice sessions for ${weakTopics[0]}. Review progress in 2 weeks.`
    } else {
      recommendedAction = `Monitor ${weakTopics[0]} performance. Consider supplementary learning materials.`
    }

    recommendations.push({
      userId,
      userName: sortedGaps[0].userName,
      department: sortedGaps[0].department,
      weakTopics,
      suggestedCourses: matchedCourses.length ? matchedCourses : [`General review: ${weakTopics[0]}`],
      recommendedAction,
      priority: criticalCount * 3 + highCount * 2 + 1,
    })
  })

  return recommendations.sort((a, b) => b.priority - a.priority)
}

// ─── Executive Brief Generator ─────────────────────────────────────

/**
 * Generates a plain-language executive brief from analytics data.
 */
export function generateExecutiveBrief(
  users: User[],
  sessions: SessionInput[],
  gaps: AiSkillGap[],
): AiExecutiveBrief {
  const activeUsers = users.filter((u) => u.role === 'employee' && !u.disabled)
  const completedSessions = sessions.filter((s) => s.status === 'completed')
  const passedSessions = completedSessions.filter((s) => s.passed)
  const averageScore =
    completedSessions.length > 0
      ? Math.round(completedSessions.reduce((sum, s) => sum + Number(s.percentage ?? 0), 0) / completedSessions.length)
      : 0
  const passRate =
    completedSessions.length > 0 ? Math.round((passedSessions.length / completedSessions.length) * 100) : 0
  const criticalGaps = gaps.filter((g) => g.gapSeverity === 'critical')
  const highGaps = gaps.filter((g) => g.gapSeverity === 'high')

  // Department analysis
  const deptScores = new Map<string, { total: number; count: number }>()
  completedSessions.forEach((s) => {
    const user = users.find((u) => u.id === s.userId)
    const dept = user?.department ?? 'Unknown'
    const existing = deptScores.get(dept)
    if (existing) {
      existing.total += Number(s.percentage ?? 0)
      existing.count += 1
    } else {
      deptScores.set(dept, { total: Number(s.percentage ?? 0), count: 1 })
    }
  })

  const departmentInsights: string[] = []
  deptScores.forEach((data, dept) => {
    const avg = Math.round(data.total / data.count)
    if (avg < 55) departmentInsights.push(`${dept} (${avg}% average — needs attention)`)
  })

  // Build the brief
  const summary = `StaffiQ assessed ${activeUsers.length} employees across ${completedSessions.length} completed test sessions. The organisation-wide average score is ${averageScore}% with a ${passRate}% pass rate. ${criticalGaps.length} critical skill gaps and ${highGaps.length} high-severity gaps require immediate attention.`

  const keyFindings: string[] = [
    `${activeUsers.length} active employees in the assessment system.`,
    `Overall average score: ${averageScore}%. Pass rate: ${passRate}%.`,
    `${criticalGaps.length} critical skill gaps detected across ${new Set(criticalGaps.map((g) => g.topic)).size} topics.`,
    `${completedSessions.length} test sessions completed.`,
  ]

  if (departmentInsights.length) {
    keyFindings.push(`Departments needing attention: ${departmentInsights.join('; ')}`)
  }

  const riskAreas: string[] = []
  if (criticalGaps.length) {
    const criticalTopics = [...new Set(criticalGaps.map((g) => g.topic))]
    riskAreas.push(`Critical skill gaps in: ${criticalTopics.slice(0, 5).join(', ')}`)
  }
  if (passRate < 60) riskAreas.push(`Low overall pass rate (${passRate}%) — review assessment difficulty and training coverage.`)
  if (departmentInsights.length > 2) riskAreas.push('Multiple departments showing below-threshold performance.')

  const recommendations: string[] = []
  if (criticalGaps.length) {
    recommendations.push(`Assign targeted remedial training for the ${new Set(criticalGaps.map((g) => g.topic)).size} topics with critical gaps.`)
  }
  if (highGaps.length) {
    recommendations.push(`Schedule follow-up assessments in ${2} weeks for employees with high-severity gaps.`)
  }
  if (passRate < 70) {
    recommendations.push('Review assessment content difficulty — consider adjusting pass marks or adding prerequisite training.')
  }
  recommendations.push('Run the AI Training Recommender to generate individual learning paths for at-risk employees.')

  return {
    generatedAt: new Date().toISOString(),
    summary,
    keyFindings,
    riskAreas: riskAreas.length ? riskAreas : ['No critical risks detected.'],
    recommendations: recommendations.length ? recommendations : ['Continue current training programmes.'],
    stats: {
      totalUsers: activeUsers.length,
      activeTestTakers: new Set(completedSessions.map((s) => s.userId)).size,
      averageScore,
      passRate,
      criticalGapCount: criticalGaps.length,
    },
  }
}

// ─── Risk Priority Engine ──────────────────────────────────────────

/**
 * Ranks employees by intervention urgency based on performance signals.
 */
export function rankInterventionRisks(
  users: User[],
  sessions: SessionInput[],
  gaps: AiSkillGap[],
): AiRiskProfile[] {
  const profiles: AiRiskProfile[] = []

  users
    .filter((u) => u.role === 'employee' && !u.disabled)
    .forEach((user) => {
      const userSessions = sessions.filter((s) => s.userId === user.id && s.status === 'completed')
      const userGaps = gaps.filter((g) => g.userId === user.id)

      if (!userSessions.length && !userGaps.length) {
        // User hasn't taken any tests — low priority but flagged
        profiles.push({
          userId: user.id,
          userName: user.fullName,
          department: user.department,
          riskLevel: 'low',
          riskScore: 5,
          reasons: ['No assessment activity recorded.'],
          recommendedIntervention: 'Encourage first assessment attempt.',
        })
        return
      }

      let riskScore = 0
      const reasons: string[] = []

      // Recent performance
      const recentSessions = userSessions.filter((s) => {
        if (!s.completedAt) return false
        const age = Date.now() - new Date(s.completedAt).getTime()
        return age < 30 * 24 * 60 * 60 * 1000 // last 30 days
      })

      if (recentSessions.length) {
        const recentAvg = Math.round(
          recentSessions.reduce((sum, s) => sum + Number(s.percentage ?? 0), 0) / recentSessions.length,
        )
        if (recentAvg < 40) {
          riskScore += 30
          reasons.push(`Recent average score is ${recentAvg}% — critically low.`)
        } else if (recentAvg < 55) {
          riskScore += 20
          reasons.push(`Recent average score is ${recentAvg}% — below threshold.`)
        } else if (recentAvg < 70) {
          riskScore += 10
          reasons.push(`Recent average score is ${recentAvg}% — needs improvement.`)
        }
      } else {
        riskScore += 5
        reasons.push('No assessment activity in the last 30 days.')
      }

      // Skill gaps
      const criticalGaps = userGaps.filter((g) => g.gapSeverity === 'critical')
      const highGaps = userGaps.filter((g) => g.gapSeverity === 'high')

      if (criticalGaps.length) {
        riskScore += criticalGaps.length * 15
        reasons.push(`${criticalGaps.length} critical skill gap(s): ${criticalGaps.map((g) => g.topic).join(', ')}.`)
      }
      if (highGaps.length) {
        riskScore += highGaps.length * 8
        reasons.push(`${highGaps.length} high-severity gap(s).`)
      }

      // Failing trend
      const failingCount = userSessions.filter((s) => !s.passed).length
      if (failingCount > 2) {
        riskScore += 10
        reasons.push(`${failingCount} failed assessment(s) — repeated failure pattern.`)
      }

      let riskLevel: AiRiskProfile['riskLevel']
      if (riskScore >= 40) riskLevel = 'critical'
      else if (riskScore >= 25) riskLevel = 'high'
      else if (riskScore >= 10) riskLevel = 'medium'
      else riskLevel = 'low'

      let recommendedIntervention: string
      if (riskLevel === 'critical') {
        recommendedIntervention = `Immediate 1:1 review with ${user.fullName}. Assign remedial training for weakest topics and schedule reassessment in 2 weeks.`
      } else if (riskLevel === 'high') {
        recommendedIntervention = `Assign targeted practice modules. Manager to check progress within 2 weeks.`
      } else if (riskLevel === 'medium') {
        recommendedIntervention = `Monitor performance. Suggest optional supplementary materials.`
      } else {
        recommendedIntervention = 'No urgent action needed. Continue regular assessment schedule.'
      }

      profiles.push({
        userId: user.id,
        userName: user.fullName,
        department: user.department,
        riskLevel,
        riskScore,
        reasons: reasons.length ? reasons : ['Performance is within acceptable range.'],
        recommendedIntervention,
      })
    })

  return profiles.sort((a, b) => b.riskScore - a.riskScore)
}
