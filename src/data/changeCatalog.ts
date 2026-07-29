/**
 * Version Tracker data — Super Admin only.
 *
 * Mirrors the Task Pulse "Version Tracker and Feature Update" pattern
 * (sibling app: src/lib/utils/change-catalog.ts) but with StaffiQ's own,
 * honestly-sourced entries.
 *
 * Every entry below is derived from real, dated records in
 * docs/agents/AGENT-COMMS.md — the shared, append-only multi-agent activity
 * log for this repository — or from this same session's own work. StaffiQ
 * does not maintain a public semantic version number, so the `version` field
 * here is a simple catalogue sequence number (VT-01, VT-02, ...), NOT a
 * semver release tag; do not read it as one. The catalogue starts from the
 * earliest dated agent-log record available (2026-07-14) rather than
 * inventing dates for earlier work with no verifiable date attached to it —
 * see docs/agents/AGENT-COMMS.md for the full, unabridged history.
 *
 * Keep this file additive: append new entries as work lands, do not rewrite
 * or delete prior ones (same append-only spirit as AGENT-COMMS.md itself).
 */

export type ChangeType = 'New Feature' | 'Improved Feature' | 'Bug Fix' | 'Other'
export type ChangeStatus = 'Live' | 'Pending Deployment' | 'Historical'

export interface ChangeCatalogEntry {
  version: string
  title: string
  period: string
  /** Calendar date only, no time, ISO format (yyyy-mm-dd). */
  date: string
  changeType: ChangeType
  status: ChangeStatus
  categories: string[]
  summary: string
  changes: string[]
  learningAndHelp: string
  deploymentNote: string
  /** Where this entry's evidence lives, so it never has to be taken on faith. */
  source: string
}

