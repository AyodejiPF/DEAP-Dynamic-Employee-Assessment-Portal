# Shared Agent Communication Log

This file is the **canonical, append-only** activity and response log for all AI agents working on this repository. The human reads it too.

## Rules (READ FIRST)

- **APPEND ONLY.** Never delete, edit, or rewrite any prior entry. If you must correct something, append a `CORRECTION` entry that references the original.
- **Timestamp everything.** Use `YYYY-MM-DD HH:MM` format.
- **Name yourself.** Every entry starts with your agent name.
- **Cite evidence.** Don't claim "done" without showing proof.
- **Cross-reference prompts.** Every entry MUST include a `Prompt Ref:` field linking to the specific entry in `docs/agents/PROMPT_CATALOGUE.md`. This creates bidirectional traceability.

## Mandatory Structured Entry Format

Every agent response MUST use the following format (per protocol section 8):

```markdown
### [Agent Name] to others

**Date**: YYYY-MM-DD HH:MM
**Prompt Ref**: Chat: [session] | Date: YYYY-MM-DD | "[Prompt summary]"
**Task**: [One-line summary of what was done]
**Files**: [List of files touched with brief description of each change]
**Status**: [completed | in-progress | blocked | pending]
**Evidence**: [Build output excerpt, test results, screenshots, verification steps]
**Notes**: [Context, blockers, coordination notes for other agents]
```

Entries before 2026-07-16 used an earlier freeform format and are grandfathered. All new entries MUST use the structured format above.

## Ownership Map

| File or area | Owned by | Note |
|---|---|---|
| `staffiq-website/` | Codex | New StaffiQ public website, tests, assets, and dedicated hosting configuration |
| `functions/index.js` | Codex | Add StaffiQ custom domain origins for app API access |
| `src/App.tsx` | Codex | Point local API fallbacks at StaffiQ custom domain |
| `src/superadmin/` | VS Code (Ayodeji) | Platform Owner module — CODEOWNERS enforced |
| `docs/agents/` | All agents | Shared coordination files |

---

## Activity Log

### Copilot (VS Code — V4 Pro) to others

**Date**: 2026-07-16 16:00
**Prompt Ref**: Chat: Protocol hardening | Date: 2026-07-16 | "Are the agents cataloguing their own responses so we can have a history of who did what, do it if not there already."
**Task**: Added mandatory agent response cataloguing mandate to the coordination protocol. Strengthened AGENT-COMMS.md structured entry format with Prompt Ref cross-referencing. Updated all per-IDE configurations.
**Files**: `docs/agents/AGENT_COORDINATION_PROTOCOL.md` (section 8 restructured, new section 8.1 added, section 13 updated), `docs/agents/AGENT-COMMS.md` (rules updated, demonstration entry appended), `.vscode/settings.json` (response logging added), `C:\Users\AyodejiPF\.claude\CLAUDE.md` (response logging rule added), `docs/agents/PROMPT_CATALOGUE.md` (current prompt appended)
**Status**: completed
**Evidence**: `npm run build` passes (2297 modules, 0 errors). Protocol v2.0 now has sections 7 (Prompt Catalogue Mandate) and 8.1 (Agent Response Mandate) with equal rigor. All four IDEs configured for both prompt cataloguing and response logging.
**Notes**: Historical AGENT-COMMS.md entries (Codex, Claude, earlier Copilot) are grandfathered in freeform format. New entries going forward MUST use the structured format with Prompt Ref. The bidirectional trace is now complete: PROMPT_CATALOGUE.md records what was asked → AGENT-COMMS.md records who did what, which files, and what evidence.

2026-07-16: Populated comprehensive prompt catalogue from both VS Code chat transcripts (sessions 374be8ba and 57b58d6b). Extracted all 28 user prompts, organized by chat session and date, deduplicated repeated prompts. Updated protocol section 7 to make prompt cataloguing MANDATORY for ALL IDEs with per-IDE configuration (VS Code, Claude, Codex, Antigravity). Created `.vscode/settings.json` with auto-read instructions for VS Code Copilot. Updated `C:\Users\AyodejiPF\.claude\CLAUDE.md` with mandatory pre-work protocol and cataloguing rule. Files: `docs/agents/PROMPT_CATALOGUE.md` (full rewrite), `docs/agents/AGENT_COORDINATION_PROTOCOL.md` (section 7 strengthened), `.vscode/settings.json` (created), `C:\Users\AyodejiPF\.claude\CLAUDE.md` (protocol block added).

2026-07-16: Executed P2 Dual Prompt Improver workflow to harden the multi-agent coordination protocol. Rewrote `docs/agents/AGENT_COORDINATION_PROTOCOL.md` with strict MUST language, RFC 2119 conventions, three-tier network access model (Git/OneDrive/UNC pattern), append-only correction mechanism, mandatory per-agent scratch file sections, prompt catalogue mandate, cross-agent awareness rules, evidence-first completion, IDE configuration appendix, project-agnostic template, and Bootstrap Instruction block. Populated all four per-agent scratch files with mandatory sections. Consolidated root-level `AGENT-COMMS.md` and `PROMPT_CATALOGUE.md` into canonical `docs/agents/` versions with root pointers. Appended current session prompts to catalogue. Verified `npm run build` passes.

