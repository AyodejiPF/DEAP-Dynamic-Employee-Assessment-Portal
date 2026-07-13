const targetUrl = (process.env.TARGET_URL || 'https://training-assessment-1c8ef.web.app').replace(/\/+$/, '')
const statusFilter = process.argv.includes('--all') ? 'all' : 'Approved for Investigation'
const jsonOutput = process.argv.includes('--json')
const monitorCadenceHours = 24
const monitorCadenceLabel = 'Daily / every 24 hours'
process.env.DEAP_PROBLEM_MONITOR_INTERVAL_HOURS = String(monitorCadenceHours)
const superAdminHeaders = {
  'X-DEAP-User-Id': process.env.DEAP_MONITOR_USER_ID || 'U001',
  'X-DEAP-User-Email': process.env.DEAP_MONITOR_USER_EMAIL || 'admin@iicocece.com',
  'X-DEAP-User-Role': process.env.DEAP_MONITOR_USER_ROLE || 'super_admin',
  'X-DEAP-Owner': process.env.DEAP_MONITOR_OWNER || 'ayodeji_falope',
}

function severityRank(report) {
  return { critical: 0, high: 1, medium: 2, low: 3 }[report.severity] ?? 4
}

function compact(value, maxLength = 260) {
  const text = String(value || '').replace(/\s+/g, ' ').trim()
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength - 1)}...`
}

function formatReport(report, index) {
  return [
    `${index + 1}. [${String(report.severity || 'medium').toUpperCase()}] ${report.title}`,
    `   ID: ${report.id}`,
    `   Reporter: ${report.reporterName || 'Unknown'} (${report.reporterRole || 'unknown'})`,
    `   Type: ${report.reportMode || 'bug'} | Category: ${report.category || 'Uncategorised'} | Points: ${report.pointsAwarded || 0}`,
    `   Status: ${report.status || 'New'} | View: ${report.view || 'unknown'} | Sync: ${report.syncState || 'unknown'}`,
    `   Created: ${report.createdAt || 'unknown'}`,
    report.activeTestId ? `   Active test: ${report.activeTestId}` : '',
    report.activeSessionId ? `   Active session: ${report.activeSessionId}` : '',
    report.url ? `   URL: ${report.url}` : '',
    `   Description: ${compact(report.description, 700)}`,
    report.expectedBehaviour ? `   Expected: ${compact(report.expectedBehaviour, 500)}` : '',
    report.actualBehaviour ? `   Actual: ${compact(report.actualBehaviour, 500)}` : '',
    report.reproductionSteps ? `   Steps: ${compact(report.reproductionSteps, 700)}` : '',
    report.repairPrompt ? `   Codex prompt: ${compact(report.repairPrompt, 900)}` : '',
  ]
    .filter(Boolean)
    .join('\n')
}

async function main() {
  const endpoint = `${targetUrl}/api/deap-problem-reports?status=${encodeURIComponent(statusFilter)}`
  const response = await fetch(endpoint, { cache: 'no-store', headers: superAdminHeaders })
  if (!response.ok) {
    throw new Error(`Problem report endpoint failed with HTTP ${response.status}: ${await response.text()}`)
  }
  const payload = await response.json()
  const reports = Array.isArray(payload.reports) ? payload.reports : []
  reports.sort((left, right) => severityRank(left) - severityRank(right) || Date.parse(right.createdAt || 0) - Date.parse(left.createdAt || 0))

  if (jsonOutput) {
    process.stdout.write(JSON.stringify({ targetUrl, endpoint, ...payload, reports }, null, 2))
    return
  }

  console.log(`DEAP Codex problem monitor`)
  console.log(`Cadence: ${monitorCadenceLabel}`)
  console.log(`Target: ${targetUrl}`)
  console.log(`Endpoint: ${endpoint}`)
  console.log(`Generated: ${payload.generatedAt || new Date().toISOString()}`)
  console.log(`Reports approved for Codex investigation: ${reports.length}`)
  console.log(`Returned reports: ${reports.length}`)
  console.log('')

  if (!reports.length) {
    console.log('No Super Admin-approved bug reports are currently waiting for Codex investigation.')
    return
  }

  console.log('Approved bug reports:')
  console.log(reports.map(formatReport).join('\n\n'))
  console.log('')
  console.log('Codex triage protocol:')
  console.log('1. Confirm the report has Super Admin approval before any investigation or repair.')
  console.log('2. Reproduce the highest severity approved report first using Browser or Playwright.')
  console.log('3. Inspect the smallest relevant code path and preserve all user data, tests, content, reports, and analytics.')
  console.log('4. Implement only a safe, scoped fix. Never hard delete or reset production records.')
  console.log('5. Run npm run build, npm run lint, node scripts/smoke.cjs, and the continuity guard before any deploy.')
  console.log('6. If repair or deployment approval is missing, return diagnosis/report only and leave production unchanged.')
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
