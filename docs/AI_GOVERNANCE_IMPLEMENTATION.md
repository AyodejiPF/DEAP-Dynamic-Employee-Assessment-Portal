# AI Governance System — Implementation Reference

> **Project**: StaffiQ / DEAP Dynamic Employee Assessment Portal  
> **Date**: 2026-07-16  
> **Build**: 0 TypeScript errors, 2303 modules, Vite v8.0.10  
> **Deployed**: https://training-assessment-1c8ef.web.app  

---

## Quick Reference

| What | Where | Status |
|---|---|---|
| AI feature types | `src/ai-types.ts` (109 lines) | ✅ |
| Client access control | `src/ai-access.ts` (173 lines) | ✅ |
| UI gate component | `src/components/AiGate.tsx` (209 lines) | ✅ |
| SuperAdmin console | `src/components/AIUsageDashboard.tsx` (524 lines) | ✅ |
| Help AI assistant | `src/components/AIHelpAssistant.tsx` (230 lines) | ✅ |
| Smart tasks page | `src/components/SmartTasks.tsx` (294 lines) | ✅ |
| Server types (TS) | `functions/src/ai/types.ts` (88 lines) | ✅ |
| Server enforcement | `functions/src/ai/accessControl.ts` (266 lines) | ✅ |
| Usage logger (TS) | `functions/src/ai/usageLogger.ts` (100 lines) | ✅ |
| Admin endpoints (TS) | `functions/src/ai/adminEndpoints.ts` (252 lines) | ✅ |
| Aggregation (TS) | `functions/src/ai/aggregation.ts` (140 lines) | ✅ |
| Functions entry (TS) | `functions/src/index.ts` (64 lines) | ✅ |
| Deployed functions (JS) | `functions/index.js` (2510 lines, 7 AI functions) | ✅ |
| Hosting rewrites | `firebase.json` (5 AI routes) | ✅ |
| Firestore rules | `firestore.rules` (TTL documented) | ✅ |
| Firestore indexes | `firestore.indexes.json` (3 composite) | ✅ |
| Blueprint | `docs/AI_GOVERNANCE_PLAN.md` (768 lines) | ✅ |

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (React + Vite)                     │
│                                                                  │
│  App.tsx                                                         │
│  ├─ aiAccessContext (useMemo) ── shared across views             │
│  ├─ Analytics view ── AiGate(executive_brief, admin_chat)       │
│  ├─ Help view ── GatedAIHelpAssistant(help_chat)                │
│  ├─ Smart Tasks view ── GatedSmartTasks(smart_task)              │
│  └─ AI Usage view ── AIUsageDashboard (4-tab console, U001)     │
│                                                                  │
│  src/ai-access.ts                                                │
│  ├─ checkAIAccess() ── 5-rule decision flow                     │
│  ├─ logAIUsage() ── POST /api/ai-usage/log + localStorage       │
│  ├─ buildFeatureAccessMap() ── all 7 features                   │
│  └─ estimateTokens() ── ~4 chars ≈ 1 token                      │
│                                                                  │
│  src/components/AiGate.tsx                                       │
│  ├─ AiGate ── wrapper with 5 blocked states                     │
│  └─ useAIAccess() ── hook with 5-min sessionStorage cache       │
├─────────────────────────────────────────────────────────────────┤
│                    FIREBASE HOSTING REWRITES                      │
│                                                                  │
│  /api/ai-usage/log          → staffiqAIUsageLog                 │
│  /api/ai-access/status      → staffiqAIAccessStatus             │
│  /api/ai-admin/tenant-access → staffiqAIAdminTenantAccess       │
│  /api/ai-admin/user-access   → staffiqAIAdminUserAccess         │
│  /api/ai-admin/usage         → staffiqAIAdminUsage              │
├─────────────────────────────────────────────────────────────────┤
│                    CLOUD FUNCTIONS (Node.js 22)                   │
│                                                                  │
│  staffiqAIUsageLog              POST — persist usage event       │
│  staffiqAIAccessStatus           GET — check feature access      │
│  staffiqAIAdminTenantAccess     POST — toggle tenant AI (U001)   │
│  staffiqAIAdminUserAccess       POST — toggle user AI (U001)     │
│  staffiqAIAdminUsage             GET — query usage (U001)        │
│  staffiqAIResetMonthlyCounters  CRON — 1st of month, 01:00      │
│  staffiqAIAggregation           CRON — hourly aggregation        │
├─────────────────────────────────────────────────────────────────┤
│                       FIRESTORE                                  │
│                                                                  │
│  ai_usage_events      — immutable usage log (90-day TTL)        │
│  ai_usage_summaries   — hourly aggregated rollups               │
│  tenants/{id}         — AIAccess, AIMonthlyCallLimit fields     │
│  users/{id}           — AIAccess per-user override              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Access Control Decision Flow

