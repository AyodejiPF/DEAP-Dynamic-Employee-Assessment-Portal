# Current Docs Verification — Skill & Slash Command Blueprint

## Source
`upstash/context7` (59.5k★, MIT, active). An MCP server + CLI that fetches live, version-specific library documentation into the prompt so generated code doesn't rely on stale training data or hallucinated APIs.

## Problem It Solves
LLMs are trained on a snapshot of the world and don't know about API changes, deprecated methods, or new library versions released after that snapshot. Left unchecked, this produces code that compiles-looking but calls methods that were renamed, uses deprecated patterns, or targets an old major version. Context7 fixes this by injecting real docs at generation time — but that requires the actual MCP server/CLI to be installed and reachable.

## Core Mechanism (reverse-engineered)
Context7's real value is a **behavioural habit**, independent of the tool: before generating code against a specific library/framework/API, don't assume the training-data version is current — either fetch real docs (via the actual Context7 MCP server, if installed) or explicitly flag the uncertainty to the user rather than silently guessing at method names or config shapes. This blueprint captures that habit as a skill so it applies even in environments where Context7 itself isn't installed (e.g. Claude Desktop without MCP access).

## Proposed Skill

### Suggested SKILL.md frontmatter
```
name: current-docs-verification
description: Flags when generated code depends on a library/framework/API version that may have changed since training, and either verifies via an available documentation tool (Context7 MCP, web search) or explicitly surfaces the uncertainty instead of silently guessing. Use whenever writing code against a specific library, SDK, API, or framework version, especially fast-moving ones like n8n nodes, cloud SDKs, or JS frameworks.
```

### Full Skill Instructions (body)
```markdown
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
```

## Proposed Slash Command

### Command name
`/verify-docs`

### Command behavior
```markdown
---
description: Verify the current API/method shape for a library before generating integration code against it
---

For the library or API named in `$ARGUMENTS` (or the one currently being integrated in this session): use any available documentation-fetching tool (Context7 MCP if installed, otherwise WebFetch/WebSearch) to confirm current method names, required parameters, and breaking changes since a plausible training cutoff. Report what was confirmed vs. what remains an assumption, then proceed with implementation using only confirmed API shapes.
```

## Example Interaction
**Before:** asked to "add Stripe webhook handling," the agent writes a handler using a Stripe SDK method signature that was renamed two major versions ago.
**After `/verify-docs stripe webhooks`:** agent fetches current Stripe webhook docs first, confirms the current signature-verification method name, then writes the handler against the confirmed API.

## Notes / Limitations
This is a behavioural skill, not a documentation source itself — its value depends on an actual fetch tool (Context7 MCP, WebFetch, WebSearch) being available in the environment. If none is available, its job shrinks to honest uncertainty-flagging rather than active verification. For the real thing with library-ID resolution and version-specific snippets, install Context7 properly: `npx ctx7 setup`.
