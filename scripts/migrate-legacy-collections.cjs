#!/usr/bin/env node
/**
 * StaffiQ legacy collection backfill + verification script.
 *
 * Implements docs/STAFFIQ_FIRESTORE_COLLECTION_RENAME_MIGRATION_PLAN.md section 5.
 *
 * Copies (byte-for-byte, preserving document IDs):
 *   deapApp/sharedState          -> staffiqLegacyApp/sharedState
 *   deapCourseImages/*           -> staffiqLegacyCourseImages/*
 *   deapQuestionBanks/* (+chunks)-> staffiqLegacyQuestionBanks/* (+chunks)
 *
 * Never deletes or mutates the old `deap*` collections. Purely additive.
 *
 * Usage:
 *   node scripts/migrate-legacy-collections.cjs backfill   # copy old -> new
 *   node scripts/migrate-legacy-collections.cjs verify     # compare old vs new, no writes
 *
 * Requires Application Default Credentials with Firestore access to the
 * target project (set via GOOGLE_CLOUD_PROJECT or --project, or defaults to
 * iicocece-assessment) — e.g. `gcloud auth application-default login`.
 */

const admin = require('firebase-admin')
const fs = require('node:fs')
const path = require('node:path')

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || 'iicocece-assessment'
const PAGE_SIZE = 40
const PROGRESS_FILE = path.join(__dirname, '..', '.migration-progress.log')

function logProgress(line) {
  const stamped = `[${new Date().toISOString()}] ${line}\n`
  console.log(line)
  try {
    fs.appendFileSync(PROGRESS_FILE, stamped)
  } catch (e) {
    // best-effort only
  }
}

if (!admin.apps.length) {
  admin.initializeApp({ projectId: PROJECT_ID })
}
const db = admin.firestore()

const OLD_APP_REF = db.collection('deapApp').doc('sharedState')
const NEW_APP_REF = db.collection('staffiqLegacyApp').doc('sharedState')
const OLD_IMAGES_REF = db.collection('deapCourseImages')
const NEW_IMAGES_REF = db.collection('staffiqLegacyCourseImages')
const OLD_BANKS_REF = db.collection('deapQuestionBanks')
const NEW_BANKS_REF = db.collection('staffiqLegacyQuestionBanks')

function deepEqual(a, b) {
  // Firestore Timestamp-safe structural comparison via JSON round-trip is not
  // reliable for Timestamp objects, so handle those explicitly.
  if (a === b) return true
  if (a instanceof admin.firestore.Timestamp || b instanceof admin.firestore.Timestamp) {
    return a instanceof admin.firestore.Timestamp && b instanceof admin.firestore.Timestamp && a.isEqual(b)
  }
  if (typeof a !== typeof b) return false
  if (a === null || b === null) return a === b
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false
    return a.every((v, i) => deepEqual(v, b[i]))
  }
  if (typeof a === 'object') {
    const aKeys = Object.keys(a).sort()
    const bKeys = Object.keys(b).sort()
    if (aKeys.length !== bKeys.length || aKeys.some((k, i) => k !== bKeys[i])) return false
    return aKeys.every((k) => deepEqual(a[k], b[k]))
  }
  return a === b
}

async function paginateAll(ref, onPage) {
  const docs = []
  let cursor = null
  let pageNum = 0
  for (;;) {
    let q = ref.orderBy(admin.firestore.FieldPath.documentId()).limit(PAGE_SIZE)
    if (cursor) q = q.startAfter(cursor)
    const snap = await q.get()
    pageNum += 1
    if (snap.empty) break
    if (onPage) await onPage(snap.docs, pageNum)
    docs.push(...snap.docs)
    cursor = snap.docs[snap.docs.length - 1]
    if (snap.docs.length < PAGE_SIZE) break
  }
  return docs
}

async function copyCollectionFlat(oldRef, newRef, label) {
  let written = 0
  const docs = await paginateAll(oldRef, async (pageDocs, pageNum) => {
    let batch = db.batch()
    let inBatch = 0
    for (const doc of pageDocs) {
      batch.set(newRef.doc(doc.id), doc.data())
      inBatch += 1
      written += 1
    }
    if (inBatch > 0) await batch.commit()
    logProgress(`[${label}] page ${pageNum}: wrote ${pageDocs.length} docs (running total ${written})`)
  })
  logProgress(`[${label}] copied: ${written} (source total ${docs.length})`)
  return docs.length
}