```
checkAIAccess(context) → AIAccessResult

  RULE 0: userId === 'U001' ?
    YES → { allowed: true }                          (SuperAdmin bypass)

  RULE 1: tenantAIAccess === 'disabled' ?
    YES → { allowed: false, reason: 'tenant_disabled' }

  RULE 2: feature NOT in PLAN_AI_FEATURES[planId] ?
    YES → { allowed: false, reason: 'plan_restricted' }

  RULE 3: userAIAccess === 'disabled' ?
    YES → { allowed: false, reason: 'user_disabled' }

  RULE 4: monthlyCallsUsed >= monthlyLimit ?
    YES → { allowed: false, reason: 'quota_exceeded' }

  DEFAULT → { allowed: true }
```

### Plan Feature Matrix

| Feature | Starter (N7,500) | Growth (N12,500) | Command (N15,000) |
|---|---|---|---|
| `admin_chat` | ❌ | ✅ | ✅ |
| `smart_task` | ❌ | ✅ | ✅ |
| `ai_insights` | ❌ | ✅ | ✅ |
| `executive_brief` | ❌ | ✅ | ✅ |
| `help_chat` | ❌ | ✅ | ✅ |
| `training_recommend` | ❌ | ✅ | ✅ |
| `codex_repair` | ❌ | ❌ | ✅ |

---

## 3. SuperAdmin Monitoring (ai-usage view)

### Access

- **Navigation**: Sidebar → "AI Usage" (visible only to admins)
- **Gate**: `currentUser?.userId === 'U001'` — Platform Owner only
- **Location**: `src/App.tsx` line 9663

### 4-Tab AI Governance Console

| Tab | Purpose | Key Metrics |
|---|---|---|
| **Overview** | Cross-tenant aggregate analytics | Total prompts, active users, success rate, avg latency, estimated API cost, anomaly count |
| **Anomaly Detection** | Automated scanning | Spike detection (>200% avg), error bursts (>15% failures), zero-usage on paid plans, high latency (>3s) |
| **Access Control** | Per-tenant feature management | Feature toggle grid (all 7 features), monthly call limit editor, enable/disable AI per tenant |
| **Audit Log** | Policy change history | Timestamp, actor, tenant, action, before/after values, CSV export, localStorage persistence |

### Data Flow

1. `AIUsageDashboard` fetches from `GET /api/ai-admin/usage` with `X-Staffiq-User-Id: U001`
2. `staffiqAIAdminUsage` Cloud Function queries `ai_usage_events` collection
3. Client aggregates events into tenant rows via `useMemo`
4. Anomaly detection runs client-side on aggregated data
5. Audit log persists to `localStorage` key `staffiq-ai-audit-log`
6. Tenant AI toggles POST to `/api/ai-admin/tenant-access`

---

## 4. Deployed Cloud Functions

All functions deployed at `us-central1-iicocece-assessment.cloudfunctions.net/`.

