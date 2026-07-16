/**
 * SmartTasks — AI-Powered Task Decomposition Panel
 *
 * Feature: smart_task (available on Growth+ plans)
 *
 * Allows admins to describe a work item in plain language and have
 * the AI break it into structured, assignable tasks with priorities.
 *
 * Integration points:
 *   - AiGate gating (plan_restricted if not Growth+)
 *   - logAIUsage tracking per decomposition call
 *   - enforceAIAccess via AiGate component
 */

import { useState, useCallback } from 'react'
import {
  Sparkles, ListChecks, UserRound, Clock,
  RefreshCw, Plus, Trash2, Copy,
} from 'lucide-react'
import { AiGate } from './AiGate'
import { logAIUsage, estimateTokens } from '../ai-access'
import type { AIAccessContext } from '../ai-access'

// ─── Types ─────────────────────────────────────────────────────────

interface SmartTask {
  id: string
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  estimatedMinutes: number
  assigneeHint: string
  dependencies: string[]
}

interface DecompositionResult {
  summary: string
  tasks: SmartTask[]
  totalEstimatedMinutes: number
  suggestedDeadline: string
}

// ─── Props ─────────────────────────────────────────────────────────

interface SmartTasksProps {
  aiContext: Omit<AIAccessContext, 'featureName'>
  currentUser?: { id?: string; fullName?: string; displayName?: string }
  onToast?: (message: string) => void
}

// ─── Helpers ───────────────────────────────────────────────────────

