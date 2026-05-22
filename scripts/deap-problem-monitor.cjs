const targetUrl = (process.env.TARGET_URL || 'https://iicocece-assessment.web.app').replace(/\/+$/, '')
const statusFilter = process.argv.includes('--all') ? 'all' : 'open'
const jsonOutput = process.argv.includes('--json')

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
    `   Status: ${report.status || 'open'} | View: ${report.view || 'unknown'} | Sync: ${report.syncState || 'unknown'}`,
    `   Created: ${report.createdAt || 'unknown'}`,
    report.activeTestId ? `   Active test: ${report.activeTestId}` : '',
    report.activeSessionId ? `   Active session: ${report.activeSessionId}` : '',
    report.url ? `   URL: ${report.url}` : '',
    `   Description: ${compact(report.description, 700)}`,
  ]
    .filter(Boolean)
    .join('\n')
}

async function main() {
  const endpoint = `${targetUrl}/api/deap-problem-reports?status=${encodeURIComponent(statusFilter)}`
  const response = await fetch(endpoint, { cache: 'no-store' })
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
  console.log(`Target: ${targetUrl}`)
  console.log(`Endpoint: ${endpoint}`)
  console.log(`Generated: ${payload.generatedAt || new Date().toISOString()}`)
  console.log(`Open problem reports: ${payload.openCount ?? reports.filter((report) => report.status !== 'resolved').length}`)
  console.log(`Returned reports: ${reports.length}`)
  console.log('')

  if (!reports.length) {
    console.log('No unresolved problem reports are currently waiting for Codex review.')
    return
  }

  console.log('Unresolved problem reports:')
  console.log(reports.map(formatReport).join('\n\n'))
  console.log('')
  console.log('Codex triage protocol:')
  console.log('1. Reproduce the highest severity report first using Browser or Playwright.')
  console.log('2. Inspect the smallest relevant code path and preserve all user data, tests, content, reports, and analytics.')
  console.log('3. Implement only a safe, scoped fix. Never hard delete or reset production records.')
  console.log('4. Run npm run build, npm run lint, node scripts/smoke.cjs, and the continuity guard before any deploy.')
  console.log('5. If the report cannot be safely fixed automatically, return a recommendation and leave production unchanged.')
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
