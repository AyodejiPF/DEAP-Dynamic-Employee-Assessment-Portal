---
name: production-data-safety
description: Production data safety checks before modifying live applications, Firebase projects, databases, user records, tasks, reports, uploads, cloud resources, automations, or destructive file paths. Use when Ayodeji asks to deploy, delete, repair, migrate, clean, reset, archive, fix bugs, or change a live product.
---

# Production Data Safety

Use this skill before any action that can affect live data, cloud resources, user access, production records, billing, or irreversible files.

## Safety Workflow

1. Identify the exact target project, path, cloud project, database, or hosting site.
2. Confirm whether the action is read only, reversible, risky, or destructive.
3. Check for backups, exports, snapshots, or rollback paths.
4. Separate source data from generated output.
5. Avoid hard delete unless Ayodeji clearly asks and the target is verified.
6. For production bug work, reproduce first and change the smallest safe code path.
7. Run the required tests and continuity checks before deployment.
8. Verify after deployment or deletion.

## Stop Conditions

Stop and ask before continuing if the target is ambiguous, the action may delete live user data, the account identity is unclear, or the rollback path is missing.

## Output Format

Report target, risk level, safety checks, action taken, verification, remaining risk, and next action.
