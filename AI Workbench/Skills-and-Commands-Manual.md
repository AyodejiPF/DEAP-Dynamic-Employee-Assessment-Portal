# Skills & Slash Commands Manual

A reference for the 15 Skills and 15 matching slash commands built for Ayodeji's Claude Code, Claude Desktop, and Cowork setup.

## How These Work

- **Skills** live in `C:\Users\AyodejiPF\OneDrive\Desktop\AI Workbench\Skills\<name>\SKILL.md`. They're usable in Claude Code, Claude Desktop, and Cowork — anywhere Skills are supported. They **auto-trigger**: Claude loads and applies one whenever it judges the description matches what's currently being worked on. No need to invoke them by name.
- **Slash commands** live in `C:\Users\AyodejiPF\.claude\commands\<name>.md`. These are **Claude Code CLI only** — Desktop and Cowork have no slash command system, so these are not available there. Type them directly, e.g. `/build-plan`.
- A command **explicitly loads its matching skill and runs a specific action** on demand. The skill alone works passively in the background — it applies itself when relevant without being asked.

---

## 1. karpathy-principles → `/karpathy-check`

**What it does:** Applies four guardrails against the most common AI-coding failure modes — silent wrong assumptions, overbuilt/bloated code, edits that drift outside scope, and vague success criteria.

**Triggers automatically when:** planning or implementing any non-trivial code change, feature, or automation.

**Slash command:** `/karpathy-check [target]` — audits the current plan or diff against all four principles and reports findings grouped by principle.

**Example use:** Before implementing a requested feature, run `/karpathy-check` to confirm the plan doesn't silently assume unstated requirements or build more than was asked for.

---

## 2. caveman → `/caveman`

**What it does:** Compresses replies to essential technical content, cutting filler while keeping code, commands, numbers, and errors exactly as they are. Inspired by `JuliusBrussee/caveman`.

**Triggers automatically when:** the user asks for terse, concise, or "caveman-style" replies.

**Slash command:** `/caveman [lite|standard|tight|off]` — sets the compression level for the rest of the session.

**Example use:** `/caveman tight` during a long back-and-forth debugging session where you want fast, minimal-fluff answers.

---

## 3. engineering-review-checklist → `/eng-review`

**What it does:** A five-axis pre-merge review — correctness, security, performance, test coverage, maintainability — with severity labels (Critical/Major/Minor/Nit).

**Triggers automatically when:** reviewing a diff or PR, or before merging any non-trivial change.

**Slash command:** `/eng-review [PR/branch/file]` — runs the full five-axis review against a diff.

**Example use:** `/eng-review` before merging a StaffiQ/StaffiQ feature branch.

---

## 4. solo-dev-methodology → `/build-plan`

**What it does:** A five-checkpoint build discipline — clarify the real problem, break work into small verifiable tasks, test-first implementation, self-review, and verify with evidence rather than claims.

**Triggers automatically when:** starting a non-trivial feature or a bug fix spanning multiple files.

**Slash command:** `/build-plan [request]` — runs the full sequence end to end on a request.

**Example use:** `/build-plan add CSV export to the dashboard` — forces scope clarification and test-first building instead of an unplanned build.

---

## 5. current-docs-verification → `/verify-docs`

**What it does:** Flags when generated code depends on a library or API whose shape may have changed since training, and either verifies it with an available tool or explicitly states the uncertainty instead of guessing.

**Triggers automatically when:** writing code against a named library, SDK, or framework — especially fast-moving ones like n8n nodes or cloud SDKs.

**Slash command:** `/verify-docs [library]` — actively checks the current API shape for a named library before implementation continues.

**Example use:** `/verify-docs stripe webhooks` before writing a payment integration.

---

## 6. spec-driven-development → `/spec`

**What it does:** Writes a short spec — objective, scope, structure, testing approach, explicit exclusions — before any planning or code begins.

**Triggers automatically when:** starting a new feature or project where requirements feel underspecified.

**Slash command:** `/spec [request]` — drafts the spec, stating any assumptions made to fill gaps.

**Example use:** `/spec add notifications` before building, to pin down scope and stop it turning into email + SMS + push when only an in-app bell was wanted.

---

## 7. security-hardening-checklist → `/security-check`

**What it does:** Classifies every data entry point into a three-tier trust boundary (internal / authenticated / untrusted-external) and applies OWASP Top 10 checks scaled to that tier.

**Triggers automatically when:** handling user input, authentication, external API calls, webhooks, file uploads, or anything touching secrets or session data.

**Slash command:** `/security-check [diff/file]` — runs the tiered check and reports findings by severity.

**Example use:** `/security-check` on a new public webhook endpoint before it ships.

---

## 8. git-shipping-discipline → `/ship-check`

**What it does:** Enforces small, atomic, why-focused commits and a pre-ship checklist — tests, secrets scan, rollback plan, docs updated.

**Triggers automatically when:** committing code, opening a PR, or preparing to deploy.

**Slash command:** `/ship-check [branch/PR]` — checks each item and refuses to declare "ready to ship" if any fails.

**Example use:** `/ship-check` before merging to confirm no debug logs or secrets slipped into the diff.

---

## 9. mcp-server-playbook → `/mcp-scope`

**What it does:** Decides whether an existing reference MCP server (filesystem, git, memory, fetch, time, sequential-thinking) already covers a need, or helps scope a new custom server narrowly if not.

