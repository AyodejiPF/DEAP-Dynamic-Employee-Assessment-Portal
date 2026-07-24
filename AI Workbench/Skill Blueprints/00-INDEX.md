# Skill Blueprints — Master Index

Maps all 16 original links to what was built. Nothing skipped — items with no buildable blueprint are explained, not omitted.

| # | Original Item | Source Repo | Disposition |
|---|---|---|---|
| 1 | Front-end Design | `anthropics/skills` | **No blueprint needed** — real official Skill, already installable directly: `/plugin marketplace add anthropics/skills` → `/plugin install example-skills@anthropic-agent-skills` (contains `frontend-design`). |
| 2 | Superpowers | `obra/superpowers` | **Blueprint built** → [solo-dev-methodology.md](solo-dev-methodology.md) |
| 3 | Context Seven | `upstash/context7` | **Blueprint built** → [current-docs-verification.md](current-docs-verification.md) |
| 4 | Code Review | `addyosmani/agent-skills` | **Already a live Skill** — `engineering-review-checklist` (built earlier this session, in `AI Workbench\Skills\engineering-review-checklist\`, with matching `/eng-review` command). |
| 5 | Code Simplifier | `VoltAgent/awesome-agent-skills` | **Now a live Skill** — `code-simplifier` (built after being flagged as skipped; the link itself was still just a curated directory, so this was built as an original skill around the "code simplification" concept, drawing on `addyosmani/agent-skills`' code-simplification skill — Chesterton's Fence + Rule of 500), with matching `/code-simplify` command. |
| 6 | Skill Creator | `anthropics/skills` | **No blueprint needed** — same repo as #1; `skill-creator` folder installs with the same plugin command. |
| 7 | GitHub MCP | `modelcontextprotocol/servers` | **Blueprint built** → [mcp-server-playbook.md](mcp-server-playbook.md). Note: the actual GitHub reference server is archived — playbook flags this. |
| 8 | Playwright | `anthropics/skills` | **Now a live Skill** — `browser-testing-playbook` (built after being flagged as skipped; the actual named folder doesn't exist, but this was built as an original skill capturing the real `webapp-testing` skill's Playwright-based browser-testing concept, plus `addyosmani/agent-skills`' browser-testing-with-devtools), with matching `/browser-test` command. |
| 9 | Claude.md Management | `shanraisshan/claude-code-best-practice` | **Blueprint built** → [claude-code-power-tips.md](claude-code-power-tips.md) |
| 10 | Feature Dev | `VoltAgent/awesome-agent-skills` | **Now a live Skill** — `feature-dev-workflow` (built after being flagged as skipped; same source repo as #5, built as an original skill around `addyosmani/agent-skills`' incremental-implementation concept — thin vertical slices, feature flags, rollback-friendly changes), with matching `/feature-slice` command. |
| 11 | TypeScript LSP | `modelcontextprotocol/typescript-sdk` | **Blueprint built** (combined with #7) → [mcp-server-playbook.md](mcp-server-playbook.md). Note: this is the MCP TypeScript SDK, not an LSP — original label was inaccurate. |
| 12 | Security Guidance | `anthropics/skills` | **Does not exist as named** in that repo — real equivalent is `addyosmani/agent-skills`' `security-and-hardening` skill. **Blueprint built** → [security-hardening-checklist.md](security-hardening-checklist.md) |
| 13 | Caveman | `JuliusBrussee/caveman` | **Already a live Skill** — `caveman` (renamed from `terse-mode`, with matching `/caveman` command). |
| 14 | G-stack | `garrytan/gstack` | **Blueprint built** → [multi-perspective-review.md](multi-perspective-review.md) |
| 15 | Karpathy Skills | `multica-ai/andrej-karpathy-skills` | **Already a live Skill** — `karpathy-principles` (built earlier this session, with matching `/karpathy-check` command). |
| 16 | Agent Skills Official Standard | `agentskills.io` | **Blueprint built** → [skill-authoring-standards.md](skill-authoring-standards.md) |

## Extras built beyond the original 16, from the same source repos
| Blueprint / Skill | Source |
|---|---|
| [spec-driven-development.md](spec-driven-development.md) | `addyosmani/agent-skills` — a second skill from the same repo as item 4, not just the code-review one. |
| [git-shipping-discipline.md](git-shipping-discipline.md) | `addyosmani/agent-skills` — a third skill from the same repo, covering commit/ship discipline. |

## Status: nothing skipped any more

All 16 original items are now either an installable official Skill (items 1, 6), or a live custom Skill in this workbench (everything else, including all 3 that were originally skipped: Code Simplifier, Playwright, Feature Dev).

## What's in this folder vs. the live Skills folder

- **`AI Workbench\Skills\`** — 15 finished, active Skills, all picked up live by Claude Code this session: `karpathy-principles`, `caveman`, `engineering-review-checklist`, `solo-dev-methodology`, `current-docs-verification`, `spec-driven-development`, `security-hardening-checklist`, `git-shipping-discipline`, `mcp-server-playbook`, `claude-code-power-tips`, `multi-perspective-review`, `skill-authoring-standards`, `code-simplifier`, `feature-dev-workflow`, `browser-testing-playbook`.
- **`AI Workbench\Skill Blueprints\`** (this folder) — the original detailed source blueprints for 9 of the 15, each containing a ready-to-use SKILL.md frontmatter + body and a ready-to-use slash command definition, kept for reference/regeneration. The other 6 (the first 3 built, plus the 3 from this round) were built directly without a separate blueprint document.

## Cross-references between blueprints
Several blueprints reference each other rather than duplicating content — when finalising, keep these links intact or replace `[[name]]` with the actual skill name once converted:
- `solo-dev-methodology` → references `karpathy-principles`
- `security-hardening-checklist` → references `engineering-review-checklist`
- `git-shipping-discipline` → references `engineering-review-checklist`, `security-hardening-checklist`
- `multi-perspective-review` → references `engineering-review-checklist`, `security-hardening-checklist`
- `spec-driven-development` → references `engineering-review-checklist`, `security-hardening-checklist`
