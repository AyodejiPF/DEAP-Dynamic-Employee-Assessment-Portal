---
name: skill-authoring-standards
description: Reviews a SKILL.md file's frontmatter and structure against Agent Skills format rules — trigger-focused description, progressive disclosure, no hard-coded paths, scoped tool requests. Use when writing a new skill, editing an existing SKILL.md, or when a skill doesn't seem to be triggering when it should.
---

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