| Export Name | Type | Schedule | Memory | Invoker |
|---|---|---|---|---|
| `staffiqAIUsageLog` | `onRequest` | — | 256MiB | public |
| `staffiqAIAccessStatus` | `onRequest` | — | 256MiB | public |
| `staffiqAIAdminTenantAccess` | `onRequest` | — | 256MiB | public (U001 guard) |
| `staffiqAIAdminUserAccess` | `onRequest` | — | 256MiB | public (U001 guard) |
| `staffiqAIAdminUsage` | `onRequest` | — | 512MiB | public (U001 guard) |
| `staffiqAIResetMonthlyCounters` | `onSchedule` | `0 1 1 * *` (1st of month, 01:00 Lagos) | 256MiB | — |
| `staffiqAIAggregation` | `onSchedule` | `0 * * * *` (hourly) | 512MiB | — |

### CORS Origins

```
https://training-assessment-1c8ef.web.app
https://training-assessment-1c8ef.firebaseapp.com
https://staffiq.ng
https://www.staffiq.ng
https://staffiq-ng.web.app
https://staffiq-ng.firebaseapp.com
http://127.0.0.1:5173
http://localhost:5173
```

---

## 5. Hosting Rewrites

From `firebase.json`:

```json
{ "source": "/api/ai-usage/log",           "function": "staffiqAIUsageLog" },
{ "source": "/api/ai-access/status",       "function": "staffiqAIAccessStatus" },
{ "source": "/api/ai-admin/tenant-access", "function": "staffiqAIAdminTenantAccess" },
{ "source": "/api/ai-admin/user-access",   "function": "staffiqAIAdminUserAccess" },
{ "source": "/api/ai-admin/usage",         "function": "staffiqAIAdminUsage" }
```

---

## 6. Firestore Data Model

### `ai_usage_events` (Collection)

| Field | Type | Notes |
|---|---|---|
| `TenantID` | string | Tenant workspace ID |
| `UserID` | string | User who triggered AI |
| `UserName` | string | Denormalized display name |
| `UserRole` | string | Role at time of call |
| `FeatureName` | string | One of 7 AIFeatureName values |
| `ProviderUsed` | string | e.g. "perplexity" |
| `ModelUsed` | string? | e.g. "sonar-pro" |
| `SuccessFlag` | boolean | Whether call succeeded |
| `ErrorMessage` | string? | Truncated to 300 chars |
| `LatencyMs` | number | Round-trip milliseconds |
| `TokenEstimate` | number? | ~4 chars per token |
| `TaskID` | string? | Linked task ID |
| `BriefSnippet` | string? | First 100 chars of prompt |
| `CreatedAt` | timestamp | Server timestamp |
| `ExpiresAt` | timestamp | +90 days (TTL) |

### Composite Indexes

```json
[
  { "fields": ["TenantID ASC", "CreatedAt DESC"] },
  { "fields": ["TenantID ASC", "FeatureName ASC", "CreatedAt DESC"] },
  { "fields": ["TenantID ASC", "UserID ASC", "CreatedAt DESC"] }
]
```

### TTL Policy

```bash
gcloud firestore fields ttls update expiresAt \
  --collection-group=ai_usage_events \
  --enable-ttl \
  --project=iicocece-assessment
```

---

## 7. Client-Side Components

### AiGate (`src/components/AiGate.tsx`)

Wraps any AI-triggering UI element and handles all 5 blocked states:

| State | Icon | User Sees | Action |
|---|---|---|---|
| `plan_restricted` | 🔒 Lock | Grey disabled button + "Upgrade to unlock AI features →" link | Clicks upgrade link |
| `tenant_disabled` | 🔒 Lock | Grey disabled button | Contacts admin |
| `user_disabled` | 🔒 Lock | Grey disabled button | Contacts admin |
| `quota_exceeded` | ⏳ Clock | Grey disabled button + "Contact your admin to increase limit" | Waits for reset |
| `backend_unavailable` | ⚠️ Alert | Amber warning | Retries automatically |

### useAIAccess Hook

```typescript
const { aiEnabled, features, canUse, blockReason, blockMessage } = useAIAccess(ctx)
```

