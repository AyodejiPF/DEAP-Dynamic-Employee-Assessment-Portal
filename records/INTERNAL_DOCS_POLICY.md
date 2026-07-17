# Internal Documents Policy (both products)

Goal: an internal document can never be mistakenly made public.

## Where documents live
- Internal only: repository `docs/` and `docs/internal/`. These are never deployed.
- Public marketing pages: the website source only (staffiq-website root pages listed in build publicFiles; TaskPulse marketing route source).
- Never place a document, note, plan, PRD, prompt brief, analytics export, or markdown file in any deployable public folder (`public/`, `dist/`, the hosting artifact).

## Three enforced safeguards (in place since 2026-07-17)
1. Content neutralisation: any internal file that was sitting in a deployable path has had its deployable copy emptied; the real content lives in `docs/internal/`.
2. Hosting ignore rules: every firebase hosting block ignores `**/*.md`, `**/docs/**`, env files and internal marker patterns, so they are never uploaded.
3. Predeploy scanner: `node scripts/guard-no-internal-leaks.mjs <deployDir>` fails the deploy if any markdown or internal marker (Implementation Plan, Confidential, PRD, Prepared by, Result A/B) is found in the artifact. Wire it into the deploy script before `firebase deploy`.

## Deploy checklist
1. node scripts/ledger-check.mjs
2. build
3. node scripts/guard-no-internal-leaks.mjs <the folder about to deploy>
4. firebase deploy
5. record the deploy in records/DEPLOYS.md
