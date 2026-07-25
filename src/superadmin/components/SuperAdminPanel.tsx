/**
 * SuperAdminPanel — the root container for all Platform Owner functionality.
 * This component is only rendered when the current user is the Platform Owner.
 *
 * Tabs:
 *   - Grants          — Delegate billing duties to trusted staff
 *   - Branding        — Platform branding controls
 *   - Tokens          — API token management
 *   - Testers         — Tester account management
 *   - Feature Parity  — StaffiQ vs Task Pulse dynamic record
 *   - Version Tracker — Dated catalogue of every recorded StaffiQ change, filterable, with a scoped Q&A box
 */

import { useState, type ReactNode } from 'react'
import { getOwnerLabel } from '../owner'
import { VersionTrackerPanel } from './VersionTrackerPanel'
import { ApiKeysUsagePanel } from './ApiKeysUsagePanel'

type PanelTab = 'grants' | 'branding' | 'tokens' | 'testers' | 'parity' | 'versionTracker' | 'apiKeys'

interface SuperAdminPanelProps {
  children?: ReactNode
  /** Pre-built tab content — provided by App.tsx */
  grantsContent?: ReactNode
  brandingContent?: ReactNode
  tokensContent?: ReactNode
  testersContent?: ReactNode
  /** Feature Parity dynamic record vs Task Pulse — see FeatureParityPanel.tsx */
  parityContent?: ReactNode
  /** Version Tracker and Feature Update — see VersionTrackerPanel.tsx. Self-contained, no props required. */
  versionTrackerContent?: ReactNode
  /** Client API Keys and Usage — see ApiKeysUsagePanel.tsx. Self-contained, no props required. */
  apiKeysContent?: ReactNode
}

const TAB_CONFIG: { key: PanelTab; label: string }[] = [
  { key: 'grants', label: 'Grants' },
  { key: 'branding', label: 'Branding' },
  { key: 'tokens', label: 'API Tokens' },
  { key: 'testers', label: 'Test Accounts' },
  { key: 'parity', label: 'Feature Parity' },
  { key: 'versionTracker', label: 'Version Tracker' },
  { key: 'apiKeys', label: 'Client API Keys' },
]

export function SuperAdminPanel({
  children,
  grantsContent,
  brandingContent,
  tokensContent,
  testersContent,
  parityContent,
  versionTrackerContent,
  apiKeysContent,
}: SuperAdminPanelProps) {
  const [activeTab, setActiveTab] = useState<PanelTab>('grants')

  const tabContent: Record<PanelTab, ReactNode> = {
    grants: grantsContent,
    branding: brandingContent,
    tokens: tokensContent,
    testers: testersContent,
    parity: parityContent,
    // VersionTrackerPanel needs no external data, so it defaults itself in when
    // App.tsx has not (yet) wired versionTrackerContent — same reasoning as why
    // FeatureParityPanel is self-contained, but this tab also renders out of
    // the box without requiring App.tsx integration first.
    versionTracker: versionTrackerContent ?? <VersionTrackerPanel />,
    // Same reasoning again: renders out of the box, tenant ID typed in by hand,
    // until App.tsx wires a real tenant picker through apiKeysContent.
    apiKeys: apiKeysContent ?? <ApiKeysUsagePanel />,
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
