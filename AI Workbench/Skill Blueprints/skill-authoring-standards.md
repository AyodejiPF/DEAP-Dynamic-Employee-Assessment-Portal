# Skill Authoring Standards — Skill & Slash Command Blueprint

## Source
`agentskills.io` (open Agent Skills specification, item 16) combined with the "Skill Quality Standards" section from `VoltAgent/awesome-agent-skills` (28.6k★ — items 5/10 in the original list, which pointed at this curated directory rather than a specific named skill).

## Problem It Solves
A badly-written skill either never triggers (vague description the agent can't match against) or always triggers and bloats context (too much loaded eagerly instead of on demand). Since Ayodeji's own CLAUDE.md convention is "when asked to create a skill, save it in the Skills folder" — this is the standard that should apply to every skill built in that folder, including the ones in this very workbench.

## Core Mechanism (reverse-engineered)
Agent Skills load via **progressive disclosure** in three stages: discovery (name + description only, at startup), activation (full SKILL.md body loads once the description matches the task), execution (bundled scripts/references load only if actually needed). This means the `description` field is doing all the work of getting the skill triggered at the right moment — it's a matching key for the agent, not a summary for a human reader. Getting that field wrong is the single most common reason a skill silently never fires.

## Proposed Skill

### Suggested SKILL.md frontmatter
```
name: skill-authoring-standards
description: Reviews a SKILL.md file's frontmatter and structure against Agent Skills format rules — trigger-focused description, progressive disclosure, no hard-coded paths, scoped tool requests. Use when writing a new skill, editing an existing SKILL.md, or when a skill doesn't seem to be triggering when it should.
```

### Full Skill Instructions (body)
```markdown
# Skill Authoring Standards

## The description field is a trigger, not a summary
Write it in third person, for the agent deciding whether to activate — not for a human reading documentation. State specifically what the skill does AND when it should fire, using concrete keywords the agent can match against ("PostgreSQL migration" beats "database stuff"). A vague description means the skill either never triggers or triggers on everything.

## Progressive disclosure
- Keep the top-level frontmatter (name + description) under ~100 tokens.
- Keep the skill body under ~500 lines — if it's growing past that, split supporting material into `references/`, `scripts/`, or `examples/` subdirectories that load only when actually needed, not inline in the main body.
- Don't front-load information the agent will only need in an edge case.

## No hard-coded paths
Never reference machine-specific absolute paths (`/Users/alice/...`, `C:\Users\specific-name\...`) inside a skill body — use relative paths or well-known variables (`$HOME`, `$PROJECT_ROOT`) so the skill still works when moved or shared.

## Scoped tool requests
If a skill declares which tools it needs, request only the specific ones it actually uses — avoid a blanket "any tool" declaration, which defeats the purpose of scoping and is a red flag in any security review of the skill itself.

## Anatomy checklist
A well-formed skill has: frontmatter (name, description), an overview of what it does, explicit triggering conditions, a step-by-step process, common rationalisations/excuses to reject (if agents might try to skip steps), and — where relevant — a verification requirement so "seems done" isn't accepted as evidence.
```

## Proposed Slash Command

### Command name
`/skill-lint`

### Command behavior
```markdown
---
description: Review a SKILL.md file against Agent Skills format standards — trigger-focused description, progressive disclosure, no hard-coded paths, scoped tools
---

Load the skill-authoring-standards skill and review the SKILL.md at `$ARGUMENTS` (or the skill most recently created/edited in this session). Check: does the description state concrete triggering conditions an agent could match against (not just a summary)? Is the body under ~500 lines, with supporting material split into references/scripts/examples if it's longer? Are there any hard-coded machine-specific paths? Are tool requests scoped narrowly rather than blanket? Report pass/fail per check with the specific fix needed.
```

## Example Interaction
**Before:** a new skill's description reads "Helps with databases." — too vague to ever reliably trigger, and its body hard-codes `C:\Users\ayodeji\projects\deap\`.
**After `/skill-lint`:** flags the description as non-triggering (recommends "Writes and reviews PostgreSQL migrations; use when altering table schemas or writing a new migration file") and flags the hard-coded path for replacement with `$PROJECT_ROOT`.

## Notes / Limitations
This is the standard the other blueprints in this workbench were written against — running `/skill-lint` against `karpathy-principles`, `terse-mode`, and `engineering-review-checklist` themselves would be a reasonable first real-world test of this skill.
