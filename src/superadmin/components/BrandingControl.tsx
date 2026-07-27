/**
 * BrandingControl — logo upload and reset UI.
 *
 * Extracted verbatim from the inline "branding" tab block that used to live
 * directly inside src/App.tsx's SettingsPanel (StaffiQ build book Part 4
 * Medium priority #4, 27 Jul 2026). This is a pure code-organisation move:
 * same markup, same class names, same behaviour, same gating (only rendered
 * when activeTab === 'branding' in SettingsPanel, which is itself only
 * reachable from the Settings screen). Nothing about what the user sees or
 * how it behaves changed.
 *
 * Imports Branding, sidebarLogoDimensions, and LogoPlaceholder from
 * src/branding.tsx rather than duplicating them, since that module is the
 * single source of truth for those (App.tsx itself imports them from there
 * too, e.g. for BrandHeader) — this also avoids a circular import between
 * App.tsx and this file.
 */

import { Upload } from 'lucide-react'
import { type Branding, sidebarLogoDimensions, LogoPlaceholder } from '../../branding'

export interface BrandingControlProps {
  branding: Branding
  onLogoUpload: (file?: File) => void | Promise<void>
  onLogoReset: () => void
}

export function BrandingControl({ branding, onLogoUpload, onLogoReset }: BrandingControlProps) {
  return (
    <section className="panel branding-panel">
      <div className="panel-heading-row">
        <div>
          <h2>Platform logo</h2>
          <p>Admin-only logo control. Upload the organisation logo that appears at the top left of every admin and employee screen.</p>
        </div>
      </div>
      <div className="branding-control">
        <div className="logo-preview-card" aria-label="Current platform logo preview">
          {branding.logoUrl ? <img src={branding.logoUrl} alt="Current Training and assessment platform logo" /> : <LogoPlaceholder large />}
        </div>
        <div className="branding-actions">
          <label className="upload-button">
            <Upload size={18} /> Upload new logo
            <input
              type="file"
              accept="image/*"
              onChange={(event) => {
                void onLogoUpload(event.target.files?.[0])
                event.currentTarget.value = ''
              }}
            />
          </label>
          <button className="secondary-button" type="button" onClick={onLogoReset}>
            Remove logo
          </button>
          <p className="hint">Expected display slot: {sidebarLogoDimensions.width} x {sidebarLogoDimensions.height} px. Recommended upload: PNG, JPG, SVG, or WebP under 1.5 MB. Staffiq optimises raster logos before syncing them to every user.</p>
        </div>
      </div>
    </section>
  )
}
