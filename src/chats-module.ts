type ChatsContent = {
  title?: string
  body: string
  guidance?: string
  admin?: string
  shortcut?: string
}

type ChatsRegistryValue = string | ChatsContent

export type ChatsOptions = {
  enabled?: boolean
  hoverDelay?: number
  focusDelay?: number
  touchDelay?: number
  selector?: string
  registry?: Record<string, ChatsRegistryValue>
}

const tooltipId = 'chats-global-tooltip'
const defaultSelector = [
  '[data-tooltip]',
  '[data-tooltip-key]',
  'button',
  'a[href]',
  'input',
  'select',
  'textarea',
  '[role="button"]',
  '[role="tab"]',
  '[role="menuitem"]',
  '[role="switch"]',
  '[role="checkbox"]',
  '[role="radio"]',
  '[role="slider"]',
  '.metric-card',
  '.panel',
  '.status-pill',
  '.badge',
  '.live-signal',
  '.sync-indicator',
  '.token-status',
  '.score-badge',
  '.expiry-countdown-pill',
  '.timer',
  'th',
  'td',
].join(',')

const defaultOptions: Required<Pick<ChatsOptions, 'enabled' | 'hoverDelay' | 'focusDelay' | 'touchDelay' | 'selector' | 'registry'>> = {
  enabled: true,
  hoverDelay: 3000,
  focusDelay: 1000,
  touchDelay: 500,
  selector: defaultSelector,
  registry: {},
}

function words(value: string): string[] {
  return value.trim().split(/\s+/).filter(Boolean)
}

function trimWords(value: string, maximum = 60): string {
  const parts = words(value)
  return parts.length > maximum ? `${parts.slice(0, maximum).join(' ')}.` : value.trim()
}

