# StaffiQ AI Governance & Usage Analytics — Complete Feature Plan

> **Version**: 1.0
> **Date**: 2026-07-16
> **Author**: VS Code Copilot (V4 Pro)
> **Status**: Planning — awaiting approval for implementation

---

## Table of Contents

1. [Overview](#1-overview)
2. [Current State Analysis](#2-current-state-analysis)
3. [Data Architecture](#3-data-architecture)
4. [Access Control Model](#4-access-control-model)
5. [UI State Specification](#5-ui-state-specification)
6. [Smart Task Generation Tracking](#6-smart-task-generation-tracking)
7. [SuperAdmin Cross-Tenant Dashboard](#7-superadmin-cross-tenant-dashboard)
8. [Privacy & Data Retention](#8-privacy--data-retention)
9. [Implementation Roadmap](#9-implementation-roadmap)
10. [API Contracts](#10-api-contracts)
11. [Testing Strategy](#11-testing-strategy)

---

## 1. Overview

### 1.1 Purpose

This document defines the complete feature specification for AI usage tracking, access governance, and cross-tenant analytics across the StaffiQ multi-tenant assessment platform. It covers every stage from user interaction to SuperAdmin oversight.

### 1.2 Business Context

StaffiQ currently advertises AI features as a Growth-plan (N12,500/user) and above benefit. Without governance infrastructure, there is no way to:
- Verify that Starter-plan tenants are not accessing AI
- Track which tenants use AI the most
- Understand whether AI is improving outcomes
- Control AI access granularly
- Bill or forecast AI API costs

### 1.3 Key Principles

1. **Every AI interaction is logged** — no exceptions, no silent failures
2. **Access control is hierarchical** — Tenant > User > Feature
3. **UI never lies** — users always know why AI is or isn't available
4. **Privacy by design** — prompts are hashed, not stored in plaintext
5. **SuperAdmin sees everything** — cross-tenant visibility is non-negotiable
6. **Plan-based gating is automatic** — Starter plan = no AI, no manual toggling needed

---

## 2. Current State Analysis

### 2.1 Existing AI Infrastructure

| Component | Location | Status |
|-----------|----------|--------|
| AI Intelligence API | `requestAiIntelligence()` in `App.tsx` | Deployed (calls Perplexity Sonar) |
| AI Chat Types | `AiChatMessage`, `AiChatThread`, `AiIntelligencePayload` | Defined |
| Admin Analytics Chat | Analytics view in `App.tsx` | Deployed |
| Help Chat | Help view | Deployed |
| Client-side AI Insights | `src/ai-insights.ts` | Built (not yet integrated) |
| AI Recommendations | `recommendationCatalogue.ts` — Priority 4 theme | Planned |
| AI Usage Report idea | `reportingAnalyticsIdeas.ts` — line 38 | Planned |

### 2.2 Existing Tenant Infrastructure

| Component | Location | Status |
|-----------|----------|--------|
| Multi-tenant types | `src/tenant.ts` — `Tenant`, `TenantSession`, `TenantPlan` | Deployed |
| Tenant directory | `listTenantDirectory()`, tenant CRUD functions | Deployed |
| Tenant plans | `TenantPlan` type | Deployed (not currently enforced for AI) |
| SuperAdmin isolation | `src/superadmin/` | Scaffolded |

### 2.3 Identified Gaps

1. **No AI usage logging** — interactions happen but are not recorded
2. **No plan enforcement** — Starter tenants can access AI if they discover the endpoints
3. **No access toggles** — SuperAdmin cannot disable AI per tenant or user
4. **No UI gating** — AI buttons always appear regardless of plan
5. **No analytics** — no way to know who uses AI or how much it costs
6. **No rate limiting** — users can make unlimited AI calls

---

## 3. Data Architecture

### 3.1 Entity: `AiUsageLog`

The atomic record of a single AI interaction. Stored in Firestore, collection `aiUsageLogs`.

```typescript
interface AiUsageLog {
  id: string                    // Unique ID: `ai-log-${eventId()}`
  tenantId: string              // Tenant workspace ID
  userId: string                // User who initiated the AI call
  userName: string              // Denormalized for display
  userRole: string              // Role at time of interaction
  
  // Feature identification
  feature: AiFeature            // Which AI capability was used
  
  // Prompt data (privacy-preserving)
  promptHash: string            // SHA-256 hash of the full prompt
  promptLength: number          // Character count of prompt
  promptCategory?: string       // Auto-classified: 'analytics', 'task', 'help', 'repair'
  
  // Response data
  model: string                 // AI model used (e.g., 'sonar-pro')
  responseLength: number        // Character count of response
  latencyMs: number             // Time from request to response
  tokensUsed: number            // Estimated token count (prompt + response)
  
  // Outcome
  outcome: AiOutcome            // 'success' | 'error' | 'timeout' | 'rate_limited' | 'blocked'
  errorCode?: string            // Error code if failed
  errorMessage?: string         // Human-readable error
  
  // User engagement
  accepted?: boolean             // Did the user accept/apply the AI output?
  modified?: boolean             // Did the user modify the AI output before applying?
  dismissedAt?: string           // If the user dismissed the output
  
  // Smart Task specific
  taskGenerated?: boolean        // Did this prompt generate a task?
  taskId?: string                // ID of the generated task (for linking)
  
  // Timestamps
  createdAt: string              // ISO 8601
  tenantPlanAtTime: string       // Snapshot: what plan was the tenant on?
}

type AiFeature =
  | 'admin_chat'          // Analytics intelligence chat
  | 'smart_task'          // Smart task generation
  | 'ai_insights'         // Skill gap analysis
  | 'executive_brief'     // AI executive brief generation
  | 'help_chat'           // Employee help/intelligence chat
  | 'codex_repair'        // Codex bug repair prompt generation
  | 'training_recommend'  // AI training recommendations

type AiOutcome = 'success' | 'error' | 'timeout' | 'rate_limited' | 'blocked'
```

### 3.2 Entity: `AiAccessPolicy`

Per-tenant AI access configuration. Stored in Firestore, document `aiAccessPolicies/{tenantId}`.

```typescript
interface AiAccessPolicy {
  tenantId: string
  
  // Master switch
  aiEnabled: boolean               // Global AI on/off for this tenant
  
  // Plan-derived default (computed, not stored)
  // Starter → aiEnabled: false
  // Growth → aiEnabled: true, features: ['admin_chat', 'smart_task', 'ai_insights', 'executive_brief', 'help_chat', 'training_recommend']
  // Command → aiEnabled: true, all features + 'codex_repair'
  
  // Feature-level toggles
  allowedFeatures: AiFeature[]    // Which AI features are enabled
  
  // Per-user overrides
  userOverrides: Record<string, {  // Key = userId
    aiEnabled: boolean
    allowedFeatures?: AiFeature[]
  }>
  
  // Rate limits
  rateLimitPerUserPerDay: number   // Default: 50 for Growth, 200 for Command
  rateLimitPerTenantPerDay: number // Default: 500 for Growth, 2000 for Command
  
  // Metadata
  updatedBy: string                // Who last modified
  updatedAt: string                // ISO 8601
  notes?: string                   // Reason for change
}
```

### 3.3 Entity: `AiUsageAggregate`

Pre-computed daily/weekly/monthly aggregates. Stored in Firestore, collection `aiUsageAggregates`.

```typescript
interface AiUsageAggregate {
  id: string                       // `${tenantId}_${period}_${periodStart}`
  tenantId: string
  tenantName: string               // Denormalized
  
  period: 'daily' | 'weekly' | 'monthly'
  periodStart: string              // ISO 8601 — start of period
  periodEnd: string                // ISO 8601 — end of period
  
  // Counts
  totalPrompts: number
  successfulPrompts: number
  failedPrompts: number
  rateLimitedPrompts: number
  blockedPrompts: number
  
  // Users
  uniqueUsers: number
  activeAiUsers: string[]          // User IDs (for drill-down)
  
  // By feature
  byFeature: Record<AiFeature, {
    prompts: number
    successRate: number
    avgLatencyMs: number
  }>
  
  // Cost
  estimatedCostUsd: number         // Based on token count × Perplexity pricing
  
  // Engagement
  acceptanceRate: number           // % of outputs accepted without modification
  modificationRate: number         // % of outputs modified before use
  
  // Computed at
  computedAt: string               // ISO 8601
}
```

### 3.4 Integration with Existing Systems

| Existing System | Integration Point |
|----------------|------------------|
| `AnalyticsEvent` | Add `eventType: 'ai_interaction'` — links to `AiUsageLog.id` |
| `AuditEvent` | Log policy changes (AI toggle, rate limit change) to audit trail |
| `TenantSession` | AI access check runs against the active tenant's `AiAccessPolicy` |
| `User` | Per-user AI override stored in `AiAccessPolicy.userOverrides[userId]` |

---

## 4. Access Control Model

### 4.1 Decision Flow

When a user triggers any AI feature, the access check runs in this order:

```
1. Is the tenant on a plan that allows AI?
   ├─ Starter (N7,500)  → AI BLOCKED (all features)
   ├─ Growth (N12,500)  → AI ALLOWED (core features)
   └─ Command (N15,000) → AI ALLOWED (all features)

2. Is AI globally enabled for the tenant?
   ├─ No  → AI BLOCKED (admin disabled)
   └─ Yes → Continue

3. Is this specific AI feature enabled for the tenant?
   ├─ No  → AI BLOCKED (feature not in allowedFeatures)
   └─ Yes → Continue

4. Does the user have a per-user override?
   ├─ Override: disabled → AI BLOCKED (user-specific)
   ├─ Override: enabled  → AI ALLOWED (bypasses other checks except plan)
   └─ No override        → Continue

5. Has the user hit their daily rate limit?
   ├─ Yes → AI BLOCKED (rate limited — retry at midnight)
   └─ No  → Continue

6. Has the tenant hit their daily rate limit?
   ├─ Yes → AI BLOCKED (tenant rate limited)
   └─ No  → AI ALLOWED ✓
```

### 4.2 Plan-Based Default Policies

#### Starter Plan (N7,500/user)
```json
{
  "aiEnabled": false,
  "allowedFeatures": [],
  "rateLimitPerUserPerDay": 0,
  "rateLimitPerTenantPerDay": 0
}
```
All AI features are blocked. Users see upgrade messaging. No API calls are possible.

#### Growth Plan (N12,500/user)
```json
{
  "aiEnabled": true,
  "allowedFeatures": [
    "admin_chat",
    "smart_task", 
    "ai_insights",
    "executive_brief",
    "help_chat",
    "training_recommend"
  ],
  "rateLimitPerUserPerDay": 50,
  "rateLimitPerTenantPerDay": 500
}
```
Core AI features enabled. `codex_repair` excluded (Command only).

#### Command Plan (N15,000/user)
```json
{
  "aiEnabled": true,
  "allowedFeatures": [
    "admin_chat",
    "smart_task",
    "ai_insights", 
    "executive_brief",
    "help_chat",
    "training_recommend",
    "codex_repair"
  ],
  "rateLimitPerUserPerDay": 200,
  "rateLimitPerTenantPerDay": 2000
}
```
All AI features enabled with higher rate limits.

### 4.3 Access Check Function (Reference Implementation)

```typescript
type AiAccessResult = 
  | { allowed: true }
  | { allowed: false; reason: AiBlockReason; message: string; action: 'upgrade' | 'contact_admin' | 'retry_later' | 'not_available' }

type AiBlockReason = 
  | 'plan_restricted'       // Starter plan
  | 'tenant_disabled'       // Admin turned off AI
  | 'feature_disabled'      // Specific feature not in allowed list
  | 'user_disabled'         // User-level override
  | 'user_rate_limited'     // User hit daily limit
  | 'tenant_rate_limited'   // Tenant hit daily limit
  | 'backend_unavailable'   // AI service is down

function checkAiAccess(
  tenant: Tenant,
  policy: AiAccessPolicy,
  user: User,
  feature: AiFeature,
  usageToday: { userCount: number; tenantCount: number }
): AiAccessResult {
  // Implementation follows the decision flow in section 4.1
}
```

---

## 5. UI State Specification

### 5.1 State Matrix

| State | Button Appearance | Icon | Tooltip/Message | Action |
|-------|------------------|------|-----------------|--------|
| **Available** | Full color (lime green bg) | ✨ Sparkle | None — button is active | Triggers AI feature |
| **Plan gated** (Starter) | Grey, 50% opacity, `cursor: not-allowed` | 🔒 Lock | "AI features available on Growth plan (N12,500/user). Upgrade to unlock." | Opens pricing/upgrade dialog |
| **Admin disabled** | Grey, 50% opacity | ⚙️ Settings | "AI features disabled by your workspace admin. Contact [admin]." | None — informational only |
| **Feature disabled** | Grey, 50% opacity | 🚫 | "This AI feature is not included in your workspace configuration." | None |
| **User disabled** | **Hidden entirely** | — | Subtle banner on first visit: "Your AI access has been updated." | None |
| **Rate limited** | Grey + countdown timer | ⏳ Timer | "Daily limit reached. Resets at midnight. [Admin] can increase your limit." | Shows countdown |
| **Backend down** | Amber/warning bg | ⚠️ Warning | "AI is temporarily unavailable. Retrying in [30s]." | Auto-retry |

### 5.2 UI Component: `<AiGate>`

A wrapper component that handles all AI access states:

```typescript
interface AiGateProps {
  feature: AiFeature
  children: ReactNode
  fallback?: ReactNode                    // Custom fallback UI
  showUpsell?: boolean                    // Show upgrade card for plan-gated
  onAccessDenied?: (result: AiAccessResult) => void
}

function AiGate({ feature, children, fallback, showUpsell, onAccessDenied }: AiGateProps) {
  const access = useAiAccess(feature)
  
  if (access.allowed) return <>{children}</>
  
  onAccessDenied?.(access)
  
  if (fallback) return <>{fallback}</>
  
  return <AiBlockedState result={access} showUpsell={showUpsell} />
}
```

Usage:
```tsx
<AiGate feature="smart_task" showUpsell>
  <button onClick={generateTask} className="ai-button">
    <Sparkles /> Generate smart draft
  </button>
</AiGate>
```

### 5.3 Upgrade Nudge Component

For Starter-plan users who encounter AI features:

```
┌─────────────────────────────────────────────┐
│ 🔒  AI Features Require Growth Plan         │
│                                             │
│  Smart task generation, AI analytics chat,   │
│  and executive briefs are available on the   │
│  Growth plan at N12,500 per user monthly.    │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │ Starter  │  Growth ✨  │  Command   │    │
│  │ N7,500   │  N12,500   │  N15,000   │    │
│  │ ---      │  AI + Core │  All + AI  │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  [Contact admin about upgrading]            │
└─────────────────────────────────────────────┘
```

### 5.4 "Generate Smart Draft" Button States

This is the most visible AI button — it deserves detailed specification.

#### State: Available (Growth/Command, all checks pass)
```
┌──────────────────────────────┐
│ ✨  Generate smart draft     │  ← Lime green background
└──────────────────────────────┘     Full hover effect, cursor: pointer
```

#### State: Plan-gated (Starter)
```
┌──────────────────────────────┐
│ 🔒  Generate smart draft     │  ← Grey, 50% opacity
└──────────────────────────────┘     cursor: not-allowed
     Tooltip on hover: "AI features available on Growth plan and above"
```

#### State: Rate-limited
```
┌──────────────────────────────┐
│ ⏳  Generate smart draft     │  ← Grey, countdown "Resets in 4h 23m"
└──────────────────────────────┘
```

#### State: User-disabled
```
                                │  ← Button does not exist in DOM
                                │     Replaced by nothing (no gap, no ghost)
```

---

## 6. Smart Task Generation Tracking

### 6.1 Feature Definition

"Smart Task generation" allows admins to describe a training need in natural language, and the AI generates a structured task (test, assessment, or training module) with questions, topics, difficulty levels, and scoring rules.

### 6.2 Tracking Events

Each Smart Task interaction generates a chain of `AiUsageLog` records:

| Event | `feature` | Additional Fields |
|-------|-----------|-------------------|
| User opens Smart Task dialog | `smart_task` | `outcome: 'success'`, `taskGenerated: false` |
| User submits prompt for task generation | `smart_task` | `promptHash`, `promptLength`, `promptCategory: 'task'` |
| AI returns task draft | `smart_task` | `responseLength`, `latencyMs`, `tokensUsed` |
| User accepts task as-is | `smart_task` | `accepted: true`, `modified: false`, `taskId` |
| User modifies then accepts | `smart_task` | `accepted: true`, `modified: true`, `taskId` |
| User rejects/dismisses draft | `smart_task` | `accepted: false`, `dismissedAt` |
| User regenerates (new prompt) | `smart_task` | New log entry (linked via parent log ID) |
| Generated task is deployed/launched | `smart_task` | `taskGenerated: true`, `taskId` |

### 6.3 Smart Task Analytics Queries

The SuperAdmin dashboard should answer these questions:

1. **Adoption**: What % of tenants use Smart Tasks? What % of admins within each tenant?
2. **Quality**: What % of generated tasks are accepted without modification? (High modification rate = AI output needs improvement)
3. **Volume**: How many tasks are generated per tenant per week?
4. **Prompts**: What are the most common prompt patterns? (From hashed categories, not raw text)
5. **ROI**: Time saved estimate = (tasks generated × 30 min) − (time spent editing)
6. **Errors**: What % of generation attempts fail? Why?

### 6.4 Smart Task Dashboard Panel (SuperAdmin)

```
┌─────────────────────────────────────────────────────────┐
│ Smart Task Generation Analytics          [Export CSV]   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐ │
│  │ Generated │ │ Accepted │ │ Modified │ │ Avg Time  │ │
│  │  1,247    │ │  892     │ │  34%     │ │  2.3s     │ │
│  │  tasks    │ │  71%     │ │ modified │ │ per gen   │ │
│  └──────────┘ └──────────┘ └──────────┘ └───────────┘ │
│                                                         │
│  Tasks by Tenant (last 30 days)                         │
│  ┌──────────────┬──────┬───────┬──────┬────────┐       │
│  │ Tenant       │ Gen  │ Accept│ Mod% │ Errors │       │
│  │ IICOCECE     │ 423  │ 78%   │ 28%  │ 3      │       │
│  │ RevenStrat   │ 312  │ 65%   │ 42%  │ 5      │       │
│  │ DemoCorp     │ 89   │ 92%   │ 12%  │ 0      │       │
│  └──────────────┴──────┴───────┴──────┴────────┘       │
│                                                         │
│  ⚠ Attention: RevenStrat has 42% modification rate     │
│    — AI output may need tuning for this tenant's needs. │
└─────────────────────────────────────────────────────────┘
```

---

## 7. SuperAdmin Cross-Tenant Dashboard

### 7.1 AI Governance Console Layout

The console is a dedicated view accessible only to Platform Owner (SuperAdmin), reachable from the SuperAdmin panel.

```
┌──────────────────────────────────────────────────────────────┐
│ 🧠 AI Governance Console                 Platform Owner Only │
├──────────────────────────────────────────────────────────────┤
│ [Overview] [Tenants] [Access Control] [Smart Tasks] [Audit]  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  [Period: Last 30 days ▼]  [Export Report]  [Refresh]        │
│                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ Total    │ │ Active   │ │ Avg Resp │ │ Est. API │       │
│  │ Prompts  │ │ AI Users │ │ Time     │ │ Cost     │       │
│  │          │ │          │ │          │ │          │       │
│  │ 12,847   │ │ 342      │ │ 1.2s     │ │ $47.20   │       │
│  │ ↑12%     │ │ ↑8%      │ │ ↓0.1s    │ │ ↑$5.30   │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ Success  │ │ Rate     │ │ Smart    │ │ Anomalies│       │
│  │ Rate     │ │ Limited  │ │ Tasks    │ │ Detected │       │
│  │          │ │          │ │          │ │          │       │
│  │ 96.2%    │ │ 124      │ │ 1,247    │ │ 2 ⚠     │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│                                                              │
│  ─────────────── Tenant Breakdown ──────────────────────     │
│                                                              │
│  Search: [_______________]  Filter: [All Plans ▼]            │
│                                                              │
│  ┌──────────┬──────┬───────┬───────┬──────┬──────┬──────┐  │
│  │ Tenant   │ Plan │Prompts│ Users │ Cost │ Succ │Anom?│  │
│  │          │      │       │       │      │ Rate │     │  │
│  ├──────────┼──────┼───────┼───────┼──────┼──────┼──────┤  │
│  │IICOCECE  │ Cmd  │ 3,421 │ 89    │$12.50│ 97%  │  —   │  │
│  │RevenStrat│ Grw  │ 2,103 │ 45    │$8.20 │ 94%  │ ⚠   │  │
│  │DemoCorp  │ Grw  │ 892   │ 23    │$3.10 │ 99%  │  —   │  │
│  │StartupNG │ Strt │   0   │  0    │$0.00 │  —   │  —   │  │
│  │...       │ ...  │ ...   │ ...   │ ...  │ ...  │ ...  │  │
│  └──────────┴──────┴───────┴───────┴──────┴──────┴──────┘  │
│                                                              │
│  ─────────────── Anomaly Detection ─────────────────────     │
│                                                              │
│  ⚠ CRITICAL: RevenStrat — 340% spike in AI usage            │
│    (2 hours ago). 45 prompts in 30 minutes vs avg 8/hr.     │
│    [Investigate] [Set Rate Limit]                            │
│                                                              │
│  ⚠ WARNING: DemoCorp — 12 consecutive errors in last hour   │
│    All returning "AI backend unavailable."                   │
│    [Check Backend Status]                                    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 7.2 Access Control Tab

```
┌──────────────────────────────────────────────────────────────┐
│ Access Control                  [Search tenant or user...]    │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Tenant: IICOCECE (Command)  [AI: ● ON]                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Feature              │ Enabled │ Rate Limit/User/Day │   │
│  │ Admin Chat           │   ☑    │   200               │   │
│  │ Smart Tasks          │   ☑    │   50                │   │
│  │ AI Insights          │   ☑    │   — (on-demand)     │   │
│  │ Executive Brief      │   ☑    │   20                │   │
│  │ Help Chat            │   ☑    │   100               │   │
│  │ Training Recommend   │   ☑    │   50                │   │
│  │ Codex Repair         │   ☑    │   10                │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  User Overrides:                    [+ Add User Override]    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ User              │ AI Access │ Features             │   │
│  │ john.doe@iicoc    │ ● ON      │ All default          │   │
│  │ jane.smith@iicoc  │ ○ OFF     │ —                    │   │
│  │ temp.worker@iicoc │ ◐ LIMITED │ Chat only, 10/day    │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  Tenant Rate Limits:                                         │
│  Daily: [2000] prompts    Current today: 342                 │
│                                                              │
│  [Save Changes]  [Reset to Plan Defaults]                    │
└──────────────────────────────────────────────────────────────┘
```

### 7.3 Audit Log Tab

Shows every AI access policy change across all tenants:

```
┌──────────────────────────────────────────────────────────────┐
│ AI Governance Audit Log                                       │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────┬──────────┬──────────┬────────────────────┐  │
│  │ Date       │ Actor    │ Tenant   │ Action             │  │
│  ├────────────┼──────────┼──────────┼────────────────────┤  │
│  │2026-07-16  │ Ayodeji  │ IICOCECE │ Enabled Smart Tasks│  │
│  │ 14:32      │ Falope   │          │ for all users      │  │
│  ├────────────┼──────────┼──────────┼────────────────────┤  │
│  │2026-07-16  │ Ayodeji  │ RevenStr │ Disabled AI for    │  │
│  │ 13:15      │ Falope   │          │ user jane.smith    │  │
│  ├────────────┼──────────┼──────────┼────────────────────┤  │
│  │2026-07-16  │ Admin    │ DemoCorp │ Increased rate     │  │
│  │ 10:00      │ (Mary)   │          │ limit to 100/day   │  │
│  └────────────┴──────────┴──────────┴────────────────────┘  │
│                                                              │
│  [Export Audit Log]  [Filter by Tenant]  [Filter by Actor]   │
└──────────────────────────────────────────────────────────────┘
```

---

## 8. Privacy & Data Retention

### 8.1 What is NOT Stored

- **Raw prompt text** — Only SHA-256 hashes are stored. The hash can verify if two prompts are identical, but cannot recover the original text.
- **AI response content** — Only metadata (length, latency, tokens) is stored. The actual AI-generated text is in the chat thread or task, not in the usage log.
- **Personally sensitive prompt content** — Even the hash is discarded if the hash matches known sensitive patterns (optional).

### 8.2 What SuperAdmin CAN See

| Data Point | Visible? | Notes |
|-----------|----------|-------|
| Which tenant used AI | ✅ Yes | Core metric |
| Which user used AI | ✅ Yes | Per-user breakdown |
| Which AI feature was used | ✅ Yes | Feature analytics |
| When AI was used | ✅ Yes | Timestamp |
| Whether AI output was accepted | ✅ Yes | Quality metric |
| Prompt category | ✅ Yes | Auto-classified only |
| Raw prompt text | ❌ No | Hashed for privacy |
| AI response content | ❌ No | Not stored in usage log |
| Estimated API cost | ✅ Yes | For billing/forecasting |

### 8.3 Data Retention Policy

| Data | Retention | Notes |
|------|-----------|-------|
| `AiUsageLog` (raw) | 90 days | Individual interaction records |
| `AiUsageAggregate` (daily) | 1 year | Daily rollups |
| `AiUsageAggregate` (monthly) | 3 years | Monthly rollups |
| `AiAccessPolicy` audit | Indefinite | Policy change history |
| Prompt hashes | 90 days | Aligned with raw log retention |

---

## 9. Implementation Roadmap

### Phase 1: Infrastructure & Logging (Days 1-5)

**Goal**: Every AI interaction is logged. Zero UI changes.

1. Create TypeScript types for `AiUsageLog`, `AiAccessPolicy`, `AiUsageAggregate`
2. Create Firestore collections: `aiUsageLogs`, `aiAccessPolicies`, `aiUsageAggregates`
3. Add logging wrapper around `requestAiIntelligence()` — log before and after every call
4. Add logging wrapper around `requestHelpIntelligence()`
5. Add logging to client-side AI insights (`src/ai-insights.ts`)
6. Create Firestore indexes for efficient querying
7. **Test**: Verify logs appear in Firestore after AI interactions

### Phase 2: Access Control (Days 6-10)

**Goal**: Starter tenants cannot use AI. SuperAdmin can toggle per tenant.

8. Create default `AiAccessPolicy` for each plan tier
9. Implement `checkAiAccess()` function
10. Add plan-based gating: block all AI for Starter tenants
11. Create SuperAdmin Access Policy editor UI (within `src/superadmin/`)
12. Implement tenant-level AI toggle
13. Implement per-user AI overrides
14. **Test**: Verify Starter tenant gets blocked, Growth tenant gets through

### Phase 3: UI States (Days 11-15)

**Goal**: Users see appropriate UI for their AI access level.

15. Build `<AiGate>` wrapper component
16. Implement all 5 disabled states (plan-gated, admin-disabled, feature-disabled, user-disabled, rate-limited)
17. Build `AiBlockedState` component with appropriate messaging per state
18. Build upgrade nudge component for Starter users
19. Add rate limiting with countdown UI
20. **Test**: Verify correct UI state for every scenario

### Phase 4: SuperAdmin Dashboard (Days 16-22)

**Goal**: Platform Owner sees cross-tenant AI analytics.

21. Build AI Governance Console shell with tabs
22. Implement Overview tab with aggregate metrics cards
23. Implement Tenant Breakdown table with sorting/filtering
24. Implement anomaly detection algorithms (spike detection, error rate monitoring)
25. Build Access Control tab with per-tenant/per-user toggles
26. Build Smart Task analytics panel
27. Build Audit Log tab
28. Add CSV export for all data views
29. **Test**: Verify SuperAdmin sees accurate cross-tenant data

### Phase 5: Aggregation & Cost Tracking (Days 23-28)

**Goal**: Efficient analytics with cost visibility.

30. Build daily aggregation Cloud Function (runs at midnight)
31. Build weekly/monthly aggregation
32. Integrate Perplexity pricing for cost estimation
33. Add cost tracking to SuperAdmin dashboard
34. Add cost alerts (notify if cost exceeds threshold)
35. **Test**: Verify aggregates match raw log data

### Phase 6: Polish & Documentation (Days 29-35)

36. Add AI usage to the main app analytics export
37. Create `docs/AI_GOVERNANCE_USER_GUIDE.md`
38. Add tooltips and help text throughout the governance console
39. Performance optimization for large tenant datasets
40. Security audit of access control logic
41. End-to-end testing with multiple tenants

---

## 10. API Contracts

### 10.1 Log AI Usage

```
POST /api/ai-usage/log
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  "tenantId": "tenant_iicoc",
  "feature": "smart_task",
  "promptHash": "sha256:abc123...",
  "promptLength": 245,
  "promptCategory": "task",
  "model": "sonar-pro",
  "responseLength": 1200,
  "latencyMs": 2340,
  "tokensUsed": 450,
  "outcome": "success",
  "accepted": true,
  "modified": false
}

Response (201):
{
  "id": "ai-log-20260716-00001",
  "logged": true
}
```

### 10.2 Check AI Access

```
GET /api/ai-access/check?tenantId=tenant_iicoc&userId=user123&feature=smart_task
Authorization: Bearer <token>

Response (200):
{
  "allowed": true
}

Response (200) — blocked:
{
  "allowed": false,
  "reason": "plan_restricted",
  "message": "AI features are available on the Growth plan and above.",
  "action": "upgrade"
}
```

### 10.3 Update AI Access Policy

```
PATCH /api/ai-access/policy
Authorization: Bearer <token>  // SuperAdmin only
Content-Type: application/json

Request:
{
  "tenantId": "tenant_iicoc",
  "aiEnabled": true,
  "allowedFeatures": ["admin_chat", "smart_task", "ai_insights"],
  "userOverrides": {
    "user456": { "aiEnabled": false }
  },
  "rateLimitPerUserPerDay": 100
}

Response (200):
{
  "updated": true,
  "policy": { ... }
}
```

### 10.4 Get AI Usage Aggregates

```
GET /api/ai-usage/aggregates?period=daily&start=2026-07-01&end=2026-07-16
Authorization: Bearer <token>  // SuperAdmin only

Response (200):
{
  "aggregates": [
    {
      "tenantId": "tenant_iicoc",
      "tenantName": "IICOCECE",
      "totalPrompts": 3421,
      "uniqueUsers": 89,
      "byFeature": {
        "smart_task": { "prompts": 1203, "successRate": 0.96 },
        "admin_chat": { "prompts": 1800, "successRate": 0.98 }
      },
      "estimatedCostUsd": 12.50
    }
  ]
}
```

---

## 11. Testing Strategy

### 11.1 Unit Tests

- `checkAiAccess()` returns correct result for all plan/feature/user combinations
- Rate limit counter works correctly across day boundaries
- Prompt hashing is deterministic and collision-resistant
- Aggregation math matches raw log sums

### 11.2 Integration Tests

- AI call is logged to Firestore after successful `requestAiIntelligence()`
- Failed AI call is logged with error details
- Starter tenant receives blocked response from access check
- Growth tenant with admin-disabled AI receives blocked response
- User override correctly overrides tenant-level setting

### 11.3 UI Tests

- Starter user sees greyed-out AI button with upgrade tooltip
- Growth user sees active AI button
- User-disabled user sees no AI button at all
- Rate-limited user sees countdown
- SuperAdmin sees all tenants in governance console
- Access policy changes are reflected in real-time

### 11.4 Acceptance Criteria

- [ ] Every AI call across all tenants is logged within 1 second
- [ ] Starter plan users cannot trigger any AI feature
- [ ] SuperAdmin can toggle AI per tenant in < 3 clicks
- [ ] SuperAdmin dashboard loads tenant data in < 2 seconds
- [ ] Anomaly detection fires within 5 minutes of a spike
- [ ] Cost estimates are within 10% of actual Perplexity billing
- [ ] Zero AI features available to Starter plan tenants
- [ ] All access policy changes are audited

---

## Appendix A: Smart Task Generation Flow

```
User (Admin, Growth/Command plan)
  │
  ├─ Clicks "✨ Generate smart draft"
  │    └─ AiGate checks access → ALLOWED
  │
  ├─ Dialog opens: "Describe the task you need"
  │    └─ User types: "Create a compliance test for new hires covering NDPR basics"
  │
  ├─ Submits → AiUsageLog created (feature: smart_task, outcome: pending)
  │    └─ Prompt sent to Perplexity with system prompt for task generation
  │
  ├─ AI returns task draft (JSON with questions, topics, difficulty, scoring)
  │    └─ AiUsageLog updated (outcome: success, responseLength, latencyMs, tokensUsed)
  │
  ├─ User reviews draft
  │    ├─ [Accept] → Task created in question bank → AiUsageLog.accepted = true
  │    ├─ [Modify] → User edits → Accepts → AiUsageLog.modified = true
  │    ├─ [Regenerate] → New prompt → New AiUsageLog (linked)
  │    └─ [Dismiss] → AiUsageLog.accepted = false, dismissedAt = now
  │
  └─ Task is live → AiUsageLog.taskGenerated = true, taskId = new task ID
```

## Appendix B: Anomaly Detection Rules

| Rule | Condition | Severity | Action |
|------|-----------|----------|--------|
| Usage spike | >300% of 7-day average in 1 hour | Critical | Alert SuperAdmin, consider rate limit |
| Error cascade | >5 consecutive errors in 10 minutes | Critical | Check backend, alert SuperAdmin |
| New tenant burst | New tenant >50 prompts in first hour | Warning | Flag for review (possible abuse) |
| Low acceptance rate | <40% acceptance on Smart Tasks for 30+ generations | Warning | AI output quality may need tuning |
| Cost anomaly | Daily cost >200% of 30-day average | Warning | Alert with cost breakdown |
| Unused AI | Tenant on Growth plan, 0 AI usage in 30 days | Info | Opportunity for adoption outreach |

---

*Document version 1.0. Next review: after Phase 1 implementation.*
