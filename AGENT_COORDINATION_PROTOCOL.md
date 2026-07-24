# Shared Multi-Agent Coordination Protocol for StaffiQ / StaffiQ

This document is the master prompt that should be shared with Claude, Codex, Antigravity, and any other AI agent working on this project. It defines how all agents should communicate, how prompts should be recorded, how work should be tracked, and how the repository should behave as a shared team workspace.

## Storage location

This file should live in the project root of this repository:

- [AGENT_COORDINATION_PROTOCOL.md](AGENT_COORDINATION_PROTOCOL.md)
- [AGENT-COMMS.md](AGENT-COMMS.md)
- [PROMPT_CATALOGUE.md](PROMPT_CATALOGUE.md)

These three files form the working backbone of the system. They are the shared source of truth for coordination, history, and prompt tracking.

## What this system is trying to achieve

You are trying to solve a very practical coordination problem:

1. You use multiple IDEs and AI tools on the same project at the same time.
2. You want each tool to behave as part of one team rather than as an isolated assistant.
3. You want one shared record of what the human asked for, what each agent did, and what changed.
4. You want a durable, reviewable system that survives across devices, laptops, and different IDEs.
5. You want the project to remain coherent even when work is happening in VS Code, Claude Cowork, Codex, and Antigravity concurrently.

The reason for this is simple: when multiple AI systems work on one codebase, they can easily overwrite each other, forget context, duplicate effort, or lose the trail of decisions. A shared protocol fixes this by making the repo itself the memory layer.

## Why a better approach is needed

The better approach is not to depend on each IDE’s memory or each agent’s private chat history. The better approach is to make the repository itself the operating system for collaboration.

Use these principles:

- One shared repository root as the home for team context.
- One shared agent activity log for all actions.
- One shared prompt catalogue for all human requests.
- One shared coordination protocol that all agents must follow.
- Evidence-based updates, not vague summaries.
- Clear handoffs, not silent assumptions.

This is much stronger than relying on each assistant to “remember” what happened earlier. It is also more reliable when you are working across multiple devices and remote laptops.

## The core concept

Think of the system as having three layers:

1. Human intent layer
   - The human writes prompts and requests.
   - Those prompts are preserved in [PROMPT_CATALOGUE.md](PROMPT_CATALOGUE.md).

2. Agent activity layer
   - Every agent records what it did, where it changed files, and what was verified.
   - Those records are preserved in [AGENT-COMMS.md](AGENT-COMMS.md).

3. Protocol layer
   - This file defines the behavioural rules for all agents.
   - It tells each agent how to read, write, hand off work, and avoid conflicts.

## 1. The primary goal of this protocol

Every agent must act as a contributor to one shared team workflow.

When an agent starts work, it must:

- read the current coordination files,
- understand the current state of the project,
- preserve the human’s intent,
- avoid clobbering the work of others,
- log its own actions clearly,
- provide evidence for completion.

## 2. The files that must be treated as source of truth

Every agent must treat the following files as the project’s operating documents:

- [AGENT_COORDINATION_PROTOCOL.md](AGENT_COORDINATION_PROTOCOL.md): the rulebook for how agents work together.
- [AGENT-COMMS.md](AGENT-COMMS.md): the shared log of what each agent has done.
- [PROMPT_CATALOGUE.md](PROMPT_CATALOGUE.md): the chronological store of human prompts.

If a file is missing, the agent should create it before continuing.

## 3. How agents must behave when they start work

Before making changes, each agent must do all of the following:

1. Read the current contents of [AGENT-COMMS.md](AGENT-COMMS.md).
2. Read the current contents of [PROMPT_CATALOGUE.md](PROMPT_CATALOGUE.md).
3. Read this protocol file.
4. Identify whether the task is new, ongoing, or a continuation of prior work.
5. Check whether another agent has already modified the files in scope.
6. Record its arrival in the shared log.
7. Proceed with the work only after understanding the current context.

## 4. How agents must record their work

Every agent must append to [AGENT-COMMS.md](AGENT-COMMS.md) with a short but complete entry.

Each entry should contain:

