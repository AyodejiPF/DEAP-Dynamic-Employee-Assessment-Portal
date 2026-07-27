/**
 * TokenStudio — API token creation and management UI.
 * Only rendered for the Platform Owner.
 *
 * Extracted verbatim from the inline "apiTokens" tab block (plus the
 * generatedApiToken success modal, which only ever appears while this tab is
 * open, the modal backdrop blocks navigating away from it) that used to live
 * directly inside src/App.tsx's SettingsPanel (StaffiQ build book Part 4
 * Medium priority #4, 27 Jul 2026). Pure code-organisation move — same
 * markup, same class names, same handlers, same gating.
 *
 * Many shared types and helpers (User, ApiTokenKind, ApiTokenStatus,
 * ApiTokenRiskLevel, ApiTokenRotationPolicy, ApiTokenRecord,
 * GeneratedApiToken, ApiTokenCreateRequest, ApiCapability,
 * apiCapabilityCatalog, OWNER_ROLE, isTesterAccount, sharedStateTime,
 * downloadJsonFile, maskTokenPreview, copyToClipboard, DataTable) are used
 * pervasively throughout App.tsx itself, not just here, so they were left in
 * place there (now exported) rather than relocated, to avoid a much larger,
 * riskier refactor touching many unrelated parts of a 22,000 line file
 * overnight. This does create a circular import between App.tsx and this
 * file, which is safe here because every imported binding is only read
 * inside this component's function body at render time, never at this
 * module's own top level.
 */

import { useState, useMemo, type FormEvent } from 'react'
import { ShieldCheck, KeyRound, FileDown, FileSpreadsheet, AlertCircle, Search, RotateCcw, Archive, Copy } from 'lucide-react'
import {
  type User,
  type ApiTokenKind,
  type ApiTokenStatus,
  type ApiTokenRiskLevel,
  type ApiTokenRotationPolicy,
  type ApiTokenRecord,
  type GeneratedApiToken,
  type ApiTokenCreateRequest,
  type ApiCapability,
  apiCapabilityCatalog,
  OWNER_ROLE,
  isTesterAccount,
  sharedStateTime,
  downloadJsonFile,
  maskTokenPreview,
  copyToClipboard,
  DataTable,
} from '../../App'

export interface TokenStudioProps {
  users: User[]
  canManageApiTokens: boolean
  apiTokens: ApiTokenRecord[]
  generatedApiToken?: GeneratedApiToken
  onCreateApiToken: (request: ApiTokenCreateRequest) => void | Promise<void>
  onRevokeApiToken: (tokenId: string) => void
  onRotateApiToken: (tokenId: string) => void
  onArchiveApiToken: (tokenId: string) => void
  onDismissGeneratedApiToken: () => void
  onDownloadCapabilityCsv: () => void
  onToast: (message: string) => void
}

