# Shared Multi-Agent Coordination Protocol

> **Version**: 2.0 — Strict Edition
> **Canonical location**: `docs/agents/AGENT_COORDINATION_PROTOCOL.md`
> **Applies to**: VS Code Copilot, Claude Cowork, Codex, Antigravity, and any future agent

---

## RFC 2119 Convention

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119.

In short:
- **MUST** / **MUST NOT** = absolute requirement. Violating this breaks the protocol.
- **SHOULD** / **SHOULD NOT** = strong recommendation. You need a good reason to deviate.
- **MAY** / **OPTIONAL** = truly optional.

---

## 1. Purpose

This protocol transforms the repository into a **shared team workspace** where multiple AI agents across different IDEs, machines, and network locations operate from a single, consistent, append-only source of truth.

Without this protocol, each agent relies on private memory. That leads to silent overwrites, lost context, divergent assumptions, and untraceable changes. This protocol prevents all of that.

## 2. Why This Approach

| Without protocol | With protocol |
|---|---|
| Agents use private memory that other agents cannot see | All agents read and write to shared, auditable files |
| Context is lost between sessions | Every session inherits the full history |
| Two agents overwrite each other's work | Cross-agent awareness rules prevent collisions |
| No record of what was asked or done | Append-only logs preserve every prompt and action |
| Protocol is permissive and ignored | Strict MUST language with concrete consequences |

## 3. File Map — What Lives Where

| File | Purpose | Mutability |
|---|---|---|
| `docs/agents/AGENT_COORDINATION_PROTOCOL.md` | **The rulebook** — every agent reads this first | Mutable (intentional updates only) |
| `docs/agents/AGENT-COMMS.md` | **Canonical activity log** — all agent actions | Append-only |
| `docs/agents/PROMPT_CATALOGUE.md` | **Canonical prompt catalogue** — all human prompts | Append-only |
| `docs/agents/AGENT_VSCODE.md` | VS Code Copilot scratch + handoff | Per-section rules |
| `docs/agents/AGENT_CLAUDE.md` | Claude Cowork scratch + handoff | Per-section rules |
| `docs/agents/AGENT_CODEX.md` | Codex scratch + handoff | Per-section rules |
| `docs/agents/AGENT_ANTIGRAVITY.md` | Antigravity scratch + handoff | Per-section rules |
| Root `AGENT-COMMS.md` | **Pointer only** → redirects to `docs/agents/AGENT-COMMS.md` | Mutable |
| Root `PROMPT_CATALOGUE.md` | **Pointer only** → redirects to `docs/agents/PROMPT_CATALOGUE.md` | Mutable |

**The canonical versions are in `docs/agents/`.** Root-level files of the same name are pointer files only. If you find content in a root file that is not in the `docs/agents/` version, you MUST merge it into the canonical file and then restore the root file to a pointer.

---

## 4. Mandatory Workflow — Every Session, No Exceptions

Every agent MUST follow this exact sequence at the start of every session, **before making any code or file changes**:

1. **Read the protocol** — `docs/agents/AGENT_COORDINATION_PROTOCOL.md` (this file).
2. **Read the activity log** — `docs/agents/AGENT-COMMS.md`. Understand what other agents have done.
3. **Read the prompt catalogue** — `docs/agents/PROMPT_CATALOGUE.md`. Understand what the human has asked for.
4. **Read your per-agent file** — `docs/agents/AGENT_<YOUR_NAME>.md`. Pick up where you left off.
5. **Check for concurrent work** — If another agent's most recent activity log entry is less than 2 hours old and touches the same files you plan to work on, note your awareness in your activity entry.
6. **Append an activity log entry** — Before making changes, record that you are starting work.
7. **Catalogue the human's prompt** — Append to `docs/agents/PROMPT_CATALOGUE.md` before beginning work.
8. **Begin work** — Only after steps 1–7 are complete.

At the end of every session, every agent MUST:

9. **Update your per-agent file** — Handoff notes, files touched, evidence collected.
10. **Append a closing activity log entry** — Status: completed, blocked, or pending. Include evidence.

---

## 5. Append-Only Rule with Correction Mechanism

### 5.1 Default Rule

The shared activity log (`docs/agents/AGENT-COMMS.md`) and prompt catalogue (`docs/agents/PROMPT_CATALOGUE.md`) are **append-only**.