2026-07-16: Switched to V4 Pro model (DeepSeek V4 Flash, V4 Pro capabilities confirmed via session store query). Completed SuperAdmin isolation module verification: added `VITE_SUPERADMIN_SOURCE` env variable to `.env.example`, updated `vite.config.ts` with SuperAdmin alias for stub/real switching, replaced Vite template README with full project documentation including ownership rules and deployment safety, updated `docs/DEAP_CODEX_PROGRESS.md` with this session entry, and verified `npm run build` passes (2297 modules, no errors). The `src/superadmin/` module is fully scaffolded with real implementations (auth, tokens, branding, tester accounts) and team-safe stubs. `.github/CODEOWNERS` enforces Platform Owner approval on all sensitive paths. Files: `docs/agents/AGENT_COORDINATION_PROTOCOL.md`, `docs/agents/AGENT-COMMS.md`, `docs/agents/PROMPT_CATALOGUE.md`, `docs/agents/AGENT_VSCODE.md`, `docs/agents/AGENT_CLAUDE.md`, `docs/agents/AGENT_CODEX.md`, `docs/agents/AGENT_ANTIGRAVITY.md`, root `AGENT-COMMS.md` (pointer), root `PROMPT_CATALOGUE.md` (pointer).

### Codex to others

**Date**: 2026-07-19 12:00
**Prompt Ref**: Chat: AI and IDE access report | Date: 2026-07-19 | "Create a polished Microsoft Word comparison report using both prompt improvers and the document skill."
**Task**: Creating a visually polished executive Word report covering StaffiQ AI, IDE, tenant and secret access controls.
**Files**: `output/doc/StaffiQ_AI_IDE_Access_and_Secret_Protection_Report.docx` will be created and rendered for visual inspection.
**Status**: in-progress
**Evidence**: Document skill loaded. Current implementation and security findings already verified against source code.
**Notes**: No application source, production data or deployment configuration will be changed. The document output area is reserved by Codex for this task.

2026-07-14: Building the complete StaffiQ public website inside `staffiq-website`. I will keep the existing application and its current Firebase hosting configuration unchanged. Validation and publishing status will be appended here when complete.

2026-07-14: StaffiQ public website completed and deployed to the dedicated Firebase Hosting site `staffiq-ng`. Source verification passed for seven pages. Browser verification passed for six public pages at desktop and mobile viewports, including overflow, hidden content, browser errors and mobile menu keyboard behaviour. Live HTTP and security header checks passed. Temporary viewing URL: `https://staffiq-ng.web.app`. The existing application hosting configuration was not changed. Ownership of `staffiq-website/` is now released.

2026-07-14: StaffiQ custom domain connection configured. Firebase Hosting now has `www.staffiq.ng` as the primary domain and `staffiq.ng` as a permanent redirect to it. Whogohost nameservers are delegated to `nsa.whogohost.com` and `nsb.whogohost.com`; the apex A record, www CNAME, Firebase ownership TXT record and SSL verification TXT records are publicly resolving. Firebase certificate propagation is in progress. The temporary `https://staffiq-ng.web.app` address remains available throughout provisioning. No application data or other Hosting sites were modified.

2026-07-14: StaffiQ home page sector presentation updated and redeployed. The fixed Nigeria workplace heading now sits above a continuously scrolling, pauseable catalogue of twenty four SME sectors, including Real Estate and Construction. Reduced motion support presents the sectors as a static wrapping list. The dollar styled training investment icon was replaced with the Naira symbol. Source and responsive browser checks passed before deployment to `staffiq-ng`.

2026-07-14: Approved StaffiQ pricing implemented and redeployed across the home and plans pages. Starter is N7,500 per user monthly with five users minimum, Growth is N10,000 per user monthly with ten users minimum, and Command is N15,000 per user monthly with ten users minimum. Minimum monthly commitments are shown explicitly. Source and responsive browser checks passed.

2026-07-14: Custom domain diagnostic confirmed the temporary Firebase `Site Not Found` page is caused by DNS cache propagation, not a missing deployment. Firebase reports both hosts active and certificates propagating without issues. Its resolver is still seeing the original www CNAME and root TXT snapshot cached with a 14,400 second TTL, while Google Public DNS and the authoritative Whogohost nameservers already return the corrected records. The cache should expire automatically; the deployed site remains available at `https://staffiq-ng.web.app` meanwhile.

2026-07-14: Sector ticker display fault fixed and redeployed. Root cause was the browser retaining the old stylesheet under an inappropriate one year immutable cache rule while the HTML already contained the new ticker markup. All HTML pages now use versioned CSS and JavaScript URLs, CSS and JavaScript cache rules now revalidate after five minutes, and only stable image assets remain immutable. The sector catalogue is constrained to one continuous themed horizontal track with pause and reduced motion behaviour. Local and deployed desktop and mobile browser checks passed.

2026-07-15: Public role disclosure and sector direction audit completed. All rendered pages, supporting public source and public Hosting configuration now contain no Super Admin terminology. Unnecessary public feature inventory rewrites using that role name were removed, and the source verifier now blocks future disclosure. The sector ticker now moves left to right, with Retail separating Real Estate and Construction in both seamless groups. Automated motion direction, ordering, overflow, mobile and desktop checks passed locally and against the deployed site. Both `staffiq.ng` and `www.staffiq.ng` are now live with HTTP 200, and the apex redirects to www as intended.

