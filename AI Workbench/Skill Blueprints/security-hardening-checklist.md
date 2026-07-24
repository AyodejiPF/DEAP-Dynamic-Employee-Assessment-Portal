# Security Hardening Checklist — Skill & Slash Command Blueprint

## Source
`addyosmani/agent-skills` (79.6k★, MIT, active) — its `security-and-hardening` skill. Also closes the gap flagged in the original audit: the originally-requested "Security Guidance" link pointed at `anthropics/skills`, which has no such folder — this is the real equivalent, sourced correctly.

## Problem It Solves
Security review is easy to skip under deadline pressure, and most vulnerabilities that make it to production aren't exotic — they're OWASP Top 10 basics that a checklist would have caught: unvalidated input, secrets in code, missing auth checks on a new endpoint. A dedicated, always-available checklist closes that gap without requiring a human security engineer for every change.

## Core Mechanism (reverse-engineered)
A three-tier boundary system: (1) trusted internal code, (2) validated input from authenticated users, (3) untrusted external input (public APIs, webhooks, file uploads). Every new data entry point gets classified into one of these tiers, and the required controls scale with the tier — trusted internal code needs no extra validation, tier-3 untrusted input needs full sanitisation, size limits, and rate control. This avoids the two failure modes of security review: over-validating internal code (wasted effort) and under-validating public-facing input (the actual risk).

## Proposed Skill

### Suggested SKILL.md frontmatter
```
name: security-hardening-checklist
description: Classifies data entry points into a three-tier trust boundary (internal, authenticated, untrusted-external) and applies OWASP Top 10 checks scaled to the tier. Use when handling user input, authentication, external API calls, webhooks, file uploads, or any code touching secrets or session data.
```

### Full Skill Instructions (body)
```markdown
# Security Hardening Checklist

## Step 1: Classify the boundary
For any new data entry point, name its tier:
- **Tier 1 — Internal**: trusted code calling trusted code. No extra validation needed.
- **Tier 2 — Authenticated user input**: validate shape/type, but the actor is known and accountable.
- **Tier 3 — Untrusted external**: public API endpoints, webhooks, file uploads, anything from an unauthenticated or third-party source. Full validation, sanitisation, size limits, and rate control required.

## Step 2: Apply checks scaled to tier
For Tier 2/3 entry points, check:
- **Injection** — SQL, command, and template injection risk from unsanitised input reaching a query, shell call, or template engine.
- **Auth/Authz** — is the caller's identity verified, and does it have permission for this specific action (not just "logged in")?
- **Secrets** — no API keys, tokens, or credentials in code, logs, error messages, or client-visible responses.
- **Validation** — type, length, and format checks on every field before use, not just at the UI layer.
- **Rate/abuse control** — can this endpoint be hammered or used to enumerate data (e.g. user existence via error message differences)?
- **Dependency risk** — does a new dependency introduce a known-vulnerable package?

## Step 3: Report findings with severity
- **Critical** — exploitable now, blocks merge (e.g. SQL injection, auth bypass).
- **Major** — real gap, fix before shipping (e.g. missing rate limit on a public endpoint).
- **Minor** — defence-in-depth improvement, not blocking.

## What NOT to do
- Don't apply Tier-3 rigor to Tier-1 internal calls — this wastes effort and adds noise.
- Don't report generic "use HTTPS" advice with no connection to the actual code being reviewed.
```

## Proposed Slash Command

### Command name
`/security-check`

### Command behavior
```markdown
---
description: Classify data entry points by trust tier and run OWASP-scaled security checks against the current diff
---

Load the security-hardening-checklist skill and review `$ARGUMENTS` (a file, diff, or feature description — otherwise the current uncommitted changes). For each new data entry point: classify its trust tier (internal / authenticated / untrusted-external), then apply checks scaled to that tier — injection, auth/authz, secrets, validation, rate/abuse control, dependency risk. Report findings with severity (Critical/Major/Minor). Only Critical/Major should block.
```

## Example Interaction
**Before:** a new public webhook endpoint is added with no signature verification and the internal error message leaks the database table name on failure.
**After `/security-check`:** flags the endpoint as Tier 3, reports Critical — missing signature verification (forgeable requests) — and Major — error message leaks schema detail to an unauthenticated caller.

## Notes / Limitations
This complements, not replaces, [[engineering-review-checklist]] — that one covers correctness/performance/tests/maintainability as well; this one goes deeper specifically on security. Run both on anything touching auth, payments, or public endpoints.
