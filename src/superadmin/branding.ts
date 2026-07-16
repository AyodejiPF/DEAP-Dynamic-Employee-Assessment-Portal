/**
 * SuperAdmin branding control — logo upload and reset.
 * These operations are restricted to the Platform Owner only.
 */

const logoUploadMaxBytes = 1_500_000
const logoCloudMaxBytes = 420_000

/**
 * Stores an uploaded organisation logo so every shared app surface uses it.
 */
export async function updatePlatformLogo(
  file: File | undefined,
  context: {
    onSetToast: (message: string) => void
    onSetBranding: (branding: { logoUrl: string }) => void
    onPublishSharedState: (state: { branding: { logoUrl: string } }) => void
    onRecordAudit: (action: string, detail: string) => void
    onRecordAnalytics: (event: string, data: Record<string, unknown>) => void
  },
): Promise<void> {
  const { onSetToast, onSetBranding, onPublishSharedState, onRecordAudit, onRecordAnalytics } = context

  if (!file) return
  if (!file.type.startsWith('image/')) {
    onSetToast('Please upload an image file for the platform logo.')
    return
  }
  if (file.size > logoUploadMaxBytes) {
    onSetToast('Please upload a logo smaller than 1.5 MB.')
    return
  }
  try {
    const nextBranding = { logoUrl: await prepareLogoDataUrl(file) }
    onSetBranding(nextBranding)
    onPublishSharedState({ branding: nextBranding })
    onRecordAudit('Logo updated', `${file.name} was uploaded as the platform logo.`)
    onRecordAnalytics('logo_updated', { outcome: 'uploaded', metadata: { filename: file.name, bytes: file.size } })
    onSetToast('Platform logo updated and synced. It now appears across admin and user dashboards.')
  } catch (error) {
    onSetToast(error instanceof Error ? error.message : 'Logo upload failed. Please try another image file.')
  }
}

/**
 * Clears the logo slot so the platform shows the upload placeholder.
 */
export function resetPlatformLogo(
  context: {
    defaultBranding: { logoUrl: string }
    onSetToast: (message: string) => void
    onSetBranding: (branding: { logoUrl: string }) => void
    onPublishSharedState: (state: { branding: { logoUrl: string } }) => void
    onRecordAudit: (action: string, detail: string) => void
    onRecordAnalytics: (event: string, data: Record<string, unknown>) => void
  },
): void {
  const { defaultBranding, onSetToast, onSetBranding, onPublishSharedState, onRecordAudit, onRecordAnalytics } = context

  onSetBranding(defaultBranding)
  onPublishSharedState({ branding: defaultBranding })
  onRecordAudit('Logo cleared', 'The platform logo slot was reset to the upload placeholder.')
  onRecordAnalytics('logo_restored', { outcome: 'placeholder_restored' })
  onSetToast('The logo slot has been cleared and synced for all users.')
}

// ─── Helpers ─────────────────────────────────────────────────────

async function prepareLogoDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Please upload an image file for the platform logo.')
  if (file.size > logoUploadMaxBytes) throw new Error('Please upload a logo under 1.5 MB.')

  const rawDataUrl = await readFileAsDataUrl(file)

  if (file.type === 'image/svg+xml') {
    if (dataUrlByteSize(rawDataUrl) > logoCloudMaxBytes) throw new Error('Please upload a smaller SVG logo so it can sync to every user.')
    return rawDataUrl
  }

  const optimised = await optimiseRasterLogo(rawDataUrl, file.type)
  if (dataUrlByteSize(optimised) > logoCloudMaxBytes) throw new Error('Please upload a smaller logo or a simpler image.')
  return optimised
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to read the image file.'))
    reader.readAsDataURL(file)
  })
}

function dataUrlByteSize(dataUrl: string): number {
  const base64 = dataUrl.split(',')[1] ?? ''
  return Math.ceil(base64.length * 0.75)
}

async function optimiseRasterLogo(dataUrl: string, mimeType: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const maxDimension = 300
      let { width, height } = img
      if (width > maxDimension || height > maxDimension) {
        const ratio = Math.min(maxDimension / width, maxDimension / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('Canvas context unavailable.')); return }
      ctx.drawImage(img, 0, 0, width, height)
      const quality = 0.8
      const optimised = canvas.toDataURL(mimeType === 'image/png' ? 'image/png' : 'image/jpeg', quality)
      resolve(optimised)
    }
    img.onerror = () => reject(new Error('Failed to optimise the logo image.'))
    img.src = dataUrl
  })
}
