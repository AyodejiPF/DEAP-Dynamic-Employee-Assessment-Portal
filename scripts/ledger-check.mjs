#!/usr/bin/env node
// RevenStrat ledger check. Run before any deploy.
// Refuses to proceed if the working tree is dirty or there is no ledger entry for today.
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const today = new Date().toISOString().slice(0, 10)
let dirty = ''
try { dirty = execSync('git status --porcelain', { encoding: 'utf8' }).trim() } catch {}
let ledger = ''
try { ledger = readFileSync(new URL('../records/LEDGER.md', import.meta.url), 'utf8') } catch {
  console.error('FAIL: records/LEDGER.md not found.'); process.exit(1)
}
const problems = []
if (dirty) problems.push('Working tree has uncommitted changes. Commit before deploy.')
if (!ledger.includes(today)) problems.push('No LEDGER.md entry dated ' + today + '. Add one before deploy.')
if (problems.length) { console.error('LEDGER CHECK FAILED:\n- ' + problems.join('\n- ')); process.exit(1) }
console.log('Ledger check passed for ' + today)
