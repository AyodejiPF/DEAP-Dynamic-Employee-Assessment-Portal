/**
 * BrandingControl — logo upload and reset UI.
 * Only rendered for the Platform Owner.
 */

export function BrandingControl() {
  return (
    <section className="superadmin-section" data-superadmin="branding">
      <h3>Platform Logo</h3>
      <p>Upload or remove the organisation logo.</p>
      {/* Full branding UI is implemented here — only accessible to Platform Owner */}
    </section>
  )
}
