# P2 Dual Prompt Improver — AI Governance & Usage Analytics Prompt

> **Type**: Super Prompt (Stage 3 of P2 Workflow)
> **Date**: 2026-07-16
> **Agent**: VS Code Copilot (V4 Pro — DeepSeek V4 Flash)
> **Objective**: Generate a comprehensive AI governance and analytics feature plan

---

## Original Human Request

/P2-Dual-Prompt-Improver give me a plan if i wanted to analyse how each tenant and each user in each tenant's work space used AI, especially in the smart Task generation mode, if I were to ask you to create such a feature, go into extreme detail about how this feature would function and how to control and toggle AI access per tenant or per user and the messages they get like the generate smart draft button greyed out or vanishing etc, just come up with a plan that takes into consideration the users and their experience and the superadmin and the need for me to track every thing that is done in the webapp across all tenants workspaces, start with giving me a detailed plan

---

## Result A — Improved Prompt Specification

### Objective

Design a comprehensive, production-ready feature plan for AI usage tracking and governance across the StaffiQ multi-tenant platform. The plan must define: (1) how every AI interaction is logged per tenant and per user, (2) how SuperAdmin can toggle AI access at the tenant or individual user level, (3) what users see when AI is disabled versus enabled, (4) the SuperAdmin dashboard for cross-tenant AI analytics, and (5) the full data model, permission model, and audit trail architecture.

### Background and Context

