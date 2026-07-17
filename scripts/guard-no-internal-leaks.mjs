#!/usr/bin/env node
// Predeploy guard: refuse to ship internal documents.
// Usage: node scripts/guard-no-internal-leaks.mjs <deployDir> [<deployDir2> ...]
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'
const dirs = process.argv.slice(2)
if (!dirs.length) { console.error('Provide the deploy directory to scan.'); process.exit(2) }
const MARKERS = [/Internal\s*\/\s*Confidential/i, /Implementation Plan/i, /IICOCECE-PRD/i, /Prepared by:/i, /Result A[\s\S]{0,40}Result B/i, /Classification:/i]
const problems = []
function walk(d){ for (const e of readdirSync(d)){ const p=join(d,e); const s=statSync(p); if(s.isDirectory()){ if(e==='node_modules'||e.startsWith('.')) continue; walk(p) } else {
  if (extname(p).toLowerCase()==='.md') { const t=readFileSync(p,'utf8'); if(!/not for publication/i.test(t)) problems.push('Markdown in deploy artifact: '+p) }
  if (/\.(html?|txt|json)$/i.test(p)) { const t=readFileSync(p,'utf8'); for(const m of MARKERS){ if(m.test(t)){ problems.push('Internal marker '+m+' in '+p); break } } }
} } }
for (const d of dirs) { try { walk(d) } catch(e){ console.error('Cannot scan',d,e.message); process.exit(2) } }
if (problems.length){ console.error('INTERNAL LEAK GUARD FAILED. Do not deploy:\n- '+problems.join('\n- ')); process.exit(1) }
console.log('Internal leak guard passed. No internal documents in the deploy artifact.')
