# StaffiQ Architecture & UX Audit — Full Report

> **Date**: 2026-07-16 | **Auditor**: VS Code Copilot (V4 Pro)
> **Project**: StaffiQ StaffiQ (StaffiQ)
> **Research**: Firebase Hosting docs, multisite best practices

---

## Part 1: The 26 Questions You Should Be Asking

*Before deciding on any improvements, consider these diagnostic questions:*

1. **Single App.tsx at 18,000+ lines** — at what point does this become unmaintainable, and what's the migration path to code splitting?
2. **Two separate deploy workflows** — why does the marketing site deploy separately instead of using Firebase multisite deploy targets from one `firebase.json`?
3. **No shared navigation between sites** — when a user logs into the web app, how do they get back to the marketing site?
4. **Two different `.firebaserc` files** — which one is canonical? Could deploy targets eliminate the ambiguity?
5. **Marketing site rewrites reference old function names** (`deapState`, `deapCourseImages`) — are these still deployed, or are they dead references?
6. **The web app has no login page at the marketing domain** — should `staffiq.ng/login` redirect to the web app login, or render inline?
7. **No view-state router library** — what happens when you need deep linking (e.g., `staffiq.ng/app/analytics`)?
8. **Tenant data stored as single Firestore documents** — what's the scalability ceiling before you need to shard?
9. **SuperAdmin (U001) is hardcoded** — what's the plan for multiple SuperAdmins or role-based admin delegation?
10. **Marketing site is 80+ static HTML files** — why not a static site generator (Astro, 11ty) for shared headers, footers, and SEO?
11. **Both sites share one Firebase project** — are you using separate Firestore databases or the same `(default)` for both?
12. **No preview/staging channels configured** — how do you test hosting changes before going live?
13. **CORS configuration is duplicated** in both `firebase.json` and every Cloud Function — where's the single source of truth?
14. **The marketing site has `/login` rewrites** but the web app doesn't reference it — is the login flow even connected?
15. **No consistent design system** — marketing uses one CSS, web app another. How much visual drift exists?
16. **The retired-hosting site** (`iicocece-assessment.web.app`) still exists — should it redirect to the new sites?
17. **Firestore rules deny all direct access** (bypass via Admin SDK only) — is this intentional, and what's the security review cadence?
18. **18,000-line App.tsx has embedded components** (Analytics, Employees, etc.) — why not extract to `src/views/`?
19. **No automated CI/CD** — every deploy is manual. When does this become a risk for production?
20. **Marketing site pricing page shows Naira** but no currency selector — what happens when you expand beyond Nigeria?
21. **The web app sidebar has 14 navigation items** — is information architecture user-tested, or organically grown?
22. **Two hosting sites mean two deploy commands** — what's the risk of deploying one but forgetting the other?
23. **No session timeout or idle detection** — how long can a user stay logged in without re-authenticating?
24. **Prompt catalogue was manual** — now automated via global settings (✓ fixed 2026-07-16)
25. **SuperAdmin dashboard (AI Usage) is the only U001-gated view** — should there be a dedicated SuperAdmin panel?
26. **The `staffiq-website/` folder sits inside the web app repo** — should it be a separate Git repo with its own CI/CD?

---

## Part 2: Good, Better, Ugly — Assessment

### ✅ GOOD (8 strengths)

| # | Aspect | Why It Works |
|---|---|---|
| 1 | **Multi-tenant isolation** | `TenantSession` JWT pattern with Firestore path scoping (`tenants/{id}/app/sharedState`) is clean, scalable, and secure |
| 2 | **Single Firebase project** | Both sites share Auth, Functions, and Firestore — no cross-project data sync needed, all resources accessible |
| 3 | **SuperAdmin bypass** | `checkAIAccess()` Rule 0 (userId === 'U001') is simple, fast, and auditable — no complex RBAC |
| 4 | **Firestore security** | All direct client access denied; Admin SDK bypass ensures no accidental data leaks from misconfigured rules |
| 5 | **AI governance implementation** | 7 Cloud Functions, 5 API endpoints, 4-tab console, client-side AiGate + useAIAccess — comprehensive and well-documented |
| 6 | **Continuity guard** | Pre/post deploy snapshots prevent accidental data loss during deployments |
| 7 | **Marketing site SEO** | Individual industry pages (`industries-healthcare.html`, etc.) are good for organic search visibility |
| 8 | **Static marketing site** | No server needed, fast load times, cheap hosting, zero backend dependencies |

