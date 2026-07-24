---
name: mcp-server-playbook
description: Guides the choice between using an existing reference MCP server and building a custom one, and how to scope a custom server's tools narrowly. Use when a task needs external system access (files, git, web, a business API) and it's unclear whether an existing MCP server covers it, or when asked to build a custom MCP integration.
---

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
