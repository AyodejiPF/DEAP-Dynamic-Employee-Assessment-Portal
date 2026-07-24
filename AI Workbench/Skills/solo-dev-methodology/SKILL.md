---
name: solo-dev-methodology
description: Enforces a disciplined build sequence — clarify intent, write a plan, red-green-refactor TDD, review before merge — instead of jumping straight to code. Use before starting any non-trivial feature, bug fix spanning multiple files, or when the user asks to "build", "implement", or "add" something without an existing spec.
---

# Solo Dev Methodology

Five checkpoints, run in order, for any task bigger than a one-line fix.

## 1. Clarify Before Building
Before writing code, restate: what's the actual problem (not just the literal request), what does success look like, what's explicitly out of scope. If the request is ambiguous, ask one sharp question rather than guessing. Write this as a 4–6 line design summary.

## 2. Break Into Verifiable Tasks
Split the design into small units (each completable and testable independently). Each unit states: exact file(s) touched, what changes, how to verify it worked. Reject "implement the feature" as a single task — it must decompose.

## 3. Test First
For each unit: write a test that fails for the right reason, confirm it fails, write the minimum code to pass it, confirm it passes, then clean up. Never leave code in place that was written before its test — if you wrote ahead, delete and redo test-first.

## 4. Review Before Calling It Done
Before presenting the result as complete, review the diff twice: once against the original design (does it do what was asked, nothing more, nothing less — see [[karpathy-principles]]), once against code quality alone (naming, duplication, error handling). Flag anything that fails either pass.

## 5. Verify, Don't Claim
Never state a task is complete without evidence: test output, a screenshot, or a command result. "Should work" is not verification.

## When to skip
Trivial one-liners, typo fixes, or config tweaks don't need the full sequence — apply judgement.