You MUST NOT:
- Delete any prior entry.
- Silently rewrite or modify any prior entry.
- Replace prior notes with newer summaries.
- Remove another agent's entries.
- Edit a prior entry to change its meaning.

### 5.2 Correction Mechanism

If a factual error exists in a prior entry, you MUST correct it by **appending a new entry** — not by editing the original.

**Correction format**:
```
CORRECTION to [date] [entry reference]: [corrected information]
  — Reason: [why the correction is needed]
  — Corrected by: [agent name]
  — Original entry remains unchanged above.
```

Example:
```
CORRECTION to 2026-07-14 "Sector ticker display fault fixed": The cache rule was changed to 5 minutes, not 10 minutes.
  — Reason: Re-read the deployed configuration and confirmed the value is 300 seconds.
  — Corrected by: VS Code Copilot (V4 Pro)
  — Original entry remains unchanged above.
```

### 5.3 Redaction Rule

Only the **human repository owner** (Ayodeji Falope) MAY authorize redaction of a prior entry. Redaction is permitted only for:
- Accidental inclusion of secrets, passwords, or API keys.
- Personal data that must be removed for legal or privacy reasons.
- Content that violates platform policies.

If redaction is necessary, the human or an agent acting on explicit human instruction MUST:
1. Remove the sensitive content from the entry.
2. Replace it with `[REDACTED: reason — authorized by Ayodeji Falope on YYYY-MM-DD]`.
3. Append a `REDACTION` entry explaining what was removed and why.

Agents MUST NOT redact entries on their own initiative.

---

## 6. Per-Agent Scratch File Requirements

Every per-agent file (`docs/agents/AGENT_<NAME>.md`) MUST contain the following five sections:

### Section 1: Current Task Context (MUTABLE)
What the agent is currently working on. This section MAY be overwritten as tasks change. It exists so any agent (or the human) can quickly see what each agent is doing.

### Section 2: Working Assumptions (APPEND-ONLY)
Assumptions the agent is making during the current session. Append new assumptions; do not delete old ones. If an assumption is invalidated, append a note stating it was invalidated and why.

### Section 3: Implementation Checkpoints (APPEND-ONLY)
Timestamped progress markers. Format: `YYYY-MM-DD HH:MM — [checkpoint description]`. Append one line per checkpoint. This creates a granular timeline of work.

### Section 4: Files Touched This Session (APPEND-ONLY)
List of files modified in the current session. Format: `- [file path] — [brief description of change]`. Append each file as it is modified. This section resets at the start of a new session (move old entries to an archive or append a "New session" marker).

### Section 5: Handoff Notes for Next Agent (APPEND-ONLY)
What the next agent (or the same agent in a future session) needs to know. Include:
- What was done.
- What remains.
- Which files were touched.
- What evidence was collected (build output, test results, verification).
- Any blockers or pending decisions.

---

## 7. Prompt Catalogue Mandate — ALL IDEs

Every human prompt received by **any agent on any IDE** MUST be appended to `docs/agents/PROMPT_CATALOGUE.md` **before the agent begins work on that prompt**.

This applies to:
- VS Code Copilot
- Claude Cowork
- Codex (ChatGPT)
- Antigravity (Google)
- Any future agent added to this repository

Entry format:
```markdown
### YYYY-MM-DD | Chat: [short session identifier] | Agent: [your agent name]
- **Prompt**: [verbatim text or faithful summary if very long]
- **Objective**: [one-line description of what the human wants to achieve]
```

This is a **MUST** rule, not a suggestion. If you forget to catalogue a prompt before beginning work, catalogue it as soon as you remember, with a note: `[Catalogued late — work already in progress]`.

### Per-IDE Configuration

To make this automatic, configure each IDE as follows:

**VS Code Copilot**: Add to `.vscode/settings.json`:
```json
"AFTER human prompt, append to docs/agents/PROMPT_CATALOGUE.md"
```

**Claude Cowork**: Add to `C:\Users\AyodejiPF\.claude\CLAUDE.md`:
```markdown
Catalogue every human prompt in docs/agents/PROMPT_CATALOGUE.md before beginning work. Use format: ### YYYY-MM-DD | Chat: [session] | Agent: Claude | Prompt: [text] | Objective: [summary]
```

**Codex**: Include in session prompt:
```
Catalogue all human prompts in docs/agents/PROMPT_CATALOGUE.md using format: ### YYYY-MM-DD | Chat: [session] | Agent: Codex | Prompt: [text] | Objective: [summary]
```

