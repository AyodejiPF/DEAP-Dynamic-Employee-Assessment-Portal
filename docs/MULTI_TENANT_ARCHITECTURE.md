# StaffiQ Multi Tenant Architecture

## Purpose

StaffiQ uses one Firebase project with tenant scoped Firestore paths. Each client workspace has its own users, permissions, assessments, sessions, reports, question banks, training assets, dashboard layouts, branding and token metadata.

## Authoritative paths

```text
tenants/{tenantId}
tenants/{tenantId}/members/{userId}
tenants/{tenantId}/app/sharedState
tenants/{tenantId}/courseImages/{imageId}
tenants/{tenantId}/questionBanks/{bankId}
tenants/{tenantId}/questionBanks/{bankId}/chunks/{chunkId}
tenantAuditLogs/{auditId}
```

Direct browser access to Firestore is denied by `firestore.rules`. Cloud Functions use the Admin SDK and enforce tenant identity, membership, role and access status before reading or writing tenant data.

## Session model

1. A user enters a workspace code, username and password.
2. `staffiqAuth` resolves the tenant by ID, slug or portal code.
3. The function validates the user against that tenant only.
4. A signed session containing the user ID and tenant ID is issued for twelve hours.
5. The browser stores the signed token in session storage and sends it with every protected request.
6. The server rejects requests where the tenant header and signed tenant claim differ.
7. The server rechecks the user and workspace status for every protected request.

The browser cannot grant itself access by changing a workspace code or request header.

## Access status

| Status | Ordinary member access | Platform Owner access |
| --- | --- | --- |
| Active | Allowed | Allowed |
| Trialling | Allowed | Allowed |
| Grace | Allowed with restricted status | Allowed |
| Past due | Allowed with restricted status | Allowed |
| Draft | Blocked | Allowed |
| Suspended | Blocked | Allowed |
| Cancelled | Blocked | Allowed |
| Archived | Blocked | Allowed |

## Role controls

| Role | Scope |
| --- | --- |
| Platform Owner | May create, inspect, switch and govern every workspace |
| Tenant Admin | May manage authorised records inside the current workspace |
| Employee | Receives only assigned assessments and personal records |

Employee state writes are merged server side. An employee cannot overwrite the tenant user directory, other users' sessions, admin audit logs, token records or another employee's records.

## Permanent user record policy

StaffiQ does not hard delete user records. A user can be active, disabled, suspended or marked as having left. Every status change records the previous state, new state, reason, actor and time. Role changes and password resets are also audited.

The Platform Owner can search users across all workspaces, add a user, change status, change role and issue a replacement password. The Platform Owner record cannot be disabled, suspended, reassigned or deleted. Unsupported delete, remove and purge requests are rejected by the backend.

Disabled, suspended and departed users cannot sign in, but their assessment history, reports, contribution records and audit references remain intact.

## Local cache isolation

Tenant data is stored with keys in this format:

```text
staffiq-tenant:{tenantId}:{dataKey}
```

Appearance settings remain global. Operational data does not. Switching a workspace creates a new signed session and reloads the application against the target tenant cache.

## Legacy data migration

The first protected tenant request creates `tenant_staffiq_main` if required. If its scoped state does not yet exist, the function copies the old `deapApp/sharedState` document to `tenants/tenant_staffiq_main/app/sharedState`.

The same migration copies `deapCourseImages` and `deapQuestionBanks`, including question bank chunks, into the default tenant paths. Completion counts and timestamps are recorded on the tenant document so retries are safe and idempotent.

The original document is not deleted or modified. It remains a rollback source until an authorised retention decision is made.

## Deployment safety

Before deployment:

1. Run `npm run build`.
2. Run `npm run lint`.
3. Run `node scripts/verify-tenant-architecture.cjs`.
4. Run the continuity snapshot.
5. Deploy Functions, Firestore rules and Hosting together.
6. Sign in to the default workspace and create a temporary empty workspace.
7. Confirm that the temporary workspace cannot see default workspace users, assessments or reports.
8. Confirm that a suspended workspace blocks ordinary users.
9. Confirm that the Platform Owner can still inspect a suspended workspace.

## Rollback

Application source can be rolled back through version control and Firebase Hosting release history. The original legacy state is preserved. Tenant documents are additive and must not be hard deleted during rollback.
