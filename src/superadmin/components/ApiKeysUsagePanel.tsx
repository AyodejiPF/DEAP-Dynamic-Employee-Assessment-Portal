/**
 * ApiKeysUsagePanel — Platform Owner / Tenant Admin only.
 *
 * Reads and writes against the staffiqApiKey* Cloud Functions added in
 * functions/src/apiKeys/. Self-contained inline styles, same reasoning as
 * VersionTrackerPanel.tsx and FeatureParityPanel.tsx: this panel should not
 * depend on either app's CSS framework, so it stays independently reviewable
 * and safe to add without risking existing styles.
 *
 * Deliberately not wired into SuperAdminPanel's props from App.tsx yet, same
 * pattern as VersionTrackerPanel before it: this renders out of the box once
 * mounted, no App.tsx integration required first.
 */

import { useCallback, useEffect, useState, type CSSProperties, type FormEvent } from 'react'

interface ApiKeyRecord {
  keyId: string
  label: string
  keyPrefix: string
  status: 'active' | 'revoked'
  createdAt: string
  createdBy: string
  revokedAt?: string
  revokedBy?: string
  revokedReason?: string
  lastUsedAt?: string
}

interface ApiKeyUsageRow {
  keyId: string
  requestCount: number
  errorCount: number
  byEndpoint: Record<string, number>
}

const FUNCTIONS_BASE = 'https://us-central1-iicocece-assessment.cloudfunctions.net'

const styles: Record<string, CSSProperties> = {
  wrap: { fontFamily: 'system-ui, -apple-system, sans-serif', color: '#1e293b', maxWidth: 960 },
  row: { display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 16 },
  field: { display: 'flex', flexDirection: 'column', gap: 4 },
  label: { fontSize: 12, fontWeight: 700, color: '#475569' },
  input: {
    border: '1px solid #cbd5e1',
    borderRadius: 8,
    padding: '8px 10px',
    fontSize: 14,
    minWidth: 220,
  },
  button: {
    border: 'none',
    borderRadius: 8,
    background: '#1e40af',
    color: '#fff',
    fontWeight: 700,
    fontSize: 14,
    padding: '9px 16px',
    cursor: 'pointer',
  },
  buttonDanger: {
    border: '1px solid #fecaca',
    borderRadius: 8,
    background: '#fef2f2',
    color: '#991b1b',
    fontWeight: 700,
    fontSize: 13,
    padding: '6px 12px',
    cursor: 'pointer',
  },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
  th: { textAlign: 'left', borderBottom: '2px solid #e2e8f0', padding: '8px 10px', color: '#475569', fontSize: 12, textTransform: 'uppercase' },
  td: { borderBottom: '1px solid #f1f5f9', padding: '8px 10px', verticalAlign: 'top' },
  banner: {
    border: '1px solid #bfdbfe',
    background: '#eff6ff',
    color: '#1e3a8a',
    borderRadius: 8,
    padding: '10px 14px',
    fontSize: 13,
    marginBottom: 16,
  },
  rawKeyBox: {
    border: '1px dashed #f59e0b',
    background: '#fffbeb',
    borderRadius: 8,
    padding: '10px 14px',
    fontFamily: 'monospace',
    fontSize: 13,
    marginBottom: 16,
    wordBreak: 'break-all',
  },
  error: { color: '#991b1b', fontSize: 13, marginBottom: 12 },
}

function statusPillStyle(bg: string, fg: string): CSSProperties {
  return {
    display: 'inline-block',
    borderRadius: 999,
    padding: '2px 10px',
    fontSize: 12,
    fontWeight: 700,
    background: bg,
    color: fg,
  }
}

function statusPill(status: 'active' | 'revoked') {
  return status === 'active'
    ? <span style={statusPillStyle('#ecfdf5', '#065f46')}>Active</span>
    : <span style={statusPillStyle('#f8fafc', '#64748b')}>Revoked</span>
}

