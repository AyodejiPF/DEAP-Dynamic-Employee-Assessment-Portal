# RevenStrat Build Ledger

One place every human and AI agent reads project state and writes what they did.
Applies identically to TaskPulse and Staff iQ so a future federated view can merge both.

## The five append only files
| File | Purpose |
|---|---|
| LEDGER.md | One entry per work session, written before the session ends |
| DEPLOYS.md | One line per deploy: date, site, artifact, command, live check, rollback point |
| INCIDENTS.md | One entry per fault that reached production or blocked work |
| DECISIONS.md | One entry per owner decision, with reason and affected files |
| PROMPTS.md | Verbatim user prompts with a reference id |

## Rules
1. Append only. Never edit or delete a past entry. Correct with a new dated entry.
2. Write your ledger entry before you end a session, not later.
3. Commit at the end of every session and push immediately. No session ends dirty.
4. Commit message format: `type: summary [prompt ref]` so every commit traces to a prompt.
5. Tag every deploy: `deploy-YYYYMMDD-N`.
6. Run `node scripts/ledger-check.mjs` before any deploy. It refuses to proceed if the
   working tree is dirty or there is no ledger entry for today.
7. Every Friday, compile the week into `records/digest-YYYY-WW.md`: shipped, failed, carried over.

## Ledger entry schema (every field mandatory)
date | agent and model | prompt ref | what was asked | files touched | build result | deploy result | live verification | commit hash | status: DONE / PARTIAL(remainder) / FAILED(reason)
