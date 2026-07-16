const { chromium } = require('playwright')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

const targetUrl = process.env.TARGET_URL || 'https://training-assessment-1c8ef.web.app'

function writeFixtureFiles() {
  const fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), 'staffiq-smoke-'))
  const usersPath = path.join(fixtureDir, 'real-employees.csv')
  const questionsPath = path.join(fixtureDir, 'real-question-bank.csv')
  const courseImagePath = path.join(fixtureDir, 'course-placeholder.png')

  fs.writeFileSync(
    usersPath,
    [
      'Employee ID,Full Name,Email,Department,Role Title,Staffiq Role,Password,Manager Email,Status',
      'EMP-100,Ada Realdata,ada.realdata@iicocece.local,Compliance,Compliance Analyst,employee,Pass123!,admin@iicocece.com,Active',
      'EMP-101,Bola Evidence,bola.evidence@iicocece.local,Sales,Sales Associate,employee,Pass124!,admin@iicocece.com,Active',
      'EMP-102,Inactive Person,inactive.person@iicocece.local,Sales,Former Staff,employee,Pass125!,admin@iicocece.com,Inactive',
    ].join('\n'),
  )

  fs.writeFileSync(
    questionsPath,
    [
      'question_id,question_text,difficulty,option_a,option_b,option_c,option_d,option_e,correct_answer,partial_answer_1,partial_answer_2,correct_weight,partial_weight_1,partial_weight_2,topic_tag,explanation',
      'RQ-001,What should a manager verify before approving a compliance evidence pack?,Medium,Completion status only,Assignment proof pass mark remediation certificate and audit actions,Only the certificate,Only the due date,Only the score,B,A,,1,0.5,,Compliance Evidence,Complete evidence combines proof completion pass marks remediation certificates and audit actions.',
      'RQ-002,Which control helps leadership trust a report after later data changes?,Easy,Changing the spreadsheet name,Report snapshot freezing,Deleting all audit logs,Removing filter summaries,Disabling exports,B,,,1,,,Report Governance,Snapshot freezing preserves what was reported at a selected timestamp.',
      'RQ-003,What improves analytics accuracy when importing real assessment data?,Hard,Using named employees and topic tagged question banks,Keeping demo users in reports,Removing all topics,Ignoring test filters,Exporting before review,A,B,,1,0.4,,Data Quality,Real employee records and topic tagged banks make training groups and analytics meaningful.',
    ].join('\n'),
  )

  fs.writeFileSync(
    courseImagePath,
    Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAAAVElEQVR4nO3PQQ3AIADAQMC/5yFjRxMFfXpn2pmd9wT4JgNsgA2wATbABtgAG2ADbIANsAE2wAbYABtgA2yADbABNsAG2AAbYANsgA2wATbABtgAG+ADP1kCGEhW30sAAAAASUVORK5CYII=',
      'base64',
    ),
  )

  return { fixtureDir, usersPath, questionsPath, courseImagePath }
}