export function ApiKeysUsagePanel() {
  const [tenantId, setTenantId] = useState('')
  const [platformOwnerUserId, setPlatformOwnerUserId] = useState('U001')
  const [keys, setKeys] = useState<ApiKeyRecord[]>([])
  const [usage, setUsage] = useState<ApiKeyUsageRow[]>([])
  const [newLabel, setNewLabel] = useState('')
  const [rawKey, setRawKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const headers = useCallback(
    () => ({
      'Content-Type': 'application/json',
      'X-Staffiq-User-Id': platformOwnerUserId,
      'X-Staffiq-User-Role': 'Admin',
    }),
    [platformOwnerUserId]
  )

  const load = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    setError(null)
    try {
      const [keysRes, usageRes] = await Promise.all([
        fetch(`${FUNCTIONS_BASE}/staffiqApiKeyList?tenantId=${encodeURIComponent(tenantId)}`, { headers: headers() }),
        fetch(`${FUNCTIONS_BASE}/staffiqApiKeyUsageReport?tenantId=${encodeURIComponent(tenantId)}`, { headers: headers() }),
      ])
      if (!keysRes.ok) throw new Error(`Could not load keys (${keysRes.status}).`)
      if (!usageRes.ok) throw new Error(`Could not load usage (${usageRes.status}).`)
      const keysJson = await keysRes.json()
      const usageJson = await usageRes.json()
      setKeys(keysJson.keys ?? [])
      setUsage(usageJson.usage ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load API keys.')
    } finally {
      setLoading(false)
    }
  }, [tenantId, headers])

  useEffect(() => {
    if (tenantId) void load()
  }, [tenantId, load])

  async function handleIssue(e: FormEvent) {
    e.preventDefault()
    if (!tenantId || !newLabel.trim()) return
    setError(null)
    try {
      const res = await fetch(`${FUNCTIONS_BASE}/staffiqApiKeyIssue`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ tenantId, label: newLabel.trim() }),
      })
      if (!res.ok) throw new Error(`Could not issue key (${res.status}).`)
      const json = await res.json()
      setRawKey(json.rawKey)
      setNewLabel('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to issue API key.')
    }
  }

  async function handleRevoke(keyId: string) {
    const reason = window.prompt('Reason for revoking this key (required):')
    if (!reason || !reason.trim()) return
    setError(null)
    try {
      const res = await fetch(`${FUNCTIONS_BASE}/staffiqApiKeyRevoke`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ tenantId, keyId, reason: reason.trim() }),
      })
      if (!res.ok) throw new Error(`Could not revoke key (${res.status}).`)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke API key.')
    }
  }

  const usageByKey = new Map(usage.map((row) => [row.keyId, row]))

  return (
    <div style={styles.wrap}>
      <div style={styles.banner}>
        Every client can hold more than one API key. Usage below is this calendar month only. A
        new key's raw value is shown once, directly below the form, then never again.
      </div>

      <div style={styles.row}>
        <div style={styles.field}>
          <span style={styles.label}>Tenant ID</span>
          <input
            style={styles.input}
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
            placeholder="e.g. pachamama"
          />
        </div>
        <div style={styles.field}>
          <span style={styles.label}>Acting as (user ID)</span>
          <input
            style={styles.input}
            value={platformOwnerUserId}
            onChange={(e) => setPlatformOwnerUserId(e.target.value)}
          />
        </div>
        <button style={styles.button} onClick={() => void load()} disabled={!tenantId || loading}>
          {loading ? 'Loading…' : 'Load keys'}
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {rawKey && (
        <div style={styles.rawKeyBox}>
          New key, copy it now, it will not be shown again:
          <br />
          {rawKey}
        </div>
      )}

      <form onSubmit={handleIssue} style={styles.row}>
        <div style={styles.field}>
          <span style={styles.label}>New key label</span>
          <input
            style={styles.input}
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="e.g. Production"
          />
        </div>
        <button style={styles.button} type="submit" disabled={!tenantId || !newLabel.trim()}>
          Issue key
        </button>
      </form>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Label</th>
            <th style={styles.th}>Prefix</th>
            <th style={styles.th}>Status</th>
            <th style={styles.th}>This month</th>
            <th style={styles.th}>Errors</th>
            <th style={styles.th}>Last used</th>
            <th style={styles.th} />
          </tr>
        </thead>
        <tbody>
          {keys.length === 0 && (
            <tr>
              <td style={styles.td} colSpan={7}>
                {tenantId ? 'No keys yet for this tenant.' : 'Enter a tenant ID above to load its keys.'}
              </td>
            </tr>
          )}
          {keys.map((key) => {
            const rowUsage = usageByKey.get(key.keyId)
            return (
              <tr key={key.keyId}>
                <td style={styles.td}>{key.label}</td>
                <td style={styles.td}>{key.keyPrefix}…</td>
                <td style={styles.td}>{statusPill(key.status)}</td>
                <td style={styles.td}>{rowUsage?.requestCount ?? 0}</td>
                <td style={styles.td}>{rowUsage?.errorCount ?? 0}</td>
                <td style={styles.td}>{key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleString('en-GB') : 'Never'}</td>
                <td style={styles.td}>
                  {key.status === 'active' && (
                    <button style={styles.buttonDanger} onClick={() => void handleRevoke(key.keyId)}>
                      Revoke
                    </button>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