function taskId(): string {
  return `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

// ─── Example Prompt Bank ───────────────────────────────────────────

const EXAMPLE_PROMPTS = [
  { label: 'Onboarding programme', prompt: 'Create a 5-day onboarding programme for new branch tellers covering compliance, customer service, and system training.' },
  { label: 'Quarterly audit prep', prompt: 'Break down quarterly compliance audit preparation into tasks for the HR and Operations teams over the next 3 weeks.' },
  { label: 'Training rollout', prompt: 'Plan the rollout of a new mandatory cybersecurity training course to 200 employees across 4 branches.' },
  { label: 'Performance reviews', prompt: 'Organise the end-of-year performance review cycle for a 50-person department with self-assessments, manager reviews, and calibration meetings.' },
]

// ─── Main Component ────────────────────────────────────────────────

export function SmartTasks({ aiContext, currentUser, onToast }: SmartTasksProps) {
  const [prompt, setPrompt] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<DecompositionResult | null>(null)
  const [editedTasks, setEditedTasks] = useState<SmartTask[]>([])
  const [showExamples, setShowExamples] = useState(true)

  const hasResult = result !== null

  const handleDecompose = useCallback(async () => {
    const trimmed = prompt.trim()
    if (!trimmed || busy) return

    setBusy(true)
    setError('')
    setShowExamples(false)

    const startTime = Date.now()

    try {
      const res = await fetch('/api/analytics-intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: `You are a project management AI. Break down this work request into structured tasks:\n\n"${trimmed}"\n\nReturn a JSON object with:\n- summary: one-sentence overview\n- tasks: array of { title, description, priority (high|medium|low), estimatedMinutes (number), assigneeHint (which role should handle this), dependencies (array of task titles this depends on) }\n- totalEstimatedMinutes: sum of all task times\n- suggestedDeadline: a reasonable completion date\n\nOutput ONLY valid JSON, no markdown.`,
          filters: { source: 'smart-tasks' },
          analytics: { usageMetrics: {} },
          questionBankContext: { banks: [], relevantQuestionSamples: [] },
        }),
      })

      const data = await res.json()
      let parsed: DecompositionResult

      try {
        // Try parsing the answer as JSON
        const cleaned = (data.answer ?? '').replace(/```json|```/g, '').trim()
        parsed = JSON.parse(cleaned)
      } catch {
        // Fallback: create a simple decomposition
        parsed = {
          summary: 'AI-generated task breakdown based on your request.',
          tasks: [
            { id: taskId(), title: 'Review and refine request', description: trimmed, priority: 'high', estimatedMinutes: 30, assigneeHint: 'Requestor', dependencies: [] },
            { id: taskId(), title: 'Execute main work', description: 'Complete the core deliverable described above.', priority: 'medium', estimatedMinutes: 120, assigneeHint: 'Team member', dependencies: ['Review and refine request'] },
          ],
          totalEstimatedMinutes: 150,
          suggestedDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        }
      }

      // Add IDs to tasks
      parsed.tasks = parsed.tasks.map((t) => ({ ...t, id: taskId() }))
      setResult(parsed)
      setEditedTasks([...parsed.tasks])

      // Log usage
      logAIUsage({
        tenantId: aiContext.tenantId ?? '',
        userId: aiContext.userId,
        userName: currentUser?.fullName ?? currentUser?.displayName ?? 'Unknown',
        userRole: aiContext.userRole,
        featureName: 'smart_task',
        provider: 'perplexity',
        success: true,
        latencyMs: Date.now() - startTime,
        tokenEstimate: estimateTokens(trimmed + JSON.stringify(parsed)),
        briefSnippet: parsed.summary.slice(0, 100),
      })
    } catch (err: any) {
      setError(err.message || 'Task decomposition failed.')
      logAIUsage({
        tenantId: aiContext.tenantId ?? '',
        userId: aiContext.userId,
        userName: currentUser?.fullName ?? currentUser?.displayName ?? 'Unknown',
        userRole: aiContext.userRole,
        featureName: 'smart_task',
        provider: 'perplexity',
        success: false,
        errorMessage: err.message,
        latencyMs: Date.now() - startTime,
      })
    } finally {
      setBusy(false)
    }
  }, [prompt, busy, aiContext, currentUser])

  const updateTask = useCallback((taskId: string, updates: Partial<SmartTask>) => {
    setEditedTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, ...updates } : t))
  }, [])

  const deleteTask = useCallback((taskId: string) => {
    setEditedTasks((prev) => prev.filter((t) => t.id !== taskId))
  }, [])

  const addTask = useCallback(() => {
    setEditedTasks((prev) => [...prev, { id: taskId(), title: 'New task', description: '', priority: 'medium', estimatedMinutes: 30, assigneeHint: '', dependencies: [] }])
  }, [])

  const copyAsText = useCallback(async () => {
    const text = editedTasks.map((t, i) =>
      `${i + 1}. [${t.priority.toUpperCase()}] ${t.title} (${t.estimatedMinutes}min) — ${t.assigneeHint}\n   ${t.description}`
    ).join('\n\n')
    try {
      await navigator.clipboard.writeText(`Task Breakdown\n${result?.summary ?? ''}\n\n${text}\n\nTotal: ${result?.totalEstimatedMinutes ?? 0}min | Suggested: ${result?.suggestedDeadline ?? ''}`)
      onToast?.('Tasks copied to clipboard.')
    } catch { /* clipboard unavailable */ }
  }, [editedTasks, result, onToast])

  return (
    <section className="smart-tasks-panel">
      <div className="panel-heading-row">
        <div>
          <h2>Smart Task Decomposition</h2>
          <p>Describe a work item in plain language and let AI break it into structured, assignable tasks.</p>
        </div>
      </div>

      {/* Input area */}
      {!hasResult && (
        <div className="smart-tasks-input-area">
          {showExamples && (
            <div className="smart-tasks-examples">
              <p className="hint">Try one of these examples or write your own:</p>
              {EXAMPLE_PROMPTS.map((ex) => (
                <button key={ex.label} className="secondary-button compact" type="button" onClick={() => setPrompt(ex.prompt)}>
                  <Sparkles size={14} /> {ex.label}
                </button>
              ))}
            </div>
          )}
          <div className="smart-tasks-form">
            <textarea
              placeholder="Describe the work to break down... e.g., 'Plan and execute the Q3 compliance training rollout for 200 staff across 4 branches over the next 6 weeks.'"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              disabled={busy}
            />
            <button className="primary-button" type="button" onClick={handleDecompose} disabled={busy || !prompt.trim()}>
              <Sparkles size={16} /> {busy ? 'Decomposing…' : 'Decompose into tasks'}
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && <p className="inline-error">{error}</p>}

      {/* Results */}
      {hasResult && (
        <div className="smart-tasks-results">
          <div className="smart-tasks-summary">
            <div>
              <strong>Summary</strong>
              <p>{result.summary}</p>
            </div>
            <div className="smart-tasks-meta">
              <span><Clock size={14} /> {result.totalEstimatedMinutes} min total</span>
              <span><CalendarIcon size={14} /> Due: {result.suggestedDeadline}</span>
              <span><ListChecks size={14} /> {editedTasks.length} task(s)</span>
            </div>
          </div>

          <div className="smart-tasks-actions-bar">
            <button className="secondary-button compact" type="button" onClick={() => { setResult(null); setShowExamples(true); setPrompt('') }}>
              <RefreshCw size={14} /> New decomposition
            </button>
            <button className="secondary-button compact" type="button" onClick={addTask}>
              <Plus size={14} /> Add task
            </button>
            <button className="secondary-button compact" type="button" onClick={copyAsText}>
              <Copy size={14} /> Copy as text
            </button>
          </div>

          <div className="smart-tasks-list">
            {editedTasks.map((task, index) => (
              <div className={`smart-task-card priority-${task.priority}`} key={task.id}>
                <div className="smart-task-header">
                  <span className="smart-task-number">{index + 1}</span>
                  <input
                    className="smart-task-title-input"
                    value={task.title}
                    onChange={(e) => updateTask(task.id, { title: e.target.value })}
                  />
                  <select
                    className={`priority-badge ${task.priority}`}
                    value={task.priority}
                    onChange={(e) => updateTask(task.id, { priority: e.target.value as SmartTask['priority'] })}
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                  <button className="icon-button danger" type="button" onClick={() => deleteTask(task.id)} aria-label="Delete task">
                    <Trash2 size={14} />
                  </button>
                </div>
                <textarea
                  className="smart-task-desc-input"
                  value={task.description}
                  onChange={(e) => updateTask(task.id, { description: e.target.value })}
                  rows={2}
                />
                <div className="smart-task-footer">
                  <label>
                    <Clock size={12} /> Est. minutes
                    <input
                      type="number"
                      min={5}
                      max={480}
                      value={task.estimatedMinutes}
                      onChange={(e) => updateTask(task.id, { estimatedMinutes: Math.max(5, Number(e.target.value) || 30) })}
                    />
                  </label>
                  <label>
                    <UserRound size={12} /> Assignee
                    <input
                      type="text"
                      placeholder="Role or name"
                      value={task.assigneeHint}
                      onChange={(e) => updateTask(task.id, { assigneeHint: e.target.value })}
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

// ─── Mini Calendar Icon (inline SVG) ───────────────────────────────

function CalendarIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x={3} y={4} width={18} height={18} rx={2} ry={2} />
      <line x1={16} y1={2} x2={16} y2={6} />
      <line x1={8} y1={2} x2={8} y2={6} />
      <line x1={3} y1={10} x2={21} y2={10} />
    </svg>
  )
}

// ─── Gated Wrapper ─────────────────────────────────────────────────

/**
 * GatedSmartTasks — Wraps SmartTasks with AiGate.
 * Users on Starter plan see the upgrade prompt instead.
 */
export function GatedSmartTasks(props: SmartTasksProps) {
  return (
    <AiGate feature="smart_task" context={props.aiContext}>
      <SmartTasks {...props} />
    </AiGate>
  )
}
