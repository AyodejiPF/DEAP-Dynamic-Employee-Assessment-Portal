---
name: firebase-cloud-operations
description: Firebase and cloud operations for creating projects, deploying Hosting, checking custom domains, DNS, paid plan status, project deletion, live verification, rollback awareness, and cost control. Use when Ayodeji asks to deploy online, redeploy, fix Firebase, check DNS, list paid Firebase projects, demote billing, delete cloud projects, or verify a live URL.
---

# Firebase Cloud Operations

Use this skill for Firebase Hosting and related Google Cloud work.

## Workflow

1. Identify the local project and Firebase project id.
2. Confirm the active account before changing cloud resources.
3. Check whether the action affects hosting only or wider cloud resources.
4. For deploys, build first, then deploy, then verify live URLs.
5. For DNS, compare Firebase instructions, public DNS, registrar records, and duplicate records.
6. For billing, list projects and plan status before suggesting changes.
7. For deletion, confirm exact project id and verify post deletion state.

## Verification

For hosting, check the live URL returns success and the expected page title or content.

For DNS, check root records, www records, TXT verification, CNAME conflicts, A records, and nameserver delegation.

For deletion, verify the cloud project state or hosting failure after shutdown.

## Output Format

Report account, project id, action, checks run, live URL, console URL, result, and remaining propagation or billing risk.
