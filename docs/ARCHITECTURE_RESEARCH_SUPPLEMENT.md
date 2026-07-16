# Architecture Research Supplement — External Best Practices

> **Date**: 2026-07-16
> **Sources**: React.dev, Patterns.dev, Robin Wieruch (2026), Firebase docs, Vite docs

---

## Research Finding 1: React Feature Folder Structure (Validates Recommendation)

**Source**: Robin Wieruch — "React Folder Structure Best Practices [2026]" (updated May 2026)

The industry-standard pattern for scaling React applications follows this progression:

```
Single file → Multiple files → Component folders → Technical folders → Feature folders → Domain folders → Package folders → App folders (monorepo)
```

**Key rules from the research**:

1. **Features don't import from each other.** If `features/project/` needs something from `features/customer/`, that shared piece moves one layer up to the shared `components/`, `hooks/`, or `utils/` folder.

2. **Code flows one direction**: shared utilities → features → pages. Never the reverse. A reusable component should never reach into a feature folder.

3. **The "delete a feature" test**: Pick any feature folder, imagine deleting it, and ask how many other folders break. If the answer is "everything," boundaries have leaked.

4. **Public API via index.ts**: Each feature exports only its public surface. Implementation details stay hidden.

5. **Maximum 2 levels of nesting**: `features/customer/components/customer-form/` is fine. Don't nest deeper.

6. **Promotion rule**: If exactly one feature uses a hook/util → keep it in that feature. Once two or more features need it → promote to shared layer.

**How this applies to StaffiQ**: The recommended `src/features/` structure with `auth/`, `dashboard/`, `training/`, `questions/`, `tests/`, `analytics/`, `reports/`, `employees/`, `settings/`, `ai/`, `bugs/`, `tenants/` — plus `src/shared/` for components/hooks/utils used by multiple features — follows this exact pattern. The current 18,000-line App.tsx is at the "single file" stage and needs to progress through the remaining stages.

---

## Research Finding 2: React Context + Reducer Pattern (Validates State Management)

**Source**: React.dev — "Scaling Up with Reducer and Context"

The official React documentation recommends:
- Extract state logic into reducers
- Provide state + dispatch through context
- Move all wiring into a single provider file
- Export custom hooks (`useTasks()`, `useTasksDispatch()`) for consumption

**How this applies to StaffiQ**: Each extracted feature should have its own context provider (e.g., `TrainingProvider`, `AnalyticsProvider`) that manages that feature's state. The App shell should compose providers without knowing their internals. This replaces the current pattern of all state living in App.tsx's top-level `useState` calls.

---

## Research Finding 3: Firebase Multi-Site Best Practices (Validates Current Setup)

**Source**: Firebase Documentation — "Share project resources across multiple sites" (updated July 2026)

Official Firebase guidance:
- Multiple sites within one project share Firebase resources (Auth, Firestore, Functions)
- Each site has its own hosting config, content, and custom domain
- Use deploy targets (`firebase target:apply hosting <target> <site-id>`) for multi-site deploys
- Array format in `firebase.json` for multiple sites
- Maximum 36 sites per project
- For dev/staging, use separate projects (not separate sites)

**How this applies to StaffiQ**: The current setup of two sites (`staffiq-ng` for marketing, `training-assessment-1c8ef` for the app) within one Firebase project follows Firebase's recommended pattern. The marketing site and app correctly share the same Auth and Functions backend. Adding `app.staffiq.ng` as a custom domain for the web app is fully supported. A future Platform Owner site (`super.staffiq.ng`) would be a third site in the same project.

---

## Research Finding 4: Vite Code Splitting (Validates Performance Recommendation)

**Source**: Vite Documentation — "Building for Production"

Vite supports code splitting via:
- `build.rolldownOptions.output.codeSplitting` for automatic splitting
- Manual chunks for vendor separation
- Dynamic `import()` for lazy-loaded routes

**How this applies to StaffiQ**: The current 1.3MB single JS chunk can be split into:
- `react-vendor` (React, ReactDOM)
- `recharts-vendor` (Recharts charting library)
- `xlsx-vendor` (Excel export library)
- Feature chunks loaded on demand (analytics, AI chat, question banks)

This would reduce initial load from 1.3MB to approximately 200-300KB for the core app shell.

---

## Research Finding 5: React Component Extraction Principles (Validates Approach)

**Source**: Patterns.dev — "Overview of React.js"

Key principles:
- Components should have a single responsibility
- If a UI part is used several times OR is complex enough on its own, extract it
- State should be added last — design stateless first
- Modern state management: Context + Hooks or lightweight libraries (Zustand, Jotai)
- Redux remains valid for complex global state but is overkill for most cases

**How this applies to StaffiQ**: The current App.tsx has components that are complex enough to stand alone (SettingsPanel, AnalyticsDashboard, TestEngine) but are embedded in the monolith. Extracting them follows the "complex enough on its own" criterion.

---

## Research Finding 6: Monorepo vs Monolith Decision Framework

**Source**: Robin Wieruch — "App Folders in React"

Decision framework:
- **Single src/ folder**: Small team, single app, <10 features
- **Feature folders**: Growing team, single app, 10-30 features
- **Domain folders**: Multiple teams, single app, 30+ features
- **Package folders**: Shared UI library needed
- **App folders (monorepo)**: Multiple deployable apps sharing domain logic

**StaffiQ's current position**: At the "single file → feature folders" transition. With ~19 view states and growing, it should move to feature folders now, with domain folders (workspace, platform, learning) as the next stage.

---

## Summary: Research Validates All Major Recommendations

| Recommendation | Research Support | Source |
|---------------|-----------------|--------|
| Split App.tsx into feature modules | Feature folder pattern is industry standard | Robin Wieruch 2026 |
| Each feature gets its own context provider | React docs recommend context + reducer per feature | React.dev |
| Shared components/hooks/utils layer | Promotion rule: shared when used by 2+ features | Robin Wieruch 2026 |
| Public API per feature (index.ts) | Barrel files for feature boundaries | Robin Wieruch 2026 |
| Firebase multi-site hosting | Officially documented and recommended | Firebase docs 2026 |
| Vite code splitting | Supported via rolldownOptions | Vite docs |
| Strangler fig migration | Extract one feature at a time, don't rewrite | Martin Fowler (pattern) |