export const CHANGE_CATALOG_ENTRIES: ChangeCatalogEntry[] = [
  {
    version: 'VT-25',
    title: 'Public Website Load Speed: Smaller Favicon, Optimised Social Image, Self Hosted Fonts',
    period: 'July 2026',
    date: '2026-07-28',
    changeType: 'Improved Feature',
    status: 'Pending Deployment',
    categories: ['Website', 'Performance'],
    summary: 'Three front loading weight reductions across all 30 pages of the public StaffiQ website, with no visual change to any of them. Recorded honestly as Pending Deployment: both commits exist and are real, but they sit on the branch speed/staffiq-favicon-og-optimisation and have not been merged to main or deployed, and both commit messages themselves say awaiting review.',
    changes: [
      'The browser tab icon was a 1254 by 1254 source image of 328,594 bytes being downloaded in full on every one of the 30 pages purely to draw a tiny tab icon. Replaced with a proper 64 by 64 version of the same artwork at 3,705 bytes, a 98.9 per cent reduction, with all 30 pages repointed at it.',
      'The social sharing image was losslessly re optimised in place, same format and same dimensions, from 1,143,275 down to 1,039,732 bytes, roughly 9 per cent smaller.',
      'Inter and Space Grotesk were being pulled from two external font origins on every page, each needing its own DNS lookup, connection, and security handshake, with a render blocking round trip before the font file could even be requested. The exact same Latin subset font files are now served from the site itself, 70,544 bytes total for every weight of both families, covered by the existing one year immutable cache rule with no extra configuration.',
      'Net effect: two fewer external origins per page and a materially smaller first load, with identical rendering.',
    ],
    learningAndHelp: 'Nothing user facing to document. Relevant to Ayodeji only as evidence of the website speed work, and as a reminder that this improvement is not live until the branch is merged.',
    deploymentNote: 'NOT DEPLOYED. Committed on branch speed/staffiq-favicon-og-optimisation only, not merged into main, not published. Merge the branch and redeploy the website to make this real for visitors.',
    source: 'Commits 813baa8 and 3230e4c on branch speed/staffiq-favicon-og-optimisation; byte counts quoted directly from those commit messages and from SPEED_IMPROVEMENTS_CHANGELOG.md.',
  },
  {
    version: 'VT-24',
    title: 'Version Tracker & Help Centre Content Refresh',
    period: 'July 2026',
    date: '2026-07-28',
    changeType: 'Other',
    status: 'Live',
    categories: ['Documentation', 'Admin', 'Learning Center'],
    summary:
      'Brought the Version Tracker up to date with everything genuinely shipped since VT-13, and added matching Learning / Help Centre entries so the AI answer guard, the My Team manager view, and the Version Tracker itself are explained where ordinary users and the Platform Owner actually encounter them, not only in the developer log.',
    changes: [
      'Added VT-14 through VT-23 to src/data/changeCatalog.ts, each traced to a specific dated docs/agents/AGENT-COMMS.md entry or a specific git commit on main, cross-checked against git log --oneline -30 so nothing shipped since VT-13 was left undocumented.',
      'Added three new entries to the src/App.tsx Learning / Help Centre knowledge base (helpKnowledgeItems): the AI hierarchy privacy guard, the My Team manager view, and Version Tracker (SuperAdmin only), matching the file\'s existing HelpContentItem structure and tone exactly.',
      'Deliberately did not add a Help Centre entry for the Firestore legacy collection rename: it changes nothing a user can see or do, so a help article would have nothing to explain.',
    ],
    learningAndHelp: 'This entry documents the documentation update itself, in keeping with this catalogue\'s own append-only, evidence-first practice.',
    deploymentNote:
      'Built and deployed together with VT-14 through VT-23 in this same session. See this session\'s docs/agents/AGENT-COMMS.md entry for the real build, typecheck, and live verification evidence.',
    source: 'This session — see docs/agents/AGENT-COMMS.md, Claude (Cowork), 2026-07-28.',
  },
  {
    version: 'VT-23',
    title: 'Admin Cloud Save Reliability on Reconnect',
    period: 'July 2026',
    date: '2026-07-27',
    changeType: 'Bug Fix',
    status: 'Live',
    categories: ['Reliability', 'Admin'],
    summary:
      'Fixed a real data-loss risk: when an admin\'s connection dropped mid-save, the app previously just relabelled the status pill and hoped the browser would eventually resend the change. It now actually retries the save once the connection returns, instead of silently leaving it unsent.',
    changes: [
      'src/App.tsx: the last unsent admin change is now persisted to local storage, so a page refresh during an outage cannot lose it.',
      'Retries fire on the browser\'s online event, again on component mount, and on a 20 second safety-net poll for connections that reconnect without ever firing that event.',
    ],
    learningAndHelp: 'No new screen or setting; this is an under-the-hood fix so admin edits made during a dropped connection are no longer silently lost.',
    deploymentNote: 'Committed to main (18b1230). Built and deployed to the live app in this session alongside VT-14 through VT-22 — see this session\'s AGENT-COMMS.md entry for real build and deploy evidence.',
    source: 'git log, commit 18b1230, 2026-07-27 15:05.',
  },
  {
    version: 'VT-22',
    title: 'Automated Test Coverage & CI Lint Gate for the AI Guard',
    period: 'July 2026',
    date: '2026-07-27',
    changeType: 'Other',
    status: 'Live',
    categories: ['Quality', 'CI', 'AI'],
    summary:
      'Added real automated tests for the hierarchy-aware AI answer guard (27 passing tests) and a lint check that now runs before every deploy, plus the missing robots.txt and sitemap.xml for the marketing site, closing three separate gaps in one pass.',
    changes: [
      'src/ai-guard.test.ts (NEW) + vitest.config.ts (NEW): 27 real, passing tests exercising the reporting-chain and tier logic added for VT-12/VT-16, so a future change that weakens the guard now fails a test instead of shipping unnoticed.',
      '.github/workflows/deploy.yml: added a lint step that must pass before the existing deploy workflow runs.',
      'public/robots.txt and public/sitemap.xml (NEW): previously missing from the app shell.',
    ],
    learningAndHelp: 'No visible change for users; this is quality infrastructure protecting the AI guard described in VT-16.',
    deploymentNote: 'Committed to main (7a7903b) — the commit message itself said "not pushed" at the time, but it is present on main as of this session\'s git log and was built and deployed together with the rest of this batch.',
    source: 'git log, commit 7a7903b, 2026-07-27 11:10.',
  },
  {
    version: 'VT-21',
    title: 'Flutterwave Checkout Safety Gate',
    period: 'July 2026',
    date: '2026-07-27',
    changeType: 'Bug Fix',
    status: 'Live',
    categories: ['Billing', 'Security'],
    summary:
      'Closed a latent risk before it could ever bite: no screen in StaffiQ actually lets a client choose Flutterwave as a payment provider today, but the Flutterwave code path itself had no safeguard stopping a future change from wiring it in half-finished. Recurring charges and refunds were never implemented for it. A hard runtime guard now blocks it outright until that work is finished.',
    changes: [
      'functions/src/billing/flutterwave.ts: createCheckout() now throws immediately unless a FLUTTERWAVE_CHECKOUT_SELECTABLE flag (currently false) is turned on, with an inline note explaining why.',
      'Verified first that no live path exists today for a client to reach Flutterwave (only Paystack is wired into functions/src/billing/endpoints.ts), so this is a precaution, not a fix to a live bug.',
    ],
    learningAndHelp: 'No visible change for clients; Paystack remains the only working payment path today.',
    deploymentNote: 'Committed to main (e61ab86). Built and deployed to Cloud Functions together with the rest of this batch.',
    source: 'git log, commit e61ab86, 2026-07-27 02:35.',
  },
  {
    version: 'VT-20',
    title: 'Hardcoded Identity Checks Replaced With Canonical Permission Checks',
    period: 'July 2026',
    date: '2026-07-27',
    changeType: 'Bug Fix',
    status: 'Live',
    categories: ['Security', 'Admin'],
    summary:
      'Replaced two places where access to a privileged screen was decided by comparing a user ID literal string ("U001") instead of the app\'s own official ownership check, closing a small but real gap where a future rename or a copy-paste elsewhere could quietly break access control.',
    changes: [
      'src/App.tsx: the AI Usage Dashboard view now uses isAyodejiTokenOwner() instead of a bare currentUser?.userId === \'U001\' comparison.',
      'src/hooks/useEntitlement.ts: the client-side Platform Owner billing bypass now imports and calls the single canonical isPlatformOwner() check instead of duplicating the role/name comparison inline.',
      'A broader sweep found further bare "U001" comparisons inside functions/ that were flagged for a follow-up, not fixed in this same pass.',
    ],
    learningAndHelp: 'No visible change; same people have the same access as before, reached through a safer, single, reusable check.',
    deploymentNote: 'Committed to main (02dfd72). Built and deployed together with the rest of this batch.',
    source: 'git log, commit 02dfd72, 2026-07-27 02:31.',
  },
  {
    version: 'VT-19',
    title: 'My Team — Manager Reporting View',
    period: 'July 2026',
    date: '2026-07-27',
    changeType: 'New Feature',
    status: 'Live',
    categories: ['Employee', 'Admin', 'UX'],
    summary:
      'A manager\'s reporting line (supervisorId) previously only existed in the background — set via CSV import and used only by the AI guard to decide what the assistant could discuss. It never actually scoped any screen. A new My Team view now shows a manager their own direct reports and each person\'s completed-assessment summary, and an admin can finally set or change who reports to whom without a bulk import.',
    changes: [
      'src/App.tsx: new "My Team" nav item and view, visible only to a user who is the actual supervisorId of at least one other user. Shows that manager\'s direct reports and a completed-assessment summary for each — never another manager\'s team, never the whole directory.',
      'New updateUserSupervisor() lets an admin set or change a user\'s supervisor directly from the Manage Users credential screen, closing the gap where this could previously only be set via CSV/XLSX import.',
      'Scoped to one reporting level for now: a manager\'s manager seeing the whole downward chain is an explicit, flagged follow-up, not built yet.',
    ],
    learningAndHelp: 'A "My Team" nav item now appears for anyone set as another user\'s supervisor; added a matching Learning / Help Centre entry explaining it (see help-my-team-view in src/App.tsx).',
    deploymentNote: 'Committed to main (06da009), tsc -b and npm run build both verified passing at commit time. Built and deployed to the live app together with the rest of this batch.',
    source: 'git log, commit 06da009, 2026-07-27 02:29.',
  },
  {
    version: 'VT-18',
    title: 'Client AI Keys — Platform-Level DeepSeek Key Pool',
    period: 'July 2026',
    date: '2026-07-26',
    changeType: 'New Feature',
    status: 'Live',
    categories: ['AI', 'Admin', 'Billing'],
    summary:
      'Added a Super Admin tab for managing the DeepSeek AI credentials behind StaffiQ\'s AI features. It started the same day as a single tenant-owned key with a shared platform fallback, then was replaced, same day, with a platform-level pool of up to 10 named keys that can each be assigned to one client tenant at a time, with sync-status tracking back to that client\'s own portal.',
    changes: [
      'functions/src/aiProviderKeys/ (NEW): stores each tenant\'s DeepSeek credential; resolveDeepSeekCredential() falls back to a shared platform key until a tenant has its own, then automatically switches that tenant to the deepseek-flash model.',
      'src/superadmin/components/ClientAiKeysPanel.tsx (NEW): Super Admin tab to view and manage keys, self-contained in the same style as VersionTrackerPanel and FeatureParityPanel.',
      'Same-day follow-up replaced the single-tenant-key model with a platform-level pool of up to 10 named, reassignable keys.',
    ],
    learningAndHelp: 'Super Admin only — not shown to Admin or Employee accounts.',
    deploymentNote: 'Committed to main (c8ba9d4, then b7f61a9 and 0dac271 same/next day). Built and deployed together with the rest of this batch.',
    source: 'git log, commits c8ba9d4 / b7f61a9 / 0dac271, 2026-07-26.',
  },
  {
    version: 'VT-17',
    title: 'Version Tracker & Feature Parity Tabs Mounted in Super Admin Panel',
    period: 'July 2026',
    date: '2026-07-26',
    changeType: 'Improved Feature',
    status: 'Live',
    categories: ['Admin', 'Documentation'],
    summary:
      'Closes the gap flagged honestly in VT-13: the Version Tracker tab existed in the codebase but SuperAdminPanel was never actually mounted anywhere in the running app, so nobody could reach it. It is now wired into src/App.tsx behind the existing Platform Owner check, so the Version Tracker (and Feature Parity) tabs are genuinely reachable.',
    changes: [
      'src/App.tsx: SuperAdminPanel mounted behind the existing isAyodejiTokenOwner check already used for API Tokens / Feature Inventory / Bug Reports, added to the AppView union, nav items, and visible admin nav filter.',
    ],
    learningAndHelp: 'Super Admin only. This is the entry that makes VT-13\'s Version Tracker tab actually visible in the app rather than only in source.',
    deploymentNote: 'Committed to main as part of 1c1e385. Deployed and verified live 2026-07-26 (see docs/agents/AGENT-COMMS.md, Claude (Cowork), 2026-07-26 entry) and confirmed again in this session.',
    source: 'docs/agents/AGENT-COMMS.md, Claude (Cowork), 2026-07-25 (later same day) and 2026-07-26 entries; git commit 1c1e385.',
  },
  {
    version: 'VT-16',
    title: 'Hierarchy-Aware AI Answer Guard Now Live + Session-Based Admin Authentication Hardening',
    period: 'July 2026',
    date: '2026-07-26',
    changeType: 'Improved Feature',
    status: 'Live',
    categories: ['AI', 'Security'],
    summary:
      'The reporting-chain-aware AI guard built in VT-12 is now actually wired into the live AI assistants and deployed to production, not just sitting in source. Alongside it, several admin-only Cloud Functions were switched from trusting a caller-supplied header or body value for identity to verifying a real signed session, closing a spoofing gap.',
    changes: [
      'functions/index.js: guardAiQuestion() now runs before the model call and filterAiAnswerToTier() after it, in both analyticsIntelligence and helpIntelligence, live in production.',
      'Replaced header/body-trusted caller identity with signed-session verification (verifyTenantSession) on staffiqAIAdminTenantAccess, staffiqAIAdminUserAccess, staffiqAIAdminUsage, staffiqGrantCreate, staffiqGrantRevoke, and staffiqGrantList, plus the matching client calls.',
      'AI Usage dashboard: the monthly call limit is now actually saved via /api/ai-admin/tenant-access instead of a no-op demo input.',
    ],
    learningAndHelp: 'No visible change to how the AI assistants look; the difference is what they will and will not say about other people. See the new AI privacy FAQ entry in the Learning / Help Centre.',
    deploymentNote: 'Committed to main as part of 1c1e385. Deployed via a real firebase deploy --only functions,hosting,firestore and verified live 2026-07-26 (see docs/agents/AGENT-COMMS.md, Claude (Cowork), 2026-07-26 entry).',
    source: 'docs/agents/AGENT-COMMS.md, Claude (Cowork), 2026-07-26 entry; git commit 1c1e385.',
  },
  {
    version: 'VT-15',
    title: 'Firestore Legacy Collection Rename — Backfill, Verify, Cutover',
    period: 'July 2026',
    date: '2026-07-26',
    changeType: 'Improved Feature',
    status: 'Live',
    categories: ['Database', 'Reliability', 'Migration'],
    summary:
      'Finished the data-naming cleanup flagged back in VT-11: StaffiQ\'s core Firestore collections were still named after the old "deapApp" product name. They have now been renamed to staffiqLegacyApp / staffiqLegacyCourseImages / staffiqLegacyQuestionBanks, with every record copied and verified byte-for-byte before the app was switched over to read from the new names. The old collections were deliberately kept in place as a permanent safety net, not deleted.',
    changes: [
      'scripts/migrate-legacy-collections.cjs run for real against the production project: backfilled deapApp/sharedState, deapCourseImages, and deapQuestionBanks (including their chunks subcollections) into the new staffiqLegacy* names.',
      'Verified before cutover: sharedState doc matched, 2/2 course images matched, 3/3 question bank parent docs matched, and all 4,532 question-bank chunks matched by count with deep-equality spot checks passing on every bank.',
      'functions/index.js switched to read from the new staffiqLegacy* collections at all 5 call sites; the old deap* collections are untouched and kept as the dual-write safety-net target, per the Zero Data Loss Policy retention window.',
      'scripts/verify-tenant-architecture.cjs (the deploy gate) updated to require the new names while confirming the old names are still present as the safety net.',
    ],
    learningAndHelp: 'No end-user facing change — this is an internal data-naming cleanup with no visible screen or behaviour difference, so no Help Centre entry was added for it.',
    deploymentNote: 'Committed to main (1c1e385). Deployed via a real firebase deploy --only functions,hosting,firestore and confirmed live 2026-07-26: every function showed no changes needed on a follow-up deploy, meaning the cutover had already taken effect.',
    source: 'docs/agents/AGENT-COMMS.md, Claude (Cowork), 2026-07-25 (later same day, migration plan) and 2026-07-26 (verification and cutover close-out) entries; git commit 1c1e385.',
  },
  {
    version: 'VT-14',
    title: 'Per-Tenant API Keys & Usage Dashboard',
    period: 'July 2026',
    date: '2026-07-25',
    changeType: 'New Feature',
    status: 'Live',
    categories: ['Admin', 'API', 'Billing'],
    summary:
      'Added the ability to issue each client its own API key so their usage can be tracked and reconciled separately, plus a Super Admin dashboard to issue, view, and revoke those keys and see monthly usage per key.',
    changes: [
      'functions/src/apiKeys/ (NEW): per-tenant API key issuing, listing, revocation (reason + actor required, never hard-deleted), and rotation; monthly usage aggregation plus a rolling usage-events log; five new staffiqApiKey* Cloud Functions; a daily scheduled usage snapshot to Cloud Storage for reconciliation.',
      'src/superadmin/components/ApiKeysUsagePanel.tsx (NEW): Super Admin tab to issue/revoke keys and see this month\'s usage per key.',
      'Fails closed until the STAFFIQ_API_KEY_PEPPER and STAFFIQ_RECONCILIATION_TOKEN secrets are set (they were bound as Cloud Functions v2 secrets the same night).',
    ],
    learningAndHelp: 'Super Admin only — not shown to Admin or Employee accounts.',
    deploymentNote: 'Committed to main (c232353, 373c2fd, 5ce02a6). Built and deployed to Cloud Functions and Hosting together with the rest of this batch, after an earlier session flagged it blocked by a repository lock file.',
    source: 'docs/agents/AGENT-COMMS.md, Claude (Cowork), 2026-07-25 (later same day) entry; git commits c232353 / 373c2fd / 5ce02a6.',
  },
  {
    version: 'VT-13',
    title: 'Version Tracker Super Admin Tab',
    period: 'July 2026',
    date: '2026-07-25',
    changeType: 'New Feature',
    status: 'Pending Deployment',
    categories: ['Admin', 'Documentation', 'AI'],
    summary:
      'Added a Version Tracker tab to the Super Admin panel: a filterable table of every recorded StaffiQ change with an exact date, a New Feature / Improved Feature / Bug Fix / Other classification, and a scoped question box that answers only from this catalogue.',
    changes: [
      'Added src/data/changeCatalog.ts as the single source of truth for this table, sourced from docs/agents/AGENT-COMMS.md.',
      'Added src/superadmin/components/VersionTrackerPanel.tsx: filter by change type, filter by change area, expandable row detail, and an extractive (non-model) "Ask the Version Tracker" box.',
      'Added the "versionTracker" tab to SuperAdminPanel.tsx TAB_CONFIG and a matching team-safe stub export.',
    ],
    learningAndHelp: 'Super Admin only — not shown to Admin or Employee accounts.',
    deploymentNote:
      'Source only in this pass: added to the repository but not built or deployed by this session (sandbox cannot reliably run npm run build / tsc). Needs a real build + review before it reaches production, and SuperAdminPanel itself is not yet mounted inside src/App.tsx — see the Handoff Notes in docs/agents/AGENT-COMMS.md for this session.',
    source: 'This session — see docs/agents/AGENT-COMMS.md, Claude (Cowork), 2026-07-25.',
  },
  {
    version: 'VT-12',
    title: 'Manager Hierarchy Field + Hierarchy-Aware AI Answer Guard',
    period: 'July 2026',
    date: '2026-07-25',
    changeType: 'New Feature',
    status: 'Pending Deployment',
    categories: ['AI', 'Security', 'Admin', 'Database'],
    summary:
      'Added an additive, nullable manager_id column to database/schema.sql for reporting-line parity with the Firestore runtime (which already carries a supervisorId field on user records), plus a new reporting-chain-aware AI answer guard wired into both the analyticsIntelligence and helpIntelligence Cloud Functions.',
    changes: [
      'database/schema.sql: added nullable, self-referencing users.manager_id (ON DELETE SET NULL) and a supporting index. No NOT NULL constraint, no change to the existing super_admin/admin/employee role enum.',
      'Added src/ai-guard.ts and its CommonJS twin functions/ai-guard.js: reporting-chain resolver, an AI access tier (public/admin/super_admin), keyword-based tier detection, and a named-person guard so the assistant will not discuss someone outside the caller\'s reporting chain unless the caller is admin or super_admin.',
      'Wired the guard into functions/index.js: both exports.analyticsIntelligence and exports.helpIntelligence now run the guard BEFORE calling the Perplexity model, and filter the model\'s answer again AFTER, before it reaches the caller.',
      'Added a small, additive askedBy field to the analytics AI payload and a userId field to the help AI payload (src/App.tsx) so the server has a viewer identity to guard with; both are optional and the guard degrades gracefully to tier-only checking when absent.',
    ],
    learningAndHelp: 'No public-facing copy change. Internal note: the AI assistants now reason about people, not only about admin-only topics.',
    deploymentNote:
      'Source only in this pass: functions/index.js and src/App.tsx changes are not deployed. A real build/typecheck was not run in this session\'s sandbox — every touched file was manually reviewed for balanced braces/JSX/types instead. Deploy functions and hosting together after a real build passes.',
    source: 'This session — see docs/agents/AGENT-COMMS.md, Claude (Cowork), 2026-07-25.',
  },
  {
    version: 'VT-11',
    title: 'DEAP to StaffiQ Documentation Naming Sweep',
    period: 'July 2026',
    date: '2026-07-23',
    changeType: 'Other',
    status: 'Live',
    categories: ['Documentation', 'Branding'],
    summary:
      'Replaced case-sensitive "DEAP" / "Dynamic Employee Assessment Portal" with "StaffiQ" across 27 living documentation files, while deliberately leaving append-only logs, live Firestore collection names (deapApp, deapCourseImages, deapQuestionBanks), and coupled internal tooling names (DEAP_PORTAL_URL, .deap-continuity, /api/deap-state) untouched pending a real data migration plan.',
    changes: [
      'Renamed README.md, docs/ARCHITECTURE_*.md, docs/MULTI_TENANT_ARCHITECTURE.md, docs/ZERO_DATA_LOSS_POLICY.md, docs/AI_GOVERNANCE_IMPLEMENTATION.md, docs/GITHUB_SETUP.md, docs/DEAP_25_RECOMMENDATIONS_2026.md and sibling docs.',
      'Verified with a full re-grep after the sweep: zero case-sensitive matches left in any of the 27 renamed files.',
      'Left functions/index.js Firestore collection names and scripts/deap-continuity-guard.cjs / scripts/deap-problem-monitor.cjs untouched on purpose — renaming those without a real migration would break the app\'s own ability to find its existing data.',
    ],
    learningAndHelp: 'No end-user facing change.',
    deploymentNote: 'Documentation only; no deploy required.',
    source: 'docs/agents/AGENT-COMMS.md, Claude (Cowork), 2026-07-23 (naming sweep entry).',
  },
  {
    version: 'VT-10',
    title: 'TaskPulse / StaffiQ Feature Parity Audit',
    period: 'July 2026',
    date: '2026-07-23',
    changeType: 'Other',
    status: 'Live',
    categories: ['Documentation', 'Product', 'Admin'],
    summary:
      'Delivered a code-verified feature parity comparison between StaffiQ and its sister app Task Pulse, cataloguing build gaps including the three Super Admin panel stub files, the partial Flutterwave provider, the missing manager/reporting hierarchy (the gap this session\'s VT-12 entry starts to close), and a hardcoded-name authorisation check.',
    changes: [
      'Produced docs/TASKPULSE_STAFFIQ_FEATURE_PARITY_AUDIT.xlsx and the FeatureParityPanel.tsx Super Admin tab backed by src/data/featureParity.ts.',
      'Catalogued exact file and line references for every build gap identified, not general impressions.',
    ],
    learningAndHelp: 'Super Admin only, Feature Parity tab.',
    deploymentNote: 'Documentation and a self-contained read-only panel; no schema or runtime change.',
    source: 'docs/agents/AGENT-COMMS.md, Claude (Cowork), 2026-07-23 (scan phase entry).',
  },
  {
    version: 'VT-09',
    title: 'Hosting Site Misconfiguration + CSP Gaps Fixed',
    period: 'July 2026',
    date: '2026-07-22',
    changeType: 'Bug Fix',
    status: 'Live',
    categories: ['Security', 'Deployment', 'CSP'],
    summary:
      'Found and fixed two pre-existing bugs before deploying tracking code: root firebase.json pointed the "deploy:safe" script at the marketing site (staffiq-ng) instead of the app site (training-assessment-1c8ef), and the Content-Security-Policy on both StaffiQ hosting configs was missing the Google Analytics and Microsoft Clarity domains, which would have silently blocked the just-added tracking snippets.',
    changes: [
      'Corrected firebase.json hosting.site from staffiq-ng to training-assessment-1c8ef (confirmed via firebase hosting:sites:list).',
      'Added https://www.googletagmanager.com to script-src and the Google Analytics domains to connect-src in both firebase.json and staffiq-website/firebase.json.',
      'Added https://www.clarity.ms to both CSP directives on the marketing site config.',
    ],
    learningAndHelp: 'No end-user facing change; this was infrastructure correctness.',
    deploymentNote: 'Deployed and verified live: both hosting sites released correctly to their intended targets afterward.',
    source: 'docs/agents/AGENT-COMMS.md, Claude (Cowork), 2026-07-22 09:00 and 09:30 entries.',
  },
  {
    version: 'VT-08',
    title: 'GA4 + Search Console + Microsoft Clarity Rollout',
    period: 'July 2026',
    date: '2026-07-21',
    changeType: 'New Feature',
    status: 'Live',
    categories: ['Analytics', 'Marketing', 'Tracking'],
    summary:
      'Stood up the external analytics/SEO stack for staffiq.ng: a GA4 property, Search Console verification and sitemap submission, and installed the real GA4 measurement ID plus a Microsoft Clarity snippet across all marketing pages and the web-app shell.',
    changes: [
      'Created GA4 property "StaffiQ" (Measurement ID G-70WMCDHYC0) and verified Search Console for https://www.staffiq.ng/, sitemap.xml submitted (29 pages, status Success).',
      'Swapped the placeholder G-XXXXXXXXXX for the real GA4 ID across all 30 staffiq-website/*.html pages and added the Microsoft Clarity snippet (project xps118m9lt).',
      'Added a separate GA4 stream (G-PYTVN2Y33X) to the web-app shell root index.html, deliberately not touching the Codex-owned src/App.tsx to add it.',
    ],
    learningAndHelp: 'No end-user facing change.',
    deploymentNote: 'Deployed to both staffiq-ng and training-assessment-1c8ef, then live-verified via browser JS inspection with zero console errors on both.',
    source: 'docs/agents/AGENT-COMMS.md, Claude (Cowork), 2026-07-21 16:00 / 16:30 and 2026-07-22 09:30 entries.',
  },
  {
    version: 'VT-07',
    title: 'AI & IDE Access Governance Report',
    period: 'July 2026',
    date: '2026-07-19',
    changeType: 'Other',
    status: 'Live',
    categories: ['Documentation', 'Governance', 'AI'],
    summary:
      'Produced an executive Word report comparing implemented, partial, outstanding, and rejected AI/IDE access controls for StaffiQ, including an approval checklist and a risk register, without changing any application source, production data, or deployment.',
    changes: [
      'output/doc/StaffiQ_AI_IDE_Access_and_Secret_Protection_Report.docx delivered and page-by-page reviewed.',
    ],
    learningAndHelp: 'Reference document for governance review, not end-user facing.',
    deploymentNote: 'Document-only delivery; no deploy involved.',
    source: 'docs/agents/AGENT-COMMS.md, Codex, 2026-07-19 12:00 / 12:30 entries.',
  },
  {
    version: 'VT-06',
    title: 'Learning Tips Snooze Control',
    period: 'July 2026',
    date: '2026-07-16',
    changeType: 'New Feature',
    status: 'Live',
    categories: ['UX', 'Learning Center'],
    summary:
      'Added a snooze/pause control for contextual learning tips and popups (1 day / 3 days / 1 week), available both from a sidebar control and from inside every tip popup, where previously only a blanket on/off Learning tips toggle existed.',
    changes: [
      'src/chats-module.ts: tooltip footer with 1d/3d/1w pause buttons.',
      'src/App.tsx: snooze state, auto-resume timer, and a sidebar control placed immediately before the sidebar resize handle for all users.',
      'src/App.css: styling for the new controls.',
    ],
    learningAndHelp: 'Learning Center tips can now be paused by any user directly from the tip itself.',
    deploymentNote: 'tsc --noEmit passed clean at the time; full build/deploy was blocked by a documented sandbox stale-mount issue and left for a later session to complete.',
    source: 'docs/agents/AGENT-COMMS.md, Claude (Cowork), 2026-07-16 02:35 entry (tips snooze feature).',
  },
  {
    version: 'VT-05',
    title: 'SuperAdmin Isolation Module Scaffolded',
    period: 'July 2026',
    date: '2026-07-16',
    changeType: 'New Feature',
    status: 'Live',
    categories: ['Admin', 'Security', 'Architecture'],
    summary:
      'Scaffolded src/superadmin/ as an isolated Platform Owner module, with a real implementation (auth, tokens, branding, tester accounts) and a team-safe stub, switched by a VITE_SUPERADMIN_SOURCE build variable, and enforced by CODEOWNERS.',
    changes: [
      'Added VITE_SUPERADMIN_SOURCE to .env.example and a matching alias in vite.config.ts.',
      'Populated src/superadmin/ with real implementations plus src/superadmin/stub.ts no-op equivalents.',
      '.github/CODEOWNERS enforces Platform Owner approval on all sensitive paths under src/superadmin/.',
    ],
    learningAndHelp: 'Foundation for all subsequent Super Admin tabs, including this session\'s Version Tracker tab.',
    deploymentNote: 'npm run build verified passing at the time (2297 modules, 0 errors).',
    source: 'docs/agents/AGENT-COMMS.md, Copilot (VS Code — V4 Pro), 2026-07-16 entry.',
  },
  {
    version: 'VT-04',
    title: 'Public Website Responsiveness + Header Redesign',
    period: 'July 2026',
    date: '2026-07-15',
    changeType: 'Improved Feature',
    status: 'Live',
    categories: ['Marketing', 'Website', 'UI'],
    summary:
      'Tightened staffiq-website responsiveness across phone, tablet, laptop, and desktop widths and rebuilt the header to match the Task Pulse sister-brand navigation pattern.',
    changes: [
      'Compact tablet navigation before the desktop header becomes crowded; contained narrow-phone sector-ticker overflow.',
      'Header rebuilt with a larger logo lockup and tagline, active Home pill, and a Request demo / Client login pairing on desktop.',
      'Verified with Playwright across phone 320/390, tablet 768/1024, laptop 1366, and desktop 1440.',
    ],
    learningAndHelp: 'Public marketing site only, no in-app change.',
    deploymentNote: 'Deployed to staffiq-ng; npm run check and npm run build both passed before deploy.',
    source: 'docs/agents/AGENT-COMMS.md, Codex, 2026-07-15 entries (header + responsiveness passes).',
  },
  {
    version: 'VT-03',
    title: 'Privileged Role Visibility Cleanup',
    period: 'July 2026',
    date: '2026-07-14',
    changeType: 'Bug Fix',
    status: 'Live',
    categories: ['Security', 'Marketing'],
    summary:
      'Removed public references to the privileged Super Admin role from the marketing site, branded login bundle, and public API error wording, so unauthenticated visitors and API callers can no longer discover that a privileged tier exists.',
    changes: [
      'Public pages, the branded login bundle, and feature-inventory/problem-report endpoints no longer disclose the Super Admin role name or its API routes.',
      'The old /api/superadmin/feature_inventory route now returns 404 on www.staffiq.ng.',
    ],
    learningAndHelp: 'No visible change for ordinary users; this closes an information-disclosure gap.',
    deploymentNote: 'Builds, production bundle scan, and live API checks all passed before the deapFeatureInventory / deapProblemReports functions and hosting were redeployed.',
    source: 'docs/agents/AGENT-COMMS.md, Codex, 2026-07-14 entries (privileged role visibility cleanup).',
  },
  {
    version: 'VT-02',
    title: 'StaffiQ Custom Domain Connected (staffiq.ng)',
    period: 'July 2026',
    date: '2026-07-14',
    changeType: 'Other',
    status: 'Live',
    categories: ['Domain', 'Deployment', 'DNS'],
    summary:
      'Connected the staffiq.ng custom domain to Firebase Hosting, with www.staffiq.ng as the primary host and the apex domain permanently redirecting to it.',
    changes: [
      'Whogohost nameservers delegated to Firebase; apex A record, www CNAME, and ownership/SSL verification TXT records confirmed publicly resolving.',
      'The temporary staffiq-ng.web.app address remained available throughout provisioning as a fallback.',
    ],
    learningAndHelp: 'No in-app change.',
    deploymentNote: 'DNS/hosting configuration only; no application code touched.',
    source: 'docs/agents/AGENT-COMMS.md, Codex, 2026-07-14 entry (custom domain connection).',
  },
  {
    version: 'VT-01',
    title: 'Public StaffiQ Website Launch (staffiq-ng)',
    period: 'July 2026',
    date: '2026-07-14',
    changeType: 'New Feature',
    status: 'Live',
    categories: ['Marketing', 'Website', 'Deployment'],
    summary:
      'Built and deployed the standalone public StaffiQ marketing website (staffiq-website/) to its own dedicated Firebase Hosting site, separate from and never cross-deployed with the application itself.',
    changes: [
      'Seven pages built, source-verified, and deployed to the dedicated Firebase Hosting site staffiq-ng.',
      'Browser-verified at desktop and mobile viewports across six public pages, including overflow, hidden content, console errors, and mobile menu keyboard behaviour.',
      'Live HTTP and security header checks passed at the temporary staffiq-ng.web.app address.',
    ],
    learningAndHelp: 'Public marketing site only; existing application hosting configuration was left unchanged.',
    deploymentNote: 'First deploy of the marketing site, deliberately isolated from the app\'s own hosting target from day one.',
    source: 'docs/agents/AGENT-COMMS.md, Codex, 2026-07-14 entries (public website build and deployment).',
  },
]

