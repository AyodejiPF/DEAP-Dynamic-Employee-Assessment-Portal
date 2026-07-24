# Git & Shipping Discipline — Skill & Slash Command Blueprint

## Source
`addyosmani/agent-skills` (79.6k★, MIT, active) — its `git-workflow-and-versioning` and `shipping-and-launch` skills, behind the `/ship` command.

## Problem It Solves
AI agents left to their own devices tend to produce one giant commit at the end of a session, with a vague message, no thought to whether the change is revertable in isolation, and no pre-launch checklist before something goes to production. Small, atomic commits and a pre-ship checklist are cheap insurance against exactly the kind of incident that's expensive to unwind later.

## Core Mechanism (reverse-engineered)
Two combined disciplines:
1. **Atomic commits, trunk-based** — each commit represents one logical change (~100 lines is a healthy target), with a message stating *why*, not just what. This makes `git bisect` and `git revert` actually usable tools instead of theoretical ones.
2. **Pre-ship checklist** — before calling anything "shipped": tests pass, no secrets in the diff, feature flags/rollback path considered for risky changes, docs updated if behaviour changed, and a rollback plan exists for anything touching production data.

## Proposed Skill

### Suggested SKILL.md frontmatter
```
name: git-shipping-discipline
description: Enforces small atomic commits with why-focused messages and a pre-ship checklist (tests, secrets scan, rollback plan, docs) before any change is considered done. Use when committing code, opening a PR, or preparing to deploy/ship a change.
```

### Full Skill Instructions (body)
```markdown
# Git & Shipping Discipline

## Commit discipline
- One logical change per commit — if you're tempted to write "and" in the commit message, it's probably two commits.
- Message states *why* the change was made, not a restatement of the diff ("fix race condition on double-submit" beats "update handler.ts").
- Target ~100 lines changed per commit as a rough ceiling — if a change is much bigger, look for a natural split point.
- Commit at natural checkpoints (a passing test, a completed unit), not just at the end of a session.

## Pre-ship checklist
Before calling a change ready to ship, confirm:
1. Tests pass (state which ones were run, not just "should be fine").
2. No secrets, API keys, or credentials appear anywhere in the diff.
3. If the change is risky (touches auth, payments, or production data), a rollback path exists — feature flag, reversible migration, or a clear revert commit.
4. Docs/README/CLAUDE.md updated if user-facing behaviour or setup steps changed.
5. The PR/commit is small enough to review in one sitting — if not, say so and propose a split.

## What NOT to do
- Don't squash unrelated changes into one commit for convenience.
- Don't mark something "shipped" without stating what was actually verified.
- Don't skip the rollback-path question just because the change "should be fine."
```

## Proposed Slash Command

### Command name
`/ship-check`

### Command behavior
```markdown
---
description: Run the pre-ship checklist (tests, secrets, rollback plan, docs) and confirm commits are atomic before calling a change done
---

Load the git-shipping-discipline skill and check `$ARGUMENTS` (a branch/PR, or the current uncommitted work): confirm tests pass and state which ones, scan the diff for secrets/credentials, confirm a rollback path exists for anything touching auth/payments/production data, confirm docs are updated if behaviour changed, and flag if the diff is too large to review in one sitting. Report pass/fail per item — don't declare "ready to ship" if any item fails.
```

## Example Interaction
**Before:** a session ends with one commit titled "updates" containing a new feature, an unrelated dependency bump, and a debug console.log left in.
**After `/ship-check`:** flags the mixed commit for splitting, flags the leftover debug log as a Minor issue, and asks for the rollback plan before confirming ready-to-ship.

## Notes / Limitations
Complements [[engineering-review-checklist]] (code quality) and [[security-hardening-checklist]] (security) — this one is specifically about the commit/ship boundary, not the code review itself.