**Antigravity**: Include in session prompt:
```
Catalogue all prompts in docs/agents/PROMPT_CATALOGUE.md. Append only. Format: ### YYYY-MM-DD | Chat: [session] | Agent: Antigravity | Prompt: [text] | Objective: [summary]
```

---

## 8. Activity Log Requirements — Structured Format

Every agent action MUST be recorded in `docs/agents/AGENT-COMMS.md` using the structured format below. This creates a traceable link from every human prompt to the agent who responded, the files changed, the evidence collected, and the work status.

**Mandatory structured entry format**:
```markdown
### [Agent Name] to others

**Date**: YYYY-MM-DD HH:MM
**Prompt Ref**: Chat: [session] | Date: YYYY-MM-DD | "[Prompt summary — what the human asked]"
**Task**: [One-line summary of what was done]
**Files**: [List of files touched with brief description of each change]
**Status**: [completed | in-progress | blocked | pending]
**Evidence**: [Build output excerpt, test results, screenshots, verification steps]
**Notes**: [Context, blockers, coordination notes for other agents]
```

Example of a well-formed entry:
```markdown
### VS Code Copilot (V4 Pro) to others

**Date**: 2026-07-16 15:30
**Prompt Ref**: Chat: Protocol hardening | Date: 2026-07-16 | "Edit the prompts report in the docs folder..."
**Task**: Populated comprehensive prompt catalogue from both VS Code chat transcripts.
**Files**: `docs/agents/PROMPT_CATALOGUE.md` (28 prompts added), `docs/agents/AGENT_COORDINATION_PROTOCOL.md` (section 7 strengthened), `.vscode/settings.json` (created)
**Status**: completed
**Evidence**: `npm run build` passes (2297 modules, 0 errors). All 28 prompts verified against transcript source.
**Notes**: Catalogue now covers sessions 374be8ba and 57b58d6b. Next agent should verify their own IDE is configured per section 13.
```

Status definitions:
- **completed**: Task is finished, evidence provided.
- **in-progress**: Agent is actively working. Include what's been done so far.
- **blocked**: Agent cannot proceed. Include what's blocking and what's needed.
- **pending**: Task is planned but not yet started.

---

## 8.1 Agent Response Mandate — ALL IDEs

Every agent response, action, and deliverable produced by **any agent on any IDE** MUST be logged in `docs/agents/AGENT-COMMS.md` using the structured format defined in section 8.

This applies to:
- VS Code Copilot
- Claude Cowork
- Codex (ChatGPT)
- Antigravity (Google)
- Any future agent added to this repository

Every entry MUST include a **Prompt Ref:** field that cross-references the specific entry in `docs/agents/PROMPT_CATALOGUE.md`. This creates a complete bidirectional audit trail: what was asked → who did what → what files changed → what evidence exists.

This is a **MUST** rule, not a suggestion. It carries the same weight as the Prompt Catalogue Mandate (section 7). If you forget to log a response, log it as soon as you remember, with a note: `[Logged late — work already completed]`.

### Per-IDE Configuration for Response Logging

**VS Code Copilot**: Add to `.vscode/settings.json`:
```json
"AFTER completing work, append to docs/agents/AGENT-COMMS.md using structured format with Prompt Ref, Task, Files, Status, Evidence, and Notes fields"
```

**Claude Cowork**: Add to `C:\Users\AyodejiPF\.claude\CLAUDE.md`:
```markdown
Log every response/action in docs/agents/AGENT-COMMS.md using the structured format. Every entry MUST include a Prompt Ref: field linking to docs/agents/PROMPT_CATALOGUE.md. Include Date, Task, Files, Status, Evidence, and Notes fields.
```

**Codex**: Include in session prompt:
```
Log every response in docs/agents/AGENT-COMMS.md using structured format. Every entry MUST include Prompt Ref: linking to PROMPT_CATALOGUE.md. Fields: Date, Prompt Ref, Task, Files, Status, Evidence, Notes.
```

**Antigravity**: Include in session prompt:
```
Log every response in docs/agents/AGENT-COMMS.md. Append only. Use structured format with Prompt Ref: linking to PROMPT_CATALOGUE.md. Fields: Date, Prompt Ref, Task, Files, Status, Evidence, Notes.
```

---

## 9. Cross-Agent Awareness Rule

