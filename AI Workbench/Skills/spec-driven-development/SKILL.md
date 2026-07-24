---
name: spec-driven-development
description: Writes a short spec covering objective, scope, structure, and explicit exclusions before any code is planned or built. Use when starting a new feature, project, or significant change, especially one where requirements feel underspecified or likely to drift during implementation.
---

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