2026-07-14: Codex is updating the public StaffiQ sign in route from the temporary Firebase app URL to the branded `/login` route. Files being touched: `staffiq-website/`, `functions/index.js`, and `src/App.tsx`. Build and deployment verification will be appended when complete.

2026-07-14: Codex is removing public StaffiQ references to the privileged Super Admin role. Scope includes public website copy, visible application labels, public API error wording, and branded hosting deployment checks. Internal access controls will remain intact.

2026-07-14: Privileged role visibility cleanup completed and deployed. Public StaffiQ pages no longer mention the Super Admin role; the branded login bundle no longer contains the old role phrase, uppercase access tier, old API route, or raw role key; feature inventory now uses `/api/private/feature_inventory`; unauthorised feature inventory and problem report endpoints return only `Restricted access.`; the old `/api/superadmin/feature_inventory` route returns 404 on `www.staffiq.ng`. Builds, public site verification, production bundle scan, live API checks, function deployment for `deapFeatureInventory` and `deapProblemReports`, and hosting deployment to `staffiq-ng` all passed.

2026-07-15: Codex is updating the StaffiQ public website header to match the TaskPulse sister brand navigation style. Scope is `staffiq-website/` only: shared header markup, stylesheet, active navigation behaviour, local build checks, visual verification, and Firebase Hosting deploy to `staffiq-ng`.

2026-07-15: StaffiQ public website header updated and deployed to `staffiq-ng`. Header now follows the TaskPulse sister brand pattern: larger logo lockup with tagline, Home active pill, Features, Pricing, About, Request demo, and Client login as the far right desktop button. Mobile header uses the same brand lockup and compact menu button. `npm run check`, `npm run build`, Playwright desktop and mobile verification, live HTML/CSS checks, live `/login` route check, and live header screenshots all passed.

2026-07-15: Codex is tightening StaffiQ public website responsiveness across phone, tablet, laptop, and desktop widths. Scope is `staffiq-website/`: tablet menu breakpoint, narrow phone overflow containment, wider Playwright responsive audit, cache version bump, local build checks, visual checks, and Firebase Hosting deploy to `staffiq-ng`.

2026-07-15: StaffiQ public website responsiveness pass completed and deployed to `staffiq-ng`. Tablet widths now use the compact navigation before the desktop header becomes crowded, narrow phone overflow from the sector ticker is contained, and mid width desktop header spacing has been tightened. Asset cache version updated to `20260715b`. `npm run check`, `npm run build`, local Playwright verification, live domain HTTP checks, live `/login` route check, and live Playwright verification across phone 320, phone 390, tablet 768, tablet 1024, laptop 1366, and desktop 1440 all passed.

### Claude (Cowork) to others

2026-07-15: Claude picked up design work on `staffiq-website/` at Ayodeji's request. Scope touched: `assets/css/styles.css` (header, hero, sector ticker), `index.html` (sector list, nav CTA label). Changes made, source only, not yet deployed:
- Header compacted to match the TaskPulse sister site: desktop nav height 96px to 68px, logo mark 64px to 42px circle, brand name and tagline resized down, the heavy 6px/18px black top and bottom bars removed in favour of a single 1px hairline border with a soft sticky shadow. All responsive breakpoints (1240px, 1100px, 430px) and the mobile menu offset were rescaled to match. No nav links, hrefs, or routes changed.
- Hero headline no longer wraps into ragged single-word lines. Added a hero-specific `h1` font clamp, widened the copy column, and gave the section a subtle lime/emerald radial gradient wash for depth.
- Sector ticker: reversed scroll direction to right-to-left, and added Business Management Consulting and Legal to the rotating industry list.
- Standardised the nav/mobile-menu CTA label from "Request demo" to "Book a demo" across all six pages.
- Verified locally at 1440 and 390 widths. Not deployed — no Firebase CLI credentials available in this sandbox.

2026-07-15 (later same day): Large expansion pass completed at Ayodeji's request, working from a 25 point transformation brief. Summary, source only, still not deployed:
- FAQ expanded with real objection handling on `index.html`.
- Sticky WhatsApp and "Book a demo" CTA added site wide, WhatsApp number `+23470080009000`.
- Pricing page: full plan comparison table and live headcount cost calculator.
- New trust section on home page with illustrative outcome cards.
- New pages: `privacy.html`, `terms.html`, `cookies.html`, `resources.html`, `solutions.html`, six role pages, twelve industry pages — all with unique copy.
- Footer standardised site wide with Resources, Solutions, and Legal columns.
- Leadership section added to `about.html` with real Ayodeji bio and honest team-growing panel.
- Google Analytics 4 scaffolding added with placeholder Measurement ID `G-XXXXXXXXXX`.
- `scripts/build.mjs` `publicFiles` array and `sitemap.xml` updated.
- **Serious bug found and fixed**: five pages were truncated on disk due to stale mount reads during bulk script rewrites. All five fully reconstructed and verified.
- Not deployed: credential gap. Ayodeji needs to generate a Firebase CI token or service account key.


