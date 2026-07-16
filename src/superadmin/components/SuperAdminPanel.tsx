/**
 * SuperAdminPanel — the root container for all Platform Owner functionality.
 * This component is only rendered when the current user is the Platform Owner.
 *
 * Tabs:
 *   - Grants    — Delegate billing duties to trusted staff
 *   - Branding  — Platform branding controls
 *   - Tokens    — API token management
 *   - Testers   — Tester account management
 */

import { useState, type ReactNode } from 'react'
import { getOwnerLabel } from '../owner'

type PanelTab = 'grants' | 'branding' | 'tokens' | 'testers'

interface SuperAdminPanelProps {
  children?: ReactNode
  /** Pre-built tab content — provided by App.tsx */
  grantsContent?: ReactNode
  brandingContent?: ReactNode
  tokensContent?: ReactNode
  testersContent?: ReactNode
}

const TAB_CONFIG: { key: PanelTab; label: string }[] = [
  { key: 'grants', label: 'Grants' },
  { key: 'branding', label: 'Branding' },
  { key: 'tokens', label: 'API Tokens' },
  { key: 'testers', label: 'Test Accounts' },
]

export function SuperAdminPanel({
  children,
  grantsContent,
  brandingContent,
  tokensContent,
  testersContent,
}: SuperAdminPanelProps) {
  const [activeTab, setActiveTab] = useState<PanelTab>('grants')

  const tabContent: Record<PanelTab, ReactNode> = {
    grants: grantsContent,
    branding: brandingContent,
    tokens: tokensContent,
    testers: testersContent,
  }

  return (
    <section className="superadmin-panel" data-superadmin="true">
      <div className="superadmin-header">
        <h2>{getOwnerLabel()} Controls</h2>
        <p className="hint">These controls are only visible to the {getOwnerLabel()} and delegated staff.</p>
      </div>

      <nav className="superadmin-tabs" role="tablist">
        {TAB_CONFIG.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={activeTab === tab.key}
            className={`superadmin-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="superadmin-tab-content" role="tabpanel">
        {tabContent[activeTab] ?? children}
      </div>
    </section>
  )
}
