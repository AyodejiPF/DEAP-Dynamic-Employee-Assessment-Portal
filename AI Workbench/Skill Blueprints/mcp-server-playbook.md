# MCP Server Playbook — Skill & Slash Command Blueprint

## Source
Covers two original links together: `modelcontextprotocol/servers` (88.7k★, reference MCP servers — item 7 "GitHub MCP") and `modelcontextprotocol/typescript-sdk` (12.9k★, item 11, mislabelled "TypeScript LSP" in the original list — it's actually the SDK for building MCP servers/clients, not a language server).

## Problem It Solves
Two related gaps: (1) knowing *which* existing MCP server to reach for instead of reinventing file/git/memory access as bash calls, and (2) knowing how to scope a *custom* MCP server when a business need (a StaffiQ/StaffiQ integration, an n8n bridge) isn't covered by an existing one. Without a playbook, both decisions get made ad hoc each time.

## Core Mechanism (reverse-engineered)
**Selection tier** — before writing custom integration code, check whether an existing reference server already solves it: `filesystem` (scoped file ops), `git` (repo read/search/manipulate), `memory` (persistent knowledge graph across sessions), `fetch` (web content), `time` (timezone conversion), `sequential-thinking` (structured multi-step reasoning). Note: the reference **GitHub** server specifically is archived — check the MCP Registry for its current maintained replacement rather than assuming the old one still works.

**Build tier** — when nothing existing fits, a custom MCP server is a thin wrapper exposing a small number of well-scoped tools (not a wildcard "do anything" tool) over an external system, built with the official SDK (`@modelcontextprotocol/server` for TypeScript). The design discipline that matters: each tool should do one clear thing with a validated input schema, not become a general-purpose command executor.

## Proposed Skill

### Suggested SKILL.md frontmatter
```
name: mcp-server-playbook
description: Guides the choice between using an existing reference MCP server and building a custom one, and how to scope a custom server's tools narrowly. Use when a task needs external system access (files, git, web, a business API) and it's unclear whether an existing MCP server covers it, or when asked to build a custom MCP integration.
```

### Full Skill Instructions (body)
```markdown
# MCP Server Playbook

## Step 1: Check for an existing fit first
Before writing custom integration code, check whether one of these reference servers already covers the need:
- **filesystem** — scoped file read/write instead of raw shell file manipulation.
- **git** — repo read/search/manipulate instead of shelling out to git commands ad hoc.
- **memory** — persistent knowledge graph across sessions (remembering facts between conversations).
- **fetch** — web content retrieval formatted for LLM use.
- **time** — timezone-aware date/time conversion.
- **sequential-thinking** — structured multi-step reasoning for complex planning.

Note: the reference **GitHub** server is archived — don't assume it's still maintained; check the MCP Registry (modelcontextprotocol.io) for the current equivalent before building around it.

## Step 2: If nothing fits, scope a custom server narrowly
When building a custom MCP server (e.g. a bespoke StaffiQ/StaffiQ data source, an n8n bridge):
- Expose a small number of specific tools, each doing one clear thing (e.g. `get_client_status`, not `run_arbitrary_query`).
- Validate every tool's input against a schema — don't accept freeform strings that get passed straight to an external system.
- Prefer read-only tools by default; only add write/mutating tools when the task genuinely requires them, and flag those clearly.
- Use the official SDK (`@modelcontextprotocol/server` for TypeScript, or the equivalent for the target language) rather than hand-rolling the protocol.

## What NOT to do
- Don't build a custom MCP server for something an existing reference server already does.
- Don't design a tool with a "do anything" wildcard input — that defeats the point of MCP's scoped-tool model.
- Don't assume archived reference servers (like the old GitHub one) are still the current recommended path.
```

## Proposed Slash Command

### Command name
`/mcp-scope`

### Command behavior
```markdown
---
description: Decide whether an existing reference MCP server covers a need, or scope a new one narrowly
---

Load the mcp-server-playbook skill for the integration need described in `$ARGUMENTS`. First check whether filesystem, git, memory, fetch, time, or sequential-thinking already covers it — if so, recommend that instead of building anything new. If nothing fits, propose a minimal set of narrowly-scoped tools (name, one-line purpose, input schema) for a custom server, favouring read-only tools unless a write capability is explicitly required.
```

## Example Interaction
**Before:** asked to "let Claude check file contents in the StaffiQ repo," the agent starts scripting raw shell `cat`/`find` calls with no scoping.
**After `/mcp-scope reading StaffiQ repo files`:** recommends the existing `filesystem` reference server scoped to the StaffiQ repo root instead of ad hoc shell access.

## Notes / Limitations
This is a decision-making playbook, not a working server itself — actual installation still requires `npx -y @modelcontextprotocol/server-<name>` (reference servers) or `npm install @modelcontextprotocol/server` (to build a custom one with the TypeScript SDK).
