---
name: engineering-review-checklist
description: A five-axis pre-merge review covering correctness, security, performance, test coverage, and maintainability, with severity labels for each finding. Use before merging any non-trivial code change, when asked to review a diff or pull request, or when the user asks for a code review, security check, or quality gate.
---

# Engineering Review Checklist

A structured pass over a diff before it merges, across five independent axes. Review each axis in turn; don't let a clean pass on one axis skip the others.

## The Five Axes

1. **Correctness** — Does the code do what it claims? Check edge cases (empty input, null, boundary values), off-by-one errors, and whether the change actually matches the stated intent.
2. **Security** — Injection risks (SQL, command, XSS), auth/authz gaps, secrets in code or logs, unvalidated external input, unsafe deserialization.
3. **Performance** — N+1 queries, unnecessary re-renders or re-computation, unbounded loops over user-controlled data, missing indexes for new query patterns.
4. **Test Coverage** — Does a test exist that would fail if this change were reverted? Are the new tests testing behavior, not implementation detail?
5. **Maintainability** — Is the change scoped to what was asked (see [[karpathy-principles]])? Does it introduce dead code, unclear naming, or an abstraction that isn't earning its keep?

## Severity Labels

- **Critical** — blocks merge. Data loss, security hole, broken core functionality.
- **Major** — should fix before merge. Real bug or gap, but not catastrophic.
- **Minor** — worth fixing, doesn't block. Style, naming, small inefficiency.
- **Nit** — optional polish. Mention it, don't insist on it.

## Process

1. Read the diff in full before commenting — don't review line-by-line on a first pass.
2. Walk all five axes explicitly, even if the change looks fine at a glance. Security and performance issues rarely show up in a casual read.
3. For each finding: axis, severity, file:line, concrete failure scenario (not just "this could be better").
4. Only Critical/Major findings block merge. Report Minor/Nit as suggestions.
5. If the diff is large (>~300 lines), flag that it should be split rather than reviewing it as one block.

## Quick prompts per axis

- Correctness: "What input breaks this?"
- Security: "What happens with hostile input here?"
- Performance: "What happens at 100x the expected data volume?"
- Tests: "What test would fail if I reverted this line?"
- Maintainability: "Does every changed line trace back to the actual request?"
