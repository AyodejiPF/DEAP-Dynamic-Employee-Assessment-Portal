---
name: feature-dev-workflow
description: Breaks a feature into thin vertical slices — each implemented, tested, verified, and committed independently — using feature flags and safe defaults so every slice is rollback-friendly. Use when building a new feature that could be delivered incrementally rather than as one large change, especially client-facing features that need a safe rollout path.
---

# Feature Dev Workflow

## Thin vertical slices, not horizontal phases
Don't build a feature in horizontal layers (all the database work, then all the API work, then all the UI work) — that delays any real feedback until the very end. Slice vertically instead: pick the smallest end-to-end path that touches every layer it needs (DB + service + UI) and ship that first, then add the next slice.

## Feature flags and safe defaults
- Anything not yet fully verified goes behind a flag defaulted off, so a half-finished slice never affects real users.
- Each slice should have a safe, sensible default behaviour if the flag is off or something upstream fails — don't let a partial feature crash unrelated functionality.

## Rollback-friendly by construction
- Prefer additive changes (new field, new endpoint) over modifying existing behaviour in place, so a slice can be turned off without needing a data migration reversed.
- If a slice does touch existing behaviour, state explicitly how to revert it.

## Process
1. List the full feature as slices, ordered by what delivers real end-to-end value soonest.
2. Build one slice fully (implement, test, verify) before starting the next — don't leave multiple slices half-done in parallel.
3. Commit and, where relevant, ship each slice behind its own flag independently.

## What NOT to do
- Don't build all the "foundation" first with no user-visible behaviour until the very last slice — that's horizontal phasing in disguise.
- Don't skip the flag for a slice because it "should be fine" — the flag is what makes it rollback-friendly, not a formality.
