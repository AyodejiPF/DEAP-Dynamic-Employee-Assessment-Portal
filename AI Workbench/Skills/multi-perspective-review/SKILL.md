---
name: multi-perspective-review
description: Reviews a feature or deliverable through four distinct lenses in sequence — strategy/scope, design/UX, engineering soundness, and live QA — instead of one generic pass. Use before shipping a client-facing feature, before a StaffiQ/StaffiQ release, or when a single review pass feels like it's missing things.
---

# Multi-Perspective Review

Run these four lenses in sequence on the same piece of work — don't merge them into one generic pass, each asks a different question.

## 1. Strategy/Scope Lens
- Is this actually solving the real problem, or just the literal request?
- Could the scope be smaller and still deliver the value?
- Is there a simpler alternative that wasn't considered?

## 2. Design/UX Lens
- Does this look intentional, or like unreviewed AI output (inconsistent spacing, generic placeholder copy)?
- Are empty states, loading states, and error states actually designed, or just missing?
- Would a first-time user understand what to do without explanation?

## 3. Engineering Soundness Lens
- Does the overall architecture make sense, independent of line-by-line code quality?
- Are there structural edge cases (what happens with zero items, with a huge dataset, with a slow network)?
- (For line-level correctness/security/performance/tests, hand off to [[engineering-review-checklist]] and [[security-hardening-checklist]].)

## 4. Live QA Lens
- Actually run/click through the real flow — don't just read the code and assume it works.
- Try the flow with realistic bad input, not just the happy path.
- Report what was actually tested, not what should theoretically work.

## What NOT to do
- Don't collapse all four lenses into one paragraph of generic feedback — keep them distinct so each catches what the others miss.
- Don't skip the QA lens because the code "looks right" — that's exactly the assumption it exists to check.