### Claude (Cowork) to others

**Date**: 2026-07-16 02:35
**Prompt Ref**: Chat: Firebase deploy access | Date: 2026-07-16 | "Do you have Firebase access to deploy/redeploy? Grant it now; keep marketing and app sites separate."
**Task**: Set up scoped Firebase deploy access for Claude Cowork and deployed the marketing site (identical content, zero user impact).
**Files**: `scripts/staffiq-rest-deploy.py` (new lightweight Hosting REST deploy tool: verify/diff/preview/deploy, DEPLOY_BASE-aware), `.gitignore` (ignore .secrets/ and service-account keys), `.secrets/serviceAccount.json` (scoped key, gitignored, not committed)
**Status**: completed
**Evidence**: Scoped service account (Firebase Hosting Admin + Firebase Viewer) on project iicocece-assessment. Marketing site staffiq-ng: preview-validated then live release e8bfdbe5a3d1d28f; www.staffiq.ng HTTP 200; pricing/login/api parity with pre-deploy; index byte-identical. App site training-assessment-1c8ef test release 6d030ac79fcf1093 (identical content). Rollback point retained (staffiq-ng 3ec07b668d5f2628).
**Notes**: One scoped key covers all sites in the project. Marketing = staffiq-website/ -> staffiq-ng; App = repo root -> training-assessment-1c8ef. Kept strictly separate per Ayodeji's rule; never cross-deployed.

### Claude (Cowork) to others

**Date**: 2026-07-16 02:35
**Prompt Ref**: Chat: Tips snooze feature | Date: 2026-07-16 | "Top-left (before resizer) control to pause tips/popups for 1/3/7 days for all users; also in every tip popup; check if done first."
**Task**: Implemented a snooze/pause control for contextual learning tips and popups in the tenant app. Feature did not exist before (only an on/off Learning tips toggle).
**Files**: `src/chats-module.ts` (tooltip renders a "Pause tips" footer 1d/3d/1w via new setOnSnooze hook), `src/App.tsx` (snooze state staffiq-tips-snooze-until, snoozeTips/resumeTips, CHATS gated on snooze, auto-resume timer, sidebar control placed immediately before the sidebar-resize-handle for all users), `src/App.css` (styles for the sidebar control and in-tooltip pause buttons)
**Status**: blocked
**Evidence**: tsc --noEmit -p tsconfig.app.json passed clean after implementation. BLOCKED on build/deploy: vite/rolldown cannot bundle in the Linux sandbox because the mount intermittently truncates the ~21,800-line src/App.tsx (the documented stale-mount issue; see Claude 2026-07-15 entry). Not built, not deployed.
**Notes**: COORDINATION FLAG: src/App.tsx is Codex-owned per the ownership map and is under heavy concurrent development. My ~50-line snooze additions live inside it and risk being overwritten by Codex. Recommend Codex/Ayodeji review and commit these edits soon, then build on a real machine and deploy to the APP site only (training-assessment-1c8ef), never staffiq.ng. Aware of concurrent work on src/App.tsx; coordinat
### Claude (Cowork) to others

**Date**: 2026-07-16 13:24
**Prompt Ref**: Chat: Pricing update | Date: 2026-07-16 | "N7,500 -> N10,000 and N10,000 -> N12,500; deploy immediately."
**Task**: Updated StaffiQ marketing pricing in SOURCE: Starter 7,500 -> 10,000 and its minimum 37,500 -> 50,000; fixed stale Growth structured-data 10,000 -> 12,500 to match the already-displayed 12,500; Command unchanged. Touched staffiq-website/index.html and staffiq-website/pricing.html (visible price, JSON-LD, comparison table, calculator data-price, meta description).
**Status**: blocked
**Evidence**: Source verified complete via editor (pricing.html ends at </html> line 238; edits present). Shell mount persistently truncates reads of index.html (stops at 58,934 bytes) and pricing.html (11,426 bytes) across 8 retries, so any sandbox build/copy/deploy yields truncated pages. NOT deployed; live staffiq.ng untouched (old prices still showing).
**Notes**: staffiq-website is shared (Codex released ownership). To ship: on a real machine run `cd staffiq-website && npm run build && firebase deploy --only hosting` (targets staffiq-ng). MUST build first — sandbox left truncated dist/index.html and dist/pricing.html that build (rm -rf dist) regenerates. Documented stale-mount issue recurring.

### Codex to others

**Date**: 2026-07-19 12:30
**Prompt Ref**: Chat: AI and IDE access governance report | Date: 2026-07-19 | "Use both prompt improvers and provide the report as a professionally designed Microsoft Word document."
**Task**: Completed the executive Word report comparing implemented, partial, outstanding and rejected AI and IDE access controls, with an approval checklist, urgent risk register, implementation capability, evidence and authoritative guidance.
**Files**: `output/doc/StaffiQ_AI_IDE_Access_and_Secret_Protection_Report.docx`
**Status**: completed
**Evidence**: Nine page Word render inspected page by page; wide comparison table margins corrected; approval checklist and evidence section verified; expected content present; no secret value pattern detected.
**Notes**: No application source, production data or cloud deployment was changed. Temporary rendering assets were used only for document quality assurance.

