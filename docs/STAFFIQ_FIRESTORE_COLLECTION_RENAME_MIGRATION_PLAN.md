# StaffiQ Firestore Legacy Collection Rename — Migration Plan

**Status**: Planning only. No code, Firestore data, or `functions/index.js` was changed to produce this document.
**Scope**: The three live-production Firestore collection names left over from the pre-rebrand "DEAP" codebase — `deapApp`, `deapCourseImages`, `deapQuestionBanks` — and the `migratedFrom: 'deapApp/sharedState'` marker string.
**Governs against**: `docs/ZERO_DATA_LOSS_POLICY.md`, `docs/MULTI_TENANT_ARCHITECTURE.md`.
**Prepared**: 2026-07-25.

---

## 1. What these collections actually are today (read from `functions/index.js`)

This is the load-bearing finding of this plan: **none of the three legacy collections are written by any Cloud Function today.** They are frozen, read-mostly historical data left over from before the app became multi-tenant. Understanding this changes the shape of a safe migration.

| Legacy ref (constant name in code) | Collection / doc | Written by Cloud Functions? | Read by Cloud Functions? | Subcollections |
|---|---|---|---|---|
| `legacySharedStateRef` (line 19) | `deapApp/sharedState` (single document) | Never | Once, inside `ensureDefaultTenant()` (line 196), **only if** `tenants/tenant_staffiq_main/app/sharedState` does not yet exist | None |
| `legacyCourseImagesRef` (line 20) | `deapCourseImages` (collection) | Never | (a) `staffiqCourseImages` GET handler (line 1641), only for the default tenant while `migration.courseImagesMigratedAt` is unset on the `tenant_staffiq_main` tenant doc; (b) `finaliseLegacyAssetMigration()` (line 134), for verification counts | None |
| `legacyQuestionBanksRef` (line 21) | `deapQuestionBanks` (collection, one doc per question bank) | Never | (a) `staffiqQuestionBanks` GET handler (line 1716), same default-tenant/`migration.questionBanksMigratedAt` gate; (b) `finaliseLegacyAssetMigration()` (line 139), for verification counts | Yes — each bank doc has a `chunks` subcollection holding the actual question payloads in `chunkSize = 50` batches (mirrors the tenant-scoped shape at `tenantQuestionBanksRef(...).doc(...).collection('chunks')`) |

Key behavioural facts confirmed by reading the file end to end:

