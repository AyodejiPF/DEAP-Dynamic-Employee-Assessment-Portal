# Spec-Driven Development — Skill & Slash Command Blueprint

## Source
`addyosmani/agent-skills` (79.6k★, MIT, active) — specifically its `spec-driven-development` skill, part of the 24-skill lifecycle pack behind the `/spec` command.

## Problem It Solves
Features built straight from a one-line request tend to drift: the agent fills gaps with its own assumptions about scope, edge cases, and technical approach, and the result matches what the agent guessed rather than what was actually needed. A written spec — objectives, structure, boundaries — forces those assumptions into the open before any code exists, when they're cheap to correct.

## Core Mechanism (reverse-engineered)
A spec is produced BEFORE planning or building, covering: the objective (what problem, for whom), the command/interface surface (what the user-facing entry points are), the structure (what components/files this touches), the code style/conventions to follow, the testing approach, and explicit boundaries (what's out of scope). The spec becomes the reference document that later phases (planning, building, review) are checked against — any code that doesn't trace back to the spec is scope creep.

## Proposed Skill

### Suggested SKILL.md frontmatter
```
name: spec-driven-development
description: Writes a short spec covering objective, scope, structure, and explicit exclusions before any code is planned or built. Use when starting a new feature, project, or significant change, especially one where requirements feel underspecified or likely to drift during implementation.
```

### Full Skill Instructions (body)
```markdown
# Spec-Driven Development

Write the spec before the plan, and the plan before the code.

## Spec Contents (only include sections that apply)
- **Objective** — the actual problem being solved and for whom, not just the literal request.
- **Interface/Surface** — what the user-facing entry points are (UI, API, CLI command, automation trigger).
- **Structure** — which existing files/components this touches, and what new ones it creates.
- **Conventions** — code style, naming, and patterns to follow (match the existing codebase unless told otherwise).
- **Testing Approach** — what needs a test and at what level (unit, integration, end-to-end).
- **Explicit Exclusions** — what this change deliberately does NOT do, to prevent scope creep later.

## Process
1. Draft the spec from the request, filling gaps with the most reasonable assumption and stating it.
2. Surface only genuinely blocking ambiguities as questions — don't stall on solvable gaps.
3. Once the spec is confirmed (or reasonable by default for low-stakes work), treat it as the source of truth: planning and code that don't trace back to it are out of scope, not "helpful extras."
4. Keep the spec short — a paragraph per section, not an essay. A spec that takes longer to write than the feature takes to build has failed its purpose.

## Anti-patterns to avoid
- Writing a spec so vague it authorises anything ("improve the dashboard").
- Padding the spec with boilerplate sections that don't apply to a small change.
- Treating the spec as disposable — if you deviate from it mid-build, update the spec, don't silently drift.
```

## Proposed Slash Command

### Command name
`/spec`

### Command behavior
```markdown
---
description: Write a short spec (objective, surface, structure, testing approach, exclusions) before planning or building
---

Load the spec-driven-development skill and draft a spec for `$ARGUMENTS` (or the current feature request in this session). Include only the sections that materially apply. State any assumption filling a gap in the original request. Ask at most one clarifying question, only if a genuinely blocking ambiguity exists. End with an explicit exclusions list to prevent scope creep during implementation.
```

## Example Interaction
**Before:** "add a notifications feature" → agent builds email + SMS + in-app + push notifications, a preferences UI, and a digest scheduler, none of which was asked for.
**After `/spec`:** agent writes a 6-line spec — "in-app notification bell only, triggered on 3 named events, no email/SMS in this pass, uses existing user session for targeting" — then builds exactly that.

## Notes / Limitations
This is one of 24 skills in the source repo; `code-review-and-quality` and `security-and-hardening` from the same pack are covered separately in this workbench (see [[engineering-review-checklist]] and [[security-hardening-checklist]]). For the full 24-skill lifecycle with all 8 slash commands, install directly: `npx skills add addyosmani/agent-skills`.
