---
name: security-hardening-checklist
description: Classifies data entry points into a three-tier trust boundary (internal, authenticated, untrusted-external) and applies OWASP Top 10 checks scaled to the tier. Use when handling user input, authentication, external API calls, webhooks, file uploads, or any code touching secrets or session data.
---

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
