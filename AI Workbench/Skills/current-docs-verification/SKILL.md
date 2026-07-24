---
name: current-docs-verification
description: Flags when generated code depends on a library/framework/API version that may have changed since training, and either verifies via an available documentation tool (Context7 MCP, web search) or explicitly surfaces the uncertainty instead of silently guessing. Use whenever writing code against a specific library, SDK, API, or framework version, especially fast-moving ones like n8n nodes, cloud SDKs, or JS frameworks.
---

# Current Docs Verification

Don't silently assume training-data knowledge of a library's API surface is current.

## When to trigger
- Generating code against a named library/framework/SDK (React, Supabase, n8n nodes, Stripe API, etc.)
- The library is known to change frequently (JS ecosystem, cloud provider SDKs, AI/LLM SDKs)
- The user references a specific version number
- The task is an integration (calling a third-party API) rather than pure logic

## What to do
1. If a documentation-fetching tool is available (Context7 MCP, WebFetch, WebSearch), use it to confirm the current method names, required parameters, and config shape before writing the integration code — don't skip this because the pattern "looks familiar."
2. If no such tool is available, say so explicitly: state which parts of the generated code rely on assumed-current API shape, and flag them as "verify against current docs before running" rather than presenting them as certain.
3. Prefer citing the specific library version the code targets (e.g. "assumes Next.js 14 App Router conventions") so the user can catch a mismatch immediately.
4. Never invent a plausible-sounding method or parameter name to fill a gap — say the gap exists instead.

## What NOT to do
- Don't re-verify trivial, stable APIs (standard library string functions, well-established language features) — this is for fast-moving external dependencies, not everything.
- Don't pad the response with unnecessary "as of my knowledge cutoff" disclaimers when a verification tool was actually used and confirmed current.