StaffiQ currently has:
- A multi-tenant architecture (`src/tenant.ts`) supporting multiple workspaces with isolated users
- An AI intelligence system using Perplexity Sonar API (`requestAiIntelligence`, `AiChatThread`)
- An admin analytics chat for asking questions about assessment data
- A client-side AI insights module (`src/ai-insights.ts`) for skill gap analysis and recommendations
- A SuperAdmin/Platform Owner isolation module (`src/superadmin/`)
- Plans for a "Smart Task generation mode" (referenced in the user's prompt)

The pricing page advertises AI features from the Growth plan (N12,500) upwards. This creates a business need to actually enforce AI access by plan tier and to give the Platform Owner visibility into how AI is being used across all tenants.

### Available Inputs

- Existing AI infrastructure: `AiChatMessage`, `AiChatThread`, `AiIntelligencePayload`, `AiIntelligenceResponse`, `requestAiIntelligence()`, `requestHelpIntelligence()`
- Tenant system: `Tenant`, `TenantSession`, `TenantDirectoryUser`, `TenantPlan`, `TenantStatus`, multi-tenant functions
- User model: `User` with `role`, `department`, tenant association
- SuperAdmin module: Platform Owner auth (`isPlatformOwner`), branding, tokens
- Analytics event system: `AnalyticsEvent`, `AnalyticsEventType`
- Existing audit infrastructure: `AuditEvent`, `recordAudit()`

### Required Scope

**Section A: AI Usage Tracking**
- Log every AI interaction: timestamp, tenant, user, AI feature used, prompt (hashed for privacy), response length, latency, model used, error/success, tokens consumed
- Aggregate metrics: prompts per tenant per day/week/month, most-used AI features, error rates, average response time
- Smart Task generation specific: tasks generated, accepted, modified, rejected; which tenant roles generate the most tasks

**Section B: AI Access Control**
- Tenant-level toggle: SuperAdmin can enable/disable AI for an entire tenant workspace
- User-level toggle: Admin/SuperAdmin can enable/disable AI for individual users within a tenant
- Plan-based gating: Starter plan (N7,500) has no AI access; Growth (N12,500) and Command (N15,000) have AI access
- Feature-level toggles: Admin Chat, Smart Tasks, AI Insights, AI Reports — individually toggleable

**Section C: UI States**
- When AI is disabled: "Generate smart draft" button is greyed out with a tooltip explaining why
- When AI is available: full-color button with sparkle icon, clear call to action
- Plan-upgrade nudge: Starter users see an upsell message when they encounter AI-gated features
- Graceful degradation: when the AI backend is unreachable, show a "temporarily unavailable" state (different from "not in your plan")

**Section D: SuperAdmin Cross-Tenant Dashboard**
- AI Usage Overview: total prompts, active AI users, tokens consumed — across all tenants
- Per-Tenant Breakdown: sortable table of tenants with AI usage stats
- Anomaly Detection: flag unusual usage patterns (spikes, errors, abuse)
- Cost Tracking: estimated Perplexity API cost per tenant
- Access Control Panel: toggle AI features per tenant/user from one screen

**Section E: Data Model**
- New entities: `AiUsageLog`, `AiAccessPolicy`, `AiFeatureFlag`, `AiUsageAggregate`
- Integration with existing `AnalyticsEvent` and `AuditEvent` systems
- Privacy: prompt content hashed, not stored in plaintext

### Excluded Scope

- Modifying the Perplexity API integration itself
- Building the actual Smart Task generation engine (this plan covers tracking and governance of it)
- Changing the pricing page (already done)

### Deliverables

1. Complete data model specification (entities, fields, relationships)
2. Permission and access control architecture
3. UI state specification (enabled, disabled, greyed-out, upsell)
4. SuperAdmin dashboard wireframe description
5. API contract for AI usage logging
6. Implementation priority roadmap

### Acceptance Criteria

- The plan covers every AI touchpoint in the app
- Access control rules are unambiguous (tenant > user > feature)
- UI states are specified for every condition
- SuperAdmin can see AI usage across all tenants from one dashboard
- The plan is implementable within the existing React + Firebase architecture

---

## Result B — Production-Ready Implementation Brief

### Executive Overview

This plan defines a complete AI governance and analytics layer for the StaffiQ multi-tenant platform. It covers tracking every AI interaction, controlling AI access at tenant and user levels, managing UI states, and providing SuperAdmin with cross-tenant visibility.

### Problem Definition

**Current state**: AI features exist (admin analytics chat, client-side insights) but there is no tracking of who uses them, no ability to toggle AI per tenant or user, and no way for the Platform Owner to see how AI is being used across workspaces. The pricing page advertises AI from the Growth plan, but there is no enforcement mechanism.

**Desired state**: Every AI interaction is logged, AI access is gated by plan and configurable per tenant/user, UI gracefully reflects access state, and SuperAdmin has a complete cross-tenant analytics view.

### User Roles and Permissions

| Role | AI Access Control | AI Usage Visibility |
|------|------------------|-------------------|
| **SuperAdmin** | Full control — toggle AI per tenant, per user, per feature | All tenants, all users, full analytics |
| **Tenant Admin** | Limited — can toggle AI for users in their tenant only | Their tenant only |
| **Employee** | None — uses AI if granted | Their own usage history only |
| **Platform Owner** | Full control (same as SuperAdmin) | Everything |

### Data Architecture

#### Entity: AiUsageLog (per-interaction record)
| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique log ID |
| `tenantId` | string | Tenant workspace |
| `userId` | string | User who triggered AI |
| `userRole` | string | Role at time of interaction |
| `feature` | enum | `admin_chat`, `smart_task`, `ai_insights`, `executive_brief`, `help_chat`, `codex_repair` |
| `promptHash` | string | SHA-256 hash of prompt (privacy) |
| `promptLength` | number | Character count |
| `model` | string | AI model used (e.g., `sonar-pro`) |
| `responseLength` | number | Response character count |
| `latencyMs` | number | Time to response |
| `tokensUsed` | number | Estimated token count |
| `outcome` | enum | `success`, `error`, `timeout`, `rate_limited`, `blocked` |
| `errorMessage` | string? | Error if failed |
| `accepted` | boolean? | Did user accept/use the AI output? |
| `createdAt` | ISO 8601 | Timestamp |

#### Entity: AiAccessPolicy (per-tenant configuration)
| Field | Type | Description |
|-------|------|-------------|
| `tenantId` | string | Tenant |
| `aiEnabled` | boolean | Master AI switch |
| `allowedFeatures` | string[] | `['admin_chat', 'smart_task', ...]` |
| `userOverrides` | Record<string, boolean> | Per-user exceptions |
| `rateLimitPerUser` | number | Max prompts/user/day |
| `rateLimitPerTenant` | number | Max prompts/tenant/day |
| `updatedBy` | string | Who last changed it |
| `updatedAt` | ISO 8601 | When changed |

#### Entity: AiUsageAggregate (pre-computed)
| Field | Type | Description |
|-------|------|-------------|
| `tenantId` | string | Tenant |
| `period` | string | `daily`, `weekly`, `monthly` |
| `periodStart` | ISO 8601 | Period start |
| `totalPrompts` | number | Total AI calls |
| `uniqueUsers` | number | Distinct users |
| `byFeature` | Record<string, number> | Breakdown by feature |
| `errorRate` | number | Percentage |
| `avgLatency` | number | Average ms |
| `estimatedCost` | number | Approximate API cost |

### UI State Specification

#### State 1: AI Fully Available (Growth/Command, AI enabled)
- "✨ Generate smart draft" button: full color (lime green), sparkle icon, active hover state
- AI chat panel: available, shows greeting
- Analytics chat: suggested questions visible, input active

#### State 2: AI Disabled by Plan (Starter)
- "Generate smart draft" button: **greyed out**, lock icon, cursor shows tooltip
- Tooltip: "AI features are available on the Growth plan (N12,500/user) and above. Contact your admin to upgrade."
- AI sections in analytics: replaced with upgrade card showing plan comparison
- No error state — it's intentional gating

#### State 3: AI Disabled by Admin (plan allows, admin turned off)
- Button: **greyed out**, different tooltip
- Tooltip: "AI features have been disabled by your workspace administrator. Contact [admin name] to request access."
- Distinguishable from plan gating (different message, different icon)

#### State 4: AI Disabled for Specific User
- Button: **hidden entirely** (not greyed out — absent)
- If user has seen AI before: subtle notification "Your AI access has been updated. Contact your admin for details."
- Prevents confusion: if you can't use it, you don't see it

#### State 5: AI Backend Unavailable (temporary)
- Button: amber/warning state, "Temporarily unavailable"
- Retry option after 30 seconds
- Different from disabled — it's a transient error, not a permission issue

#### State 6: Rate Limited
- Button: greyed out with countdown timer
- Message: "You've reached the daily limit of [X] AI requests. Resets at midnight."
- Admin can adjust limits per user

### Implementation Checklist

**Phase 1: Infrastructure & Logging (Days 1-5)**
1. Create TypeScript types for `AiUsageLog`, `AiAccessPolicy`, `AiUsageAggregate`
2. Create Firestore collections
3. Add logging wrapper around `requestAiIntelligence()` and `requestHelpIntelligence()`
4. Add logging to client-side AI insights
5. Create Firestore indexes

**Phase 2: Access Control (Days 6-10)**
6. Create default `AiAccessPolicy` for each plan tier
7. Implement `checkAiAccess()` function with decision flow
8. Add plan-based gating: block all AI for Starter tenants
9. Create SuperAdmin Access Policy editor UI
10. Implement tenant-level and per-user AI toggles

**Phase 3: UI States (Days 11-15)**
11. Build `<AiGate>` wrapper component
12. Implement all 6 disabled states
13. Build upgrade nudge component for Starter users
14. Add rate limiting with countdown UI

**Phase 4: SuperAdmin Dashboard (Days 16-22)**
15. Build AI Governance Console with tabs
16. Implement Overview tab with aggregate metrics
17. Build Tenant Breakdown table with sorting
18. Implement anomaly detection
19. Build Access Control and Audit Log tabs

**Phase 5: Aggregation & Cost Tracking (Days 23-28)**
20. Build daily/weekly/monthly aggregation functions
21. Integrate Perplexity pricing for cost estimation
22. Add cost alerts

**Phase 6: Polish & Documentation (Days 29-35)**
23. Add AI usage to main app analytics export
24. Create user guide
25. Performance optimization and security audit

### Acceptance Criteria

- AC1: Every AI interaction is logged with tenant, user, feature, and outcome
- AC2: Starter plan users see greyed-out AI buttons with upgrade messaging
- AC3: SuperAdmin can toggle AI per tenant and per user from one console
- AC4: SuperAdmin sees cross-tenant AI usage analytics with anomaly detection
- AC5: When AI is disabled for a user, they don't see AI buttons (not just greyed out)
- AC6: Rate limiting works per-tenant and per-user with clear UI feedback

---

## Super Prompt — Final Authoritative Execution Brief

### Objective

Deliver a comprehensive, detailed, ready-to-implement plan for AI usage tracking and governance across the StaffiQ multi-tenant platform. The plan must be a self-contained document that any developer or AI agent can use to implement the feature.

### Requirements

**R1: Complete Data Architecture** — Define all entities, fields, types, and relationships for AI usage logging, access policies, and aggregates.

**R2: Access Control Model** — Define the complete permission hierarchy (SuperAdmin → Tenant Admin → User), plan-based gating (Starter vs Growth/Command), per-tenant toggles, per-user overrides, and feature-level flags.

**R3: UI State Specification** — Define all 6 UI states with exact button appearance, tooltip text, and behavior for each.

**R4: SuperAdmin Dashboard Specification** — Define the cross-tenant AI Governance Console layout, metrics, tenant breakdown table, access control panel, anomaly detection, and cost tracking.

**R5: Smart Task Generation Tracking** — Define specific metrics and tracking for Smart Task generation.

**R6: Implementation Roadmap** — Provide phased implementation order with priorities.

**R7: Privacy Considerations** — Define prompt hashing, data retention, and what SuperAdmin can vs cannot see.

### Deliverable Format

A single comprehensive Markdown document saved to `docs/AI_GOVERNANCE_PLAN.md`.

### Execution

Write the complete plan document now. The plan covers:

1. **Overview**: Purpose, business context, key principles
2. **Current State Analysis**: What AI exists, what's missing
3. **Data Architecture**: `AiUsageLog`, `AiAccessPolicy`, `AiUsageAggregate` entities
4. **Access Control Model**: Hierarchical decision flow with 6 check points
5. **UI State Specification**: 6 distinct states with exact visual specs
6. **Smart Task Generation Tracking**: 8 tracked events with analytics queries
7. **SuperAdmin Cross-Tenant Dashboard**: Full layout with 4 tabs
8. **Privacy & Data Retention**: What's stored, what's hashed, retention periods
9. **Implementation Roadmap**: 6 phases over 35 days
10. **API Contracts**: REST endpoints for logging, access check, aggregates
11. **Testing Strategy**: Unit, integration, UI, and acceptance tests

---

*Prompt executed on 2026-07-16. Resulting plan saved to `docs/AI_GOVERNANCE_PLAN.md`.*
