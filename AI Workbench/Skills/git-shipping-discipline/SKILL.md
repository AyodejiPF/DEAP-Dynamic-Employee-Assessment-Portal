---
name: git-shipping-discipline
description: Enforces small atomic commits with why-focused messages and a pre-ship checklist (tests, secrets scan, rollback plan, docs) before any change is considered done. Use when committing code, opening a PR, or preparing to deploy/ship a change.
---

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