Every agent MUST assume that another agent may be operating on the same repository at the same time.

Before touching any file, you MUST:
1. Check `docs/agents/AGENT-COMMS.md` for entries in the last 2 hours.
2. If another agent's entry mentions the same file(s), note your awareness in your own activity entry: `Aware of concurrent work by [agent name] on [file]. Coordinating accordingly.`
3. Do not overwrite recent changes without acknowledging them.
4. If two agents touch the same file, the second agent MUST explain in its entry how it resolved any potential conflict.

---

## 10. Evidence-First Completion Rule

No agent MAY claim a task is complete without observable, verifiable evidence.

Acceptable evidence includes:
- Successful build output (copy the relevant lines).
- Passing test results (copy the test runner output).
- File diff review (confirm the changes are as intended).
- Browser verification (describe what was checked and at what viewport).
- Deployment confirmation (copy the deploy output).
- Explicit readback of modified files (confirm the content is correct).

If evidence is unavailable or inconclusive, the agent MUST mark the task as **pending** or **blocked**, not completed.

---

## 11. Handoff Rule

When an agent finishes a task (or ends a session), it MUST leave a handoff note in its per-agent file under "Handoff Notes for Next Agent" that includes:

- **What was done**: One-paragraph summary.
- **What remains**: Specific, actionable items.
- **Files touched**: Complete list with brief description of each change.
- **Evidence collected**: What verification was performed.
- **Blockers**: Anything preventing completion.
- **Recommended next step**: What the next agent should do first.

---

## 12. Three-Tier Network Access Model

This repository MAY be accessed from multiple laptops on a local network. The following three access methods are documented in priority order.

### Tier 1: Git (PRIMARY — Always Available)

The canonical source of truth for all code and documentation.

- **Remote URL**: `https://github.com/AyodejiPF/StaffiQ-Dynamic-Employee-Assessment-Portal`
- **How to use**: `git clone` or `git pull` from any machine with internet access.
- **When to use**: Always. This is the primary sync mechanism. Every agent on every machine MUST pull before starting work and push after completing it.

### Tier 2: OneDrive Shared Hub (SECONDARY — Cross-Machine Sync)

Shared skills, global settings, and agent configuration that applies across all projects.

- **Path**: `C:\Users\AyodejiPF\OneDrive\Desktop\AI Workbench\`
- **Contains**:
  - `Skills/` — Reusable skill definitions (each a subfolder with `SKILL.md`).
  - `Global Settings/global-settings.md` — Cross-project preferences and rules.
- **How to use**: Any machine signed into the same OneDrive account automatically syncs this folder. Agents MUST read `Global Settings/global-settings.md` at the start of each session.
- **When to use**: For preferences, skills, and configuration that apply across projects — not for project-specific code or docs.

### Tier 3: Local Network Share (TERTIARY — User-Configured)

A Windows SMB network share for LAN-speed file access when Git push/pull is too slow for large assets.

- **Path pattern**: `\\<MACHINE-NAME>\<SHARE-NAME>\Projects\StaffiQ\`
- **Example**: `\\AYODEJI-DESK\Shared\Projects\StaffiQ\`
- **How to set up** (human must do this once):
  1. On the primary machine, right-click the project folder → Properties → Sharing → Share.
  2. Note the machine name (run `hostname` in PowerShell).
  3. Note the share name you chose.
  4. Fill in the path pattern above with your actual values.
  5. On remote laptops, map the network drive or access via UNC path.
- **Fallback**: If the network share is unreachable (machine offline, network down, share not configured), agents MUST fall back to Tier 1 (Git). The network share is a convenience, not a requirement.
- **⚠️ Warning**: Network shares can cause stale read problems when files are written by one tool and read by another through the share. Always prefer Git for critical operations. See the Claude Cowork entry from 2026-07-15 in the activity log for a documented case of stale-mount data corruption.

---

## 13. How to Configure Each IDE

This protocol is a rules document. To make it effective, each IDE/agent must be configured to read it automatically.

### VS Code Copilot

Add to `.vscode/settings.json` (create if needed):
```json
{
  "github.copilot.chat.instructions": [
    "BEFORE any changes, read docs/agents/AGENT_COORDINATION_PROTOCOL.md",
    "BEFORE any changes, read docs/agents/AGENT-COMMS.md",
    "BEFORE any changes, read docs/agents/PROMPT_CATALOGUE.md",
    "BEFORE any changes, read docs/agents/AGENT_VSCODE.md",
    "AFTER human prompt, append to docs/agents/PROMPT_CATALOGUE.md",
    "AFTER completing work, append to docs/agents/AGENT-COMMS.md",
    "AFTER completing work, update docs/agents/AGENT_VSCODE.md handoff notes"
  ]
}
```

### Claude Cowork

Add to `C:\Users\AyodejiPF\.claude\CLAUDE.md`:
```markdown
## MANDATORY PRE-WORK PROTOCOL
Before any changes, you MUST:
1. Read docs/agents/AGENT_COORDINATION_PROTOCOL.md
2. Read docs/agents/AGENT-COMMS.md
3. Read docs/agents/PROMPT_CATALOGUE.md
4. Read docs/agents/AGENT_CLAUDE.md
5. Append activity to docs/agents/AGENT-COMMS.md
6. Catalogue prompt in docs/agents/PROMPT_CATALOGUE.md
7. Update docs/agents/AGENT_CLAUDE.md handoff notes when done
```

### Codex

Include in every Codex session prompt:
```
You are joining a shared multi-agent team. Before any changes, read:
- docs/agents/AGENT_COORDINATION_PROTOCOL.md (the rulebook)
- docs/agents/AGENT-COMMS.md (what other agents did)
- docs/agents/PROMPT_CATALOGUE.md (what human asked)
- docs/agents/AGENT_CODEX.md (your scratch file)
Follow strict append-only logging.
```

### Antigravity

Include in every Antigravity session:
```
Read docs/agents/AGENT_COORDINATION_PROTOCOL.md before any changes.
Use docs/agents/AGENT_ANTIGRAVITY.md for scratch notes.
Append activity to docs/agents/AGENT-COMMS.md.
Catalogue prompts in docs/agents/PROMPT_CATALOGUE.md.
```

---

## 14. Bootstrap Instruction — For New Agents

Paste this into any new agent's system prompt:

```
You are joining a shared multi-agent team for the StaffiQ / StaffiQ repository.
You MUST treat the repository as a shared workspace. Read the full protocol
at docs/agents/AGENT_COORDINATION_PROTOCOL.md before any changes.