export function TokenStudio({
  users,
  canManageApiTokens,
  apiTokens,
  generatedApiToken,
  onCreateApiToken,
  onRevokeApiToken,
  onRotateApiToken,
  onArchiveApiToken,
  onDismissGeneratedApiToken,
  onDownloadCapabilityCsv,
  onToast,
}: TokenStudioProps) {
  const defaultRegularScopes = useMemo(
    () => apiCapabilityCatalog.filter((capability) => !capability.destructive && capability.accessTier !== 'OWNER').map((capability) => capability.scope),
    [],
  )
  const [settingsNowTick, setSettingsNowTick] = useState(() => Date.now())
  useState(() => {
    const intervalId = window.setInterval(() => setSettingsNowTick(Date.now()), 60000)
    return () => window.clearInterval(intervalId)
  })
  const [tokenKind, setTokenKind] = useState<ApiTokenKind>('regular')
  const [tokenName, setTokenName] = useState('Staffiq Partner Integration')
  const [tokenScopes, setTokenScopes] = useState<string[]>(() => defaultRegularScopes)
  const [tokenOauthProfile, setTokenOauthProfile] = useState(true)
  const [tokenExpiryDays, setTokenExpiryDays] = useState(90)
  const [tokenAcknowledged, setTokenAcknowledged] = useState(false)
  const [tokenPurpose, setTokenPurpose] = useState('Connect a trusted internal tool to Staffiq.')
  const [tokenOwnerId, setTokenOwnerId] = useState(() => users.find((user) => user.role === OWNER_ROLE)?.id ?? users[0]?.id ?? '')
  const [tokenAllowedModules, setTokenAllowedModules] = useState('Assessments, Reports, Users')
  const [tokenAllowedEnvironments, setTokenAllowedEnvironments] = useState('production')
  const [tokenAllowedIps, setTokenAllowedIps] = useState('')
  const [tokenRateLimit, setTokenRateLimit] = useState(1000)
  const [tokenUsageLimit, setTokenUsageLimit] = useState(0)
  const [tokenRotationPolicy, setTokenRotationPolicy] = useState<ApiTokenRotationPolicy>('90_days')
  const [tokenDeploymentName, setTokenDeploymentName] = useState('')
  const [tokenDeploymentEnvironment, setTokenDeploymentEnvironment] = useState('production')
  const [tokenDeploymentService, setTokenDeploymentService] = useState('')
  const [tokenNotes, setTokenNotes] = useState('')
  const [tokenJustification, setTokenJustification] = useState('')
  const [tokenSearch, setTokenSearch] = useState('')
  const [tokenTypeFilter, setTokenTypeFilter] = useState<'all' | ApiTokenKind>('all')
  const [tokenStatusFilter, setTokenStatusFilter] = useState<'all' | ApiTokenStatus>('all')
  const [tokenRiskFilter, setTokenRiskFilter] = useState<'all' | ApiTokenRiskLevel>('all')
  const [selectedTokenId, setSelectedTokenId] = useState('')
  const [tokenDetailTab, setTokenDetailTab] = useState<'overview' | 'permissions' | 'deployments' | 'usage' | 'audit' | 'rotation' | 'notes'>('overview')

  const groupedTokenCapabilities = useMemo(() => {
    return apiCapabilityCatalog.reduce<Record<string, ApiCapability[]>>((groups, capability) => {
      groups[capability.category] = [...(groups[capability.category] ?? []), capability]
      return groups
    }, {})
  }, [])
  const tokenScopeSet = useMemo(() => new Set(tokenScopes), [tokenScopes])
  const tokenScopeCount = tokenKind === 'super' ? apiCapabilityCatalog.length : tokenScopes.length
  const activeApiTokens = apiTokens.filter((token) => token.status === 'active').length
  const tokenOwnerById = useMemo(() => new Map(users.map((user) => [user.id, user])), [users])
  const tokenOwnerOptions = useMemo(() => users.filter((user) => (user.role === OWNER_ROLE || user.role === 'admin') && !isTesterAccount(user)), [users])
  const tokensDueForRotation = apiTokens.filter((token) => token.status === 'active' && sharedStateTime(token.nextRotationDueAt) < settingsNowTick).length
  const expiringSoonTokens = apiTokens.filter((token) => token.status === 'active' && sharedStateTime(token.expiresAt) < settingsNowTick + 14 * 24 * 60 * 60 * 1000).length
  const unusedTokens = apiTokens.filter((token) => token.status === 'active' && !token.lastUsedAt).length
  const riskyTokens = apiTokens.filter((token) => token.riskLevel === 'critical' || token.riskLevel === 'high').length
  const undocumentedTokens = apiTokens.filter((token) => token.status === 'active' && !token.deploymentRecords.length).length
  const suspiciousTokens = apiTokens.filter((token) => token.usageLogs.some((log) => ['denied', 'failed', 'expired', 'revoked', 'rate_limited'].includes(log.outcome))).length
  const filteredApiTokens = apiTokens.filter((token) => {
    if (tokenTypeFilter !== 'all' && token.kind !== tokenTypeFilter) return false
    if (tokenStatusFilter !== 'all' && token.status !== tokenStatusFilter) return false
    if (tokenRiskFilter !== 'all' && token.riskLevel !== tokenRiskFilter) return false
    const query = tokenSearch.trim().toLowerCase()
    if (!query) return true
    const owner = tokenOwnerById.get(token.ownerId)
    return [
      token.name,
      token.tokenFingerprint,
      token.tokenPrefix,
      token.kind,
      token.status,
      token.purpose,
      owner?.fullName,
      token.scopes.join(' '),
      token.allowedModules.join(' '),
      token.deploymentRecords.map((deployment) => `${deployment.deploymentName} ${deployment.serviceName} ${deployment.environment}`).join(' '),
    ].some((value) => String(value || '').toLowerCase().includes(query))
  })
  const selectedToken = apiTokens.find((token) => token.id === selectedTokenId) ?? filteredApiTokens[0] ?? apiTokens[0]
  const selectedTokenOwner = selectedToken ? tokenOwnerById.get(selectedToken.ownerId) : undefined

  async function copyTokenSecret(text: string) {
    await copyToClipboard(text)
    onToast('API token copied. Store it in a secrets manager now.')
  }

  function toggleTokenScope(scope: string) {
    if (tokenKind === 'super') return
    setTokenScopes((existing) => (existing.includes(scope) ? existing.filter((item) => item !== scope) : [...existing, scope]))
  }

  function submitApiToken(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (tokenKind === 'super' && tokenJustification.trim().length < 10) {
      onToast('Platform Owner Token creation requires a clear justification.')
      return
    }
    void onCreateApiToken({
      name: tokenName,
      kind: tokenKind,
      scopes: tokenScopes,
      oauthProfile: tokenOauthProfile,
      expiresInDays: tokenKind === 'super' ? 365 : tokenExpiryDays,
      purpose: tokenPurpose,
      ownerId: tokenOwnerId,
      allowedModules: tokenAllowedModules.split(',').map((item) => item.trim()).filter(Boolean),
      allowedEnvironments: tokenAllowedEnvironments.split(',').map((item) => item.trim()).filter(Boolean),
      allowedIps: tokenAllowedIps.split(',').map((item) => item.trim()).filter(Boolean),
      rateLimit: tokenRateLimit > 0 ? tokenRateLimit : undefined,
      usageLimit: tokenUsageLimit > 0 ? tokenUsageLimit : undefined,
      rotationPolicy: tokenKind === 'super' ? '90_days' : tokenRotationPolicy,
      deploymentName: tokenDeploymentName,
      deploymentEnvironment: tokenDeploymentEnvironment,
      deploymentService: tokenDeploymentService,
      notes: tokenNotes,
      justification: tokenJustification,
    })
    setTokenAcknowledged(false)
  }

  function exportTokenMetadata() {
    const exportedAt = new Date().toISOString()
    downloadJsonFile(`staffiq_Token_Metadata_${exportedAt.slice(0, 10)}.json`, {
      exportedAt,
      exportedBy: 'Ayodeji Falope',
      note: 'Metadata export only. Raw token values and token hashes are intentionally excluded.',
      tokens: filteredApiTokens.map(({ tokenHash: excludedTokenHash, usageLogs, auditLogs, ...token }) => {
        void excludedTokenHash
        return {
          ...token,
          usageLogCount: usageLogs.length,
          auditLogCount: auditLogs.length,
        }
      }),
    })
    onToast('Token metadata exported without secret values.')
  }

  if (!canManageApiTokens) {
    return (
      <section className="panel locked-token-panel">
        <ShieldCheck size={42} />
        <h2>Admin API Capability and Token Studio</h2>
        <p>Token creation, token visibility, revocation, and capability export are locked to Ayodeji Falope only.</p>
        <p className="hint">Required process: sign in as Ayodeji Falope, open Admin API Capability and Token Studio, choose Super Token or Regular Scoped Token, click Generate Token Package, then copy the token from the Bearer Token block.</p>
      </section>
    )
  }

  return (
    <>
      <section className="api-token-console">
        <section className="panel api-token-summary-panel">
          <div className="panel-heading-row">
            <div>
              <h2>Token Management and Deployment Catalogue</h2>
              <p>Ayodeji-only governance for Platform Owner Tokens and Variable Read Write Tokens, with one-time secret display, deployment records, usage tracking, rotation, revocation, and audit history.</p>
            </div>
            <div className="token-toolbar-actions">
              <button className="secondary-button" type="button" onClick={exportTokenMetadata}>
                <FileDown size={18} /> Export metadata
              </button>
              <button className="primary-button" type="button" onClick={onDownloadCapabilityCsv}>
                <FileSpreadsheet size={18} /> Export capability CSV
              </button>
            </div>
          </div>
          <div className="token-summary-grid">
            <div>
              <span>Total tokens</span>
              <strong>{apiTokens.length}</strong>
            </div>
            <div>
              <span>Active tokens</span>
              <strong>{activeApiTokens}</strong>
            </div>
            <div>
              <span>Builder selected scopes</span>
              <strong>{tokenScopeCount}</strong>
            </div>
            <div>
              <span>Platform Owner tokens</span>
              <strong>{apiTokens.filter((token) => token.kind === 'super').length}</strong>
            </div>
            <div>
              <span>Variable R/W tokens</span>
              <strong>{apiTokens.filter((token) => token.kind === 'regular').length}</strong>
            </div>
            <div>
              <span>Expiring soon</span>
              <strong>{expiringSoonTokens}</strong>
            </div>
            <div>
              <span>Rotation due</span>
              <strong>{tokensDueForRotation}</strong>
            </div>
            <div>
              <span>No deployment record</span>
              <strong>{undocumentedTokens}</strong>
            </div>
            <div>
              <span>Unused active tokens</span>
              <strong>{unusedTokens}</strong>
            </div>
            <div>
              <span>High risk signals</span>
              <strong>{riskyTokens + suspiciousTokens}</strong>
            </div>
          </div>
          <p className="token-security-note">
            Full token values are shown only once during creation. The catalogue stores fingerprints, hashes, scopes, usage, deployment metadata, and audit history; raw tokens are not kept in the browser record.
          </p>
        </section>

        <div className="api-token-layout">
          <form className="panel api-token-builder" onSubmit={submitApiToken}>
            <div className="panel-heading-row">
              <div>
                <h2>Create token package</h2>
                <p>Choose Super Token for full access, or Regular Scoped Token to grant a deliberately selected list of scopes.</p>
              </div>
            </div>
            <div className="token-mode-grid" role="radiogroup" aria-label="Token type">
              <label className={`token-mode-card ${tokenKind === 'super' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="tokenKind"
                  checked={tokenKind === 'super'}
                  onChange={() => {
                    setTokenKind('super')
                    setTokenExpiryDays(365)
                  }}
                />
                <span>
                  <strong>Super Token</strong>
                  <small>All {apiCapabilityCatalog.length} scopes, intended only for your trusted app-to-app admin orchestrator.</small>
                </span>
              </label>
              <label className={`token-mode-card ${tokenKind === 'regular' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="tokenKind"
                  checked={tokenKind === 'regular'}
                  onChange={() => {
                    setTokenKind('regular')
                    setTokenExpiryDays((existing) => (existing === 365 ? 90 : existing))
                  }}
                />
                <span>
                  <strong>Regular Scoped Token</strong>
                  <small>Use the checkbox catalogue below to decide exactly what another app can do.</small>
                </span>
              </label>
            </div>

            <label className="field-label" htmlFor="api-token-name">Token name</label>
            <input id="api-token-name" value={tokenName} onChange={(event) => setTokenName(event.target.value)} placeholder="e.g. Staffiq to CRM bridge" />

            <label className="field-label" htmlFor="api-token-purpose">Purpose</label>
            <textarea id="api-token-purpose" value={tokenPurpose} onChange={(event) => setTokenPurpose(event.target.value)} placeholder="Describe what this token is for" />

            <div className="token-builder-row">
              <label>
                Expiry days
                <input
                  type="number"
                  min={1}
                  max={365}
                  step={1}
                  value={tokenKind === 'super' ? 365 : tokenExpiryDays}
                  disabled={tokenKind === 'super'}
                  onChange={(event) => setTokenExpiryDays(Math.min(365, Math.max(1, Number(event.target.value) || 90)))}
                />
              </label>
              <label className="token-checkbox-line">
                <input type="checkbox" checked={tokenOauthProfile} onChange={(event) => setTokenOauthProfile(event.target.checked)} />
                <span>Use OAuth-style metadata, expiry, scopes, and revocation tracking</span>
              </label>
            </div>

            <div className="token-builder-row token-builder-row-three">
              <label>
                Owner
                <select value={tokenOwnerId} onChange={(event) => setTokenOwnerId(event.target.value)}>
                  {(tokenOwnerOptions.length ? tokenOwnerOptions : users).map((user) => (
                    <option key={user.id} value={user.id}>{user.fullName} · {user.role.replace('_', ' ')}</option>
                  ))}
                </select>
              </label>
              <label>
                Rotation policy
                <select value={tokenKind === 'super' ? '90_days' : tokenRotationPolicy} disabled={tokenKind === 'super'} onChange={(event) => setTokenRotationPolicy(event.target.value as ApiTokenRotationPolicy)}>
                  <option value="30_days">30 days</option>
                  <option value="60_days">60 days</option>
                  <option value="90_days">90 days</option>
                  <option value="180_days">180 days</option>
                  <option value="365_days">365 days</option>
                </select>
              </label>
              <label>
                Rate limit
                <input type="number" min={0} step={50} value={tokenRateLimit} onChange={(event) => setTokenRateLimit(Math.max(0, Number(event.target.value) || 0))} />
              </label>
            </div>

            <div className="token-builder-row token-builder-row-three">
              <label>
                Allowed modules
                <input value={tokenAllowedModules} onChange={(event) => setTokenAllowedModules(event.target.value)} placeholder="Assessments, Reports, Users" />
              </label>
              <label>
                Allowed environments
                <input value={tokenAllowedEnvironments} onChange={(event) => setTokenAllowedEnvironments(event.target.value)} placeholder="production, staging" />
              </label>
              <label>
                Usage limit
                <input type="number" min={0} step={100} value={tokenUsageLimit} onChange={(event) => setTokenUsageLimit(Math.max(0, Number(event.target.value) || 0))} />
              </label>
            </div>

            <label className="field-label" htmlFor="api-token-ips">Allowed IP addresses</label>
            <input id="api-token-ips" value={tokenAllowedIps} onChange={(event) => setTokenAllowedIps(event.target.value)} placeholder="Optional: 102.89.12.10, 41.190.2.5" />

            <div className="token-builder-row token-builder-row-three">
              <label>
                Deployment name
                <input value={tokenDeploymentName} onChange={(event) => setTokenDeploymentName(event.target.value)} placeholder="Optional: Payroll sync worker" />
              </label>
              <label>
                Environment
                <input value={tokenDeploymentEnvironment} onChange={(event) => setTokenDeploymentEnvironment(event.target.value)} placeholder="production" />
              </label>
              <label>
                Service
                <input value={tokenDeploymentService} onChange={(event) => setTokenDeploymentService(event.target.value)} placeholder="Optional: Cloud Function" />
              </label>
            </div>

            {tokenKind === 'super' && (
              <>
                <div className="token-critical-warning">
                  <AlertCircle size={18} />
                  <span>Platform Owner Tokens are critical-risk credentials. They require an owner, expiry, justification, strict rotation, and a complete audit trail.</span>
                </div>
                <label className="field-label" htmlFor="api-token-justification">Platform Owner justification</label>
                <textarea id="api-token-justification" value={tokenJustification} onChange={(event) => setTokenJustification(event.target.value)} placeholder="Explain why this privileged token is needed" />
              </>
            )}

            <label className="field-label" htmlFor="api-token-notes">Security notes</label>
            <textarea id="api-token-notes" value={tokenNotes} onChange={(event) => setTokenNotes(event.target.value)} placeholder="Rotation owner, deployment notes, or operational warnings" />

            {tokenKind === 'regular' && (
              <div className="token-scope-actions">
                <button className="secondary-button compact" type="button" onClick={() => setTokenScopes(apiCapabilityCatalog.map((capability) => capability.scope))}>
                  Select all
                </button>
                <button className="secondary-button compact" type="button" onClick={() => setTokenScopes(defaultRegularScopes)}>
                  Safe default
                </button>
                <button className="secondary-button compact" type="button" onClick={() => setTokenScopes([])}>
                  Clear all
                </button>
              </div>
            )}

            <div className="token-scope-catalog">
              {Object.entries(groupedTokenCapabilities).map(([category, capabilities]) => (
                <details className="token-scope-group" key={category} open={category === 'Token Management' || category === 'Assessment Management'}>
                  <summary>
                    <span>{category}</span>
                    <em>{capabilities.length} scope(s)</em>
                  </summary>
                  <div className="token-scope-grid">
                    {capabilities.map((capability) => (
                      <label className={`token-scope-card ${capability.destructive ? 'destructive-scope' : ''}`} key={capability.id}>
                        <input
                          type="checkbox"
                          checked={tokenKind === 'super' || tokenScopeSet.has(capability.scope)}
                          disabled={tokenKind === 'super'}
                          onChange={() => toggleTokenScope(capability.scope)}
                        />
                        <span>
                          <strong>{capability.scope}</strong>
                          <small>{capability.description}</small>
                        </span>
                        <em>{capability.operationType}</em>
                      </label>
                    ))}
                  </div>
                </details>
              ))}
            </div>

            <label className="token-acknowledgement">
              <input type="checkbox" checked={tokenAcknowledged} onChange={(event) => setTokenAcknowledged(event.target.checked)} />
              <span>I understand this token is shown once only, must be stored in a secrets manager, and all governance actions are audited.</span>
            </label>
            <button className="primary-button" type="submit" disabled={!tokenAcknowledged || (tokenKind === 'regular' && !tokenScopes.length)}>
              <KeyRound size={18} /> Generate Token Package
            </button>
          </form>

          <section className="panel api-token-records">
            <div className="panel-heading-row">
              <div>
                <h2>Token catalogue</h2>
                <p>Search, filter, inspect, rotate, revoke, archive, and export token metadata without exposing token secrets.</p>
              </div>
            </div>
            <div className="token-filter-row">
              <label className="search-box">
                <Search size={18} />
                <input placeholder="Search name, owner, fingerprint, scope, deployment" value={tokenSearch} onChange={(event) => setTokenSearch(event.target.value)} />
              </label>
              <select aria-label="Filter by token type" value={tokenTypeFilter} onChange={(event) => setTokenTypeFilter(event.target.value as 'all' | ApiTokenKind)}>
                <option value="all">All types</option>
                <option value="super">Platform Owner Token</option>
                <option value="regular">Variable Read Write Token</option>
              </select>
              <select aria-label="Filter by token status" value={tokenStatusFilter} onChange={(event) => setTokenStatusFilter(event.target.value as 'all' | ApiTokenStatus)}>
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="rotation_pending">Rotation pending</option>
                <option value="revoked">Revoked</option>
                <option value="archived">Archived</option>
              </select>
              <select aria-label="Filter by risk level" value={tokenRiskFilter} onChange={(event) => setTokenRiskFilter(event.target.value as 'all' | ApiTokenRiskLevel)}>
                <option value="all">All risk levels</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div className="token-record-list">
              {filteredApiTokens.map((token) => {
                const owner = tokenOwnerById.get(token.ownerId)
                const latestDeployment = token.deploymentRecords[0]
                return (
                <article className={`token-record-card ${token.status} risk-${token.riskLevel} ${selectedToken?.id === token.id ? 'selected' : ''}`} key={token.id}>
                  <div>
                    <div className="token-record-heading">
                      <strong>{token.name}</strong>
                      <span className={`token-status ${token.status}`}>{token.status.replace('_', ' ')}</span>
                    </div>
                    <p>{token.kind === 'super' ? 'Platform Owner Token' : 'Variable Read Write Token'} · {token.scopes.length} scope(s) · {maskTokenPreview(token.tokenPrefix, token.tokenFingerprint)}</p>
                    <small>Owner: {owner?.fullName ?? token.ownerId} · Created {new Date(token.createdAt).toLocaleString()} · Expires {new Date(token.expiresAt).toLocaleString()}</small>
                    <small>Usage: {token.usageCount} · Last used: {token.lastUsedAt ? new Date(token.lastUsedAt).toLocaleString() : 'Never'} · Deployment: {latestDeployment ? `${latestDeployment.deploymentName} (${latestDeployment.status.replace('_', ' ')})` : 'Not documented'}</small>
                    {token.revokedAt && <small>Revoked by {token.revokedBy ?? 'Admin'} on {new Date(token.revokedAt).toLocaleString()}</small>}
                    <div className="token-record-badges">
                      <span className={`token-risk risk-${token.riskLevel}`}>{token.riskLevel} risk</span>
                      <span>{token.rotationStatus.replace('_', ' ')}</span>
                      {sharedStateTime(token.nextRotationDueAt) < settingsNowTick && token.status === 'active' && <span className="token-risk risk-high">rotation due</span>}
                    </div>
                  </div>
                  <div className="token-card-actions">
                    <button className="secondary-button compact" type="button" onClick={() => setSelectedTokenId(token.id)}>
                      Details
                    </button>
                    <button className="secondary-button compact" type="button" disabled={token.status !== 'active'} onClick={() => onRotateApiToken(token.id)}>
                      <RotateCcw size={16} /> Rotate
                    </button>
                    <button className="danger-button compact" type="button" disabled={token.status === 'revoked' || token.status === 'archived'} onClick={() => onRevokeApiToken(token.id)}>
                      Revoke
                    </button>
                    <button className="secondary-button compact" type="button" disabled={token.status === 'active' || token.status === 'archived'} onClick={() => onArchiveApiToken(token.id)}>
                      <Archive size={16} /> Archive
                    </button>
                  </div>
                </article>
                )
              })}
              {!filteredApiTokens.length && <p className="hint">No token metadata matches the current filters.</p>}
            </div>
          </section>
        </div>

        {selectedToken && (
          <section className="panel token-detail-panel">
            <div className="panel-heading-row">
              <div>
                <h2>{selectedToken.name}</h2>
                <p>{selectedToken.kind === 'super' ? 'Platform Owner Token' : 'Variable Read Write Token'} · {selectedToken.tokenFingerprint} · {maskTokenPreview(selectedToken.tokenPrefix, selectedToken.tokenFingerprint)}</p>
              </div>
              <span className={`token-risk risk-${selectedToken.riskLevel}`}>{selectedToken.riskLevel} risk</span>
            </div>
            <div className="token-detail-tabs" role="tablist" aria-label="Token detail tabs">
              {[
                ['overview', 'Overview'],
                ['permissions', 'Permissions'],
                ['deployments', 'Deployments'],
                ['usage', 'Usage'],
                ['audit', 'Audit Logs'],
                ['rotation', 'Rotation'],
                ['notes', 'Security Notes'],
              ].map(([id, label]) => (
                <button className={tokenDetailTab === id ? 'active' : ''} type="button" key={id} onClick={() => setTokenDetailTab(id as typeof tokenDetailTab)}>
                  {label}
                </button>
              ))}
            </div>

            {tokenDetailTab === 'overview' && (
              <div className="token-governance-grid">
                <div><span>Status</span><strong>{selectedToken.status.replace('_', ' ')}</strong></div>
                <div><span>Owner</span><strong>{selectedTokenOwner?.fullName ?? selectedToken.ownerId}</strong></div>
                <div><span>Created by</span><strong>{selectedToken.createdBy}</strong></div>
                <div><span>Created</span><strong>{new Date(selectedToken.createdAt).toLocaleString()}</strong></div>
                <div><span>Expiry</span><strong>{new Date(selectedToken.expiresAt).toLocaleString()}</strong></div>
                <div><span>Last used</span><strong>{selectedToken.lastUsedAt ? new Date(selectedToken.lastUsedAt).toLocaleString() : 'Never'}</strong></div>
                <div><span>Usage count</span><strong>{selectedToken.usageCount}</strong></div>
                <div><span>Deployment records</span><strong>{selectedToken.deploymentRecords.length}</strong></div>
                <div className="wide"><span>Purpose</span><strong>{selectedToken.purpose}</strong></div>
              </div>
            )}

            {tokenDetailTab === 'permissions' && (
              <div className="token-metadata-grid">
                <div><span>Scopes</span><p>{selectedToken.scopes.join(', ') || 'No scopes'}</p></div>
                <div><span>Allowed modules</span><p>{selectedToken.allowedModules.join(', ') || 'All documented modules'}</p></div>
                <div><span>Allowed environments</span><p>{selectedToken.allowedEnvironments.join(', ') || 'production'}</p></div>
                <div><span>Allowed IPs</span><p>{selectedToken.allowedIps.join(', ') || 'No IP restriction recorded'}</p></div>
                <div><span>Rate limit</span><p>{selectedToken.rateLimit ? `${selectedToken.rateLimit} request(s)` : 'No explicit limit'}</p></div>
                <div><span>Usage limit</span><p>{selectedToken.usageLimit ? `${selectedToken.usageLimit} total use(s)` : 'No explicit limit'}</p></div>
              </div>
            )}

            {tokenDetailTab === 'deployments' && (
              <DataTable
                columns={['Deployment', 'Environment', 'Service', 'Status', 'Deployed by', 'Last verified']}
                rows={selectedToken.deploymentRecords.map((deployment) => [
                  deployment.deploymentName,
                  deployment.environment,
                  deployment.serviceName,
                  deployment.status.replace('_', ' '),
                  deployment.deployedBy,
                  deployment.lastVerifiedAt ? new Date(deployment.lastVerifiedAt).toLocaleString() : 'Not verified',
                ])}
                tableId={`token-deployments-${selectedToken.id}`}
              />
            )}

            {tokenDetailTab === 'usage' && (
              <DataTable
                columns={['Time', 'Outcome', 'Endpoint', 'Module', 'Environment', 'IP / Agent']}
                rows={selectedToken.usageLogs.map((log) => [
                  new Date(log.timestamp).toLocaleString(),
                  log.outcome.replace('_', ' '),
                  `${log.method} ${log.endpoint}`,
                  log.module,
                  log.environment,
                  `${log.ipAddress ?? 'unknown IP'} · ${log.userAgent ?? 'unknown agent'}`,
                ])}
                tableId={`token-usage-${selectedToken.id}`}
              />
            )}

            {tokenDetailTab === 'audit' && (
              <DataTable
                columns={['Time', 'Actor', 'Action', 'Result', 'Reason']}
                rows={selectedToken.auditLogs.map((log) => [
                  new Date(log.timestamp).toLocaleString(),
                  log.actor,
                  log.action,
                  log.result,
                  log.reason ?? '—',
                ])}
                tableId={`token-audit-${selectedToken.id}`}
              />
            )}

            {tokenDetailTab === 'rotation' && (
              <div className="token-metadata-grid">
                <div><span>Policy</span><p>{selectedToken.rotationPolicy.replace('_', ' ')}</p></div>
                <div><span>Status</span><p>{selectedToken.rotationStatus.replace('_', ' ')}</p></div>
                <div><span>Last rotated</span><p>{selectedToken.lastRotatedAt ? new Date(selectedToken.lastRotatedAt).toLocaleString() : 'Never'}</p></div>
                <div><span>Next due</span><p>{new Date(selectedToken.nextRotationDueAt).toLocaleString()}</p></div>
                <div className="wide"><span>Safe rotation flow</span><p>Create replacement, mark old token rotation pending, update deployment, observe new usage, revoke old token, then archive when history is no longer operationally active.</p></div>
              </div>
            )}

            {tokenDetailTab === 'notes' && (
              <div className="token-metadata-grid">
                <div className="wide"><span>Notes</span><p>{selectedToken.notes || 'No security notes recorded.'}</p></div>
                <div className="wide"><span>Recommended controls</span><p>{selectedToken.kind === 'super' ? 'Keep expiry short, rotate aggressively, require justification, restrict deployments, and review usage after every sensitive operation.' : 'Keep scopes narrow, document deployment, review unused tokens, and revoke tokens that are no longer tied to a live integration.'}</p></div>
              </div>
            )}
          </section>
        )}
      </section>

      {generatedApiToken && canManageApiTokens && (
        <div className="modal-backdrop" role="presentation">
          <section className="credential-modal api-token-modal" role="dialog" aria-modal="true" aria-labelledby="api-token-title">
            <h2 id="api-token-title">Token package generated</h2>
            <p>
              Copy this token now. After this dialog closes, Staffiq keeps only the fingerprint, hash, governance metadata, deployment records, usage history, and audit trail.
            </p>
            <div className="token-secret-box">
              <span>Bearer Token</span>
              <code>{generatedApiToken.token}</code>
            </div>
            <div className="token-secret-meta">
              <span>{generatedApiToken.record.name}</span>
              <span>{generatedApiToken.record.kind === 'super' ? 'Platform Owner Token' : 'Variable Read Write Token'}</span>
              <span>{generatedApiToken.record.scopes.length} scope(s)</span>
              <span>Expires {new Date(generatedApiToken.record.expiresAt).toLocaleString()}</span>
            </div>
            <div className="modal-actions">
              <button className="primary-button" type="button" onClick={() => copyTokenSecret(generatedApiToken.token)}>
                <Copy size={18} /> Copy Bearer Token
              </button>
              <button className="secondary-button" type="button" onClick={onDismissGeneratedApiToken}>
                Done
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  )
}
