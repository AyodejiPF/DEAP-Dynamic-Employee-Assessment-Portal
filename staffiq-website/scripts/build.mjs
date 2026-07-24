import { access, cp, mkdir, readdir, rm } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const output = path.join(root, 'dist')
const appDist = path.resolve(root, '..', 'dist')
const publicFiles = [
  // core pages
  'index.html', 'features.html', 'training.html', 'pricing.html', 'about.html', 'contact.html', '404.html',
  // legal / trust
  'privacy.html', 'terms.html', 'cookies.html',
  // resource hub and solutions directory
  'resources.html', 'solutions.html',
  // role landing pages
  'for-business-owners.html', 'for-hr-managers.html', 'for-operations-managers.html',
  'for-learning-teams.html', 'for-consultants.html', 'for-multi-branch.html',
  // industry landing pages
  'industries-real-estate.html', 'industries-retail.html', 'industries-construction.html',
  'industries-manufacturing.html', 'industries-healthcare.html', 'industries-education.html',
  'industries-hospitality.html', 'industries-financial-services.html', 'industries-professional-services.html',
  'industries-logistics.html', 'industries-food-and-beverage.html', 'industries-technology.html',
  // static files
  'robots.txt', 'sitemap.xml', '740b16c2978d44049d88e149a712ef29.txt',
]

await rm(output, { recursive: true, force: true })
await mkdir(output, { recursive: true })
await Promise.all(publicFiles.map((file) => cp(path.join(root, file), path.join(output, file))))
await cp(path.join(root, 'assets'), path.join(output, 'assets'), { recursive: true })
await Promise.all([
  'staffiq-mark-source-v2.png',
  'staffiq-mark-v2.png',
  'favicon.svg',
  'logo.svg',
  'logo-light.svg',
  'og-image.svg',
].map((file) => rm(path.join(output, 'assets', 'img', file), { force: true })))

try {
  await access(path.join(appDist, 'index.html'))
} catch {
  throw new Error('Build the StaffiQ app first with npm run build before building the public website.')
}

await mkdir(path.join(output, 'login'), { recursive: true })
await cp(path.join(appDist, 'index.html'), path.join(output, 'login', 'index.html'))

for (const entry of await readdir(appDist, { withFileTypes: true })) {
  if (entry.name === 'index.html') continue
  await cp(path.join(appDist, entry.name), path.join(output, entry.name), {
    recursive: true,
    force: true,
  })
}

const built = await readdir(output)
console.log(`StaffiQ website build complete: ${built.length} public entries.`)