export function getLatestChangeCatalogEntry(): ChangeCatalogEntry {
  return getChangeCatalogEntriesSortedByDate()[0]
}

export function getChangeCatalogCategoryCounts(): Array<{ category: string; count: number }> {
  const counts = new Map<string, number>()
  CHANGE_CATALOG_ENTRIES.forEach((entry) => {
    entry.categories.forEach((category) => {
      counts.set(category, (counts.get(category) ?? 0) + 1)
    })
  })
  return Array.from(counts.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((left, right) => right.count - left.count || left.category.localeCompare(right.category))
}

const CHANGE_TYPE_ORDER: ChangeType[] = ['New Feature', 'Improved Feature', 'Bug Fix', 'Other']

/** Counts per change type, in a fixed, stable display order rather than alphabetical or by size. */
export function getChangeTypeCounts(): Array<{ changeType: ChangeType; count: number }> {
  const counts = new Map<ChangeType, number>()
  CHANGE_CATALOG_ENTRIES.forEach((entry) => {
    counts.set(entry.changeType, (counts.get(entry.changeType) ?? 0) + 1)
  })
  return CHANGE_TYPE_ORDER.map((changeType) => ({ changeType, count: counts.get(changeType) ?? 0 }))
}

/** Entries sorted newest date first (ties broken by version string, descending). */
export function getChangeCatalogEntriesSortedByDate(): ChangeCatalogEntry[] {
  return [...CHANGE_CATALOG_ENTRIES].sort(
    (left, right) => right.date.localeCompare(left.date) || right.version.localeCompare(left.version),
  )
}

export interface ChangeCatalogAnswer {
  answer: string
  matches: ChangeCatalogEntry[]
}

/**
 * Intelligent question box for the Version Tracker, scoped ONLY to this
 * catalogue's own data, never to the wider app. Extractive, not a model call:
 * ranks entries by keyword overlap against title, summary, changes,
 * categories, version, and change type, so it works instantly, never
 * hallucinates a version that was not recorded, and never needs a network
 * round trip. Good enough for "what shipped in July", "show me bug fixes",
 * "what changed about AI access" style questions.
 */
export function answerChangeCatalogQuestion(question: string): ChangeCatalogAnswer {
  const trimmed = question.trim()
  if (!trimmed) {
    return {
      answer: 'Ask about a version, a month, a change type (new feature, improved feature, bug fix), or a topic like AI, security, or deployment.',
      matches: [],
    }
  }

  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'of', 'in', 'on', 'to', 'for', 'what', 'when',
    'did', 'was', 'were', 'is', 'are', 'about', 'me', 'show', 'tell', 'which',
  ])
  const monthNames = [
    'january', 'february', 'march', 'april', 'may', 'june', 'july',
    'august', 'september', 'october', 'november', 'december',
  ]
  const words: string[] = trimmed.toLowerCase().match(/[a-z0-9.]+/g) ?? []
  const keywords = words.filter((word) => word.length >= 3 && !stopWords.has(word))

  const mentionedMonth = monthNames.find((month) => words.includes(month))
  const mentionedType = CHANGE_TYPE_ORDER.find((type) => trimmed.toLowerCase().includes(type.toLowerCase()))

  const scored = CHANGE_CATALOG_ENTRIES.map((entry) => {
    const haystack = [entry.version, entry.title, entry.summary, entry.period, entry.changeType, ...entry.categories, ...entry.changes]
      .join(' ')
      .toLowerCase()

    let score = 0
    keywords.forEach((word) => {
      if (haystack.includes(word)) score += 1
    })
    if (mentionedMonth && entry.date) {
      const entryMonth = new Date(`${entry.date}T00:00:00`).toLocaleString('en-GB', { month: 'long' }).toLowerCase()
      if (entryMonth === mentionedMonth) score += 3
    }
    if (mentionedType && entry.changeType === mentionedType) score += 3
    if (trimmed.toLowerCase().includes(entry.version.toLowerCase())) score += 5

    return { entry, score }
  })

  const matches = scored
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score || right.entry.date.localeCompare(left.entry.date))
    .slice(0, 6)
    .map((item) => item.entry)

  if (matches.length === 0) {
    return {
      answer: `No recorded change matches "${trimmed}" yet. Try a month name, a change type, or a word from a feature name.`,
      matches: [],
    }
  }

  const lead =
    matches.length === 1
      ? `${matches[0].version} (${matches[0].date}) — ${matches[0].title}: ${matches[0].summary}`
      : `${matches.length} matching entries, newest first: ${matches.map((entry) => `${entry.version} (${entry.date})`).join(', ')}.`

  return { answer: lead, matches }
}
