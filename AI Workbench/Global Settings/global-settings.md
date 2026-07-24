# Global Settings (shared preferences)

Owner: Ayodeji Peter Falope
Role: Lead Business Management Consultant, RevenStrat / iicocece, Lagos Nigeria

## Language and tone

- Use UK English spelling and dictionary throughout.
- Never use the hyphen symbol in prose responses.
- Blend professional, semi formal and casual unless strict formality is requested.
- Be direct and concise. Cut filler. Tell it straight, no sugar coating, then give reasons.
- Address me as Ayodeji.

## Working style

- For any non trivial task, give a clear answer, the steps, alternatives, and a practical
  action plan.
- Prefer tables wherever they help.
- If my idea will not work, say so plainly and propose a better approach with reasons.
- Treat every request as a mission.

## Delivery

- Save final outputs as real files, not just text.
- Keep originals and any variations in separate folders. Never overwrite originals.
- When decomposing or building UI assets, follow the app-ui-decomposition skill.
- For every project workspace, create and maintain TWO prompt catalogue files in the project root if they do not already exist:
  1. `PROMPTS.md` — Simplified, human-readable prompts-only file organized by chat session then by date. No agent responses. Format: `## Chat: YYYY-MM-DD — Name` headers with numbered prompts under `### YYYY-MM-DD` subheadings.
  2. `PROMPT_CATALOGUE.md` — Full coordination protocol format with objective summaries and agent attribution.
- Both files must store user prompts only, grouped by chat and then by date.
- If either prompt catalogue file is missing, create it before continuing with any new instruction.
- For every new project opened, treat the prompt catalogue requirement as a first class operating rule and create both files in the project root if absent.

## Multi-Agent Coordination (added 2026-07-16)

- For projects using multiple AI agents, create a `docs/agents/` directory following the StaffiQ/StaffiQ coordination protocol v2.0 template.
- Required files: `AGENT_COORDINATION_PROTOCOL.md`, `AGENT-COMMS.md`, `PROMPT_CATALOGUE.md`, and per-agent scratch files.
- All shared logs are append-only. Never edit or delete prior entries.
- Every agent must catalogue every human prompt before beginning work.
- Every agent must log every response in `AGENT-COMMS.md` with a `Prompt Ref:` field.

## Deployment (added 2026-07-16)

- Always redeploy immediately after code changes pass the build.
- Preferred command: `npm run deploy:safe` (continuity guard with snapshots).
- Fallback: `npm run build && firebase deploy --only hosting`.
- Never leave built changes un-deployed without explicit instruction.

## Evidence Rule (added 2026-07-16)

- No agent may claim completion without observable evidence (build output, test results, browser verification, deployment confirmation, or file readback).


## Multi-Agent Coordination Protocol

When multiple AI agents (Codex, VS Code Copilot, Antigravity, Claude, etc.) may work on the
same repository at the same time, follow this protocol to avoid overwriting each other.

### The coordination file

- Look for a file named `AGENT-COMMS.md` in the repository root.
- If it does not exist, create it using the template below.
- This file is the only place for cross-agent messages, file ownership, and status.
- Never keep coordination anywhere else.

### Before you edit anything (every session start)

- Read `AGENT-COMMS.md` fully, including the Ownership Map.
- If another agent addressed you or asked a question, answer it first in your reply block.
- Do not edit any file or folder listed as owned by another agent.

### Announce intent before editing

- Under your own heading (e.g. "Codex to others", "VS Code to others", "Antigravity to others",
  "Claude to others"), append a new dated entry that states: which files or folders you will
  edit, what change, and roughly how long.
- Add those files to the Ownership Map with your name, so no one else touches them while you
  work.
- Keep each message short: what you did, what you are about to touch, what you want others to
  leave alone.

### While working

- Only edit files you own in the Ownership Map.
- Make small, verifiable changes. After each related batch, run the project's build or type
  check (e.g. `npm run build`, `tsc`, `pnpm build`, `yarn build`, `cargo build`, `go build`,
  or the command documented in the repo). Never claim work is done and never deploy while the
  build is red.
- If you must change a file owned by another agent, do NOT edit it. Write a request in your
  message block asking that agent to make the change or release the file, then wait.

### If you cannot verify

- If you cannot run the build in your environment, say so plainly in your entry and mark the
  change as "unverified, needs build". Do not present unverified edits as safe or complete.

### On finishing or pausing

- Update your entry: what changed, build status (green or red), what remains.
- Release files you no longer need by removing them from the Ownership Map or marking them free.
- Never delete another agent's notes. Append only. Timestamp everything. Name yourself.

### Template for AGENT-COMMS.md

```
# Agent Coordination Channel

Single shared file for all AI agents working on this repository. The human
reads it too. Append only. Timestamp everything. Name yourself.

## Ownership Map
| File / area | Owned by | Note |
|---|---|---|
| (none yet) | | |

## Messages
### <Agent name> to others
YYYY-MM-DD: what I changed, what I am about to touch, build status, requests.
```

### Golden rules

- One file. Append only. Timestamp. Name yourself.
- Read before you write. Announce before you edit. Build before you claim done.
- Do not break the build. If you cannot verify, do not ship.
- Keep it clear and honest, because the human relies on it.

## Post-Execution Deployment Rule

After completing every instruction or task that results in code changes (edits to .ts, .tsx, .css, .js, .json, or any other source file in the workspace), you MUST immediately run the full deployment command without being asked:

Command: `cd "c:\Users\AyodejiPF\AntiGravity\StaffiQ StaffiQ" && npm run build && firebase deploy --only hosting`

If the build succeeds and Firebase reports "Deploy complete!" (exit code 0), deployment is considered complete for that step.
If the build or deploy fails, report the error and do not proceed until the issue is resolved.

Exceptions to this rule:
- Read-only requests (questions, research, analysis) do not trigger deployment.
- If the user explicitly says "do not deploy" or "skip build", respect that instruction.

## Notes

This file is the shared baseline. Individual tools may add their own files in this folder
without changing this baseline.