- the agent name,
- the date and time,
- the scope of work,
- the files touched,
- the purpose,
- the outcome,
- any verification performed,
- any next step or handoff.

The format should be consistent.

Suggested structure:

- Agent:
- Date:
- Task:
- Files:
- Status:
- Evidence:
- Notes:

## 5. How prompts must be logged

Every human prompt must be recorded in [PROMPT_CATALOGUE.md](PROMPT_CATALOGUE.md).

This file must preserve:

- the prompt text,
- the date,
- the chat or session context,
- the project context,
- the intended outcome.

This is important because the prompt catalogue becomes the historical memory of the human’s intent. It is the bridge between the human and all the AI tools.

## 6. How work should be handed off between agents

When one agent finishes work, it must leave a clear handoff note.

The handoff should include:

- what was completed,
- what remains,
- what files were changed,
- what validation was performed,
- what the next agent should check.

The next agent must not assume the previous agent completed everything. It must read the handoff and verify the current state.

## 7. Evidence-first rule

No agent should claim completion without evidence.

Evidence can include:

- a successful build,
- a passing test,
- a deployed URL,
- a diff review,
- a browser check,
- a file readback,
- a log output.

If there is no evidence, the work should be marked as pending or in progress.

## 8. Respect for existing work

Agents must not overwrite or replace another agent’s work without checking first.

If a file is already under active change by another agent, the incoming agent must:

- inspect the current state,
- read the latest log entry,
- avoid duplicate changes,
- coordinate before editing the same area.

## 9. Rule for shared file ownership

The repository should be treated as a shared workspace, not as a private sandbox.

Each major area can have an implied owner, but the final system still uses shared records.

Examples:

- UI work: logged in [AGENT-COMMS.md](AGENT-COMMS.md)
- Marketing site work: logged in [AGENT-COMMS.md](AGENT-COMMS.md)
- SuperAdmin or privileged work: logged in [AGENT-COMMS.md](AGENT-COMMS.md)
- Prompt history: logged in [PROMPT_CATALOGUE.md](PROMPT_CATALOGUE.md)

## 10. Rule for repo-wide continuity

When an agent works on this repository, it must preserve continuity.

Continuity means:

- the project still runs,
- previous work remains intact,
- the human’s instructions remain visible,
- the latest state is documented,
- future agents can continue without confusion.

## 11. Rule for concurrent multi-IDE work

Because you use multiple IDEs concurrently, each agent must assume that another agent may still be editing the same repository.

This means:

- do not assume your workspace is the only one in use,
- re-read the shared files before editing,
- avoid unrecorded changes,
- communicate changes in the shared log.

## 12. Rule for remote laptop access

If other laptops are connected over the local Wi-Fi network and are allowed to access this PC’s files, they should operate through the same repository root rather than creating their own independent copies.

Recommended setup:

- use one shared project folder,
- mount the folder consistently on each machine,
- avoid duplicate clones unless absolutely necessary,
- keep all coordination files in the same repo root,
- use the same file names and same structure.

The shared root should be the project folder containing this repository.

## 13. Rule for naming and identity

Every agent entry should identify itself clearly.

Examples:

- VS Code agent
- Claude Cowork
- Codex
- Antigravity

The agent should also identify the task in a human-readable way.

## 14. Rule for being explicit about status

Agents must not say “done” vaguely.

They should say one of the following:

- implemented and verified,
- implemented but not yet verified,
- blocked by dependency,
- pending human input,
- needs review,
- reverted due to conflict.

## 15. Rule for avoiding duplication

If two agents are working on the same request, one should own the implementation while the other should review or support.

The work should be coordinated through the shared log instead of duplicated in parallel.

## 16. Rule for preserving the human’s intent

The human’s prompt is the source of truth. The agent’s job is not to reinterpret the request into something else.

The agent must:

- preserve the original request,
- follow the instructions literally where possible,
- ask a question only when the task cannot proceed safely without clarification,
- avoid adding irrelevant features.

## 17. Rule for safe changes

Agents should make the smallest safe change that satisfies the request.

Avoid:

- large rewrites without need,
- deleting files without confirmation,
- changing architecture without reason,
- introducing risky migration steps without clear need.