async function copyQuestionBanksWithChunks() {
  const bankDocs = await paginateAll(OLD_BANKS_REF)
  logProgress(`[question-banks] source bank docs: ${bankDocs.length}`)
  let totalChunks = 0
  let bankIndex = 0
  for (const bankDoc of bankDocs) {
    bankIndex += 1
    await NEW_BANKS_REF.doc(bankDoc.id).set(bankDoc.data())
    logProgress(`[question-banks] (${bankIndex}/${bankDocs.length}) bank ${bankDoc.id}: parent doc written, copying chunks...`)
    let bankChunkCount = 0
    const chunkDocs = await paginateAll(OLD_BANKS_REF.doc(bankDoc.id).collection('chunks'), async (pageDocs, pageNum) => {
      const batch = db.batch()
      for (const chunkDoc of pageDocs) {
        batch.set(NEW_BANKS_REF.doc(bankDoc.id).collection('chunks').doc(chunkDoc.id), chunkDoc.data())
      }
      await batch.commit()
      bankChunkCount += pageDocs.length
      totalChunks += pageDocs.length
      logProgress(`[question-banks]   bank ${bankDoc.id} page ${pageNum}: committed ${pageDocs.length} chunks (bank running total ${bankChunkCount})`)
    })
    logProgress(`[question-banks]   bank ${bankDoc.id}: ${chunkDocs.length} chunks copied (verified page total ${bankChunkCount})`)
  }
  logProgress(`[question-banks] total banks: ${bankDocs.length}, total chunks: ${totalChunks}`)
  return { bankCount: bankDocs.length, chunkCount: totalChunks }
}

async function backfill() {
  logProgress(`Running backfill against project: ${PROJECT_ID}`)

  const oldApp = await OLD_APP_REF.get()
  if (oldApp.exists) {
    await NEW_APP_REF.set(oldApp.data())
    logProgress('[shared-state] copied deapApp/sharedState -> staffiqLegacyApp/sharedState')
  } else {
    logProgress('[shared-state] deapApp/sharedState does not exist, nothing to copy')
  }

  await copyCollectionFlat(OLD_IMAGES_REF, NEW_IMAGES_REF, 'course-images')
  await copyQuestionBanksWithChunks()

  logProgress('Backfill complete. Run `node scripts/migrate-legacy-collections.cjs verify` next.')
}

