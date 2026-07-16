/**
 * SuperAdminPanel — the root container for all Platform Owner functionality.
 * This component is only rendered when the current user is the Platform Owner.
 */

import type { ReactNode } from 'react'

interface SuperAdminPanelProps {
  children?: ReactNode
}

export function SuperAdminPanel({ children }: SuperAdminPanelProps) {
  return (
    <section className="superadmin-panel" data-superadmin="true">
      <div className="superadmin-header">
        <h2>Platform Owner Controls</h2>
        <p className="hint">These controls are only visible to the Platform Owner.</p>
      </div>
      {children}
    </section>
  )
}
