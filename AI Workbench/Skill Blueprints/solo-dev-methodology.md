# Solo Dev Methodology — Skill & Slash Command Blueprint

## Source
`obra/superpowers` (259k★, MIT, very active). A full agentic software-development methodology: brainstorm → spec → plan → git-worktree isolation → subagent-driven TDD build → two-stage review → ship. Not a single skill — a chain of ~15 skills that activate automatically as the agent recognises which phase of work it's in.

## Problem It Solves
Left unstructured, an AI coding agent jumps straight to writing code from a one-line request: no requirements interrogation, no plan, no tests-first discipline, no review gate before merge. This produces plausible-looking code that either doesn't match what was actually wanted, or breaks in ways nobody tested for. The methodology forces every non-trivial task through the same disciplined sequence a good senior engineer would use, without the user having to remember to ask for each step.

## Core Mechanism (reverse-engineered)
The methodology is a **state machine over conversation phases**, not a single technique:
1. **Brainstorming** — before any code, the agent interrogates the request: what's the actual pain point, what are 2–3 alternative approaches, what's explicitly out of scope. Produces a short design doc.
2. **Planning** — the approved design becomes a task list broken into 2–5 minute units, each with exact file paths and a verification step. No task is "vague."
3. **Isolated build** — work happens on a fresh branch/worktree so a failed attempt never pollutes the main line.
4. **Red-Green-Refactor TDD** — for each task: write a failing test, watch it fail, write the minimal code to pass, watch it pass, refactor, commit. Code written before its test is deleted, not kept.
5. **Two-stage review** — first pass checks the diff matches the plan (spec compliance), second pass checks code quality independent of the plan.
6. **Ship gate** — only after tests pass and review clears does the branch get merged/PR'd.

The key insight: each phase's OUTPUT becomes the next phase's INPUT (design doc → task list → failing test → passing code → reviewed diff → merged PR). Skipping a phase breaks the chain, which is why the methodology insists on running phases in order rather than jumping to "just write the code."

## Proposed Skill

### Suggested SKILL.md frontmatter
```
name: solo-dev-methodology
description: Enforces a disciplined build sequence — clarify intent, write a plan, red-green-refactor TDD, review before merge — instead of jumping straight to code. Use before starting any non-trivial feature, bug fix spanning multiple files, or when the user asks to "build", "implement", or "add" something without an existing spec.
```

### Full Skill Instructions (body)
```markdown
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
```

## Proposed Slash Command

### Command name
`/build-plan`

### Command behavior
```markdown
---
description: Run the solo-dev-methodology sequence on the current request — clarify, plan, test-first build, self-review
---

Load the solo-dev-methodology skill and apply it to `$ARGUMENTS` (or the current unaddressed request in this session if no argument given):

1. Restate the actual problem and success criteria in 4-6 lines. Ask one clarifying question only if genuinely blocked.
2. Break the work into small, independently verifiable tasks.
3. For each task, write the test first, confirm it fails, implement minimally, confirm it passes.
4. Before presenting as done, self-review against both the original design and general code quality.
5. Report what was verified (test output, command results) — do not claim completion without evidence.
```

## Example Interaction
**Before:** "Add a CSV export button to the dashboard" → agent writes a button, an export function, and a downloads-handling refactor nobody asked for, with no test.
**After `/build-plan`:** agent restates scope ("export the currently filtered table rows to CSV, triggered by a new button, no changes to existing export formats"), lists 3 tasks (CSV serialisation function + test, button + click handler + test, wiring into existing filter state), builds each test-first, then reports test output before calling it done.

## Notes / Limitations
This blueprint captures the *philosophy*, not Superpowers' actual git-worktree/subagent-dispatch machinery (that requires the real plugin's hooks and tooling). If genuine multi-agent worktree isolation is wanted, install the real plugin: `/plugin install superpowers@claude-plugins-official`. This skill is a lighter, portable version of the same discipline usable anywhere, including Claude Desktop/Cowork where no worktree/hook system exists.
