---
name: code-simplifier
description: Reduces code complexity while preserving exact behaviour — applies Chesterton's Fence (understand why something exists before removing it) and the Rule of 500 (flag files/functions that have grown too large) to working code that's harder to read or maintain than it should be. Use when code works but feels overcomplicated, when asked to simplify/refactor/clean up, or when a file/function has grown unwieldy.
---

# Code Simplifier

## Chesterton's Fence
Before removing anything that looks unnecessary — a check, a branch, a parameter — understand why it was added. If you can't determine why, that's a signal to investigate (git blame, related tests, commit history), not licence to delete.

## Rule of 500
Flag files, functions, or classes that have grown past a reasonable size (~500 lines is a common threshold) as candidates for splitting — not as a hard rule, but as a prompt to ask whether the size reflects genuine complexity or just accumulated cruft.

## Process
1. Identify what's actually making the code hard to read: duplication, deep nesting, unclear naming, an abstraction serving only one call site.
2. Simplify without changing behaviour — this is not the place to add features or fix unrelated bugs (see [[karpathy-principles]]).
3. Verify behaviour is unchanged: existing tests still pass, or write a characterisation test first if none exist.
4. Prefer deleting code over adding a wrapper around it, when the underlying need has genuinely gone away.

## What NOT to do
- Don't simplify by removing error handling or edge-case checks whose purpose isn't understood yet — that's not simplification, that's a bug.
- Don't rewrite working code just because you'd have written it differently in style.
- Don't bundle simplification into an unrelated feature PR — keep it a visible, standalone change.