## 18. Rule for validation

Every meaningful implementation change should be validated.

Validation may include:

- build checks,
- lint or type checks,
- tests,
- browser checks,
- file existence checks,
- diff review.

If validation cannot be completed, the agent must say so clearly.

## 19. Rule for reporting changes

When an agent completes work, it should report:

- what changed,
- why it changed,
- where it changed,
- what was verified,
- what remains open.

The report should be concise but complete.

## 20. Rule for maintaining continuity across tools

Each tool should be able to continue from the current state without needing to guess.

That means each agent must leave behind enough context for the next agent to proceed.

A good handoff contains:

- the current task,
- the current status,
- the relevant files,
- the next action,
- any blockers.

## 21. Recommended operating workflow for this repository

The recommended workflow is:

1. Human sends a prompt.
2. The prompt is logged in [PROMPT_CATALOGUE.md](PROMPT_CATALOGUE.md).
3. The agent reads the log and the protocol.
4. The agent updates [AGENT-COMMS.md](AGENT-COMMS.md) with its planned work.
5. The agent performs the work.
6. The agent validates the result.
7. The agent records the completion in [AGENT-COMMS.md](AGENT-COMMS.md).
8. The next agent can pick up from there without guesswork.

## 22. Suggested start and end templates

### Start template

- Agent:
- Date:
- task:
- intent:
- files likely to be touched:
- current status:

### Completion template

- Agent:
- Date:
- task:
- completed:
- verified:
- files changed:
- notes:
- next step:

## 23. Anti-patterns to avoid

Do not:

- silently overwrite another agent’s work,
- keep work only in private chat history,
- omit the prompt from the catalogue,
- fail to log completed work,
- claim success without evidence,
- change files without describing the reason,
- branch into unrelated work without noting it,
- assume the human wants a full rewrite when a targeted fix is enough.

## 24. Recommended default configuration for your workflow

For this project, the best configuration is:

- one repo root as the source of truth,
- one shared prompt catalogue,
- one shared agent communication log,
- one explicit protocol file,
- consistent evidence-based updates,
- clear handoffs,
- all agents reading the same coordination files before acting.

This is the simplest and most durable system for the way you work.

## 25. Final instruction to every agent

Every agent working on this repository must follow this rule:

You are not an isolated assistant. You are a member of a shared team operating inside one repository. Read the shared files, preserve the human’s intent, record your actions, verify your work, and leave enough context for the next agent to continue without confusion.

When you work, do not just change code. Also preserve continuity, traceability, and collaboration.

## Copy-ready prompt to share with Claude, Codex, and other agents

Use the following text as the prompt you share with Claude, Codex, Antigravity, and any other AI agent:

You are joining a shared multi-agent workflow for the StaffiQ / StaffiQ repository. This repository is the source of truth for the project. You must operate as part of a team, not as a private assistant.

Before you begin work, read the following files from the project root:

- AGENT_COORDINATION_PROTOCOL.md
- AGENT-COMMS.md
- PROMPT_CATALOGUE.md

Treat these files as the operating system for collaboration.

Your responsibilities are:

1. Preserve the human’s original request.
2. Read prior agent activity before making changes.
3. Record your work in AGENT-COMMS.md.
4. Record the human prompt in PROMPT_CATALOGUE.md.
5. Avoid overwriting another agent’s work.
6. Validate your work with evidence.
7. Leave a clear handoff for the next agent.
8. Follow the repo’s shared rules rather than relying on memory alone.

You must not work in isolation. You must act as though you are part of a team of agents operating on the same codebase across multiple IDEs and devices.

Whenever you make changes, report:

- what changed,
- why it changed,
- which files were touched,
- what validation was performed,
- what remains open.

If you cannot verify something, say so clearly.

Do not claim completion without evidence.

The human is using multiple IDEs concurrently. Your job is to preserve continuity, shared memory, and team coordination across tools.

Your default behaviour must be:

- read first,
- log second,
- implement third,
- verify fourth,
- hand off clearly.

This repository must remain coherent, traceable, and safe even when work is happening from different machines and different agents at the same time.
