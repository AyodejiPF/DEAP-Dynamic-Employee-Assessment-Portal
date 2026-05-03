const { chromium } = require('playwright')

const targetUrl = process.env.TARGET_URL || 'https://iicocece-assessment.web.app'

async function main() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } })
  const failures = []

  await page.goto(targetUrl, { waitUntil: 'networkidle' })
  await page.evaluate(() => localStorage.clear())
  await page.reload({ waitUntil: 'networkidle' })

  await page.getByRole('button', { name: /Switch to dark theme/ }).click()
  const theme = await page.evaluate(() => document.documentElement.dataset.theme)
  if (theme !== 'dark') failures.push('Theme toggle did not switch the app to dark mode.')

  await page.getByLabel('Username').fill('Ayodeji Falope')
  await page.getByLabel('Password').fill('GODhelpUS')
  await page.getByRole('button', { name: 'Log in' }).click()
  await page.waitForSelector('text=Dashboard', { timeout: 15000 })
  if (!(await page.locator('.sidebar .brand-logo-frame img').isVisible())) failures.push('Admin logo is not visible.')

  await page.getByRole('button', { name: /Reports/ }).click()
  await page.waitForSelector('text=Recent activity trail', { timeout: 15000 })
  await page.getByRole('button', { name: /Permissions/ }).click()
  await page.waitForSelector('text=Control web app access by user', { timeout: 15000 })
  await page.getByPlaceholder(/Search users/).fill('Nimi')
  await page.waitForSelector('text=Nimi', { timeout: 15000 })

  await page.getByRole('button', { name: 'Sign out' }).click()
  await page.getByLabel('Username').fill('Nimi Ajala')
  await page.getByLabel('Password').fill('Ni9Q2j')
  await page.getByRole('button', { name: 'Log in' }).click()
  await page.waitForSelector('text=My Tests', { timeout: 15000 })
  await page.waitForFunction(() => {
    const raw = localStorage.getItem('deap-questions')
    if (!raw) return false
    try {
      return JSON.parse(raw).length > 1000
    } catch {
      return false
    }
  }, null, { timeout: 25000 })

  const preStartKeys = await page.evaluate(() => Object.keys(localStorage).filter((key) => key.startsWith('deap-session-questions')))
  if (preStartKeys.length) failures.push(`Questions were selected before agreement: ${preStartKeys.join(', ')}`)

  await page.getByRole('button', { name: 'Start Test' }).first().click()
  await page.waitForSelector('text=Before you begin', { timeout: 15000 })
  const bodyText = await page.locator('body').innerText()
  for (const expected of ['Google Meet', 'screen shared', 'camera/video', 'randomly selected only after', 'Autosave heartbeat']) {
    if (!bodyText.includes(expected)) failures.push(`Pre-test modal missing: ${expected}`)
  }
  if (!(await page.getByRole('button', { name: 'Start the test' }).isDisabled())) failures.push('Start button should stay disabled until the agreement is checked.')
  await page.getByLabel(/I understand/).check()
  await page.getByRole('button', { name: 'Start the test' }).click()
  await page.waitForSelector('text=Assessment item', { timeout: 15000 })
  const deliveryText = await page.locator('body').innerText()
  if (/Question\s+\d+\s+of\s+\d+/i.test(deliveryText)) failures.push('Delivery screen exposes the current question number or total question count.')
  const displayedQuestion = await page.locator('.question-stage h1').innerText()
  if (/^\s*(?:\[[^\]]+\]|\d+[\).:-]|\b(?:easy|medium|hard|standard|weighted|scenario)\b\s*[:\-])/i.test(displayedQuestion)) {
    failures.push(`Displayed question still exposes a source prefix: ${displayedQuestion}`)
  }

  const sessionHealth = await page.evaluate(() => {
    const sessions = JSON.parse(localStorage.getItem('deap-sessions') || '[]')
    const active = sessions.find((session) => session.userId === 'u009' && session.status === 'in_progress')
    return {
      questionCount: active?.questionIds?.length ?? 0,
      optionOrderCount: active?.optionOrderByQuestion ? Object.keys(active.optionOrderByQuestion).length : 0,
    }
  })
  if (sessionHealth.questionCount !== 60) failures.push(`Expected 60 selected question IDs, found ${sessionHealth.questionCount}.`)
  if (sessionHealth.optionOrderCount !== 60) failures.push(`Expected randomized option order for 60 questions, found ${sessionHealth.optionOrderCount}.`)

  await browser.close()
  if (failures.length) {
    console.error(failures.join('\n'))
    process.exit(1)
  }
  console.log(`Smoke passed for ${targetUrl}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
