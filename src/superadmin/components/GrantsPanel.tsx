/**
 * GrantsPanel — Platform Owner interface for managing delegated billing roles.
 *
 * Allows the Platform Owner to:
 *   - Grant Billing Admin, Support, or Finance roles to users
 *   - View all active and revoked grants
 *   - Revoke active grants
 */

import { useState, useEffect, useCallback } from 'react'
import {
  PLATFORM_OWNER,
  fetchGrants,
  createGrant,
  revokeGrant as revokeGrantApi,
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
  type OwnerIdentity,
  type DelegatedRole,
  type PlatformGrant,
} from '../grants'

interface GrantsPanelProps {
  /** The current Platform Owner identity */
  owner: OwnerIdentity
}

const DELEGATED_ROLES: DelegatedRole[] = ['billing_admin', 'support', 'finance']

export function GrantsPanel({ owner }: GrantsPanelProps) {
  const [grants, setGrants] = useState<PlatformGrant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<'active' | 'revoked'>('active')

  // Grant form state
  const [subjectUserId, setSubjectUserId] = useState('')
  const [selectedRole, setSelectedRole] = useState<DelegatedRole>('billing_admin')
  const [grantReason, setGrantReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Revoke form state
  const [revokeGrantId, setRevokeGrantId] = useState('')
  const [revokeReason, setRevokeReason] = useState('')
  const [revoking, setRevoking] = useState(false)

  const loadGrants = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchGrants(statusFilter)
      setGrants(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load grants')
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    loadGrants()
  }, [loadGrants])

  const handleGrant = async () => {
    if (!subjectUserId.trim()) {
      setFormError('User ID is required.')
      return
    }
    if (!grantReason.trim()) {
      setFormError('Reason is required.')
      return
    }
    setFormError(null)
    setSubmitting(true)
    try {
      await createGrant(owner, subjectUserId.trim(), selectedRole, grantReason.trim())
      setSuccessMessage(`Granted ${ROLE_LABELS[selectedRole]} to ${subjectUserId.trim()}`)
      setSubjectUserId('')
      setGrantReason('')
      loadGrants()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create grant')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRevoke = async () => {
    if (!revokeGrantId.trim() || !revokeReason.trim()) {
      return
    }
    setRevoking(true)
    try {
      await revokeGrantApi(owner, revokeGrantId.trim(), revokeReason.trim())
      setSuccessMessage(`Revoked grant ${revokeGrantId.trim()}`)
      setRevokeGrantId('')
      setRevokeReason('')
      loadGrants()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to revoke grant')
    } finally {
      setRevoking(false)
    }
  }

  const isOwner = owner.userId === PLATFORM_OWNER.userId

  return (
    <div className="grants-panel">
      {!isOwner && (
        <p className="warning-banner">
          ⚠️ You are viewing grants as a delegate. Only the Platform Owner can grant or revoke roles.
        </p>
      )}

      {successMessage && (
        <div className="success-banner" onClick={() => setSuccessMessage(null)}>
          ✅ {successMessage}
        </div>
      )}

      {/* Grant Form — Owner Only */}
      {isOwner && (
        <section className="grants-form-section">
          <h3>Grant a Delegated Role</h3>
          <p className="hint">
            Grant billing duties to trusted staff without making them Platform Owners.
            Every grant is audit-logged.
          </p>

          <div className="grants-form">
            <div className="form-group">
              <label htmlFor="grant-user-id">User ID</label>
              <input
                id="grant-user-id"
                type="text"
                value={subjectUserId}
                onChange={(e) => setSubjectUserId(e.target.value)}
                placeholder="e.g., user_abc123"
                disabled={submitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="grant-role">Role</label>
              <select
                id="grant-role"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as DelegatedRole)}
                disabled={submitting}
              >
                {DELEGATED_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </option>
                ))}
              </select>
              <p className="role-description">{ROLE_DESCRIPTIONS[selectedRole]}</p>
            </div>

            <div className="form-group">
              <label htmlFor="grant-reason">Reason</label>
              <input
                id="grant-reason"
                type="text"
                value={grantReason}
                onChange={(e) => setGrantReason(e.target.value)}
                placeholder="e.g., Needs to manage billing for Q3"
                disabled={submitting}
              />
            </div>

            {formError && <p className="error-message">{formError}</p>}

            <button
              className="primary-button"
              onClick={handleGrant}
              disabled={submitting || !subjectUserId.trim() || !grantReason.trim()}
            >
              {submitting ? 'Granting...' : 'Grant Role'}
            </button>
          </div>
        </section>
      )}

      {/* Revoke Form — Owner Only */}
      {isOwner && (
        <section className="grants-revoke-section">
          <h3>Revoke a Grant</h3>
          <div className="grants-form-inline">
            <input
              type="text"
              value={revokeGrantId}
              onChange={(e) => setRevokeGrantId(e.target.value)}
              placeholder="Grant ID"
              disabled={revoking}
            />
            <input
              type="text"
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
              placeholder="Reason"
              disabled={revoking}
            />
            <button
              className="danger-button"
              onClick={handleRevoke}
              disabled={revoking || !revokeGrantId.trim() || !revokeReason.trim()}
            >
              {revoking ? 'Revoking...' : 'Revoke'}
            </button>
          </div>
        </section>
      )}

      {/* Grants List */}
      <section className="grants-list-section">
        <div className="grants-list-header">
          <h3>Grants</h3>
          <div className="status-filter">
            <button
              className={statusFilter === 'active' ? 'active' : ''}
              onClick={() => setStatusFilter('active')}
            >
              Active
            </button>
            <button
              className={statusFilter === 'revoked' ? 'active' : ''}
              onClick={() => setStatusFilter('revoked')}
            >
              Revoked
            </button>
          </div>
        </div>

        {loading && <p className="loading">Loading grants...</p>}
        {error && <p className="error-message">{error}</p>}

        {!loading && !error && grants.length === 0 && (
          <p className="empty-state">No {statusFilter} grants found.</p>
        )}

        {!loading && grants.length > 0 && (
          <table className="grants-table">
            <thead>
              <tr>
                <th>Grant ID</th>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Reason</th>
                <th>Granted</th>
              </tr>
            </thead>
            <tbody>
              {grants.map((grant) => (
                <tr key={grant.grantId}>
                  <td><code>{grant.grantId}</code></td>
                  <td>{grant.subjectUserId}</td>
                  <td>{ROLE_LABELS[grant.role] ?? grant.role}</td>
                  <td>
                    <span className={`status-badge status-${grant.status}`}>
                      {grant.status}
                    </span>
                  </td>
                  <td>{grant.reason}</td>
                  <td>{new Date(grant.grantedAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
