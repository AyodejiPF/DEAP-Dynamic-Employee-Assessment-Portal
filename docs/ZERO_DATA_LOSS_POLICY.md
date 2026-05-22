# DEAP Zero Data Loss Policy

## Non Negotiable Principle

All user data must be preserved across every app update, feature change, refactor, migration, redesign, deployment, rebuild, backend change, frontend change, infrastructure change, API rewrite, and synchronisation cycle.

No user data may be accidentally lost, overwritten, corrupted, reset, unlinked, hard deleted, or made unrecoverable.

Data integrity comes first. Recoverability comes second. Feature delivery comes third. UI convenience comes last.

## Protected User Data

The following data is protected:

- User accounts, names, emails, user IDs, roles, passwords or authentication metadata.
- Permissions, settings, preferences, branding, layout configuration, and user specific UI state.
- Uploaded files, images, videos, audio, PDFs, documents, spreadsheets, certificates, infographics, and course assets.
- Course content, training content, learning progress, test attempts, test statuses, scores, reports, analytics, and audit logs.
- Notifications, comments, chats, AI conversations, AI generated outputs, drafts, tags, metadata, and record relationships.
- Deleted records, archived records, hidden records, legacy records, experimental modules, session state, cached user state, and feature specific data.
- Any database record created by or about a user.

Assume every user generated or user related record may become important later, even when it appears unused.

## No Hard Delete Rule

The app must not automatically hard delete user data.

If a feature is removed, redesigned, deprecated, hidden, or replaced, its existing user data must remain recoverable. Affected records must move to protected Trash or Archive storage while preserving:

- Original IDs.
- Ownership.
- Timestamps.
- Metadata.
- File paths.
- Relationships.
- Previous location or context.
- Restore capability.
- Audit history.

If a Trash or Archive workflow does not exist for the affected data type, one must be designed before destructive behavior is implemented.

## Super Admin Authority

Deep recovery and permanent deletion controls are reserved for Ayodeji Falope, Super Admin.

Only Ayodeji Falope, Super Admin, may have:

- Full Trash visibility.
- Full restore authority.
- Full backup access.
- Full audit log access.
- Full archival visibility.
- Full migration approval authority.
- Full permanent purge authority.
- Full disaster recovery authority.

Normal administrators, employees, moderators, managers, and standard users must not receive permanent deletion authority.

## Deployment Guard

Every production deployment must use continuity verification. The safe deployment workflow is:

```bash
npm run deploy:safe
```

The continuity guard must snapshot production state before deployment, deploy the app, then verify protected state afterward.

Protected checks must include:

- Users.
- Permissions.
- Roles.
- Sessions.
- Progress.
- Tests.
- Scores.
- Reports.
- Analytics.
- Audit logs.
- Uploaded assets.
- Trash.
- Archived records.
- Settings.
- Feature specific records.

If the guard detects missing data, status drift, file loss, analytics regression, broken relationships, or unexpected user record changes, the deployment is not successful.

## Migration Rules

All migrations must preserve:

- Primary IDs.
- Foreign keys and relationships.
- Ownership.
- Timestamps.
- Metadata.
- Statuses.
- Historical records.
- Deleted and archived records.
- User progress.
- Audit history.

Never drop production tables, collections, columns, fields, or documents without first migrating their data into protected Archive or Trash storage.

Migrations must be backward compatible, incremental, rollback capable, snapshot protected, and verified before and after deployment.

## Sync And Cache Safety

Synchronisation logic must never overwrite newer data with stale data.

The system must:

- Compare timestamps.
- Prefer newer writes.
- Merge records where possible.
- Preserve unknown fields.
- Avoid destructive replacement.
- Avoid clearing arrays or objects unless explicitly intended.
- Protect local unsynced user work.
- Retry failed sync safely.
- Log sync conflicts.
- Expose recovery options.

Offline state, failed requests, stale browser cache, or partial API responses must never cause data deletion.

## Backup Requirements

Every app update must preserve backup and restore capability for:

- Database state.
- File metadata.
- Configuration.
- Permissions.
- Relationships.
- Audit logs.
- Trash and archived records.
- Local user state where applicable.

Backups must be recoverable and testable. A backup that has never been verified is not reliable.

## Stop Condition

If a requested change may delete, reset, overwrite, corrupt, unlink, hide unrecoverably, or orphan user data:

1. Stop immediately.
2. Do not implement the destructive change.
3. Explain the risk.
4. Preserve the data.
5. Create a Trash or Archive path.
6. Suggest a safe implementation approach.
7. Proceed only after the data is protected.

## Completion Report Requirement

After any work that touches data, report:

- What user data was touched.
- What user data was protected.
- Whether any data was migrated.
- Whether any data was moved to Trash or Archive.
- What safeguards were added.
- What tests or verification checks passed.
- Whether any residual risk remains.
