/**
 * ClientAiKeysPanel — Platform Owner / Tenant Admin only.
 *
 * Distinct from ApiKeysUsagePanel.tsx (that tab issues OUR keys so clients
 * can call OUR API). This tab stores each CLIENT's own DeepSeek API key, so
 * their AI usage bills against their own DeepSeek account rather than
 * Ayodeji's. Until a client's own key is saved here, their AI calls quietly
 * fall back to the platform default DeepSeek key on the V4 Pro tier. Saving
 * a client specific key here always switches that client onto the V4 Flash
 * tier automatically, no separate model picker needed.
 *
 * Self-contained inline styles, same convention as VersionTrackerPanel.tsx
 * and ApiKeysUsagePanel.tsx.
 */

import { useCallback, useEffect, useState, type CSSProperties, type FormEvent } from 'react'

interface ClientAiKey {
  tenantId: string
  clientLabel: string
  model: 'deepseek-chat' | 'deepseek-flash'
  keyPreview: string
  updatedAt: string
  updatedBy: string
}

const FUNCTIONS_BASE = 'https://us-central1-iicocece-assessment.cloudfunctions.net'

const styles: Record<string, CSSProperties> = {
  wrap: { fontFamily: 'system-ui, -apple-system, sans-serif', color: '#1e293b', maxWidth: 960 },
  banner: {
    border: '1px solid #bfdbfe',
    background: '#eff6ff',
    color: '#1e3a8a',
    borderRadius: 8,
    padding: '10px 14px',
    fontSize: 13,
    marginBottom: 16,
  },
  row: { display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 16 },
  field: { display: 'flex', flexDirection: 'column', gap: 4 },
  label: { fontSize: 12, fontWeight: 700, color: '#475569' },
  input: { border: '1px solid #cbd5e1', borderRadius: 8, padding: '8px 10px', fontSize: 14, minWidth: 220 },
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
  td: { borderBottom: '1px solid #f1f5f9', padding: '8px 10px' },
  error: { color: '#991b1b', fontSize: 13, marginBottom: 12 },
}

function modelPill(model: 'deepseek-chat' | 'deepseek-flash') {
  const isPro = model === 'deepseek-chat'
  return (
    <span
      style={{
        display: 'inline-block',
        borderRadius: 999,
        padding: '2px 10px',
        fontSize: 12,
        fontWeight: 700,
        background: isPro ? '#fffbeb' : '#ecfdf5',
        color: isPro ? '#92400e' : '#065f46',
      }}
    >
      {isPro ? 'V4 Pro (shared)' : 'V4 Flash (own key)'}
    </span>
  )
}

export function ClientAiKeysPanel() {
  const [platformOwnerUserId, setPlatformOwnerUserId] = useState('U001')
  const [keys, setKeys] = useState<ClientAiKey[]>([])
  const [tenantId, setTenantId] = useState('')
  const [clientLabel, setClientLabel] = useState('')
  const [apiKey, setApiKey] = useState('')
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
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${FUNCTIONS_BASE}/staffiqAiProviderKeyList`, { headers: headers() })
      if (!res.ok) throw new Error(`Could not load client AI keys (${res.status}).`)
      const json = await res.json()
      setKeys(json.keys ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load client AI keys.')
    } finally {
      setLoading(false)
    }
  }, [headers])

  useEffect(() => {
    void load()
  }, [load])

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    if (!tenantId.trim() || !clientLabel.trim() || !apiKey.trim()) return
    setError(null)
    try {
      const res = await fetch(`${FUNCTIONS_BASE}/staffiqAiProviderKeySave`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ tenantId: tenantId.trim(), clientLabel: clientLabel.trim(), apiKey: apiKey.trim() }),
      })
      if (!res.ok) throw new Error(`Could not save this client's key (${res.status}).`)
      setTenantId('')
      setClientLabel('')
      setApiKey('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save the client AI key.')
    }
  }

  async function handleRemove(id: string) {
    if (!window.confirm('Remove this client\'s own key? They will fall back to the shared platform key on V4 Pro.')) return
    setError(null)
    try {
      const res = await fetch(`${FUNCTIONS_BASE}/staffiqAiProviderKeyDelete`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ tenantId: id }),
      })
      if (!res.ok) throw new Error(`Could not remove this key (${res.status}).`)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove the client AI key.')
    }
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.banner}>
        Every client here has their own DeepSeek API key and automatically runs on V4 Flash.
        Any client with no row below is still sharing your own DeepSeek key on V4 Pro.
      </div>

      <div style={styles.row}>
        <div style={styles.field}>
          <span style={styles.label}>Acting as (user ID)</span>
          <input style={styles.input} value={platformOwnerUserId} onChange={(e) => setPlatformOwnerUserId(e.target.value)} />
        </div>
        <button style={styles.button} onClick={() => void load()} disabled={loading}>
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <form onSubmit={handleSave} style={styles.row}>
        <div style={styles.field}>
          <span style={styles.label}>Tenant ID</span>
          <input style={styles.input} value={tenantId} onChange={(e) => setTenantId(e.target.value)} placeholder="e.g. pachamama" />
        </div>
        <div style={styles.field}>
          <span style={styles.label}>Client name</span>
          <input style={styles.input} value={clientLabel} onChange={(e) => setClientLabel(e.target.value)} placeholder="e.g. PachaMama" />
        </div>
        <div style={styles.field}>
          <span style={styles.label}>Their DeepSeek API key</span>
          <input style={styles.input} value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-…" />
        </div>
        <button style={styles.button} type="submit" disabled={!tenantId.trim() || !clientLabel.trim() || !apiKey.trim()}>
          Save, switch to V4 Flash
        </button>
      </form>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Client</th>
            <th style={styles.th}>Tenant ID</th>
            <th style={styles.th}>Model</th>
            <th style={styles.th}>Key</th>
            <th style={styles.th}>Last updated</th>
            <th style={styles.th} />
          </tr>
        </thead>
        <tbody>
          {keys.length === 0 && (
            <tr>
              <td style={styles.td} colSpan={6}>No clients have their own key saved yet, everyone is on the shared platform key.</td>
            </tr>
          )}
          {keys.map((key) => (
            <tr key={key.tenantId}>
              <td style={styles.td}>{key.clientLabel}</td>
              <td style={styles.td}>{key.tenantId}</td>
              <td style={styles.td}>{modelPill(key.model)}</td>
              <td style={styles.td}>{key.keyPreview}</td>
              <td style={styles.td}>{new Date(key.updatedAt).toLocaleString('en-GB')}</td>
              <td style={styles.td}>
                <button style={styles.buttonDanger} onClick={() => void handleRemove(key.tenantId)}>Remove</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
