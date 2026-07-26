/**
 * ClientAiKeysPanel — Platform Owner / Tenant Admin only.
 *
 * A pool of up to 10 DeepSeek API keys that Ayodeji uploads and names
 * himself, each assignable to one tenant at a time. Whichever tenant has a
 * key assigned bills its AI usage against that key on the V4 Flash tier.
 * Any tenant with no key assigned still shares the platform default
 * DeepSeek key on the V4 Pro tier.
 *
 * DeepSeek has no API to rename a key's display name on its own dashboard
 * (platform.deepseek.com), only the DeepSeek UI itself can do that. So every
 * key tracks a portal sync status: renaming a key here marks it "needs
 * portal update" until Ayodeji (or Claude, driving a live browser session on
 * his behalf) has actually renamed the matching key on DeepSeek's dashboard
 * and it gets marked synced.
 *
 * Self-contained inline styles, same convention as VersionTrackerPanel.tsx
 * and ApiKeysUsagePanel.tsx.
 */

import { useCallback, useEffect, useState, type CSSProperties, type FormEvent } from 'react'

interface PoolKey {
  keyId: string
  label: string
  assignedTenantId: string | null
  assignedTenantLabel: string | null
  portalSyncStatus: 'synced' | 'needs_portal_update'
  portalSyncedAt: string | null
  keyPreview: string
  createdAt: string
  updatedAt: string
  updatedBy: string
}

const FUNCTIONS_BASE = 'https://us-central1-iicocece-assessment.cloudfunctions.net'
const MAX_KEYS = 10

const styles: Record<string, CSSProperties> = {
  wrap: { fontFamily: 'system-ui, -apple-system, sans-serif', color: '#1e293b', maxWidth: 1080 },
  banner: {
    border: '1px solid #bfdbfe',
    background: '#eff6ff',
    color: '#1e3a8a',
    borderRadius: 8,
    padding: '10px 14px',
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 1.5,
  },
  row: { display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 16 },
  field: { display: 'flex', flexDirection: 'column', gap: 4 },
  label: { fontSize: 12, fontWeight: 700, color: '#475569' },
  input: { border: '1px solid #cbd5e1', borderRadius: 8, padding: '8px 10px', fontSize: 14, minWidth: 200 },
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
  buttonSecondary: {
    border: '1px solid #cbd5e1',
    borderRadius: 8,
    background: '#fff',
    color: '#1e293b',
    fontWeight: 700,
    fontSize: 12,
    padding: '6px 10px',
    cursor: 'pointer',
  },
  buttonDanger: {
    border: '1px solid #fecaca',
    borderRadius: 8,
    background: '#fef2f2',
    color: '#991b1b',
    fontWeight: 700,
    fontSize: 12,
    padding: '6px 10px',
    cursor: 'pointer',
  },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
  th: { textAlign: 'left', borderBottom: '2px solid #e2e8f0', padding: '8px 10px', color: '#475569', fontSize: 12, textTransform: 'uppercase' },
  td: { borderBottom: '1px solid #f1f5f9', padding: '8px 10px', verticalAlign: 'top' },
  error: { color: '#991b1b', fontSize: 13, marginBottom: 12 },
  actionsCell: { display: 'flex', gap: 6, flexWrap: 'wrap' },
}

function assignmentPill(key: PoolKey) {
  const assigned = Boolean(key.assignedTenantId)
  return (
    <span
      style={{
        display: 'inline-block',
        borderRadius: 999,
        padding: '2px 10px',
        fontSize: 12,
        fontWeight: 700,
        background: assigned ? '#ecfdf5' : '#f1f5f9',
        color: assigned ? '#065f46' : '#475569',
      }}
    >
      {assigned ? `V4 Flash — ${key.assignedTenantLabel}` : 'Unassigned'}
    </span>
  )
}