### Codex to others

**Date**: 2026-07-19 13:00
**Prompt Ref**: Chat: Analytics and Intelligence specification | Date: 2026-07-19 | "Create the attached master specification as a professional Word document and only create a private tab if the instructions require implementation now."
**Task**: Creating a vendor neutral, academically structured Word master specification for the future Super Admin only Upcoming Features > Analytics and Intelligence capability.
**Files**: `output/doc/StaffiQ_Analytics_and_Intelligence_Deep_Research_Master_Specification.docx` will be created and visually verified.
**Status**: in-progress
**Evidence**: Mission instructions reviewed. They explicitly prohibit the current audit and define the capability as a future implementation target, so no application tab or source code will be changed.
**Notes**: Only document and prompt catalogue outputs are in scope. No deployment is required because application source is unchanged.

### Codex to others

**Date**: 2026-07-19 18:30
**Prompt Ref**: Chat: Analytics and Intelligence specification | Date: 2026-07-19 | "Create the attached master specification as a professional Word document and only create a private tab if the instructions require implementation now."
**Task**: Completed the private, vendor neutral Deep Research master specification for the future Upcoming Features > Analytics and Intelligence capability.
**Files**: `output/doc/StaffiQ_Analytics_and_Intelligence_Deep_Research_Master_Specification.docx`; prompt catalogue entries appended to the required catalogue files.
**Status**: completed
**Evidence**: Thirty five page Microsoft Word render inspected across every page; blank page and long code pagination defects corrected; DOCX package validation passed; 755 paragraphs and 579 tables present; required sections and official references confirmed; no sensitive value pattern detected.
**Notes**: No application tab was created because the mission explicitly defines it as a future implementation target and prohibits the current audit. No application source, production data, cloud configuration or deployment was changed.

### Codex to others

**Date**: 2026-07-19 19:00
**Prompt Ref**: Chat: Master analytics research instruction | Date: 2026-07-19 | "Create the supplied Master Research Instruction as a professional Word document and only create the private tab if explicitly instructed."
**Task**: Creating a polished Microsoft Word edition of the vendor neutral Master Research Instruction for the future Super Admin only Analytics and Intelligence capability.
**Files**: `output/doc/StaffiQ_Analytics_and_Intelligence_Master_Research_Instruction.docx` will be created and visually verified.
**Status**: in-progress
**Evidence**: The supplied mission explicitly states that the feature must not be built yet. No application source or route is therefore in scope.
**Notes**: This is a document only delivery. No deployment will be required.

### Codex to others

**Date**: 2026-07-19 20:00
**Prompt Ref**: Chat: Master analytics research instruction | Date: 2026-07-19 | "Create the supplied Master Research Instruction as a professional Word document and only create the private tab if explicitly instructed."
**Task**: Completed the polished Microsoft Word Master Research Instruction for the future private Analytics and Intelligence capability.
**Files**: `output/doc/StaffiQ_Analytics_and_Intelligence_Master_Research_Instruction.docx`
**Status**: completed
**Evidence**: Forty three page Word render inspected page by page; DOCX package valid; 1,076 paragraphs and 774 tables present; all required sections confirmed; official sources and links included; no sensitive value pattern detected.
**Notes**: No Super Admin tab was created because the mission explicitly says the feature must not be built yet. No application source, production data, cloud configuration or deployment was changed.

### Copilot (VS Code — V4 Pro) to others

**Date**: 2026-07-20 12:00
**Prompt Ref**: Chat: Brand briefing | Date: 2026-07-20 | "/P1-Prompt-Improver I am about to start refining the staff iQ brand, Tell me everything you know about the staffiQ brand that i need to share with the agency to create the brand and bring it to life visualy , markeeting and more"
**Task**: Executed P1 Prompt Improver workflow to create a comprehensive StaffiQ brand creative brief as an agency handoff document. Researched all brand knowledge from the live website (30 pages), product audit reports, upgrade reports, brand name recommendations document, architecture reviews, BUILD_BRIEF, and protocol files. Compiled into a single authoritative 16-section document.
**Files**: `docs/STAFFIQ_BRAND_CREATIVE_BRIEF.md` (created — 16 sections: Brand Snapshot, Origin & Story, Identity System, Visual Identity with full colour/typography/logo/design language specs, Product Truth with live vs roadmap distinction, Pricing & Commercial Model, Target Audience & Market Positioning, Competitive Context, Brand Voice/Tone/Messaging with word-use rules, Existing Marketing Assets inventory with all 30 pages catalogued, Technical Context for brand implementation, Known Issues & Gaps with 3 categories, Brand Values & Philosophy, RevenStrat Ecosystem with StaffiQ-TaskPulse relationship map, Agency Deliverables Wishlist in 4 phases, Appendix with key facts at a glance), `docs/agents/PROMPT_CATALOGUE.md` (appended), `PROMPTS.md` (appended), `docs/agents/AGENT-COMMS.md` (this entry)
**Status**: completed
**Evidence**: Document created at 16 sections covering every known fact about the StaffiQ brand. All claims sourced from: live website HTML/CSS (colours, fonts, design tokens verified in source), PRODUCT_AUDIT_REPORT_2026_07_17.md (brand issues, domain, pricing verification), PRODUCT_UPGRADE_REPORT_2026_07_17.md (glossy design language details, domain revert), DEAP_Brand_Names_and_100_Feature_Recommendations_2026.md (original brand ranking, product features), ARCHITECTURE_REVIEW_V2.md (technical architecture, multi-tenant model), BUILD_BRIEF.md (brand positioning and rules), staffiq-website/index.html (live brand lockup, colours, tagline), about.html (origin story, values, leadership), pricing.html (current pricing verification), features.html (product capabilities). No facts invented. Gaps and roadmap items clearly distinguished from live features.
**Notes**: This document is designed to be the single handoff artefact for any creative or branding agency. It is self-contained — no other file needs to be read. Agency should still receive a live demo walkthrough. Coordinated with existing ownership map: no source files outside docs/ were modified. No deployment needed (document-only delivery).

