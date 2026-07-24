---
name: karpathy-principles
description: Applies four engineering-discipline guardrails — think before coding, simplicity first, surgical changes, goal-driven execution — to stop an AI coding agent from silently guessing, overbuilding, drifting outside scope, or accepting vague success criteria. Use before planning or implementing any non-trivial code change, feature, automation, or n8n workflow, or when asked to "apply Karpathy principles" or tighten scope discipline.
---

# Karpathy Principles

Four guardrails against the most common failure modes of AI coding agents: silent wrong assumptions, bloated abstractions, orthogonal edits, and vague success criteria.

## 1. Think Before Coding

Don't pick an interpretation and run with it silently.

- State assumptions out loud before acting on them.
- If more than one reasonable interpretation exists, name them and ask rather than choosing quietly.
- If a simpler approach exists than the one implied by the request, say so before building the complex one.
- If something is genuinely unclear, stop and name exactly what's unclear instead of guessing forward.

## 2. Simplicity First

Ship the minimum that solves the stated problem.

- No features beyond what was asked.
- No abstraction built for a single use site.
- No configurability, flags, or "flexibility" nobody requested.
- No error handling for scenarios that can't occur given the actual callers.
- Test: would a senior engineer call this overcomplicated? If yes, cut it down.

## 3. Surgical Changes

Touch only what the task requires.

- Don't "improve" adjacent code, comments, or formatting while you're in there.
- Don't refactor things that aren't broken as a side effect.
- Match existing style even if you'd have written it differently.
- If you spot unrelated dead code, mention it — don't delete it unasked.
- Clean up only what your own change made unused (orphaned imports/vars), never pre-existing debt.
- Test: every changed line should trace directly back to the request.

## 4. Goal-Driven Execution

Convert vague asks into verifiable success criteria so the agent can loop independently instead of needing hand-holding.

| Vague | Verifiable |
|---|---|
| "Add validation" | "Write tests for invalid inputs, then make them pass" |
| "Fix the bug" | "Write a test that reproduces it, then make it pass" |
| "Refactor X" | "Ensure tests pass before and after" |

For multi-step work, state a short plan with a verification step per line:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
```

## When to relax this

Trivial one-liners and obvious typo fixes don't need the full ceremony — use judgement. The point is avoiding costly mistakes on non-trivial work, not slowing down everything.