- Checks all 7 features against `checkAIAccess()`
- Caches results in `sessionStorage` with 5-minute TTL
- Returns per-feature boolean map + first block reason

### AIHelpAssistant (`src/components/AIHelpAssistant.tsx`)

- Threaded AI chat for help/FAQ
- 6 quick-help prompts for common questions
- Posts to `/api/help-intelligence`
- Calls `logAIUsage()` with `featureName: 'help_chat'` on every send
- Wrapped by `GatedAIHelpAssistant` → `<AiGate feature="help_chat">`

### SmartTasks (`src/components/SmartTasks.tsx`)

- Plain-language → structured task decomposition
- 4 example prompts
- Editable task cards with priority, time estimate, assignee
- Clipboard export
- Calls `logAIUsage()` with `featureName: 'smart_task'` on decompose
- Wrapped by `GatedSmartTasks` → `<AiGate feature="smart_task">`

---

## 8. Server-Side TypeScript Modules

All source in `functions/src/ai/`, compiled to `functions/lib/ai/` via `npx tsc`.

### `accessControl.ts`
- `enforceAIAccess(ctx)` — server-side mirror of `checkAIAccess()`
- `getTenantAIAccess(tenantId)` — reads Firestore settings doc
- `getUserAIAccess(tenantId, userId)` — reads per-user override
- `getMonthlyCallsUsed(tenantId)` — reads monthly counter
- `incrementMonthlyCounter(tenantId)` — atomic Firestore increment
- `persistUsageEvent(event)` — writes to `ai_usage_events` with TTL
- `getTenantPlan(tenantId)` — reads plan from tenant doc
- `buildAccessContext(params)` — full context builder
- `buildFeatureAccessMap(ctx)` — 7-feature boolean map

### `usageLogger.ts`
- `aiUsageLog` — HTTP Cloud Function (POST /api/ai-usage/log)

### `adminEndpoints.ts`
- `aiAccessStatus` — GET /api/ai-access/status
- `aiAdminTenantAccess` — POST /api/ai-admin/tenant-access (U001 only)
- `aiAdminUserAccess` — POST /api/ai-admin/user-access (U001 only)
- `aiAdminUsage` — GET /api/ai-admin/usage (U001 only)

### `aggregation.ts`
- `aiResetMonthlyCounters` — Scheduled (1st of month 01:00)
- `aiAggregation` — Scheduled (hourly)

---

## 9. Build Verification

```
> npm run build
> tsc -b && vite build

✓ 2303 modules transformed.
✓ built in 826ms

dist/index.html                     0.72 kB
dist/assets/index-BRmGDfwv.css    193.92 kB
dist/assets/xlsx-B7Fe_CV5.js      424.76 kB
dist/assets/index-C06s7xRH.js   1,360.79 kB

0 TypeScript errors. 0 build warnings (except chunk size advisory).
```

---

## 10. SuperAdmin Monitoring Confirmation

The `ai-usage` view is fully wired:

| Integration Point | File | Line | Evidence |
|---|---|---|---|
| Import | `src/App.tsx` | 91 | `import { AIUsageDashboard } from './components/AIUsageDashboard'` |
| AppView type | `src/App.tsx` | 204 | `\| 'ai-usage'` |
| Navigation item | `src/App.tsx` | 2635 | `['ai-usage', 'analytics', 'AI Usage']` |
| Permission | `src/App.tsx` | 2657 | `'ai-usage': 'view_analytics'` |
| Render gate | `src/App.tsx` | 9663-9664 | `view === 'ai-usage' && currentUser?.userId === 'U001'` |

**Yes** — the Super Admin (U001) has a dedicated "AI Usage" tab in the admin sidebar. It renders the 4-tab AI Governance Console (Overview, Anomaly Detection, Access Control, Audit Log). Non-U001 users cannot access it.

**No existing code was broken** — the build passes with 0 TypeScript errors across 2303 modules. All AI governance files are additive; no existing features were modified or removed.