async function main() {
  const { fixtureDir, usersPath, questionsPath, courseImagePath } = writeFixtureFiles()
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } })
  const failures = []

  await page.route('**/api/staffiq-state', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, smokeOnly: true }) })
      return
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        state: {
          tests: [],
          sessions: [],
          auditEvents: [],
          analyticsEvents: [],
          problemReports: [],
          bugAuditLogs: [],
          contributionPoints: [],
          trashRecords: [],
          questionBankTrainingSources: [],
          questionBankMetadata: {},
          courseDeployments: {},
          deletedQuestionBankIds: [],
          updatedAt: new Date(0).toISOString(),
        },
        smokeOnly: true,
      }),
    })
  })
  await page.route('**/api/staffiq-course-images', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, smokeOnly: true }) })
      return
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ images: {} }) })
  })
  await page.route('**/api/staffiq-question-banks**', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, smokeOnly: true }) })
      return
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ banks: [] }) })
  })
  await page.route('https://firestore.googleapis.com/**', async (route) => {
    if (['POST', 'PATCH'].includes(route.request().method())) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
      return
    }
    await route.fallback()
  })

  await page.goto(targetUrl, { waitUntil: 'networkidle' })
  await page.evaluate(() => localStorage.clear())
  await page.reload({ waitUntil: 'networkidle' })

  await page.getByRole('button', { name: /Switch to dark theme/ }).first().click()
  const theme = await page.evaluate(() => document.documentElement.dataset.theme)
  if (theme !== 'dark') failures.push('Theme toggle did not switch the app to dark mode.')

  await page.getByLabel('Username').fill('Ayodeji Falope')
  await page.getByLabel('Password').fill('GODhelpUS')
  await page.getByRole('button', { name: 'Log in' }).click()
  await page.waitForSelector('text=Dashboard', { timeout: 15000 })
  await page.getByRole('button', { name: /Notifications/ }).click()
  await page.waitForSelector('text=Everyone activity ledger', { timeout: 15000 })
  await page.waitForSelector('text=Platform Owner only', { timeout: 15000 })

  const bootState = await page.evaluate(() => {
    const users = JSON.parse(localStorage.getItem('staffiq-users') || '[]')
    const questions = JSON.parse(localStorage.getItem('staffiq-questions') || '[]')
    const tests = JSON.parse(localStorage.getItem('staffiq-tests') || '[]')
    return {
      users,
      activeEmployees: users.filter((user) => user.role === 'employee').length,
      questionCount: questions.length,
      testCount: tests.length,
    }
  })
  if (bootState.questionCount !== 0) failures.push(`Expected no bundled/demo questions on clean boot, found ${bootState.questionCount}.`)
  if (bootState.testCount !== 0) failures.push(`Expected no bundled/demo tests on clean boot, found ${bootState.testCount}.`)

  await page.getByRole('button', { name: /Training/ }).click()
  await page.waitForSelector('text=Training Workspace', { timeout: 15000 })
  await page.waitForSelector('text=Content Studio', { timeout: 15000 })
  const blankTrainingText = await page.locator('body').innerText()
  if (/Topic groups|Staffiq V2\.0 blueprint active|xAPI style tracking taxonomy/i.test(blankTrainingText)) {
    failures.push('Training tab is not blank on a clean boot.')
  }

  await page.getByRole('button', { name: /Manage Users/ }).click()
  await page.waitForSelector('text=Training&assessment user access and credentials', { timeout: 15000 })
  await page.locator('label.upload-button:has-text("Import users") input[type=file]').setInputFiles(usersPath)
  await page.waitForSelector('text=2 user(s) imported successfully', { timeout: 15000 })
  await page.getByPlaceholder(/Search users/).fill('Ada Realdata')
  await page.waitForSelector('text=Ada Realdata', { timeout: 15000 })

  await page.getByRole('button', { name: /Question Bank/ }).click()
  await page.waitForSelector('text=Uploaded document overview', { timeout: 15000 })
  await page.locator('label.upload-button:has-text("Import XLSX/CSV") input[type=file]').setInputFiles(questionsPath)
  await page.waitForFunction(() => /3 question\(s\) imported/i.test(document.body.innerText), undefined, { timeout: 15000 })
  await page.waitForSelector('text=Compliance Evidence', { timeout: 15000 })

  await page.getByRole('button', { name: /Training/ }).click()
  await page.waitForSelector('text=Content Studio', { timeout: 15000 })
  await page.waitForSelector('text=real-question-bank', { timeout: 15000 })
  const trainingAfterImport = await page.locator('body').innerText()
  if (/real-question-bank\.csv/i.test(trainingAfterImport)) failures.push('Training course title still includes a file extension.')
  const importedCourseCard = page.locator('.course-placeholder-card', { hasText: 'real-question-bank' }).first()
  await importedCourseCard.locator('label.secondary-button:has-text("Image") input[type=file]').setInputFiles(courseImagePath)
  await page.waitForSelector('text=Course image uploaded', { timeout: 15000 })
  await page.waitForFunction(() => {
    const image = document.querySelector('.course-placeholder-card img')
    return image?.getAttribute('src')?.startsWith('data:image/')
  })
  const courseImageState = await page.evaluate(() => {
    const registry = JSON.parse(localStorage.getItem('staffiq-course-image-registry') || '{}')
    return Object.values(registry).some((item) => item && String(item.courseImageUrl || '').startsWith('data:image/'))
  })
  if (!courseImageState) failures.push('Uploaded course placeholder image was not saved to the course image registry.')
  await importedCourseCard.getByRole('button', { name: /Edit/ }).click()
  await importedCourseCard.getByLabel('Course name').fill('Compliance Evidence Course')
  await importedCourseCard.getByLabel('Description').fill('Full-name smoke test course description.')
  await importedCourseCard.getByRole('button', { name: /^Save$/ }).click()
  await page.waitForSelector('text=Training course saved', { timeout: 15000 })
  await page.waitForSelector('text=Compliance Evidence Course', { timeout: 15000 })
  const renamedCourseCard = page.locator('.course-placeholder-card', { hasText: 'Compliance Evidence Course' }).first()
  await renamedCourseCard.getByRole('button', { name: /Deploy/ }).click()
  await renamedCourseCard.getByLabel('Search employees').fill('Ada Realdata')
  const adaDeploymentRow = renamedCourseCard.locator('.deployment-user-row', { hasText: 'Ada Realdata' }).first()
  await adaDeploymentRow.locator('.deployment-toggle').click()
  await page.waitForSelector('text=deployed to 1 user', { timeout: 15000 })
  const deploymentState = await page.evaluate(() => {
    const deployments = JSON.parse(localStorage.getItem('staffiq-course-deployments') || '{}')
    return Object.values(deployments).some((records) => records && Object.values(records).some((record) => record && record.userId && record.enabled))
  })
  if (!deploymentState) failures.push('Course deployment toggle did not save an enabled user-level deployment record.')
  await renamedCourseCard.locator('.course-placeholder-open').click()
  await page.waitForSelector('text=Course content workspace', { timeout: 15000 })
  const courseWorkspaceText = await page.locator('.course-content-workspace').innerText()
  if (/Topic\s+\d+|under this topic|topic shells|topic cards/i.test(courseWorkspaceText)) failures.push('Course workspace still shows topic shells instead of stacked content modules.')
  await page.getByRole('button', { name: /Deploy random flashcards/ }).click()
  await page.waitForSelector('text=Notebook-style study deck', { timeout: 15000 })
  const flashcardText = await page.locator('.flashcard-study-stage').innerText()
  if (!/EASY|NOT SO EASY|HARD/i.test(flashcardText)) failures.push('Flashcard deck did not show the difficulty label on the card.')
  if (/\b\d+\s*\/\s*\d+\b/.test(flashcardText)) failures.push('Flashcard deck exposes the card/question number counter.')
  await page.locator('.flashcard-flip-card').click()
  await page.waitForSelector('text=Answer behind the card', { timeout: 15000 })
  const flippedFlashcardText = await page.locator('.flashcard-study-stage').innerText()
  if (/\b[A-E]\.\s/.test(flippedFlashcardText)) failures.push('Flashcard answer exposes the original answer option alphabet.')
  await page.getByRole('button', { name: /Back to Training Workspace/ }).click()
  const trainingText = await page.locator('body').innerText()
  if (/Support Assistant/i.test(trainingText)) failures.push('Old Support Assistant naming is still visible in the Training surface.')
  if (/Trainings grouped by question-bank topic|xAPI style tracking taxonomy|Staffiq V2\.0 blueprint active/i.test(trainingText)) {
    failures.push('Old training placeholder catalogue is still visible after the blank workspace update.')
  }

  await page.getByRole('button', { name: 'Sign out' }).click()
  await page.getByLabel('Username').fill('Ada Realdata')
  await page.getByLabel('Password').fill('Pass123!')
  await page.getByRole('button', { name: 'Log in' }).click()
  await page.waitForSelector('text=Dashboard', { timeout: 15000 }).catch(() => {})
  const employeeNotificationsCount = await page.getByRole('button', { name: /Notifications/ }).count()
  if (employeeNotificationsCount) failures.push('Employee navigation can see the Platform Owner notifications tab.')
  await page.getByRole('button', { name: /Training/ }).click()
  await page.waitForSelector('text=Compliance Evidence Course', { timeout: 15000 })
  await page.getByRole('button', { name: 'Sign out' }).click()
  await page.getByLabel('Username').fill('Bola Evidence')
  await page.getByLabel('Password').fill('Pass124!')
  await page.getByRole('button', { name: 'Log in' }).click()
  await page.waitForSelector('text=Dashboard', { timeout: 15000 }).catch(() => {})
  await page.getByRole('button', { name: /Training/ }).click()
  await page.waitForSelector('text=Training Workspace', { timeout: 15000 })
  const bolaTrainingText = await page.locator('body').innerText()
  if (/Compliance Evidence Course/i.test(bolaTrainingText)) failures.push('Undeployed employee can still see a training course.')
  await page.getByRole('button', { name: 'Sign out' }).click()
  await page.getByLabel('Username').fill('Ayodeji Falope')
  await page.getByLabel('Password').fill('GODhelpUS')
  await page.getByRole('button', { name: 'Log in' }).click()
  await page.waitForSelector('text=Dashboard', { timeout: 15000 })

  const realState = await page.evaluate(() => {
    const users = JSON.parse(localStorage.getItem('staffiq-users') || '[]')
    const questions = JSON.parse(localStorage.getItem('staffiq-questions') || '[]')
    const metadata = JSON.parse(localStorage.getItem('staffiq-question-bank-metadata') || '{}')
    return {
      activeEmployees: users.filter((user) => user.role === 'employee').length,
      hasImportedEmployee: users.some((user) => user.fullName === 'Ada Realdata'),
      hasInactiveImported: users.some((user) => user.fullName === 'Inactive Person'),
      importedQuestions: questions.filter((question) => question.questionId.startsWith('RQ-')).length,
      hasEditedCourseTitle: Object.values(metadata).some((item) => item && item.courseTitle === 'Compliance Evidence Course'),
    }
  })
  if (realState.activeEmployees !== bootState.activeEmployees + 2) failures.push(`Expected imported active employees to increase by 2, found ${realState.activeEmployees - bootState.activeEmployees}.`)
  if (!realState.hasImportedEmployee) failures.push('Imported employee was not saved to local storage.')
  if (realState.hasInactiveImported) failures.push('Inactive employee row should have been skipped.')
  if (realState.importedQuestions !== 3) failures.push(`Expected 3 imported real questions, found ${realState.importedQuestions}.`)
  if (!realState.hasEditedCourseTitle) failures.push('Edited training course title was not saved to question-bank metadata.')

  await page.getByRole('button', { name: /^Reports$/ }).click()
  await page.waitForSelector('text=Employee reports', { timeout: 15000 })
  const reportSelect = page.locator('.employee-report-panel select').first()
  const reportOptionText = (await reportSelect.locator('option').allTextContents()).join('\n')
  const defaultReportValue = await reportSelect.inputValue()
  if (defaultReportValue !== 'all-employees') failures.push('Reports dropdown does not default to All employees.')
  if (!/^All employees$/m.test(reportOptionText)) failures.push('Reports dropdown is missing the All employees option.')
  if (!/Ayodeji Falope \(Platform Owner\)/.test(reportOptionText)) failures.push('Reports dropdown is missing Admin.')
  if (!/Ada Realdata \(Employee\)/.test(reportOptionText) || !/Bola Evidence \(Employee\)/.test(reportOptionText)) failures.push('Reports dropdown is missing imported employee names.')
  await page.locator('.employee-report-card h3', { hasText: 'Ayodeji Falope' }).waitFor({ timeout: 15000 })
  await page.locator('.employee-report-card h3', { hasText: 'Ada Realdata' }).waitFor({ timeout: 15000 })
  await page.locator('.employee-report-card h3', { hasText: 'Bola Evidence' }).waitFor({ timeout: 15000 })
  const adaReportValue = await reportSelect.locator('option', { hasText: 'Ada Realdata' }).getAttribute('value')
  if (adaReportValue) await reportSelect.selectOption(adaReportValue)
  await page.locator('.employee-report-card h3', { hasText: 'Ada Realdata' }).waitFor({ timeout: 15000 })
  const reportPanelText = await page.locator('.employee-report-panel').first().innerText()
  if (/No employee selected/i.test(reportPanelText)) failures.push('Individual reports still show no employee selected after choosing a user.')
  if (!/assigned|attempts|Latest test report rows/i.test(reportPanelText)) failures.push('Individual report data did not render after choosing a user.')

  await browser.close()
  fs.rmSync(fixtureDir, { recursive: true, force: true })
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