function sentence(value: string): string {
  const trimmed = value.trim().replace(/\s+/g, ' ')
  if (!trimmed) return ''
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`
}

function visibleText(element: HTMLElement): string {
  const text = element.innerText || element.textContent || ''
  return text.replace(/\s+/g, ' ').trim()
}

function fieldLabel(element: HTMLElement): string {
  const ariaLabel = element.getAttribute('aria-label')
  if (ariaLabel) return ariaLabel.trim()
  const labelledBy = element.getAttribute('aria-labelledby')
  if (labelledBy) {
    const text = labelledBy
      .split(/\s+/)
      .map((id) => document.getElementById(id)?.textContent?.trim() ?? '')
      .filter(Boolean)
      .join(' ')
    if (text) return text
  }
  if (element.id) {
    const label = document.querySelector<HTMLLabelElement>(`label[for="${CSS.escape(element.id)}"]`)
    if (label?.innerText) return label.innerText.trim()
  }
  const parentLabel = element.closest('label')
  if (parentLabel instanceof HTMLElement) {
    const clone = parentLabel.cloneNode(true) as HTMLElement
    clone.querySelectorAll('input, textarea, select, button, svg').forEach((node) => node.remove())
    const text = clone.textContent?.trim()
    if (text) return text
  }
  const placeholder = element.getAttribute('placeholder')
  if (placeholder) return placeholder.trim()
  return visibleText(element)
}

function readableName(element: HTMLElement): string {
  return (
    fieldLabel(element) ||
    element.getAttribute('title')?.trim() ||
    element.getAttribute('name')?.trim() ||
    element.getAttribute('type')?.trim() ||
    element.tagName.toLowerCase()
  )
}

function isHidden(element: HTMLElement): boolean {
  if (element.hidden || element.getAttribute('aria-hidden') === 'true') return true
  const style = window.getComputedStyle(element)
  return style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0
}

function titleCase(value: string): string {
  return value
    .trim()
    .split(/\s+/)
    .slice(0, 5)
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(' ')
}

function navPurpose(label: string): string {
  const normalized = label.toLowerCase()
  if (normalized.includes('dashboard')) return 'review the main health signals, live tests, employee counts, and high-level capability trends'
  if (normalized.includes('question')) return 'manage uploaded question banks, search learning topics, and maintain assessment content'
  if (normalized.includes('test')) return 'launch, schedule, archive, extend, and refresh assessments for employees'
  if (normalized.includes('user')) return 'review employees, credentials, roles, and individual records'
  if (normalized.includes('analytic')) return 'filter performance data, compare users, and inspect intelligent decision metrics'
  if (normalized.includes('report')) return 'export workbooks, review activity, manage trash, and prepare governance records'
  if (normalized.includes('setting')) return 'change permissions, appearance, branding, and owner-only token settings'
  if (normalized.includes('help') || normalized.includes('learning')) return 'open lessons, FAQs, search, and AI help for self-service guidance'
  return `open the ${label} area and continue the related workflow`
}

function actionPurpose(label: string, element: HTMLElement): string {
  const normalized = label.toLowerCase()
  if (normalized.includes('delete')) return 'remove this item from the active view. Check the confirmation carefully before you continue.'
  if (normalized.includes('trash')) return 'move or review entries that are excluded from active reports and analytics.'
  if (normalized.includes('restore')) return 'bring this stored item back into the active system if it is still within the allowed recovery window.'
  if (normalized.includes('revoke')) return 'block this token or access item so connected systems can no longer use it.'
  if (normalized.includes('generate token')) return 'create a stored API token package using the selected token type and scope checkboxes.'
  if (normalized.includes('export') || normalized.includes('download')) return 'download the current data or report so it can be reviewed outside the portal.'
  if (normalized.includes('upload') || element instanceof HTMLInputElement && element.type === 'file') return 'choose a local file and import it into this workflow.'
  if (normalized.includes('refresh')) return 'pull the latest cloud-published state so the screen reflects recent admin changes.'
  if (normalized.includes('archive')) return 'store this item away from normal user portals while preserving its history.'
  if (normalized.includes('unarchive')) return 'return this stored item to active management so it can be scheduled or made available again.'
  if (normalized.includes('live') || normalized.includes('launch')) return 'control whether an assessment is visible and available for the selected users.'
  if (normalized.includes('save') || normalized.includes('update')) return 'save the current changes and sync them with the shared portal state.'
  if (normalized.includes('sign out')) return 'end this session and return to the sign-in screen.'
  if (normalized.includes('log in') || normalized.includes('sign in')) return 'submit your username and password to enter the portal.'
  if (normalized.includes('copy')) return 'copy the visible value to your clipboard so you can paste it elsewhere.'
  if (normalized.includes('start') || normalized.includes('take')) return 'begin the selected assessment. Make sure you are ready before you continue.'
  if (normalized.includes('next')) return 'move to the next step in this workflow.'
  if (normalized.includes('search')) return 'search within this section using the words you type.'
  return `run the ${label} action in the current workflow.`
}

function isAdminSurface(element: HTMLElement): boolean {
  if (element.dataset.tooltipAdmin) return true
  const text = readableName(element).toLowerCase()
  return Boolean(
    element.closest(
      '.api-token-console, .permissions-layout, .permission-table-panel, .question-bank-editor, .admin-test-card, .analytics-control-layout, .report-panel, .branding-panel, .appearance-settings-panel',
    ) ||
      element.classList.contains('danger-button') ||
      /\b(delete|remove|revoke|archive|unarchive|restore|reset|launch|live|token|permission|backup|import)\b/.test(text),
  )
}

function adminCopy(element: HTMLElement): string | undefined {
  const explicit = element.dataset.tooltipAdmin
  if (explicit) return sentence(explicit)
  if (!isAdminSurface(element)) return undefined
  const label = readableName(element).toLowerCase()
  if (/\b(delete|remove|revoke)\b/.test(label)) return 'This can remove access or active records. Confirm the target and keep an audit trail before proceeding.'
  if (/\barchive|unarchive|restore\b/.test(label)) return 'This changes what users can see while preserving stored history for reporting and review.'
  if (/\btoken\b/.test(label)) return 'Token actions affect external app access. Only Ayodeji Falope should create, copy, or revoke token packages.'
  if (/\bpermission\b/.test(label)) return 'Permission changes affect what users can see or do across the portal.'
  return 'Admin changes can affect shared portal data, user access, analytics, or reporting. Review the context before continuing.'
}

function normalizeRegistryValue(value: ChatsRegistryValue): ChatsContent {
  return typeof value === 'string' ? { body: value } : value
}

class ChatsModule {
  private options = { ...defaultOptions }
  private tooltip?: HTMLDivElement
  private currentTrigger?: HTMLElement
  private showTimer?: number
  private hideTimer?: number
  private observer?: MutationObserver
  private enabled = true
  private describedBy = new WeakMap<HTMLElement, string | null>()

  init(options: ChatsOptions = {}) {
    this.destroy()
    this.options = { ...defaultOptions, ...options, registry: { ...defaultOptions.registry, ...(options.registry ?? {}) } }
    this.enabled = this.options.enabled
    this.tooltip = document.createElement('div')
    this.tooltip.id = tooltipId
    this.tooltip.className = 'chats-tooltip'
    this.tooltip.setAttribute('role', 'tooltip')
    this.tooltip.setAttribute('aria-hidden', 'true')
    this.tooltip.hidden = true
    this.tooltip.addEventListener('mouseenter', this.handleTooltipEnter)
    this.tooltip.addEventListener('mouseleave', this.handleTooltipLeave)
    document.body.appendChild(this.tooltip)
    document.addEventListener('mouseenter', this.handleMouseEnter, true)
    document.addEventListener('mouseleave', this.handleMouseLeave, true)
    document.addEventListener('focusin', this.handleFocusIn, true)
    document.addEventListener('focusout', this.handleFocusOut, true)
    document.addEventListener('touchstart', this.handleTouchStart, { capture: true, passive: true })
    document.addEventListener('touchend', this.handleTouchEnd, true)
    document.addEventListener('touchcancel', this.handleTouchEnd, true)
    document.addEventListener('click', this.handleDocumentClick, true)
    document.addEventListener('keydown', this.handleKeyDown)
    window.addEventListener('resize', this.reposition)
    window.addEventListener('scroll', this.reposition, true)
    this.observer = new MutationObserver((records) => {
      records.forEach((record) => {
        record.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) this.scan(node)
        })
      })
    })
    this.observer.observe(document.documentElement, { childList: true, subtree: true })
    if (this.enabled) this.scan(document.body)
    document.documentElement.dataset.chatsEnabled = this.enabled ? 'true' : 'false'
  }

  destroy() {
    this.clearTimers()
    this.hide(true)
    this.observer?.disconnect()
    this.observer = undefined
    document.removeEventListener('mouseenter', this.handleMouseEnter, true)
    document.removeEventListener('mouseleave', this.handleMouseLeave, true)
    document.removeEventListener('focusin', this.handleFocusIn, true)
    document.removeEventListener('focusout', this.handleFocusOut, true)
    document.removeEventListener('touchstart', this.handleTouchStart, true)
    document.removeEventListener('touchend', this.handleTouchEnd, true)
    document.removeEventListener('touchcancel', this.handleTouchEnd, true)
    document.removeEventListener('click', this.handleDocumentClick, true)
    document.removeEventListener('keydown', this.handleKeyDown)
    window.removeEventListener('resize', this.reposition)
    window.removeEventListener('scroll', this.reposition, true)
    this.tooltip?.remove()
    this.tooltip = undefined
    this.currentTrigger = undefined
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled
    document.documentElement.dataset.chatsEnabled = enabled ? 'true' : 'false'
    if (!enabled) {
      this.clearTimers()
      this.hide(true)
      return
    }
    this.scan(document.body)
  }

  setRegistry(registry: Record<string, ChatsRegistryValue>) {
    this.options.registry = { ...registry }
  }

  private scan(root: HTMLElement) {
    if (!this.enabled) return
    const candidates = [root, ...Array.from(root.querySelectorAll<HTMLElement>(this.options.selector))]
    candidates.forEach((element) => {
      if (element === this.tooltip || element.closest('.chats-tooltip')) return
      if (!this.resolveContent(element)) return
      this.ensureDescribedBy(element)
    })
  }

  private ensureDescribedBy(element: HTMLElement) {
    if (!this.describedBy.has(element)) this.describedBy.set(element, element.getAttribute('aria-describedby'))
    const current = element.getAttribute('aria-describedby') ?? ''
    const parts = current.split(/\s+/).filter(Boolean)
    if (!parts.includes(tooltipId)) element.setAttribute('aria-describedby', [...parts, tooltipId].join(' '))
  }

  private triggerFrom(target: EventTarget | null): HTMLElement | undefined {
    if (!this.enabled || !(target instanceof Element)) return undefined
    const element = target.closest<HTMLElement>(this.options.selector)
    if (!element || element === this.tooltip || this.tooltip?.contains(element) || element.dataset.tooltipDisabled === 'true') return undefined
    if (isHidden(element)) return undefined
    return this.resolveContent(element) ? element : undefined
  }

  private resolveContent(element: HTMLElement): ChatsContent | undefined {
    const registryKey = element.dataset.tooltipKey
    if (registryKey && this.options.registry[registryKey]) return this.withAdmin(element, normalizeRegistryValue(this.options.registry[registryKey]))
    if (element.dataset.tooltip) {
      return this.withAdmin(element, {
        title: element.dataset.tooltipTitle,
        body: sentence(element.dataset.tooltip),
        guidance: element.dataset.tooltipGuidance ? sentence(element.dataset.tooltipGuidance) : undefined,
        shortcut: element.dataset.tooltipShortcut,
      })
    }
    return this.withAdmin(element, this.fallbackContent(element))
  }

  private withAdmin(element: HTMLElement, content: ChatsContent | undefined): ChatsContent | undefined {
    if (!content) return undefined
    return {
      ...content,
      body: trimWords(sentence(content.body), 60),
      guidance: content.guidance ? trimWords(sentence(content.guidance), 24) : undefined,
      admin: content.admin ?? adminCopy(element),
    }
  }

  private fallbackContent(element: HTMLElement): ChatsContent | undefined {
    const label = readableName(element)
    if (!label) return undefined
    if (element.classList.contains('panel')) {
      const heading = element.querySelector('h1, h2, h3')?.textContent?.trim()
      const title = heading || label.slice(0, 60)
      return { title: titleCase(title.length > 60 ? `${title.slice(0, 57)}...` : title), body: `This panel groups related controls and information so you can review the context before taking action.` }
    }
    if (label.length > 120) return undefined
    if (element.closest('nav') || element.getAttribute('role') === 'tab') {
      return { title: titleCase(label), body: `Open this area to ${navPurpose(label)}.` }
    }
    if (element instanceof HTMLButtonElement || element.getAttribute('role') === 'button') {
      return { title: titleCase(label), body: `You can use this to ${actionPurpose(label, element)}` }
    }
    if (element instanceof HTMLInputElement) {
      if (element.type === 'checkbox' || element.type === 'radio') {
        return { title: titleCase(label), body: `Use this option to turn ${label} on or off for this workflow.` }
      }
      if (element.type === 'file') return { title: 'File upload', body: 'Choose a supported file from your device and import it into this section.' }
      return { title: titleCase(label), body: `Enter ${label.toLowerCase()} here. Follow the format requested by this form before saving or submitting.` }
    }
    if (element instanceof HTMLSelectElement) {
      return { title: titleCase(label), body: `Choose one option from this list to filter, configure, or complete the current workflow.` }
    }
    if (element instanceof HTMLTextAreaElement) {
      return { title: titleCase(label), body: `Type the longer notes or message needed for this section. Keep the wording clear before submitting.` }
    }
    if (element.classList.contains('metric-card')) {
      const metricLabel = visibleText(element).replace(/\d+%?/, '').trim() || 'Metric'
      return { title: titleCase(metricLabel), body: `This summary card shows a key portal metric. Use it to quickly understand the current state before opening deeper details.` }
    }
    if (element.classList.contains('status-pill') || element.classList.contains('badge') || element.classList.contains('token-status') || element.classList.contains('score-badge')) {
      return { title: titleCase(label), body: `This status label tells you the current state of the item beside it.` }
    }
    if (element.classList.contains('sync-indicator')) {
      return { title: 'Cloud sync', body: 'This shows whether the latest changes are saved to the cloud, still saving, delayed, or offline.' }
    }
    if (element.classList.contains('timer')) {
      return { title: 'Question timer', body: 'This countdown shows how much time remains for the current question before the answer is revealed.' }
    }
    if (element instanceof HTMLTableCellElement) {
      return { title: element.tagName === 'TH' ? 'Table column' : 'Table value', body: 'This table entry is part of the current report or list. Read across the row to understand the full record.' }
    }
    if (element instanceof HTMLAnchorElement) {
      return { title: titleCase(label), body: `Open this link to view the related resource or section.` }
    }
    return undefined
  }

  private schedule(trigger: HTMLElement, mode: 'mouse' | 'focus' | 'touch') {
    if (!this.enabled) return
    if (this.currentTrigger && this.currentTrigger !== trigger) this.hide(true)
    this.currentTrigger = trigger
    this.ensureDescribedBy(trigger)
    this.clearTimers()
    const delay = mode === 'touch' ? this.options.touchDelay : mode === 'focus' ? this.options.focusDelay : this.options.hoverDelay
    this.showTimer = window.setTimeout(() => this.show(trigger), delay)
  }

  private show(trigger: HTMLElement) {
    const content = this.resolveContent(trigger)
    if (!content || !this.tooltip) return
    this.render(content)
    this.tooltip.hidden = false
    this.tooltip.setAttribute('aria-hidden', 'false')
    this.tooltip.classList.remove('is-leaving')
    this.reposition()
    requestAnimationFrame(() => this.tooltip?.classList.add('is-visible'))
  }

  private render(content: ChatsContent) {
    if (!this.tooltip) return
    this.tooltip.replaceChildren()
    if (content.title) {
      const title = document.createElement('strong')
      title.className = 'chats-tooltip__title'
      title.textContent = trimWords(content.title, 8)
      this.tooltip.appendChild(title)
    }
    const body = document.createElement('p')
    body.textContent = trimWords(content.body, 60)
    this.tooltip.appendChild(body)
    if (content.guidance) {
      const guidance = document.createElement('p')
      guidance.className = 'chats-tooltip__guidance'
      guidance.textContent = trimWords(content.guidance, 24)
      this.tooltip.appendChild(guidance)
    }
    if (content.admin) {
      const admin = document.createElement('p')
      admin.className = 'chats-tooltip__admin'
      admin.textContent = `Admin note: ${trimWords(content.admin, 24)}`
      this.tooltip.appendChild(admin)
    }
    if (content.shortcut) {
      const shortcut = document.createElement('span')
      shortcut.className = 'chats-tooltip__shortcut'
      shortcut.textContent = content.shortcut
      this.tooltip.appendChild(shortcut)
    }
  }

  private reposition = () => {
    if (!this.tooltip || this.tooltip.hidden || !this.currentTrigger) return
    const gap = 10
    const margin = 8
    const triggerRect = this.currentTrigger.getBoundingClientRect()
    this.tooltip.style.left = '0px'
    this.tooltip.style.top = '0px'
    const tooltipRect = this.tooltip.getBoundingClientRect()
    let placement: 'top' | 'bottom' = 'top'
    let top = triggerRect.top - tooltipRect.height - gap
    if (top < margin) {
      placement = 'bottom'
      top = triggerRect.bottom + gap
    }
    if (top + tooltipRect.height > window.innerHeight - margin) top = Math.max(margin, window.innerHeight - tooltipRect.height - margin)
    let left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2
    left = Math.max(margin, Math.min(left, window.innerWidth - tooltipRect.width - margin))
    this.tooltip.dataset.placement = placement
    this.tooltip.style.left = `${Math.round(left)}px`
    this.tooltip.style.top = `${Math.round(top)}px`
  }

  private hide(immediate = false) {
    this.clearTimers()
    if (!this.tooltip) return
    if (immediate) {
      this.tooltip.hidden = true
      this.tooltip.classList.remove('is-visible', 'is-leaving')
      this.tooltip.setAttribute('aria-hidden', 'true')
      this.currentTrigger = undefined
      return
    }
    this.tooltip.classList.remove('is-visible')
    this.tooltip.classList.add('is-leaving')
    this.hideTimer = window.setTimeout(() => {
      if (!this.tooltip) return
      this.tooltip.hidden = true
      this.tooltip.classList.remove('is-leaving')
      this.tooltip.setAttribute('aria-hidden', 'true')
      this.currentTrigger = undefined
    }, 150)
  }

  private clearTimers() {
    if (this.showTimer) window.clearTimeout(this.showTimer)
    if (this.hideTimer) window.clearTimeout(this.hideTimer)
    this.showTimer = undefined
    this.hideTimer = undefined
  }

  private handleMouseEnter = (event: MouseEvent) => {
    const trigger = this.triggerFrom(event.target)
    if (trigger) this.schedule(trigger, 'mouse')
  }

  private handleMouseLeave = (event: MouseEvent) => {
    if (!this.currentTrigger || event.target !== this.currentTrigger) return
    const related = event.relatedTarget
    if (related instanceof Node && (this.tooltip?.contains(related) || this.currentTrigger.contains(related))) return
    this.hide()
  }

  private handleFocusIn = (event: FocusEvent) => {
    const trigger = this.triggerFrom(event.target)
    if (trigger) this.schedule(trigger, 'focus')
  }

  private handleFocusOut = (event: FocusEvent) => {
    if (!this.currentTrigger || event.target !== this.currentTrigger) return
    const related = event.relatedTarget
    if (related instanceof Node && this.tooltip?.contains(related)) return
    this.hide()
  }

  private handleTouchStart = (event: TouchEvent) => {
    const trigger = this.triggerFrom(event.target)
    if (trigger) this.schedule(trigger, 'touch')
  }

  private handleTouchEnd = () => {
    if (!this.tooltip?.classList.contains('is-visible')) this.clearTimers()
  }

  private handleDocumentClick = (event: MouseEvent) => {
    const target = event.target
    if (target instanceof Node && (this.tooltip?.contains(target) || this.currentTrigger?.contains(target))) return
    this.hide()
  }

  private handleTooltipEnter = () => {
    if (this.hideTimer) window.clearTimeout(this.hideTimer)
  }

  private handleTooltipLeave = (event: MouseEvent) => {
    const related = event.relatedTarget
    if (related instanceof Node && this.currentTrigger?.contains(related)) return
    this.hide()
  }

  private handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') this.hide()
  }
}

export const CHATS = new ChatsModule()
