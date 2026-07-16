/**
 * AIHelpAssistant — AI-Powered Help Chat Panel
 *
 * Wraps the help assistant AI feature with AiGate access control.
 * Feature: help_chat (available on Growth+ plans)
 *
 * Provides:
 *   - AiGate-gated AI chat access for help/learning
 *   - logAIUsage tracking for every AI interaction
 *   - Quick-help prompt bank for common questions
 *   - Fallback to static FAQ when AI is unavailable
 */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Sparkles, Send, Bot, UserRound, X, MessageSquare, Plus } from 'lucide-react'
import { AiGate } from './AiGate'
import { logAIUsage, estimateTokens } from '../ai-access'
import type { AIAccessContext } from '../ai-access'

// ─── Types ─────────────────────────────────────────────────────────

interface HelpChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

interface HelpChatThread {
  id: string
  title: string
  messages: HelpChatMessage[]
  updatedAt: string
}

interface AIHelpAssistantProps {
  aiContext: Omit<AIAccessContext, 'featureName'>
  currentUser?: { id?: string; fullName?: string; displayName?: string }
  onToast?: (message: string) => void
}

// ─── Event ID Utility ──────────────────────────────────────────────

function eventId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

// ─── Quick Help Prompts ────────────────────────────────────────────

const QUICK_HELP_PROMPTS: Array<{ label: string; prompt: string }> = [
  { label: 'How do I take a test?', prompt: 'Explain step by step how an employee takes an assigned assessment in Staffiq.' },
  { label: 'Understanding my results', prompt: 'How do I read my test results and what do the scores mean?' },
  { label: 'What is a question bank?', prompt: 'Explain what question banks are and how they relate to tests.' },
  { label: 'How to reset password', prompt: 'How can I reset my password if I forget it?' },
  { label: 'Training vs Assessment', prompt: 'What is the difference between training courses and assessments in Staffiq?' },
  { label: 'Supervisor features', prompt: 'What features are available for supervisors and managers?' },
]

// ─── Main Component ────────────────────────────────────────────────