STARTUP SEQUENCE (complete ALL before any code/file changes):
1. READ docs/agents/AGENT_COORDINATION_PROTOCOL.md — the complete rulebook.
2. READ docs/agents/AGENT-COMMS.md — shared activity log.
3. READ docs/agents/PROMPT_CATALOGUE.md — record of human prompts.
4. READ your per-agent file (create AGENT_<YOUR_NAME>.md if new, with 5 mandatory sections).
5. CHECK for concurrent work (entries in last 2 hours).
6. APPEND activity entry to docs/agents/AGENT-COMMS.md.
7. CATALOGUE the human prompt in docs/agents/PROMPT_CATALOGUE.md.
8. BEGIN work only after steps 1-7.

RULES:
- All shared logs are APPEND-ONLY. Never edit/delete prior entries.
- To correct: append CORRECTION entry referencing the original.
- Every prompt catalogued. Every action logged.
- Never claim completion without verifiable evidence.
- Leave handoff notes in your per-agent file.

NETWORK:
- Primary: Git at https://github.com/AyodejiPF/StaffiQ-Dynamic-Employee-Assessment-Portal
- Secondary: OneDrive at C:\Users\AyodejiPF\OneDrive\Desktop\AI Workbench\
- Tertiary: Network share at \\<MACHINE-NAME>\<SHARE-NAME>\Projects\StaffiQ\ (if configured)
```

---

## 15. Project-Agnostic Template

To replicate this system in another project, copy sections 1–14 above and replace:
- Project name and Git remote URL.
- Agent list (add/remove per-agent files).
- Network paths (OneDrive path, UNC pattern).
- IDE configuration instructions (add/remove tools).

---

## 16. Protocol Governance

- **This protocol MAY be updated** by any agent for clarity, accuracy, or necessary rules. Log updates in `docs/agents/AGENT-COMMS.md`.
- **The human owner (Ayodeji Falope) has final authority.** Any rule MAY be overridden by explicit human instruction.
- **If a rule proves impractical**, flag it in handoff notes and propose an amendment. Do not silently ignore it.

---

*Protocol v2.0 — Strict Edition. Last updated: 2026-07-16 by VS Code Copilot (V4 Pro).*
