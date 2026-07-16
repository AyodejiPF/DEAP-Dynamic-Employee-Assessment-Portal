import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const output = path.resolve(root, '..', 'output', 'playwright')
const baseUrl = process.env.STAFFIQ_PREVIEW_URL || 'http://127.0.0.1:4175'
const pages = ['index.html', 'features.html', 'training.html', 'pricing.html', 'about.html', 'contact.html']
const viewports = [
  { name: 'phone320', width: 320, height: 740 },
  { name: 'phone390', width: 390, height: 844 },
  { name: 'tablet768', width: 768, height: 1024 },
  { name: 'tablet1024', width: 1024, height: 768 },
  { name: 'laptop1366', width: 1366, height: 900 },
  { name: 'desktop1440', width: 1440, height: 1000 },
]

await mkdir(output, { recursive: true })
const browser = await chromium.launch({ headless: true })
const failures = []

for (const viewport of viewports) {
  const context = await browser.newContext({ viewport })
  const page = await context.newPage()
  const browserErrors = []
  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(message.text())
  })
  page.on('pageerror', (error) => browserErrors.push(error.message))

  for (const file of pages) {
    const response = await page.goto(`${baseUrl}/${file}`, { waitUntil: 'networkidle' })
    if (!response || !response.ok()) failures.push(`${viewport.name} ${file}: HTTP ${response?.status() || 'no response'}`)
    await page.evaluate(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += Math.max(400, window.innerHeight * 0.7)) {
        window.scrollTo(0, y)
        await new Promise((resolve) => setTimeout(resolve, 35))
      }
      window.scrollTo(0, 0)
    })
    await page.waitForTimeout(120)
    const state = await page.evaluate(() => ({
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      hiddenReveals: [...document.querySelectorAll('.reveal')].filter((item) => getComputedStyle(item).opacity === '0').length,
      title: document.title,
      headerOverflow: (() => {
        const nav = document.querySelector('.site-header .nav')
        return nav ? nav.scrollWidth > nav.clientWidth + 1 : false
      })(),
      navToggleVisible: (() => {
        const toggle = document.querySelector('.nav-toggle')
        return toggle ? getComputedStyle(toggle).display !== 'none' : false
      })(),
      desktopNavVisible: (() => {
        const links = document.querySelector('.nav-links')
        return links ? getComputedStyle(links).display !== 'none' : false
      })(),
      clientLoginVisible: (() => {
        const cta = document.querySelector('.nav-cta')
        return cta ? getComputedStyle(cta).display !== 'none' : false
      })(),
      activeNavCount: document.querySelectorAll('.nav-links a.active, .mobile-menu a.active').length,
    }))
    if (state.horizontalOverflow) failures.push(`${viewport.name} ${file}: horizontal overflow`)
    if (state.headerOverflow) failures.push(`${viewport.name} ${file}: header overflow`)
    if (state.hiddenReveals) failures.push(`${viewport.name} ${file}: ${state.hiddenReveals} reveal elements remain hidden`)
    if (!state.title.includes('StaffiQ')) failures.push(`${viewport.name} ${file}: incorrect page title`)
    if (viewport.width <= 1100 && !state.navToggleVisible) failures.push(`${viewport.name} ${file}: compact menu button is not visible`)
    if (viewport.width <= 1100 && state.desktopNavVisible) failures.push(`${viewport.name} ${file}: desktop nav is visible on compact viewport`)
    if (viewport.width > 1100 && !state.desktopNavVisible) failures.push(`${viewport.name} ${file}: desktop nav is not visible`)
    if (viewport.width > 1100 && !state.clientLoginVisible) failures.push(`${viewport.name} ${file}: client login is not visible on desktop`)
    if (file !== 'training.html' && state.activeNavCount < 1) failures.push(`${viewport.name} ${file}: active navigation state is missing`)
    await page.screenshot({ path: path.join(output, `staffiq-${file.replace('.html', '')}-${viewport.name}.png`), fullPage: true })
  }

  if (viewport.name === 'desktop1440') {
    await page.goto(`${baseUrl}/index.html`, { waitUntil: 'networkidle' })
    const firstSectors = await page.locator('.sector-group:not([aria-hidden="true"]) .t-item').evaluateAll((items) => items.slice(0, 3).map((item) => item.textContent.trim()))
    if (firstSectors.join('|') !== 'Real Estate|Retail|Construction') failures.push(`sector order is incorrect: ${firstSectors.join(', ')}`)
    const ticker = page.locator('.sector-track')
    const startBox = await ticker.boundingBox()
    await page.waitForTimeout(700)
    const endBox = await ticker.boundingBox()
    if (!startBox || !endBox || endBox.x <= startBox.x) failures.push('sector ticker is not moving from left to right')
  }

  if (viewport.width <= 1100) {
    await page.goto(`${baseUrl}/index.html`, { waitUntil: 'networkidle' })
    await page.locator('.nav-toggle').click()
    if ((await page.locator('.nav-toggle').getAttribute('aria-expanded')) !== 'true') failures.push('mobile menu did not open')
    await page.keyboard.press('Escape')
    if ((await page.locator('.nav-toggle').getAttribute('aria-expanded')) !== 'false') failures.push('mobile menu did not close with Escape')
  }

  if (browserErrors.length) failures.push(`${viewport.name}: browser errors: ${browserErrors.join(' | ')}`)
  await context.close()
}

await browser.close()

if (failures.length) {
  console.error(failures.join('\n'))
  process.exit(1)
}

console.log(`StaffiQ browser verification passed for ${pages.length} pages at phone, tablet, laptop, and desktop viewports.`)
