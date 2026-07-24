# Multi-Perspective Review — Skill & Slash Command Blueprint

## Source
`garrytan/gstack` (123k★, MIT, very active). 23 role-based slash commands turning Claude Code into a virtual team (CEO, designer, eng manager, QA lead, security officer, release engineer) for a solo builder. This blueprint captures the core pattern — reviewing work from genuinely different perspectives instead of one generic pass — rather than the full 23-command system.

## Problem It Solves
A single "review this" pass tends to catch only whatever the reviewer happens to be focused on. A real team catches more because each person looks from a different angle: a CEO questions whether it's even the right thing to build, a designer catches sloppy UX a developer wouldn't notice, a QA lead actually clicks through the flow instead of reading the code, a security officer thinks like an attacker. Solo builders (or a small consultancy like RevenStrat/StaffiQ) don't have that team — but the *perspectives* can still be applied deliberately instead of skipped.

## Core Mechanism (reverse-engineered)
Each "role" is really a distinct **review lens** with its own question set, not a different skillset:
- **CEO/Strategy lens** — is this even the right scope? Could it be smaller and still solve the real problem, or is it missing something that makes it not worth shipping?
- **Design lens** — does this look and feel intentional, or like unreviewed AI output (inconsistent spacing, generic copy, no empty/loading/error states designed)?
- **Engineering lens** — architecture soundness, edge cases, data flow correctness (this overlaps with [[engineering-review-checklist]] but is scoped to structural/architectural soundness rather than line-level review).
- **QA lens** — did anyone actually run it, or just read the code? Click through the real flow, not just the happy path.
- **Security lens** — see [[security-hardening-checklist]] for the dedicated version of this lens.

Applying multiple lenses to the same piece of work in sequence catches issues a single generic pass misses, because each lens asks a genuinely different question rather than the same question phrased differently.

## Proposed Skill

### Suggested SKILL.md frontmatter
```
name: multi-perspective-review
description: Reviews a feature or deliverable through four distinct lenses in sequence — strategy/scope, design/UX, engineering soundness, and live QA — instead of one generic pass. Use before shipping a client-facing feature, before a StaffiQ/StaffiQ release, or when a single review pass feels like it's missing things.
```

### Full Skill Instructions (body)
```markdown
# Multi-Perspective Review

Run these four lenses in sequence on the same piece of work — don't merge them into one generic pass, each asks a different question.

## 1. Strategy/Scope Lens
- Is this actually solving the real problem, or just the literal request?
- Could the scope be smaller and still deliver the value?
- Is there a simpler alternative that wasn't considered?

## 2. Design/UX Lens
- Does this look intentional, or like unreviewed AI output (inconsistent spacing, generic placeholder copy)?
- Are empty states, loading states, and error states actually designed, or just missing?
- Would a first-time user understand what to do without explanation?

## 3. Engineering Soundness Lens
- Does the overall architecture make sense, independent of line-by-line code quality?
- Are there structural edge cases (what happens with zero items, with a huge dataset, with a slow network)?
- (For line-level correctness/security/performance/tests, hand off to [[engineering-review-checklist]] and [[security-hardening-checklist]].)

## 4. Live QA Lens
- Actually run/click through the real flow — don't just read the code and assume it works.
- Try the flow with realistic bad input, not just the happy path.
- Report what was actually tested, not what should theoretically work.

## What NOT to do
- Don't collapse all four lenses into one paragraph of generic feedback — keep them distinct so each catches what the others miss.
- Don't skip the QA lens because the code "looks right" — that's exactly the assumption it exists to check.
```

## Proposed Slash Command

### Command name
`/team-review`

### Command behavior
```markdown
---
description: Review a feature/deliverable through strategy, design, engineering, and live-QA lenses in sequence
---

Load the multi-perspective-review skill and review `$ARGUMENTS` (a feature, PR, or staging URL — otherwise the most recent unreviewed work in this session) through all four lenses in order: strategy/scope, design/UX, engineering soundness, live QA. Report findings per lens, don't merge them. For live QA, actually exercise the flow (browser tooling if a URL is given) rather than reasoning about the code alone.
```

## Example Interaction
**Before:** a "review this" pass reads the code, says it looks fine, and misses that the empty state shows a raw error object and nobody actually clicked the button.
**After `/team-review`:** strategy lens confirms scope is right; design lens flags the raw-error empty state; engineering lens is clean; QA lens actually clicks the button and finds it throws on an empty list.

## Notes / Limitations
This captures the *perspective-diversity* pattern from gstack's 23 commands, not the full system (which includes real browser automation via CDP, taste-learning design iteration, and cross-model second opinions). For the full system: `git clone --single-branch --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack && cd ~/.claude/skills/gstack && ./setup` (Git Bash/WSL required on Windows).