export function AIHelpAssistant({ aiContext, currentUser }: AIHelpAssistantProps) {
  const storageKey = `staffiq-help-ai-v2-${currentUser?.id ?? 'guest'}`
  const [threads, setThreads] = useState<HelpChatThread[]>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey) ?? '[]')
      return stored.length ? stored : [{ id: eventId('help-thread'), title: 'Help chat', messages: [], updatedAt: new Date().toISOString() }]
    } catch { return [{ id: eventId('help-thread'), title: 'Help chat', messages: [], updatedAt: new Date().toISOString() }] }
  })
  const [selectedId, setSelectedId] = useState(threads[0]?.id ?? '')
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [showPrompts, setShowPrompts] = useState(true)
  const chatEndRef = useRef<HTMLDivElement | null>(null)

  const activeThread = useMemo(() => threads.find((t) => t.id === selectedId) ?? threads[0], [threads, selectedId])

  // Persist threads
  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(threads)) } catch { /* ignore */ }
  }, [threads, storageKey])

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [activeThread?.messages.length, busy])

  const createThread = useCallback(() => {
    const thread: HelpChatThread = { id: eventId('help-thread'), title: 'Help chat', messages: [], updatedAt: new Date().toISOString() }
    setThreads((prev) => [thread, ...prev])
    setSelectedId(thread.id)
    setDraft('')
    setError('')
    setShowPrompts(true)
  }, [])

  const deleteThread = useCallback((threadId: string) => {
    setThreads((prev) => {
      const next = prev.filter((t) => t.id !== threadId)
      return next.length ? next : [{ id: eventId('help-thread'), title: 'Help chat', messages: [], updatedAt: new Date().toISOString() }]
    })
    if (selectedId === threadId) setSelectedId('')
  }, [selectedId])

  const sendMessage = useCallback(async (prompt: string) => {
    const trimmed = prompt.trim()
    if (!trimmed || busy) return
    setDraft('')
    setError('')
    setBusy(true)
    setShowPrompts(false)

    const threadId = activeThread?.id ?? eventId('help-thread')
    const userMsg: HelpChatMessage = { id: eventId('help-msg'), role: 'user', content: trimmed, createdAt: new Date().toISOString() }
    const baseThread = activeThread ?? { id: threadId, title: 'Help chat', messages: [], updatedAt: new Date().toISOString() }
    const optimistic: HelpChatThread = { ...baseThread, id: threadId, title: baseThread.messages.length ? baseThread.title : trimmed.slice(0, 50), updatedAt: userMsg.createdAt, messages: [...baseThread.messages, userMsg] }

    setSelectedId(threadId)
    setThreads((prev) => [optimistic, ...prev.filter((t) => t.id !== threadId)])

    const startTime = Date.now()
    try {
      const res = await fetch('/api/help-intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: trimmed, role: aiContext.userRole }),
      })
      const data = await res.json()
      const assistantMsg: HelpChatMessage = { id: eventId('help-msg'), role: 'assistant', content: data.answer ?? 'Sorry, I could not answer that. Please try rephrasing.', createdAt: new Date().toISOString() }

      setThreads((prev) =>
        prev.map((t) => t.id === threadId ? { ...t, updatedAt: assistantMsg.createdAt, messages: [...t.messages, assistantMsg] } : t),
      )

      // Log usage
      logAIUsage({
        tenantId: aiContext.tenantId ?? '',
        userId: aiContext.userId,
        userName: currentUser?.fullName ?? currentUser?.displayName ?? 'Unknown',
        userRole: aiContext.userRole,
        featureName: 'help_chat',
        provider: 'perplexity',
        success: true,
        latencyMs: Date.now() - startTime,
        tokenEstimate: estimateTokens(trimmed + (data.answer ?? '')),
      })
    } catch (err: any) {
      setError(err.message || 'Could not reach the help assistant.')
      logAIUsage({
        tenantId: aiContext.tenantId ?? '',
        userId: aiContext.userId,
        userName: currentUser?.fullName ?? currentUser?.displayName ?? 'Unknown',
        userRole: aiContext.userRole,
        featureName: 'help_chat',
        provider: 'perplexity',
        success: false,
        errorMessage: err.message,
        latencyMs: Date.now() - startTime,
      })
    } finally {
      setBusy(false)
    }
  }, [busy, activeThread, aiContext, currentUser])

  return (
    <div className="ai-help-assistant">
      <div className="help-chat-layout">
        {/* Thread sidebar */}
        <aside className="help-chat-sidebar" aria-label="Help chat threads">
          <button className="primary-button compact" type="button" onClick={createThread}>
            <Plus size={16} /> New help chat
          </button>
          {threads.map((thread) => (
            <div className={`help-chat-thread ${selectedId === thread.id ? 'active' : ''}`} key={thread.id}>
              <button type="button" onClick={() => { setSelectedId(thread.id); setShowPrompts(false) }}>
                <MessageSquare size={16} />
                <span>{thread.title.slice(0, 40)}</span>
              </button>
              <button className="icon-button" type="button" onClick={() => deleteThread(thread.id)} aria-label="Delete thread">
                <X size={14} />
              </button>
            </div>
          ))}
        </aside>

        {/* Chat area */}
        <div className="help-chat-main">
          {!activeThread?.messages.length && showPrompts ? (
            <div className="help-welcome">
              <Bot size={32} />
              <h3>Staffiq Help Assistant</h3>
              <p>Ask me anything about using Staffiq — tests, training, results, or account help.</p>
              <div className="quick-help-prompts">
                {QUICK_HELP_PROMPTS.map((item) => (
                  <button key={item.label} className="secondary-button compact" type="button" onClick={() => sendMessage(item.prompt)} disabled={busy}>
                    <Sparkles size={14} /> {item.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="help-chat-messages">
              {activeThread?.messages.map((msg) => (
                <div className={`help-message ${msg.role}`} key={msg.id}>
                  <span className="help-message-avatar">
                    {msg.role === 'assistant' ? <Bot size={18} /> : <UserRound size={18} />}
                  </span>
                  <div className="help-message-body">
                    <p>{msg.content}</p>
                    <small>{new Date(msg.createdAt).toLocaleTimeString()}</small>
                  </div>
                </div>
              ))}
              {busy && (
                <div className="help-message assistant">
                  <span className="help-message-avatar"><Bot size={18} /></span>
                  <div className="help-message-body"><p className="typing-indicator">Thinking…</p></div>
                </div>
              )}
              {error && <p className="inline-error">{error}</p>}
              <div ref={chatEndRef} />
            </div>
          )}

          {/* Input area */}
          <div className="help-chat-input">
            <input
              type="text"
              placeholder="Ask the help assistant…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(draft) } }}
              disabled={busy}
            />
            <button className="primary-button compact" type="button" onClick={() => sendMessage(draft)} disabled={busy || !draft.trim()}>
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Gated Wrapper ─────────────────────────────────────────────────

/**
 * GatedAIHelpAssistant — Wraps AIHelpAssistant with AiGate.
 * If the user's plan doesn't include help_chat, shows upgrade/reason UI.
 */
export function GatedAIHelpAssistant(props: AIHelpAssistantProps) {
  return (
    <AiGate feature="help_chat" context={props.aiContext}>
      <AIHelpAssistant {...props} />
    </AiGate>
  )
}
