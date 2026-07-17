/**
 * AdminPlanManager — Super admin view for managing plan definitions.
 *
 * Allows Platform Owner and delegated Billing Admins to:
 *   - View all plan definitions
 *   - Update plan prices, features, and availability
 *   - Create new plans
 *   - Archive old plans
 */

import { useState, useEffect, useCallback } from 'react'

interface PlanDef {
  id: string
  name: string
  description: string
  monthlyPriceKobo: number
  annualPriceKobo: number
  features: string[]
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

interface PlanFormData {
  name: string
  description: string
  monthlyPriceNaira: number
  annualPriceNaira: number
  features: string
  sortOrder: number
}

const emptyForm: PlanFormData = {
  name: '',
  description: '',
  monthlyPriceNaira: 0,
  annualPriceNaira: 0,
  features: '',
  sortOrder: 0,
}

interface AdminPlanManagerProps {
  tenantId: string
  currentUser: { userId: string; role: string; fullName: string }
}

export function AdminPlanManager({ tenantId, currentUser: _currentUser }: AdminPlanManagerProps) {
  const [plans, setPlans] = useState<PlanDef[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editPlan, setEditPlan] = useState<PlanDef | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [form, setForm] = useState<PlanFormData>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const loadPlans = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/billing/admin/plans?tenantId=${tenantId}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setPlans(data.plans ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load plans')
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  useEffect(() => { loadPlans() }, [loadPlans])

  const handleEdit = (plan: PlanDef) => {
    setEditPlan(plan)
    setIsCreating(false)
    setForm({
      name: plan.name,
      description: plan.description,
      monthlyPriceNaira: plan.monthlyPriceKobo / 100,
      annualPriceNaira: plan.annualPriceKobo / 100,
      features: plan.features.join('\n'),
      sortOrder: plan.sortOrder,
    })
    setError(null)
    setSuccessMsg(null)
  }

  const handleNew = () => {
    setEditPlan(null)
    setIsCreating(true)
    setForm({ ...emptyForm })
    setError(null)
    setSuccessMsg(null)
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccessMsg(null)
    try {
      const body = {
        tenantId,
        planId: editPlan?.id,
        name: form.name,
        description: form.description,
        monthlyPriceKobo: Math.round(form.monthlyPriceNaira * 100),
        annualPriceKobo: Math.round(form.annualPriceNaira * 100),
        features: form.features.split('\n').map((f) => f.trim()).filter(Boolean),
        sortOrder: form.sortOrder,
      }
      const method = editPlan ? 'PUT' : 'POST'
      const res = await fetch('/api/billing/admin/plans', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error((errData as any).error ?? `HTTP ${res.status}`)
      }
      setSuccessMsg(editPlan ? 'Plan updated.' : 'Plan created.')
      setEditPlan(null)
      setIsCreating(false)
      await loadPlans()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (plan: PlanDef) => {
    try {
      const res = await fetch('/api/billing/admin/plans', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          planId: plan.id,
          isActive: !plan.isActive,
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      await loadPlans()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Toggle failed')
    }
  }

  const formatNaira = (kobo: number) =>
    `₦${(kobo / 100).toLocaleString('en-NG')}`

  if (loading) return <div className="admin-panel"><p>Loading plans...</p></div>

  return (
    <div className="admin-panel plan-manager">
      <div className="admin-header">
        <h2>Plan Manager</h2>
        <button className="btn-primary" onClick={handleNew}>+ New Plan</button>
      </div>

      {error && <div className="admin-error"><p className="error">{error}</p></div>}
      {successMsg && <div className="admin-success"><p>{successMsg}</p></div>}

      {/* Plan List */}
      <table className="admin-table">
        <thead>
          <tr>
            <th>Order</th>
            <th>Name</th>
            <th>Monthly</th>
            <th>Annual</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {plans.map((plan) => (
            <tr key={plan.id} className={!plan.isActive ? 'inactive' : ''}>
              <td>{plan.sortOrder}</td>
              <td>{plan.name}</td>
              <td>{formatNaira(plan.monthlyPriceKobo)}</td>
              <td>{formatNaira(plan.annualPriceKobo)}</td>
              <td>
                <span className={`status-badge ${plan.isActive ? 'active' : 'inactive'}`}>
                  {plan.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="action-cell">
                <button className="btn-small" onClick={() => handleEdit(plan)}>Edit</button>
                <button
                  className={`btn-small ${plan.isActive ? 'btn-warning' : 'btn-success'}`}
                  onClick={() => handleToggleActive(plan)}
                >
                  {plan.isActive ? 'Archive' : 'Activate'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Edit / Create Form — shown when editing a plan or creating a new one */}
      {(editPlan !== null || isCreating) && (
        <div className="plan-form">
          <h3>{editPlan ? `Edit: ${editPlan.name}` : 'New Plan'}</h3>

          <label>
            Name
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>

          <label>
            Description
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
            />
          </label>

          <div className="form-row">
            <label>
              Monthly Price (₦)
              <input
                type="number"
                value={form.monthlyPriceNaira}
                onChange={(e) => setForm({ ...form, monthlyPriceNaira: Number(e.target.value) })}
                min={0}
              />
            </label>
            <label>
              Annual Price (₦)
              <input
                type="number"
                value={form.annualPriceNaira}
                onChange={(e) => setForm({ ...form, annualPriceNaira: Number(e.target.value) })}
                min={0}
              />
            </label>
          </div>

          <label>
            Features (one per line)
            <textarea
              value={form.features}
              onChange={(e) => setForm({ ...form, features: e.target.value })}
              rows={4}
              placeholder="User and role administration&#10;Training and assessments&#10;..."
            />
          </label>

          <label>
            Sort Order
            <input
              type="number"
              value={form.sortOrder}
              onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
              min={0}
            />
          </label>

          <div className="form-actions">
            <button className="btn-secondary" onClick={() => { setEditPlan(null); setIsCreating(false); setForm(emptyForm) }}>
              Cancel
            </button>
            <button className="btn-primary" onClick={handleSave} disabled={saving || !form.name}>
              {saving ? 'Saving...' : editPlan ? 'Update Plan' : 'Create Plan'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