function syncPill(key: PoolKey) {
  const synced = key.portalSyncStatus === 'synced'
  return (
    <span
      style={{
        display: 'inline-block',
        borderRadius: 999,
        padding: '2px 10px',
        fontSize: 12,
        fontWeight: 700,
        background: synced ? '#ecfdf5' : '#fffbeb',
        color: synced ? '#065f46' : '#92400e',
      }}
      title={synced ? 'This key\'s name on platform.deepseek.com matches this label.' : 'This key\'s name on platform.deepseek.com still needs updating to match this label.'}
    >
      {synced ? 'Synced with DeepSeek' : 'Needs portal update'}
    </span>
  )
}

export function ClientAiKeysPanel() {
  const [platformOwnerUserId, setPlatformOwnerUserId] = useState('U001')
  const [keys, setKeys] = useState<PoolKey[]>([])
  const [label, setLabel] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [relabelDraft, setRelabelDraft] = useState<Record<string, string>>({})
  const [assignDraft, setAssignDraft] = useState<Record<string, { tenantId: string; tenantLabel: string }>>({})

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
      const res = await fetch(`${FUNCTIONS_BASE}/staffiqAiKeyPoolList`, { headers: headers() })
      if (!res.ok) throw new Error(`Could not load the key pool (${res.status}).`)
      const json = await res.json()
      setKeys(json.keys ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load the key pool.')
    } finally {
      setLoading(false)
    }
  }, [headers])

  useEffect(() => {
    void load()
  }, [load])

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (!label.trim() || !apiKey.trim()) return
    setError(null)
    try {
      const res = await fetch(`${FUNCTIONS_BASE}/staffiqAiKeyPoolCreate`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ label: label.trim(), apiKey: apiKey.trim() }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message ?? `Could not add this key (${res.status}).`)
      setLabel('')
      setApiKey('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add this key.')
    }
  }

  async function handleRelabel(keyId: string) {
    const newLabel = (relabelDraft[keyId] ?? '').trim()
    if (!newLabel) return
    setError(null)
    try {
      const res = await fetch(`${FUNCTIONS_BASE}/staffiqAiKeyPoolRelabel`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ keyId, label: newLabel }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message ?? `Could not rename this key (${res.status}).`)
      setRelabelDraft((prev) => ({ ...prev, [keyId]: '' }))
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rename this key.')
    }
  }

  async function handleAssign(keyId: string) {
    const draft = assignDraft[keyId]
    if (!draft?.tenantId.trim() || !draft?.tenantLabel.trim()) return
    setError(null)
    try {
      const res = await fetch(`${FUNCTIONS_BASE}/staffiqAiKeyPoolAssign`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ keyId, tenantId: draft.tenantId.trim(), tenantLabel: draft.tenantLabel.trim() }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message ?? `Could not assign this key (${res.status}).`)
      setAssignDraft((prev) => ({ ...prev, [keyId]: { tenantId: '', tenantLabel: '' } }))
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign this key.')
    }
  }

  async function handleUnassign(keyId: string) {
    setError(null)
    try {
      const res = await fetch(`${FUNCTIONS_BASE}/staffiqAiKeyPoolUnassign`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ keyId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message ?? `Could not unassign this key (${res.status}).`)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unassign this key.')
    }
  }

  async function handleMarkSynced(keyId: string) {
    setError(null)
    try {
      const res = await fetch(`${FUNCTIONS_BASE}/staffiqAiKeyPoolMarkSynced`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ keyId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message ?? `Could not update this key (${res.status}).`)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark this key as synced.')
    }
  }

  async function handleDelete(keyId: string, keyLabel: string) {
    if (!window.confirm(`Remove "${keyLabel}" from the pool? Unassign it first if it is still assigned to a client.`)) return
    setError(null)
    try {
      const res = await fetch(`${FUNCTIONS_BASE}/staffiqAiKeyPoolDelete`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ keyId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message ?? `Could not remove this key (${res.status}).`)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove this key.')
    }
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.banner}>
        Upload up to {MAX_KEYS} DeepSeek API keys here, one at a time, and name each one however you like, for example
        the client, tenant, or workspace it belongs to. Assign a key to a client to move that client onto their own
        key on V4 Flash. Any client with no key assigned still shares your platform key on V4 Pro. DeepSeek has no way
        to rename a key from outside its own dashboard, so whenever you rename a key here it is marked &quot;needs portal
        update&quot; until you (or Claude, live, on your say so) actually rename the matching key on platform.deepseek.com
        and mark it synced, so the name you see on DeepSeek&apos;s own usage dashboard always matches the name here.
      </div>

      <div style={styles.row}>
        <div style={styles.field}>
          <span style={styles.label}>Acting as (user ID)</span>
          <input style={styles.input} value={platformOwnerUserId} onChange={(e) => setPlatformOwnerUserId(e.target.value)} />
        </div>
        <button style={styles.button} onClick={() => void load()} disabled={loading}>
          {loading ? 'Loading…' : 'Refresh'}
        </button>
        <span style={{ fontSize: 13, color: '#475569' }}>{keys.length} / {MAX_KEYS} keys used</span>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <form onSubmit={handleCreate} style={styles.row}>
        <div style={styles.field}>
          <span style={styles.label}>Name for this key</span>
          <input style={styles.input} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. PachaMama" />
        </div>
        <div style={styles.field}>
          <span style={styles.label}>DeepSeek API key</span>
          <input style={styles.input} value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-…" />
        </div>
        <button style={styles.button} type="submit" disabled={!label.trim() || !apiKey.trim() || keys.length >= MAX_KEYS}>
          {keys.length >= MAX_KEYS ? 'Pool full' : 'Add key to pool'}
        </button>
      </form>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Name</th>
            <th style={styles.th}>Key</th>
            <th style={styles.th}>Assignment</th>
            <th style={styles.th}>Portal sync</th>
            <th style={styles.th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {keys.length === 0 && (
            <tr>
              <td style={styles.td} colSpan={5}>No keys in the pool yet. Every client is sharing the platform key on V4 Pro.</td>
            </tr>
          )}
          {keys.map((key) => (
            <tr key={key.keyId}>
              <td style={styles.td}>{key.label}</td>
              <td style={styles.td}>{key.keyPreview}</td>
              <td style={styles.td}>{assignmentPill(key)}</td>
              <td style={styles.td}>{syncPill(key)}</td>
              <td style={styles.td}>
                <div style={styles.actionsCell}>
                  <input
                    style={{ ...styles.input, minWidth: 120, padding: '4px 8px', fontSize: 12 }}
                    placeholder="Rename to…"
                    value={relabelDraft[key.keyId] ?? ''}
                    onChange={(e) => setRelabelDraft((prev) => ({ ...prev, [key.keyId]: e.target.value }))}
                  />
                  <button style={styles.buttonSecondary} onClick={() => void handleRelabel(key.keyId)}>Rename</button>

                  {!key.assignedTenantId && (
                    <>
                      <input
                        style={{ ...styles.input, minWidth: 100, padding: '4px 8px', fontSize: 12 }}
                        placeholder="Tenant ID"
                        value={assignDraft[key.keyId]?.tenantId ?? ''}
                        onChange={(e) =>
                          setAssignDraft((prev) => ({ ...prev, [key.keyId]: { tenantId: e.target.value, tenantLabel: prev[key.keyId]?.tenantLabel ?? '' } }))
                        }
                      />
                      <input
                        style={{ ...styles.input, minWidth: 100, padding: '4px 8px', fontSize: 12 }}
                        placeholder="Client name"
                        value={assignDraft[key.keyId]?.tenantLabel ?? ''}
                        onChange={(e) =>
                          setAssignDraft((prev) => ({ ...prev, [key.keyId]: { tenantId: prev[key.keyId]?.tenantId ?? '', tenantLabel: e.target.value } }))
                        }
                      />
                      <button style={styles.buttonSecondary} onClick={() => void handleAssign(key.keyId)}>Assign</button>
                    </>
                  )}
                  {key.assignedTenantId && (
                    <button style={styles.buttonSecondary} onClick={() => void handleUnassign(key.keyId)}>Unassign</button>
                  )}

                  {key.portalSyncStatus !== 'synced' && (
                    <button style={styles.buttonSecondary} onClick={() => void handleMarkSynced(key.keyId)}>Mark synced</button>
                  )}
                  <button style={styles.buttonDanger} onClick={() => void handleDelete(key.keyId, key.label)}>Delete</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
