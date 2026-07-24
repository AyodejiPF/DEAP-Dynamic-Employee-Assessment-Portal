---
name: claude-code-power-tips
description: Applies CLAUDE.md hygiene (keep it short, split large rules into scoped files) and proactive context management (compact or clear before quality degrades, not after) to long Claude Code sessions. Use when a CLAUDE.md file is being written or edited, when a session has been running a long time, or when output quality seems to be degrading.
---

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