- **All new writes already go to the tenant-scoped paths** — `tenants/{tenantId}/app/sharedState`, `tenants/{tenantId}/courseImages/{imageId}`, `tenants/{tenantId}/questionBanks/{bankId}` — per `docs/MULTI_TENANT_ARCHITECTURE.md`. The `staffiqCourseImages` and `staffiqQuestionBanks` POST handlers (lines 1681 and 1802) write unconditionally to `tenantCourseImagesRef` / `tenantQuestionBanksRef`, never to the legacy collections.
- **No Cloud Functions triggers are attached to any of the three collections.** Every consumer in `functions/index.js` is `onRequest` (HTTP) or `onSchedule`; there is no `onDocumentWritten`/`onDocumentCreated`/`onDocumentDeleted` binding on `deapApp`, `deapCourseImages`, or `deapQuestionBanks`. A rename therefore cannot break a trigger registration — the only hazard is hard-coded collection-name strings inside function bodies.
- **No direct browser access exists.** `firestore.rules` denies all client reads/writes (`allow read, write: if false`), confirmed by the string check in `scripts/verify-tenant-architecture.cjs` line 42. The Admin SDK inside Cloud Functions is the only possible writer of any Firestore data in this app, and it never writes to these three collections.
- **Read-fallback is conditional and likely already dormant.** The default tenant (`tenant_staffiq_main`) only reads legacy course images/question banks while the corresponding `migration.*MigratedAt` flag is unset on its tenant document, and only reads `deapApp/sharedState` while its own scoped state document doesn't exist yet. Because this app is already live in production under the StaffiQ brand with the multi-tenant architecture built out, these fallbacks have very likely already fired once and gone dormant — but this cannot be confirmed without querying live Firestore, which is out of scope for this planning task. **The migration plan below must work correctly whether the fallback is dormant or still active**, since that state is unknown and could differ between environments.
- **A deploy-time regex gate hard-requires the old literal strings.** `scripts/verify-tenant-architecture.cjs` (run as part of `npm run deploy:safe`, per the Zero Data Loss Policy's Deployment Guard) asserts these exact patterns exist in `functions/index.js`:
  - Line 31: `/migratedFrom: 'deapApp\/sharedState'/`
  - Line 32: `/legacyCourseImagesRef = db\.collection\('deapCourseImages'\)/`
  - Line 34: `/legacyQuestionBanksRef = db\.collection\('deapQuestionBanks'\)/`

  **If the code is renamed without updating this script in the same change, `npm run deploy:safe` will throw and block every future deployment** — not just ones touching these collections. This is a hard dependency and must be treated as part of the migration, not an afterthought.
- **The continuity guard verifies via the live API, not raw Firestore.** `scripts/staffiq-continuity-guard.cjs` (`npm run continuity:snapshot` / `verify`) calls `/api/staffiq-state` and `/api/staffiq-course-images` before and after a deploy and diffs critical record counts. It will only catch a broken rename if the rename actually changes what those two endpoints return — it does not inspect collection names directly, so it is necessary but not sufficient verification (see §7).
- **Prior art already flagged this exact gap.** `README.md` (line 93) documents a prior rebrand pass that deliberately left `deapApp`, `deapCourseImages`, `deapQuestionBanks` untouched "pending a real data migration plan." This document is that plan. It does not cover the other items mentioned in that same note (`DEAP_PORTAL_URL`, `.deap-continuity`, `/api/deap-state`) — those are a separate, smaller cleanup and are out of scope here.

---

## 2. Proposed new collection names

| Old name | Proposed new name |
|---|---|
| `deapApp` (doc `sharedState`) | `staffiqLegacyApp` (doc `sharedState`) |
| `deapCourseImages` | `staffiqLegacyCourseImages` |
| `deapQuestionBanks` (+ `chunks` subcollection per bank) | `staffiqLegacyQuestionBanks` (+ `chunks` subcollection per bank, unchanged shape) |

**Why `staffiqLegacy*` rather than the flat `staffiqApp` / `staffiqCourseImages` / `staffiqQuestionBanks` suggested as a starting point:**

1. **Name collision with existing exported Cloud Functions.** `exports.staffiqCourseImages` and `exports.staffiqQuestionBanks` (lines 1621 and 1696) are already live HTTP function names. Giving a Firestore collection the identical name would make every future grep, log line, and error message ambiguous between "the function" and "the collection" — a real cost in a codebase already run by multiple concurrent agents (see `docs/agents/AGENT_COORDINATION_PROTOCOL.md`).
2. **The code already calls these "legacy" internally.** The existing constants are named `legacySharedStateRef`, `legacyCourseImagesRef`, `legacyQuestionBanksRef` — the engineering intent that this is frozen, historical, fallback-only data is already established. `staffiqLegacy*` makes that semantic visible in the Firestore console and in query logs, not just in code comments.
3. **It correctly signals "do not write here."** A name like `staffiqApp` reads as if it were the live application collection (which is actually `tenants/{tenantId}/app/sharedState`). `staffiqLegacyApp` cannot be mistaken for the live path.

If Ayodeji prefers the flatter `staffiqApp` / `staffiqCourseImages` / `staffiqQuestionBanks` naming for brevity, the plan below works identically — only the literal string substituted in Phase 2/3 changes. State that preference before Phase 2 begins.

`migratedFrom` marker: new writes of this marker (if the `deapApp/sharedState`-style bootstrap path ever fires again on a fresh environment) should read `migratedFrom: 'staffiqLegacyApp/sharedState'` once the code is switched over. **Do not rewrite the `migratedFrom` value on the tenant document that has already been created in production** — under the Zero Data Loss Policy, historical audit/metadata fields must not be retroactively edited; they are a record of what actually happened at the time, and `deapApp/sharedState` remains the historically accurate value for that one record.

---

## 3. Why this isn't a normal "hot collection" rename

Firestore has no atomic rename primitive for a collection. Because there is no live write path to these three collections (§1), the migration is not "keep two names in sync while traffic hits both" in the usual sense — it is:

1. Copy the frozen documents (and, for question banks, their `chunks` subcollections) from the old collection to a new collection, byte-for-byte, preserving document IDs.
2. Verify the copy is complete and exact.
3. Only then, switch the three module-level constants in `functions/index.js` to point at the new collection names, and deploy.
4. Keep the old collections in place, untouched, for a retention window (§8) before any deletion is even considered — and deletion requires explicit Platform Owner approval per the Zero Data Loss Policy, never an automatic step.

The "dual write" requirement below is adapted to this reality: since nothing currently writes to these collections, the safety net is a **defensive dual-write shim**, not a live sync job — but it is still required, because a future code change could add a write path before this migration ships (e.g., someone extends `finaliseLegacyAssetMigration` or a new admin tool), and the shim guarantees that even that scenario stays safe during the transition window.

---

## 4. Dual-write strategy (transition window safety net)

Even though no current code path writes to `legacySharedStateRef`, `legacyCourseImagesRef`, or `legacyQuestionBanksRef`, add a thin write wrapper for the transition window so that **if** any write ever needs to touch these paths (manual ops action, a new feature, a hotfix), it cannot silently diverge the old and new collections:

```
function writeLegacyMirror(oldRef, newRef, data, options) {
  // Writes to both the old and new collection refs in the same logical operation.
  // Used only during the transition window; removed once old refs are deleted from the codebase.
}
```

Rules for the transition window:

- **Write to both `deap*` and `staffiqLegacy*` if a write ever occurs.** Never write to the new name only.
- **Never read from the new `staffiqLegacy*` names until Phase 3 verification (§6) has passed.** All GET/read logic continues to read from `deap*` until the backfill is confirmed complete and exact.
- This wrapper is temporary scaffolding for the migration window only — it is removed once the old collection references are deleted from `functions/index.js` at the end of the retention period (§8), not left in permanently.

---

## 5. Backfill approach for existing documents

Because these are frozen collections, the backfill is a one-time, script-driven copy rather than an ongoing sync job. Recommended shape for a standalone Admin SDK script (e.g. `scripts/migrate-legacy-collections.cjs`, run manually by the Platform Owner against production — **not** part of this planning deliverable, to be written and reviewed separately before execution):

1. **`deapApp/sharedState` → `staffiqLegacyApp/sharedState`**
   - Single `get()`, single `set()` on the new path with the exact same field contents (no filtering, no re-shaping — this must be a byte-for-byte copy, not a re-run through `pickSharedStateFields`, since the goal is to preserve the frozen historical document exactly).
   - Do **not** set `migratedAt`/`migratedFrom` on this copy — those are properties of the tenant-scoped bootstrap event, not of the legacy source document itself.

2. **`deapCourseImages/*` → `staffiqLegacyCourseImages/*`**
   - Paginate through all documents (`limit(500)` + cursor, not `limit(1000)` in one shot, to keep each batch well under Firestore's 500-writes-per-batch limit).
   - Copy every field verbatim, preserving the existing document ID (`courseImageDocId(batchId)` hash) so lookups by batch ID keep working unchanged.
   - Use `db.batch()` (already used elsewhere in this file, e.g. line 1803) or a `BulkWriter` for throughput; commit in chunks.

3. **`deapQuestionBanks/*` → `staffiqLegacyQuestionBanks/*`**
   - Same pagination approach for the top-level bank documents.
   - For each bank document, additionally copy its full `chunks` subcollection (`bankRef.collection('chunks')`) to the corresponding new-path bank's `chunks` subcollection, preserving chunk document IDs (`${version}-${index}`) exactly, since `activeVersion` on the parent doc is used to filter which chunks are "live" (line 1750) — any mismatch here would silently return zero or wrong questions on read.

4. **Verification (must pass before Phase 2 in §6 begins):**
   - Reuse the pattern already proven in `finaliseLegacyAssetMigration()` (lines 132–170): compare document counts, and for question banks compare `questionCount`/`chunkCount` field-for-field between source and target, per document, not just aggregate counts.
   - Additionally do a full-document deep-equality check (not just counts) on a sample, and on 100% of documents if the collections are small enough (course images and question banks for a single legacy tenant should be — confirm actual volume against the live project before running, this plan cannot see production data).
   - Script must be idempotent and safely re-runnable (skip/overwrite already-copied docs whose content already matches, exactly the pattern the existing `finaliseLegacyAssetMigration` already follows for its own target).

---

## 6. Which Cloud Functions need updating, and in what order

This is the part that differs most from a typical multi-service rename. **`legacySharedStateRef`, `legacyCourseImagesRef`, and `legacyQuestionBanksRef` are module-level constants** (lines 19–21), resolved once when `functions/index.js` loads. They are not local to one exported function — they are shared by:

- `ensureDefaultTenant()` — called by `getTenant()`, which is called by `verifyTenantSession()`, which is called by **every** authenticated `onRequest` export in the file (directly confirmed for `staffiqState`, `staffiqCourseImages`, `staffiqQuestionBanks`, `staffiqTenants`; almost certainly all other `staffiq*` exports that accept a bearer session, given they share the same `verifyTenantSession` helper).
- `finaliseLegacyAssetMigration()` — called only from the `action === 'finalise_legacy_migration'` branch inside `staffiqTenants`.
- `staffiqCourseImages` GET handler directly.
- `staffiqQuestionBanks` GET handler directly.

Because one file, one set of shared constants, and (in Firebase Functions v2) one `firebase deploy --only functions` invocation is how this project ships backend changes, **there is no safe way to "stagger" this rename function-by-function** — doing so would create exactly the split-brain scenario the task is worried about: some Cloud Run revisions resolving the old collection name, others the new one, simultaneously, for the same shared constant. The correct order is:

1. **Before any deploy**: run and verify the backfill (§5) against production Firestore. Confirm `staffiqLegacyApp`, `staffiqLegacyCourseImages`, `staffiqLegacyQuestionBanks` are byte-for-byte complete copies of `deapApp`, `deapCourseImages`, `deapQuestionBanks`.
2. **Update `functions/index.js` in one commit**: change the three constant declarations (lines 19–21) to the new collection names, update the `migratedFrom` string used for *future* bootstrap events only (§2), and add the defensive dual-write shim (§4) if a write path is introduced.
3. **Update `scripts/verify-tenant-architecture.cjs` in the same commit** (lines 31, 32, 34) to assert the new collection-name strings instead of the old ones. This is not optional — skipping it blocks `npm run deploy:safe` entirely, for every future deploy, not just this one.
4. **Deploy the entire Functions codebase in one `firebase deploy --only functions` run** (not a filtered subset). This ensures every Cloud Run service backing every export picks up the new constant value together, minimizing — though, per standard Cloud Run traffic-draining behaviour, not perfectly eliminating — the window where an old revision might still be draining traffic on the previous code.
5. **Keep both old and new collections live and untouched throughout deploy.** Because step 1 guarantees they're identical at the moment of cutover, it does not matter if a straggler request briefly still executes the pre-deploy code and reads `deap*` — it will get the same data as a request that already reads `staffiqLegacy*`.
6. **Run `npm run continuity:snapshot` before step 4 and `verify` after** (§7), plus the manual Admin SDK comparison described there, since the continuity guard alone does not directly assert collection-name-level correctness.

Do not attempt to update `firestore.rules` for this change — it already denies all direct client access regardless of collection name (`allow read, write: if false`), confirmed by grep; no rule changes are needed or should be made.

---

## 7. Verification before and after cutover

- **Before deploy**: `npm run continuity:snapshot` (captures current `/api/staffiq-state` and `/api/staffiq-course-images` critical-record summary to `.staffiq-continuity/predeploy-state.json`).
- **Before deploy**: manual Admin SDK script comparing `staffiqLegacy*` collections against `deap*` collections doc-for-doc (§5, step 4) — this is the check that actually validates the rename, since the continuity guard works through the API layer and won't notice a collection-name typo if the API still happens to return correct data from whichever collection it's pointed at.
- **After deploy**: `npm run continuity:verify` against the same snapshot — fails the deploy narrative (per the Zero Data Loss Policy's Deployment Guard) if users, tests, sessions, reports, analytics, audit logs, or course images regress.
- **After deploy**: manually exercise `GET /api/staffiq-course-images` and `GET /api/staffiq-question-banks` for the default tenant/workspace and confirm response payloads are unchanged from a pre-deploy capture.
- **After deploy**: confirm `npm run build`, `npm run lint`, and `node scripts/verify-tenant-architecture.cjs` all still pass — the latter specifically proves the deploy-time gate was updated correctly rather than merely bypassed.

---

## 8. Rollback plan

Because no data is deleted at any point in this plan (old collections are left fully intact through the entire process), rollback is a **pure code revert**, not a data-recovery operation:

1. `git revert` the commit(s) from §6 steps 2–3 (constant names in `functions/index.js`, patterns in `scripts/verify-tenant-architecture.cjs`).
2. Redeploy Functions with `firebase deploy --only functions` from the reverted commit.
3. The application immediately resumes reading `deap*` collections, which were never modified or deleted — zero data loss, zero downtime beyond the redeploy itself.
4. If the defensive dual-write shim (§4) was in place and had actually fired any writes during the transition window, those writes already landed in both old and new collections, so nothing needs to be replayed — the old collection is already current.
5. Do not delete `staffiqLegacy*` collections as part of a rollback either — leave them in place; a failed migration attempt is exactly the kind of situation where extra copies of data are a safety asset, not clutter, and the Zero Data Loss Policy's "assume every record may become important later" principle applies directly.

No Firestore-level rollback (restoring from a backup/export) should ever be necessary under this plan, because the migration is additive (copy, then repoint reads) rather than destructive (no `delete()` calls anywhere in this plan until the very end of the retention window, and even then only with explicit Platform Owner sign-off).

---

## 9. Risk list

| Risk | Likelihood | Mitigation |
|---|---|---|
| Partial/interrupted `firebase deploy --only functions` leaves some Cloud Run revisions on old collection names and some on new, concurrently | Low–medium (deploy tooling can fail mid-way) | Deploy is atomic per the shared-constant design (§6); backfill is verified complete *before* any code deploy, so either revision reads correct, identical data during any overlap window |
| Backfill script bug drops fields, mis-copies IDs, or misses the `chunks` subcollection | Medium (subcollection copy is easy to forget) | Verification step (§5.4) explicitly checks `chunks` per bank, not just parent-doc counts; reuses the existing count-comparison pattern already proven in `finaliseLegacyAssetMigration` |
| `scripts/verify-tenant-architecture.cjs` still expects the old literal strings after rename, silently blocking all future deploys (not just this one) | High if step 6.3 is skipped | Update the script in the same commit as the constant rename; run it locally before attempting `deploy:safe` |
| Continuity guard (`staffiq-continuity-guard.cjs`) gives a false sense of safety because it checks API responses, not collection names directly | Medium | Treat it as necessary but not sufficient; pair it with the manual Admin SDK doc-for-doc comparison in §7 |
| A future code change (before this migration ships) adds a write path to the legacy collections that this plan doesn't know about | Low | Grep for `legacySharedStateRef`, `legacyCourseImagesRef`, `legacyQuestionBanksRef` immediately before Phase 2 begins to re-confirm the "no writer" assumption still holds; the dual-write shim (§4) protects against this even if it does change |
| Human error via Firebase Console — someone manually edits or deletes a `deap*` document during the transition window | Low | Restrict Firestore console delete/write access to Platform Owner per the existing Zero Data Loss Policy authority model; do not schedule the deletion decision (§8) until well past the retention window and only with explicit Platform Owner approval |
| Documentation drift — `README.md` (line 93, 111) and `docs/MULTI_TENANT_ARCHITECTURE.md` (line 74–80) describe the current `deapApp`/`deapCourseImages`/`deapQuestionBanks` names and will become stale once renamed | Low (not a data risk, but a coordination risk given multiple concurrent agents work from these docs) | Update both docs in the same PR as the code change, and log the change in `docs/agents/AGENT-COMMS.md` per `docs/agents/AGENT_COORDINATION_PROTOCOL.md` so other agents don't reference the old names going forward |
| Backfill copy operation itself adds read/write load and latency if run against production during peak hours | Low (data volume is a single legacy tenant's worth of course images/question banks, not the full multi-tenant dataset) | Run the backfill script during the same low-usage window recommended for the code deploy (§10), with batched writes and modest concurrency |

---

## 10. Timing recommendation

- **First, before scheduling anything**: have the Platform Owner check whether `migration.courseImagesMigratedAt` and `migration.questionBanksMigratedAt` are already set on the `tenant_staffiq_main` tenant document (e.g., via the existing `finalise_legacy_migration` admin action already wired into `staffiqTenants`, or a one-off read). If both are already set, the legacy read-fallback paths in `staffiqCourseImages`/`staffiqQuestionBanks` are already fully dormant, and this rename becomes a very low-risk cleanup of dead code paths — it can be scheduled with normal engineering care rather than as a high-alert deploy.
- **If either flag is still unset**, the default tenant is still actively falling back to `deapCourseImages`/`deapQuestionBanks` on every course-image/question-bank GET request. In that case, treat this as a live-read-path migration and schedule the code deploy (§6 step 4) during a **low-usage window** — given the tenant's configured region is `Africa/Lagos` (`MULTI_TENANT_ARCHITECTURE.md` region default), a late evening or weekend window in West Africa Time is recommended, to minimize the chance of a request landing exactly mid-cutover.
- **Backfill (§5) can run independently of the deploy window** — it is read/copy-only against Firestore and does not touch the live code path, so it can be run and verified days ahead of the code deploy with no user-facing risk. Decouple it from the deploy schedule.
- **Transition/retention period before considering deletion of `deap*` collections**: keep the old collections fully intact for **at least 30 days, and up to 90 days**, after the code deploy is confirmed stable (post-deploy verification in §7 passing, no rollback triggered, no anomalies in the continuity guard over that period). Given these collections are already effectively frozen and low-volume, there is no storage-cost urgency pushing toward a shorter window — err toward the 90-day end.
- **Deletion is never automatic and is out of scope for this plan.** Per the Zero Data Loss Policy's Platform Owner Authority section, only Ayodeji Falope may authorize the actual permanent removal of `deap*` collections once the retention window has passed, and that decision should be a separate, explicit, logged action — not a step folded into this migration.

---

## 11. Summary of concrete actions (for the implementing agent, later, in a separate change)

1. Confirm migration-flag state on `tenant_staffiq_main` (informs §10 urgency).
2. Write and review a standalone backfill script (§5) — separate change, separate review, run against production only after review.
3. Verify backfill 100% complete and exact (§5.4, §7).
4. In one commit: rename the three constants in `functions/index.js`, add the dual-write shim (§4), update `migratedFrom` for future bootstrap events only, update `scripts/verify-tenant-architecture.cjs` patterns.
5. Update `README.md` and `docs/MULTI_TENANT_ARCHITECTURE.md` references to the old names in the same PR.
6. `npm run continuity:snapshot` → `firebase deploy --only functions` (all functions, one shot) → `npm run continuity:verify` → manual API spot-check.
7. Log the change in `docs/agents/AGENT-COMMS.md` per the coordination protocol (left to the orchestrator per this task's constraints — this document does not write that entry).
8. Hold `deap*` collections untouched for the retention window (§10); revisit deletion only as a separate, Platform-Owner-approved action.
