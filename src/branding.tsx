/**
 * Shared platform branding primitives.
 *
 * Extracted out of src/App.tsx (StaffiQ build book Part 4 Medium priority
 * #4, 27 Jul 2026) so that src/superadmin/components/BrandingControl.tsx
 * can share the same Branding type, sidebarLogoDimensions, and
 * LogoPlaceholder used throughout App.tsx (e.g. BrandHeader) without
 * creating a circular import between App.tsx and the extracted component.
 * App.tsx imports these from here now instead of defining them locally;
 * nothing about their shape or behaviour changed.
 */

export interface Branding {
  logoUrl: string
}

export const sidebarLogoDimensions = {
  width: 88,
  height: 52,
}

export function LogoPlaceholder({ large = false }: { large?: boolean }) {
  return (
    <span className={`brand-logo-placeholder ${large ? 'large' : ''}`.trim()}>
      <strong>Logo slot</strong>
      <em>{sidebarLogoDimensions.width} x {sidebarLogoDimensions.height} px</em>
    </span>
  )
}