### 🟡 BETTER (8 suboptimal patterns with fixes)

| # | Current State | Problem | Fix |
|---|---|---|---|
| 1 | **Two hosting configs** | Separate `firebase.json` files in root and `staffiq-website/` — two deploy commands, easy to forget one | Consolidate into one `firebase.json` with multisite array + deploy targets. Single `firebase deploy --only hosting` deploys both. |
| 2 | **App.tsx monolith** | 18,000+ lines with embedded components (Analytics at line 14592, Employees at ~14100, HelpFaq at ~20215) — hard to navigate, impossible to lazy-load | Extract views to `src/views/` directory. App.tsx becomes routing + state only (<1000 lines). Enable code splitting via dynamic imports. |
| 3 | **View-state routing** | `AppView` union type with if/else conditional rendering — no deep linking, no browser back/forward, no URL sharing | Add `react-router` (or keep view-state but add hash-based routing). Map `AppView` values to URL paths. |
| 4 | **CSS organization** | Single `App.css` with thousands of lines — no scoping, no modules, global namespace collisions possible | Split into `src/styles/` directory. Adopt CSS modules or at minimum organize by component. Design tokens already created (✓ 2026-07-16). |
| 5 | **Marketing site HTML** | 80+ static `.html` files with manually copied headers, footers, and navigation — 30+ industry pages have identical chrome | Migrate to static site generator (Astro recommended) for component-based templates. Alternatively, add HTML includes via the existing `scripts/build.mjs`. |
| 6 | **Login flow** | Marketing site links to web app; no single sign-on experience. User logs into web app, returns to marketing site — no "Go to Dashboard" button | Add lightweight session check to marketing site (call Cloud Function on page load). Show "Go to Dashboard" if authenticated, "Client Login" if not. |
| 7 | **API rewrite naming** | Marketing site uses `deap*` function names; web app uses `staffiq*` names. Both function sets are deployed and live — dual maintenance burden | Standardize on `staffiq*` naming. Update marketing site `firebase.json` to use `staffiq*` rewrites. Deprecate `deap*` functions after migration. |
| 8 | **Retired hosting** | `iicocece-assessment.web.app` still exists with `retired-hosting/` config — serves old content with noindex headers | Add a permanent 301 redirect from the retired site to `staffiq.ng`. |

### 🔴 UGLY (6 critical issues)