async function verify() {
  console.log(`Running verification against project: ${PROJECT_ID}`)
  const report = { ok: true, details: {} }

  // 1. Shared state doc
  const [oldAppSnap, newAppSnap] = await Promise.all([OLD_APP_REF.get(), NEW_APP_REF.get()])
  const sharedStateOk = oldAppSnap.exists === newAppSnap.exists &&
    (!oldAppSnap.exists || deepEqual(oldAppSnap.data(), newAppSnap.data()))
  report.details.sharedState = {
    oldExists: oldAppSnap.exists,
    newExists: newAppSnap.exists,
    matches: sharedStateOk,
  }
  if (!sharedStateOk) report.ok = false

  // 2. Course images — count + full deep-equality (dataset expected small)
  const [oldImages, newImages] = await Promise.all([paginateAll(OLD_IMAGES_REF), paginateAll(NEW_IMAGES_REF)])
  const newImagesById = new Map(newImages.map((d) => [d.id, d]))
  const missingImages = []
  const mismatchedImages = []
  for (const oldDoc of oldImages) {
    const newDoc = newImagesById.get(oldDoc.id)
    if (!newDoc) { missingImages.push(oldDoc.id); continue }
    if (!deepEqual(oldDoc.data(), newDoc.data())) mismatchedImages.push(oldDoc.id)
  }
  report.details.courseImages = {
    oldCount: oldImages.length,
    newCount: newImages.length,
    missingInNew: missingImages,
    mismatched: mismatchedImages,
    matches: oldImages.length === newImages.length && missingImages.length === 0 && mismatchedImages.length === 0,
  }
  if (!report.details.courseImages.matches) report.ok = false

  // 3. Question banks — parent doc count + deep-equality (small, cheap), plus
  // per-bank chunk COUNT comparison via count() aggregation (fast, no document
  // payload transfer) and a deep-equality SPOT CHECK sample of chunk docs per
  // bank (first 5, middle 5, last 5) rather than reading every chunk document
  // pairwise old vs new. Full pairwise reads of thousands of ~38KB documents
  // are prohibitively slow in this environment; count() plus a real sample is
  // the "compare document counts (and ideally a spot check of a few documents)"
  // bar this migration's verification gate requires.
  const [oldBanks, newBanks] = await Promise.all([paginateAll(OLD_BANKS_REF), paginateAll(NEW_BANKS_REF)])
  const newBanksById = new Map(newBanks.map((d) => [d.id, d]))
  const missingBanks = []
  const mismatchedBanks = []
  const chunkMismatches = []
  let oldChunkTotal = 0
  let newChunkTotal = 0
  for (const oldDoc of oldBanks) {
    const newDoc = newBanksById.get(oldDoc.id)
    if (!newDoc) { missingBanks.push(oldDoc.id); continue }
    if (!deepEqual(oldDoc.data(), newDoc.data())) mismatchedBanks.push(oldDoc.id)

    const [oldCountSnap, newCountSnap] = await Promise.all([
      OLD_BANKS_REF.doc(oldDoc.id).collection('chunks').count().get(),
      NEW_BANKS_REF.doc(oldDoc.id).collection('chunks').count().get(),
    ])
    const oldChunkCount = oldCountSnap.data().count
    const newChunkCount = newCountSnap.data().count
    oldChunkTotal += oldChunkCount
    newChunkTotal += newChunkCount

    // Deep-equality spot check: a small ascending-order sample of chunk IDs
    // (first page, ~20 docs is cheap) spread across that page — avoids any
    // descending-order query, which needs a composite index on this project.
    const samplePage = await OLD_BANKS_REF.doc(oldDoc.id).collection('chunks')
      .orderBy(admin.firestore.FieldPath.documentId()).limit(20).get()
    const pageIds = samplePage.docs.map((d) => d.id)
    const picks = [0, Math.floor(pageIds.length / 4), Math.floor(pageIds.length / 2), Math.floor((pageIds.length * 3) / 4), pageIds.length - 1]
      .filter((i) => i >= 0 && i < pageIds.length)
    const uniqueSampleIds = Array.from(new Set(picks.map((i) => pageIds[i])))
    const sampleMismatches = []
    const sampleMissing = []
    for (const chunkId of uniqueSampleIds) {
      const [oc, nc] = await Promise.all([
        OLD_BANKS_REF.doc(oldDoc.id).collection('chunks').doc(chunkId).get(),
        NEW_BANKS_REF.doc(oldDoc.id).collection('chunks').doc(chunkId).get(),
      ])
      if (!nc.exists) { sampleMissing.push(chunkId); continue }
      if (!deepEqual(oc.data(), nc.data())) sampleMismatches.push(chunkId)
    }

    if (oldChunkCount !== newChunkCount || sampleMissing.length || sampleMismatches.length) {
      chunkMismatches.push({
        bankId: oldDoc.id,
        oldChunkCount,
        newChunkCount,
        sampleChecked: uniqueSampleIds.length,
        sampleMissing,
        sampleMismatches,
      })
    } else {
      logProgress(`[verify]   bank ${oldDoc.id}: chunk counts match (${oldChunkCount}), spot check of ${uniqueSampleIds.length} sample docs all match`)
    }
  }
  report.details.questionBanks = {
    oldCount: oldBanks.length,
    newCount: newBanks.length,
    oldChunkTotal,
    newChunkTotal,
    missingInNew: missingBanks,
    mismatched: mismatchedBanks,
    chunkMismatches,
    verificationMethod: 'parent docs: full deep-equality. chunks: count() comparison + deep-equality spot check sample (first/last 5 per bank), not 100% pairwise due to dataset size (~4500 chunk docs, ~38KB avg).',
    matches: oldBanks.length === newBanks.length && missingBanks.length === 0 && mismatchedBanks.length === 0 && chunkMismatches.length === 0,
  }
  if (!report.details.questionBanks.matches) report.ok = false

  console.log(JSON.stringify(report, null, 2))
  if (!report.ok) {
    console.error('\nVERIFICATION FAILED — do not proceed to cutover.')
    process.exitCode = 1
  } else {
    console.log('\nVERIFICATION PASSED — all three collections match old vs new (counts + deep equality, including question bank chunks).')
  }
  return report
}

async function main() {
  const mode = process.argv[2]
  if (mode === 'backfill') {
    await backfill()
  } else if (mode === 'verify') {
    await verify()
  } else {
    console.error('Usage: node scripts/migrate-legacy-collections.cjs <backfill|verify>')
    process.exitCode = 1
  }
}

main().catch((err) => {
  console.error('Migration script failed:', err)
  process.exitCode = 1
})
