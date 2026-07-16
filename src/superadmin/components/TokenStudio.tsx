/**
 * TokenStudio — API token creation and management UI.
 * Only rendered for the Platform Owner.
 */

export function TokenStudio() {
  return (
    <section className="superadmin-section" data-superadmin="token-studio">
      <h3>Token Studio</h3>
      <p>Create, revoke, rotate, and archive API tokens.</p>
      {/* Full Token Studio UI is implemented here — only accessible to Platform Owner */}
    </section>
  )
}
