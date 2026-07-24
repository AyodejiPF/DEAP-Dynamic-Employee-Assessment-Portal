# Claude Code Power Tips — Skill & Slash Command Blueprint

## Source
`shanraisshan/claude-code-best-practice` (63.2k★, MIT, very active — daily commits). A large, living reference covering CLAUDE.md management, context/session management, and 83 tips-and-tricks sourced from the Claude Code team and community. Addresses original item 9, "Claude.md Management" — the actual repo is broader than that label, so this blueprint distils the CLAUDE.md- and context-management-specific portion rather than the whole knowledge base.

## Problem It Solves
Two chronic failure modes in long AI-assisted sessions: (1) CLAUDE.md files that grow unbounded and stop being read carefully, or drift out of date with the actual codebase, and (2) sessions that run long enough to hit "context rot" — degraded output quality from an overloaded context window — without the user noticing until output quality has already dropped.

## Core Mechanism (reverse-engineered)
**CLAUDE.md hygiene**: keep it under ~200 lines; split large instruction sets into `.claude/rules/*.md` with path-scoped frontmatter so they only load when relevant files are touched; wrap domain-specific rules in emphasis markers so they don't get silently deprioritised as the file grows; verify it's complete by checking a fresh session can run the project's basic commands (build/test) on the first try.

**Context management**: quality degrades well before the context window is actually full — roughly past 40% for anything intelligence-sensitive, more aggressively past 60%. The fix isn't waiting for auto-compact (which fires at the worst possible moment, when the model is already context-degraded) — it's proactively compacting with a directional hint, or clearing and re-briefing, at a moment the user chooses.

## Proposed Skill

### Suggested SKILL.md frontmatter
```
name: claude-code-power-tips
description: Applies CLAUDE.md hygiene (keep it short, split large rules into scoped files) and proactive context management (compact or clear before quality degrades, not after) to long Claude Code sessions. Use when a CLAUDE.md file is being written or edited, when a session has been running a long time, or when output quality seems to be degrading.
```

### Full Skill Instructions (body)
```markdown
# Claude Code Power Tips

## CLAUDE.md hygiene
- Target under ~200 lines per file. If it's growing past that, split domain-specific instructions into `.claude/rules/*.md` with a `paths:` frontmatter glob so they only load when relevant files are touched.
- Wrap genuinely critical, easy-to-ignore rules in explicit emphasis (e.g. an `<important>` block) so they don't get lost as the file grows.
- The test for "is my CLAUDE.md complete": could a fresh session run this project's basic build/test/setup commands correctly on the first try? If not, the gap is missing setup instructions, not a training issue.
- Finish migrations before moving on — a codebase with two competing patterns confuses future sessions into picking the wrong one.

## Context management
- Don't let a session drift past ~60% context usage for anything requiring careful reasoning — proactively `/compact` (with a hint on what to keep, e.g. "focus on the auth refactor, drop the test debugging") or `/clear` and re-brief, rather than waiting for auto-compact to fire at the point the model is least sharp.
- Prefer rewind-and-reprompt over correct-and-continue when an attempt clearly failed — leaving a failed attempt plus corrections in context pollutes it more than starting the retry cleanly.
- Use subagents to keep exploratory work (many file reads, greps, dead ends) out of the main context — only the conclusion needs to return.

## What NOT to do
- Don't keep piling instructions into one growing CLAUDE.md instead of splitting into scoped rules.
- Don't wait for auto-compact as your only context-management strategy — by the time it fires, quality has usually already dropped.
```

## Proposed Slash Command

### Command name
`/context-check`

### Command behavior
```markdown
---
description: Check CLAUDE.md size/structure and current session context usage, recommend a split or compact if either is drifting
---

Load the claude-code-power-tips skill. Check the project's CLAUDE.md (or `$ARGUMENTS` if a specific file is given): flag if it's grown past ~200 lines and suggest which sections should move to `.claude/rules/*.md`. Separately, note the current session's approximate context usage and recommend a proactive `/compact <hint>` or `/clear` if it's past the point where reasoning quality typically starts degrading, rather than waiting for auto-compact.
```

## Example Interaction
**Before:** a CLAUDE.md has grown to 400 lines mixing global preferences with project-specific build steps, and a session has been running for hours across multiple unrelated tasks.
**After `/context-check`:** recommends splitting the build-step section into `.claude/rules/build.md` scoped to relevant file paths, and recommends `/compact focus on the current task, drop the earlier debugging` before continuing.

## Notes / Limitations
This distils the CLAUDE.md/context-management slice of a much larger reference repo (83 tips across prompting, planning, hooks, workflows, debugging). For the full knowledge base — including the workflow-comparison table this workbench's blueprints were partly informed by — browse the source repo directly rather than expecting one skill to cover all of it.