**Triggers automatically when:** a task needs external system access and it's unclear whether an existing MCP server already handles it.

**Slash command:** `/mcp-scope [need]` — recommends an existing server or proposes a minimal, narrowly-scoped custom tool set.

**Example use:** `/mcp-scope reading StaffiQ repo files` — before writing custom file-access code by hand.

---

## 10. claude-code-power-tips → `/context-check`

**What it does:** CLAUDE.md hygiene (keep it under ~200 lines, split large rule sets into scoped files) plus proactive context management (compact or clear before quality degrades, not after).

**Triggers automatically when:** editing a CLAUDE.md file, or when a session has been running a long time.

**Slash command:** `/context-check [file]` — checks CLAUDE.md size/structure and session context usage, recommends action.

**Example use:** `/context-check` when a CLAUDE.md has grown unwieldy or a long session's output quality starts to feel off.

---

## 11. multi-perspective-review → `/team-review`

**What it does:** Reviews a feature through four distinct lenses in sequence — strategy/scope, design/UX, engineering soundness, live QA — instead of one generic pass.

**Triggers automatically when:** shipping a client-facing feature or before a StaffiQ/StaffiQ release.

**Slash command:** `/team-review [feature/PR/URL]` — runs all four lenses and reports findings per lens without merging them.

**Example use:** `/team-review https://staging.example.com` before a client demo — actually clicks through the flow rather than just reading the code.

---

## 12. skill-authoring-standards → `/skill-lint`

**What it does:** Checks a SKILL.md file against Agent Skills format rules — a trigger-focused description, progressive disclosure, no hard-coded paths, scoped tool requests.

**Triggers automatically when:** writing a new skill, editing an existing SKILL.md, or when a skill doesn't seem to be firing when it should.

**Slash command:** `/skill-lint [file]` — reports pass/fail per check with the specific fix needed.

**Example use:** `/skill-lint` against any of the 11 other skills above to sanity-check them.

---

## 13. code-simplifier → `/code-simplify`

**What it does:** Reduces code complexity while preserving exact behaviour, using Chesterton's Fence (understand why something exists before removing it) and the Rule of 500 (flag oversized files/functions).

**Triggers automatically when:** code works but feels overcomplicated, or when asked to simplify/refactor/clean up.

**Slash command:** `/code-simplify [file/function]` — simplifies without changing behaviour, verifying via existing or new tests.

**Example use:** `/code-simplify src/utils/formatDate.ts` on a function that's grown unwieldy over several patches.

---

## 14. feature-dev-workflow → `/feature-slice`

**What it does:** Breaks a feature into thin vertical slices — each implemented, tested, and shipped independently behind a feature flag — instead of building it as one large, all-or-nothing change.

**Triggers automatically when:** building a new feature that could be delivered incrementally, especially client-facing ones needing a safe rollout path.

**Slash command:** `/feature-slice [request]` — lists the slices, their flags, and rollback plan, then builds one at a time.

**Example use:** `/feature-slice add bulk client invoicing` — instead of one giant PR, get an ordered list of shippable increments.

---

## 15. browser-testing-playbook → `/browser-test`

**What it does:** Actually exercises a web app in a real browser — clicking through the flow, checking console errors, testing responsive behaviour — instead of reasoning about whether the code should work.

**Triggers automatically when:** finishing a UI/frontend change, or debugging something that only manifests in the browser.

**Slash command:** `/browser-test [URL]` — runs the golden path, a failure scenario, and a narrow-viewport check, reporting exactly what was observed.

**Example use:** `/browser-test https://staging.example.com/dashboard` before telling a client a feature is ready.

---

## Quick Reference Table

| Skill | Slash Command | One-Line Purpose |
|---|---|---|
| karpathy-principles | `/karpathy-check` | Guard against wrong assumptions, overbuilding, scope drift, vague goals |
| caveman | `/caveman` | Compress replies while keeping code/numbers exact |
| engineering-review-checklist | `/eng-review` | Five-axis pre-merge code review |
| solo-dev-methodology | `/build-plan` | Clarify → plan → test-first build → review → verify |
| current-docs-verification | `/verify-docs` | Verify library/API currency before generating integration code |
| spec-driven-development | `/spec` | Write objective/scope/exclusions before building |
| security-hardening-checklist | `/security-check` | Tiered OWASP security review |
| git-shipping-discipline | `/ship-check` | Atomic commits + pre-ship checklist |
| mcp-server-playbook | `/mcp-scope` | Choose or scope an MCP server for external access |
| claude-code-power-tips | `/context-check` | CLAUDE.md hygiene + proactive context management |
| multi-perspective-review | `/team-review` | Four-lens review: strategy, design, engineering, live QA |
| skill-authoring-standards | `/skill-lint` | Check a SKILL.md against format best practice |
| code-simplifier | `/code-simplify` | Simplify overcomplicated code without changing behaviour |
| feature-dev-workflow | `/feature-slice` | Break a feature into thin, rollback-friendly vertical slices |
| browser-testing-playbook | `/browser-test` | Actually exercise a web page in a real browser and report findings |

---

## Note on Blueprints

`C:\Users\AyodejiPF\OneDrive\Desktop\AI Workbench\Skill Blueprints\` holds the original detailed source blueprints these 12 Skills were built from, including `00-INDEX.md`, which maps every one of them back to the 16 original research links they were reverse-engineered from. Use that folder if any of these 12 need revising or regenerating from scratch.