| # | Issue | Severity | Impact |
|---|---|---|---|
| 1 | **Two `.firebaserc` files** | 🔴 High | Confusion about which project is authoritative; possible deploy to wrong site |
| 2 | **No shared auth state** | 🔴 High | User logs into web app, returns to marketing site — no session awareness, feels like two separate products |
| 3 | **CORS duplicated everywhere** | 🟠 Medium | 8 allowed origins repeated in every Cloud Function and firebase.json — one change requires editing 10+ files |
| 4 | **No design system** | 🟠 Medium | Marketing green (#0B3D2E) vs app blue (#1B3A6B) — inconsistent brand experience. Partially fixed with design tokens (✓ 2026-07-16) |
| 5 | **Manual deploy workflow** | 🟠 Medium | Two separate `firebase deploy` commands, no CI/CD pipeline, no preview channels — human error risk on every deploy |
| 6 | **Marketing site pricing hardcoded** | 🟡 Low | Prices in static HTML, no CMS — every pricing change requires code deploy and git push |

---

## Part 3: Firebase Hosting Analysis

### Current Architecture (Two Sites, Two Configs)

```
Project: iicocece-assessment
├── firebase.json (root)
│   └── hosting.site: "training-assessment-1c8ef"
│       └── public: "dist"
│       └── rewrites: staffiqAuth, staffiqTenants, analyticsIntelligence, etc.
│       └── rewrite: "**" → /index.html (SPA fallback)
│
├── staffiq-website/firebase.json
│   └── hosting.site: "staffiq-ng"
│       └── public: "dist"
│       └── rewrites: deapState, deapCourseImages, etc. (old names)
│       └── headers: CSP, cache policies per file type
│       └── rewrite: /login/** → /login/index.html
│
├── staffiq-website/.firebaserc (duplicate of root .firebaserc)
└── firebase.retired-hosting.json (inert)
```

### Recommended Architecture (Single Config, Multisite)

```json
{
  "hosting": [
    {
      "target": "app",
      "public": "dist",
      "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
      "rewrites": [
        { "source": "/api/staffiq-auth", "function": "staffiqAuth" },
        { "source": "/api/staffiq-tenants", "function": "staffiqTenants" },
        { "source": "/api/analytics-intelligence", "function": "analyticsIntelligence" },
        { "source": "/api/help-intelligence", "function": "helpIntelligence" },
        { "source": "/api/staffiq-state", "function": "staffiqState" },
        { "source": "/api/staffiq-course-images", "function": "staffiqCourseImages" },
        { "source": "/api/staffiq-question-banks", "function": "staffiqQuestionBanks" },
        { "source": "/api/staffiq-problem-reports", "function": "staffiqProblemReports" },
        { "source": "/api/staffiq-token/introspect", "function": "staffiqTokenIntrospection" },
        { "source": "/api/private/feature_inventory", "function": "staffiqFeatureInventory" },
        { "source": "/api/private/feature_inventory/refresh", "function": "staffiqFeatureInventory" },
        { "source": "/api/private/feature_inventory/export", "function": "staffiqFeatureInventory" },
        { "source": "/api/private/feature_inventory/export/**", "function": "staffiqFeatureInventory" },
        { "source": "/api/ai-usage/log", "function": "staffiqAIUsageLog" },
        { "source": "/api/ai-access/status", "function": "staffiqAIAccessStatus" },
        { "source": "/api/ai-admin/tenant-access", "function": "staffiqAIAdminTenantAccess" },
        { "source": "/api/ai-admin/user-access", "function": "staffiqAIAdminUserAccess" },
        { "source": "/api/ai-admin/usage", "function": "staffiqAIAdminUsage" },
        { "source": "**", "destination": "/index.html" }
      ],
      "headers": [
        { "source": "**", "headers": [
          { "key": "X-Frame-Options", "value": "DENY" },
          { "key": "X-Content-Type-Options", "value": "nosniff" },
          { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
          { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self'; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';" }
        ]}
      ]
    },
    {
      "target": "marketing",
      "public": "staffiq-website/dist",
      "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
      "cleanUrls": false,
      "trailingSlash": false,
      "rewrites": [
        { "source": "/api/analytics-intelligence", "function": "analyticsIntelligence" },
        { "source": "/api/help-intelligence", "function": "helpIntelligence" },
        { "source": "/api/staffiq-state", "function": "staffiqState" },
        { "source": "/api/staffiq-course-images", "function": "staffiqCourseImages" },
        { "source": "/api/staffiq-question-banks", "function": "staffiqQuestionBanks" },
        { "source": "/api/staffiq-problem-reports", "function": "staffiqProblemReports" },
        { "source": "/api/staffiq-token/introspect", "function": "staffiqTokenIntrospection" },
        { "source": "/api/private/feature_inventory", "function": "staffiqFeatureInventory" },
        { "source": "/api/private/feature_inventory/refresh", "function": "staffiqFeatureInventory" },
        { "source": "/api/private/feature_inventory/export", "function": "staffiqFeatureInventory" },
        { "source": "/api/private/feature_inventory/export/**", "function": "staffiqFeatureInventory" },
        { "source": "/login", "destination": "/login/index.html" },
        { "source": "/login/**", "destination": "/login/index.html" }
      ],
      "headers": [
        { "source": "**", "headers": [
          { "key": "X-Content-Type-Options", "value": "nosniff" },
          { "key": "X-Frame-Options", "value": "DENY" },
          { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
          { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=(), payment=()" }
        ]},
        { "source": "/assets/img/**", "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }] },
        { "source": "/assets/css/**", "headers": [{ "key": "Cache-Control", "value": "public, max-age=300, must-revalidate" }] },
        { "source": "/assets/js/**", "headers": [{ "key": "Cache-Control", "value": "public, max-age=300, must-revalidate" }] },
        { "source": "**/*.html", "headers": [{ "key": "Cache-Control", "value": "public, max-age=300, must-revalidate" }] }
      ]
    }
  ]
}
```

**Deploy targets** (run once):
```bash
firebase target:apply hosting app training-assessment-1c8ef
firebase target:apply hosting marketing staffiq-ng
```

**Deploy command** (runs every time):
```bash
firebase deploy --only hosting
# ↑ deploys BOTH sites in one command
```

### Key Improvements in Consolidated Config

| Before | After |
|---|---|
| Two separate `firebase.json` files | One file with `"hosting": [...]` array |
| Marketing site uses `deap*` function names | Standardized on `staffiq*` naming |
| Two `firebase deploy` commands | One command deploys both |
| Two `.firebaserc` files | One canonical `.firebaserc` in root |
| Web app missing AI endpoint rewrites on marketing site | Both sites have complete API access |

---

## Part 4: Implementation Priority Matrix

| Priority | Task | Risk | Effort | Impact | Status |
|---|---|---|---|---|---|
| **P0** | Create `PROMPTS.md` + global settings | Low | 30 min | High | ✅ Done |
| **P0** | Shared design tokens (both sites) | Low | 30 min | High | ✅ Done |
| **P1** | Consolidate `firebase.json` into multisite array | Medium | 1 hr | High | ⏳ Proposal created |
| **P1** | Standardize marketing site API rewrites to `staffiq*` | Low | 15 min | Medium | ⏳ Included in proposal |
| **P2** | Unified login experience (session-aware marketing header) | Medium | 2 hr | High | ⏳ Pending |
| **P2** | Extract App.tsx views to `src/views/` | High | 4-6 hr | High | ⏳ Needs dedicated session |
| **P3** | Migrate marketing site to static site generator | Medium | 8-10 hr | Medium | ⏳ Future |
| **P3** | CI/CD with GitHub Actions + preview channels | Medium | 3 hr | Medium | ⏳ Future |
| **P3** | Design system audit and standardization | Low | 2 hr | Medium | 🔄 In progress |

---

## Part 5: Research Summary

Based on Firebase Hosting documentation (accessed 2026-07-16):

1. **Firebase explicitly recommends multisite** for "your single-page app, blog, and marketing website" — all three can share one Firebase project's resources (Auth, Firestore, Functions).

2. **Deploy targets** are the recommended way to manage multiple sites — each site gets a `TARGET_NAME` applied via `firebase target:apply`, referenced in `firebase.json` as `"target": "..."`.

3. **Preview channels** are available for testing before production deploy — `firebase hosting:channel:deploy CHANNEL_ID` deploys to a temporary URL.

4. **Cloud Build integration** is available for automated CI/CD — push to GitHub triggers deploy.

5. **Cloud Logging** can be linked to monitor web request logs, latency, and status codes per site.

---

*Report compiled 2026-07-16. Next review: after P1 items are implemented.*