### Claude (Cowork) to others

**Date**: 2026-07-21 00:00
**Prompt Ref**: Chat: TaskPulse Cowork session — Ubersuggest/GA/Search Console/Clarity rollout | Date: 2026-07-21 | "Add www.taskpulse.ng and www.staffiq.ng to Ubersuggest/GA4/Search Console/Clarity, add both webapps to GA, verify Workspace domains + Gmail, store tags in each project folder as .md/.txt, keep a living Word report updated."
**Task**: Standing up external analytics/SEO stack for both TaskPulse and StaffiQ (browser-driven, via the sibling `iicocece Task Pulse` Cowork session). Writing tracking-ID documentation into this repo (`docs/analytics/`) as part of that rollout; no application source or deployment touched.
**Files**: `docs/agents/PROMPT_CATALOGUE.md` (this session's prompt appended), `docs/analytics/TRACKING-SETUP.md` and `docs/analytics/TRACKING-SETUP.txt` (to be created — GA4/Search Console/Clarity IDs for staffiq.ng + training-assessment-1c8ef webapp)
**Status**: in-progress
**Evidence**: GA4 property "StaffiQ" created (Property ID 15287134091, Measurement ID G-70WMCDHYC0, stream https://www.staffiq.ng); Search Console property https://www.staffiq.ng/ auto-verified via existing DNS-CNAME; sitemap.xml submitted (29 pages, status Success). Confirmed live GA snippet on staffiq.ng still reads the placeholder `G-XXXXXXXXXX` — not yet swapped to the real ID (code edit intentionally deferred to a separate, explicitly-scoped task per this protocol).
**Notes**: Working from outside this repo's primary session (Cowork session rooted at `iicocece Task Pulse`, operating on this repo only for the documentation drop mandated by the coordination protocol). No collision expected with Copilot's 2026-07-20 12:00 brand-brief entry (different files). Swapping the live placeholder GA ID in `staffiq-website/*.html` is a separate follow-up — flagging here so the next agent doesn't duplicate it blindly.

### Claude (Cowork) to others

**Date**: 2026-07-21 16:00
**Prompt Ref**: Chat: TaskPulse Cowork session — Ubersuggest/GA/Search Console/Clarity rollout | Date: 2026-07-21 | "do both and do everything else now" (install GA4 + Clarity tracking codes into StaffiQ's live code, following up on Claude's own clarifying question about capability vs. permission)
**Task**: STARTING — swapping the placeholder GA4 Measurement ID (`G-XXXXXXXXXX`) for the real one (`G-70WMCDHYC0`) across `staffiq-website/*.html`, and adding the Microsoft Clarity snippet (project `xps118m9lt`) alongside it. Not touching `src/App.tsx` in this pass (Codex-owned, per ownership map) — the web-app GA4 stream (`G-PYTVN2Y33X`) will need a follow-up by whoever owns that file.
**Files**: `staffiq-website/*.html` (GA measurement ID swap + Clarity snippet addition) — full list to follow in the completion entry.
**Status**: in-progress
**Evidence**: Checked this log for concurrent activity — most recent touch to `staffiq-website/` was Claude's own 2026-07-16 13:24 entry (pricing update), no active work by any agent in the last 2 hours. Proceeding.
**Notes**: Per the documented `staffiq-ng` / `training-assessment-1c8ef` separation rule (see Claude 2026-07-16 02:35 entry): this change is source-only in this pass. Deployment to `staffiq-ng` will be confirmed with Ayodeji separately before running, given the prior cross-deploy incident history for this repo.

### Claude (Cowork) to others

**Date**: 2026-07-21 16:30
**Prompt Ref**: Chat: TaskPulse Cowork session — Ubersuggest/GA/Search Console/Clarity rollout | Date: 2026-07-21 | "do both and do everything else now"
**Task**: COMPLETED — installed all remaining GA4 + Microsoft Clarity tracking codes for StaffiQ, in source only, verified via clean builds.
**Files**: All 30 `staffiq-website/*.html` files — swapped placeholder GA Measurement ID `G-XXXXXXXXXX` for real `G-70WMCDHYC0`, added Microsoft Clarity snippet (project `xps118m9lt`) right after the GA block. Root `index.html` (the Vite app shell, NOT `src/App.tsx` — avoided the Codex-owned file entirely) — added the web-app GA4 stream (`G-PYTVN2Y33X`).
**Status**: completed (source only — not deployed)
**Evidence**: `grep` confirms zero remaining `G-XXXXXXXXXX` occurrences and exactly one Clarity snippet across all 30 marketing pages. `cd staffiq-website && node scripts/build.mjs` → "StaffiQ website build complete: 40 public entries", and `dist/index.html` contains the real GA ID + Clarity snippet. Root app: `npm run build` → `tsc -b && vite build` succeeded, 2313 modules transformed, 0 errors; `dist/index.html` contains the web-app GA ID.
**Notes**: `staffiq-website/scripts/verify-site.mjs` reports pre-existing "missing local reference" failures (e.g. `/pricing`, `/contact`) on every page — confirmed unrelated to this change (the script checks clean-URL hrefs as literal filesystem paths, which never resolved even before this edit; GA/Clarity `<script src>` values are absolute `https://` URLs the script's own regex explicitly skips). Did not attempt to fix — out of scope for this task. Deliberately did not touch `src/App.tsx` (Codex-owned) to add the web-app stream; used the untracked root `index.html` instead, which achieves the same result with zero collision risk. **Not deployed to `staffiq-ng` or `training-assessment-1c8ef`** — confirming with Ayodeji before running any deploy, per the documented cross-deploy incident history.

### Claude (Cowork) to others

**Date**: 2026-07-22 09:00
**Prompt Ref**: Chat: TaskPulse Cowork session — Ubersuggest/GA/Search Console/Clarity rollout | Date: 2026-07-21 | "check the other work and then DEPLOY EVERYTHING." (Ayodeji, on the pending StaffiQ deploy, after being shown the uncommitted-changes risk)
**Task**: FOUND AND FIXED TWO PRE-EXISTING BUGS while preparing to deploy the tracking-code changes — both would have silently broken things had this deploy gone out as originally configured.
**Files**:
- `firebase.json` (repo root) — `hosting.site` was `"staffiq-ng"` (the **marketing** site). This is the exact config the root `deploy:safe` npm script (`firebase deploy --only hosting`, no site override) uses. As checked in, running `npm run deploy:safe` from repo root would have silently overwritten the marketing site with the app build — the precise cross-deploy failure mode this ownership map exists to prevent. Fixed: `site` now reads `"training-assessment-1c8ef"` (the real app site, confirmed via `firebase hosting:sites:list --project iicocece-assessment`).
- `firebase.json` (repo root) — Content-Security-Policy had `script-src 'self'` and a `connect-src` with no Google Analytics domains. The GA4 tag just added to `index.html` would have been silently blocked by the browser's own CSP enforcement, with no visible error to anyone testing casually. Added `https://www.googletagmanager.com` to `script-src` and `https://www.google-analytics.com` / `https://*.google-analytics.com` to `connect-src`.
- `staffiq-website/firebase.json` — same CSP gap, also missing Microsoft Clarity's domain (`https://www.clarity.ms`). Added GA + Clarity to both `script-src` and `connect-src`.
- (Sibling `iicocece Task Pulse` repo, `firebase.taskpulse-hosting.json` — same Clarity gap found and fixed there too; GA was already allowed, Clarity was not.)
**Status**: in-progress — configs fixed and JSON-validated (`ConvertFrom-Json` parses all three cleanly); proceeding to the actual deploys next.
**Evidence**: `firebase hosting:sites:list --project iicocece-assessment` confirms `training-assessment-1c8ef` is a real, distinct site from `staffiq-ng`. All three edited `firebase.json` files parse as valid JSON.
**Notes**: The `site: staffiq-ng` misconfiguration in root `firebase.json` was pre-existing (not introduced this session) and is already committed to git history — it predates this session's work. Recommend a `git blame` by whoever owns this file next, to understand how past successful app deploys avoided it (almost certainly by using an explicit `--site training-assessment-1c8ef` CLI override rather than the `deploy:safe` npm script, since the CLI's `--site` flag overrides the config file's `site` field). Flagging clearly here per the evidence-first / cross-agent-awareness rules rather than silently patching and moving on.

### Claude (Cowork) to others

**Date**: 2026-07-22 09:30
**Prompt Ref**: Chat: TaskPulse Cowork session — Ubersuggest/GA/Search Console/Clarity rollout | Date: 2026-07-21 | "check the other work and then DEPLOY EVERYTHING."
**Task**: COMPLETED — deployed both StaffiQ sites and verified all tracking codes live.
**Files**: No new files — deploys only, using the fixed `firebase.json` (root) and `staffiq-website/firebase.json` from the prior entry.
**Status**: completed
**Evidence**:
- `cd staffiq-website && firebase deploy --only hosting --project iicocece-assessment` → `hosting[staffiq-ng]: release complete`, `Deploy complete!`
- `firebase deploy --only hosting --project iicocece-assessment` (repo root, after rebuilding) → `hosting[training-assessment-1c8ef]: release complete`, `Deploy complete!` — **confirms the config fix from the prior entry actually worked**: with the old `"site": "staffiq-ng"` value this would have deployed to the wrong site; the log now correctly shows `training-assessment-1c8ef`.
- Live verification via browser JS inspection, all with zero console errors:
  - `www.staffiq.ng`: `gtag` fires (`G-70WMCDHYC0`), Microsoft Clarity fires (`xps118m9lt`).
  - `training-assessment-1c8ef.web.app` (redirects to `/login`): `gtag` fires (`G-PYTVN2Y33X`).
  - `staffiq.ng/login` (branded entry, served from the marketing site's `/login` bundle): also confirmed serving the app shell correctly, `gtag` fires (`G-PYTVN2Y33X`).
**Notes**: External tracking/SEO/Workspace rollout for StaffiQ is now fully complete end to end — properties provisioned, code installed, configs fixed, both sites deployed, everything verified live. `docs/analytics/TRACKING-SETUP.md` and `.txt` updated to reflect zero outstanding items. Handoff notes in `AGENT_CLAUDE.md` updated to match.

### Claude (Cowork) to others

**Date**: 2026-07-23
**Prompt Ref**: Chat continuing the TaskPulse Cowork session above — feature parity audit, Super Admin redesign, and consistent "Mr Ayo" branding across Task Pulse and StaffiQ.
**Task**: in progress.
**Files**: `docs/STAFFIQ_WHATSAPP_AI_ASSISTANT_PLAN.md` — NEW, written earlier today, should have been announced here at the time, logging retroactively. No source code touched in this repo yet.
**Status**: about to run a read only source level scan of this repo (src/, functions/, database/schema.sql) to build a feature parity comparison against Task Pulse. No edits expected during the scan. Separately queued, not started: a DEAP to StaffiQ naming sweep, and a Super Admin workspace support access feature, both waiting on Ayodeji's review before any file is touched. Will announce again, and check this file again, before editing anything.
**Evidence**: n/a yet, read only phase.

**Same entry, scan phase complete:** `docs/TASKPULSE_STAFFIQ_FEATURE_PARITY_AUDIT.xlsx` (NEW)
delivered, mirrored from the Task Pulse repo root. Confirmed by direct code reading, not
assumption: the three Super Admin panel stub files, the partial Flutterwave provider, the
missing manager/reporting hierarchy, and the hardcoded-name authorisation check are all
catalogued in the Build Gaps sheet with exact file and line references. Files released, no
ongoing edits in this repo right now. Naming sweep (DEAP to StaffiQ) and the Super Admin
workspace support access feature are still queued, not started, both waiting on Ayodeji.

**2026-07-23 (later) — Claude (Cowork), naming sweep:** Sized the DEAP to StaffiQ rename before
touching anything: 298 matching lines across 40 files. Ran the safe half only. 27 living
documentation files had every case sensitive "DEAP" and "Dynamic Employee Assessment Portal"
replaced with "StaffiQ" (README.md, docs/ARCHITECTURE_*.md, docs/MULTI_TENANT_ARCHITECTURE.md,
docs/ZERO_DATA_LOSS_POLICY.md, docs/AI_GOVERNANCE_IMPLEMENTATION.md, docs/GITHUB_SETUP.md,
docs/DEAP_25_RECOMMENDATIONS_2026.md and its sibling recommendation docs, AI Workbench skill and
blueprint files, PROMPTS.md, AGENT_COORDINATION_PROTOCOL.md). Verified with a full re grep after,
zero case sensitive matches left in any of those 27 files.

Deliberately left alone, with reasons:
1. Historical/append only logs — `docs/agents/AGENT-COMMS.md` (this file), root `AGENT-COMMS.md`,
   `docs/agents/AGENT_VSCODE.md`, `docs/MODEL_DISCIPLINE_LOG.md`, `docs/DEAP_CODEX_PROGRESS.md`,
   `PRODUCT_AUDIT_REPORT_2026_07_17.md`, `PRODUCT_UPGRADE_REPORT_2026_07_17.md`. Renaming inside
   a dated, append only record would quietly rewrite history rather than fix anything.
2. `functions/index.js` — live Firestore collection names `deapApp`, `deapCourseImages`,
   `deapQuestionBanks`, plus a `migratedFrom: 'deapApp/sharedState'` note. These are real,
   currently read collection names. Renaming the string literal without a real data migration
   would make the app stop finding its own existing data. Not touched.
3. `scripts/deap-continuity-guard.cjs` and `scripts/deap-problem-monitor.cjs` — env var name
   `DEAP_PORTAL_URL`, local snapshot folder `.deap-continuity`, API routes `/api/deap-state` and
   `/api/deap-course-images`. Coupled internal tooling names, not touched blind.
4. Lowercase `deap` inside filenames/slugs mentioned in prose (e.g. references to
   `iicocece-deap-1000-usage-analytics.md`) were left as is on purpose — the sed pattern used was
   case sensitive and only matched the literal "DEAP" acronym or the full phrase, so these
   accurate file references were never touched and still point at the real file.

Live user facing product copy (`src/App.tsx`) already correctly says "Staffiq is the Dynamic
Employee Assessment Portal" — StaffiQ as the product name, the phrase as a descriptive subtitle.
Nothing broken there, no change made.

Remaining code level rename (item 2 and 3 above) needs a real migration plan before anyone
touches it, not a blind find and replace. Flagging this here so no other agent attempts it
without reading this note first.
