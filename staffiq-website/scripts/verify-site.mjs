import { access, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const pages = ['index.html', 'features.html', 'training.html', 'pricing.html', 'about.html', 'contact.html', '404.html']
const failures = []
const forbidden = [
  /\+234 000 000 0000/i,
  /illustrative placeholder/i,
  /indicative launch pricing/i,
  /start free trial/i,
  /14 day free trial/i,
  /no card required/i,
  /super[ -]?admin/i,
  /super administrator/i,
  /\btests?\b/i,
  /Staffiq/,
  /href=["']#["']/,
]

for (const page of pages) {
  const source = await readFile(path.join(root, page), 'utf8')
  if (!source.includes('StaffiQ')) failures.push(`${page}: exact StaffiQ brand spelling is missing`)
  if (!source.includes('assets/css/styles.css')) failures.push(`${page}: shared stylesheet is missing`)
  if (!source.includes('assets/js/main.js')) failures.push(`${page}: shared interaction script is missing`)
  if (page !== '404.html' && !source.includes('https://staffiq.ng/login')) failures.push(`${page}: application sign in destination is missing`)
  if (page !== '404.html' && !source.includes('assets/img/og-image.png')) failures.push(`${page}: production social image is missing`)
  for (const rule of forbidden) {
    if (rule.test(source)) failures.push(`${page}: forbidden placeholder or wording matched ${rule}`)
  }

  const references = [...source.matchAll(/(?:href|src)=["']([^"']+)["']/g)].map((match) => match[1])
  for (const reference of references) {
    if (/^(?:https?:|mailto:|tel:|#)/.test(reference)) continue
    const clean = reference.split('#')[0].split('?')[0]
    if (!clean) continue
    try {
      await access(path.join(root, clean))
    } catch {
      failures.push(`${page}: missing local reference ${reference}`)
    }
  }
}

const hostingConfig = await readFile(path.join(root, 'firebase.json'), 'utf8')
if (/super[ -]?admin|super administrator/i.test(hostingConfig)) {
  failures.push('firebase.json: privileged internal role wording must not appear on the public hosting surface')
}

if (failures.length) {
  console.error(failures.join('\n'))
  process.exit(1)
}

console.log(`StaffiQ website verification passed for ${pages.length} pages.`)
