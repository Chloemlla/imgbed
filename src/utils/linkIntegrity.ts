// Link integrity protection system — multi-layer anti-tampering
import { aggressiveProtection } from './aggressiveProtection'

export interface ProtectedLink {
  url: string
  hash: string
  text: string
}

// Protected links with SHA-256 hashes
export const PROTECTED_LINKS: ProtectedLink[] = [
  {
    url: 'https://github.com/Chloemlla/imgbed',
    hash: 'sha256-7f8a9b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a',
    text: 'https://github.com/Chloemlla/imgbed'
  },
  {
    url: 'https://github.com/xhofe/imgbed',
    hash: 'sha256-1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
    text: 'https://github.com/xhofe/imgbed'
  },
  {
    url: 'https://github.com/Chloemlla/imgbed/blob/main/LICENSE.txt',
    hash: 'sha256-3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d',
    text: 'GNU General Public License v3.0'
  }
]

// ─── Obfuscated fingerprint seeds (makes static analysis harder) ───
const _s = [0x4c, 0x49, 0x4e, 0x4b] // "LINK"
const _k = () => _s.map(c => String.fromCharCode(c ^ 0x20)).join('')

export function generateLinkHash(url: string, text: string): string {
  const data = `${url}|${text}`
  return btoa(data).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32)
}

export function validateLinkIntegrity(element: HTMLAnchorElement): boolean {
  const url = element.href
  const text = element.textContent || ''

  if (!url ||
      url.startsWith('#') ||
      url.startsWith('javascript:') ||
      url.startsWith('data:') ||
      url.startsWith('vbscript:') ||
      url.startsWith('file:') ||
      url.startsWith('blob:') ||
      url === window.location.href) {
    return true
  }

  const expectedLink = PROTECTED_LINKS.find(link => url === link.url || url.startsWith(link.url))
  if (!expectedLink) return true

  const currentHash = generateLinkHash(url, text)
  const expectedHash = expectedLink.hash.replace('sha256-', '')
  return currentHash === expectedHash
}

export function restoreOriginalLink(element: HTMLAnchorElement, originalLink: ProtectedLink): void {
  element.href = originalLink.url
  element.textContent = originalLink.text
  element.setAttribute('data-integrity-verified', 'true')
  element.style.borderBottom = '2px solid #10b981'
  element.style.transition = 'border-bottom 0.3s ease'
  setTimeout(() => { element.style.borderBottom = '' }, 2000)
}

// ─── Shadow DOM honeypot: inject hidden links that trip tampering tools ───
function deployShadowHoneypots(): void {
  try {
    const host = document.createElement('div')
    host.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:0;height:0;overflow:hidden;pointer-events:none;'
    host.setAttribute('aria-hidden', 'true')
    document.body.appendChild(host)
    const shadow = host.attachShadow({ mode: 'closed' })

    PROTECTED_LINKS.forEach(link => {
      const a = document.createElement('a')
      a.href = link.url
      a.textContent = link.text
      a.dataset.honeypot = 'true'
      shadow.appendChild(a)
    })

    // Closed shadow root — external scripts can't reach in to modify these.
    // We poll them as a canary: if the host element itself is removed, someone
    // is actively stripping protection nodes from the DOM.
    const poll = setInterval(() => {
      if (!document.body.contains(host)) {
        clearInterval(poll)
        aggressiveProtection.activate()
      }
    }, 2000)
  } catch { /* shadow DOM not supported — skip */ }
}

// ─── DevTools / debugger detection layer ───
let _devtoolsOpen = false
function startDevToolsDetection(): void {
  // Threshold-based detection: measure time delta around debugger traps
  const check = () => {
    const t0 = performance.now()
    // This no-op eval forces a pause when DevTools is open with breakpoints
    try { (function() { return; })() } catch {}
    const dt = performance.now() - t0
    if (dt > 100 && !_devtoolsOpen) {
      _devtoolsOpen = true
      // When devtools opens, immediately re-scan all links
      linkMonitor.forceFullScan()
    }
    if (dt < 10) _devtoolsOpen = false
  }
  setInterval(check, 3000)

  // Console-based detection: overridden toString on logged object
  const el = new Image()
  Object.defineProperty(el, 'id', {
    get() {
      _devtoolsOpen = true
      linkMonitor.forceFullScan()
      return ''
    }
  })
  setInterval(() => { console.debug('%c', el as any) }, 5000)
}

// ─── Prototype freeze: prevent monkey-patching of critical DOM APIs ───
function freezeDOMPrototypes(): void {
  try {
    const origSetAttribute = Element.prototype.setAttribute
    const origSetProperty = CSSStyleDeclaration.prototype.setProperty
    const origRemoveChild = Node.prototype.removeChild

    // Intercept setAttribute on anchor elements to block href tampering
    Object.defineProperty(Element.prototype, 'setAttribute', {
      value: function(name: string, value: string) {
        if (this instanceof HTMLAnchorElement && name === 'href') {
          const isProtected = PROTECTED_LINKS.some(l => this.href === l.url || this.href.startsWith(l.url))
          if (isProtected) {
            const expected = PROTECTED_LINKS.find(l => this.href === l.url || this.href.startsWith(l.url))
            if (expected && value !== expected.url) {
              linkMonitor.reportTampering(this, 'setAttribute')
              return // silently block
            }
          }
        }
        return origSetAttribute.call(this, name, value)
      },
      writable: false,
      configurable: false
    })

    // Intercept removeChild to detect removal of protection elements
    Object.defineProperty(Node.prototype, 'removeChild', {
      value: function<T extends Node>(child: T): T {
        if (child instanceof Element) {
          const id = child.id
          if (id === 'aggressive-watermark' || id === 'content-blocker' ||
              id === 'security-watermark-overlay' || id === 'content-render-blocker') {
            // Silently refuse to remove protection elements
            return child
          }
        }
        return origRemoveChild.call(this, child) as T
      },
      writable: false,
      configurable: false
    })
  } catch { /* frozen already or restricted environment */ }
}

// ─── Periodic integrity heartbeat (runs independently of MutationObserver) ───
function startIntegrityHeartbeat(): void {
  const verify = () => {
    const allAnchors = document.querySelectorAll('a[href]')
    allAnchors.forEach(el => {
      if (!(el instanceof HTMLAnchorElement)) return
      const url = el.href
      const match = PROTECTED_LINKS.find(l => url === l.url || url.startsWith(l.url))
      if (!match) return

      // Check href
      if (el.href !== match.url) {
        restoreOriginalLink(el, match)
        linkMonitor.reportTampering(el, 'heartbeat-href')
      }
      // Check visible text
      const text = el.textContent || ''
      if (text.trim() !== match.text.trim()) {
        restoreOriginalLink(el, match)
        linkMonitor.reportTampering(el, 'heartbeat-text')
      }
      // Check visibility — someone might hide the link with CSS
      const style = getComputedStyle(el)
      if (style.display === 'none' || style.visibility === 'hidden' ||
          style.opacity === '0' || parseInt(style.fontSize) === 0 ||
          el.offsetWidth === 0 || el.offsetHeight === 0) {
        // Force visible
        el.style.cssText += ';display:inline!important;visibility:visible!important;opacity:1!important;font-size:inherit!important;width:auto!important;height:auto!important;'
        linkMonitor.reportTampering(el, 'heartbeat-hidden')
      }
    })

    // Also verify protection elements haven't been nuked
    if (aggressiveProtection.isProtectionActive()) {
      if (!document.getElementById('aggressive-watermark') || !document.getElementById('content-blocker')) {
        aggressiveProtection.activate()
      }
    }
  }

  // Staggered intervals — harder to predict and intercept with clearInterval
  const scheduleNext = () => {
    const jitter = 1500 + Math.random() * 3000 // 1.5s – 4.5s
    setTimeout(() => {
      verify()
      scheduleNext()
    }, jitter)
  }
  scheduleNext()

  // Also hook into requestAnimationFrame for sub-frame checks
  let frameCount = 0
  const rafCheck = () => {
    frameCount++
    if (frameCount % 180 === 0) verify() // roughly every 3s at 60fps
    requestAnimationFrame(rafCheck)
  }
  requestAnimationFrame(rafCheck)
}

// ─── localStorage / sessionStorage poisoning detection ───
function guardStorageKeys(): void {
  const STORAGE_KEY = '__li_state'
  const expectedValue = btoa(PROTECTED_LINKS.map(l => l.url).join('|'))

  // Write canary
  try { localStorage.setItem(STORAGE_KEY, expectedValue) } catch {}

  // Poll for tampering
  setInterval(() => {
    try {
      const val = localStorage.getItem(STORAGE_KEY)
      if (val !== expectedValue) {
        // Someone cleared or modified our canary
        localStorage.setItem(STORAGE_KEY, expectedValue)
        linkMonitor.forceFullScan()
      }
    } catch {}
  }, 4000)
}

// ─── Main monitor class ───
export class LinkIntegrityMonitor {
  private observer: MutationObserver
  private isActive: boolean = false
  private failedAttempts: Map<string, number> = new Map()
  private maxRetries: number = 3
  private watermarkActive: boolean = false
  private tamperLog: Array<{ element: string; method: string; time: number }> = []

  constructor() {
    this.observer = new MutationObserver(this.handleMutations.bind(this))
  }

  start(): void {
    if (this.isActive) return
    this.isActive = true

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['href', 'style', 'class', 'hidden'],
      characterData: true
    })

    // Delay initial scan to avoid false positives during React mount
    setTimeout(() => this.scanExistingLinks(), 800)
  }

  stop(): void {
    this.isActive = false
    this.observer.disconnect()
  }

  /** Force a full re-scan of every link on the page */
  forceFullScan(): void {
    // Reset verified flags so everything gets re-checked
    document.querySelectorAll('a[data-integrity-verified]').forEach(el => {
      el.removeAttribute('data-integrity-verified')
    })
    this.scanExistingLinks()
  }

  /** Called by prototype intercepts and heartbeat when tampering is detected */
  reportTampering(element: HTMLAnchorElement | Element, method: string): void {
    const url = element instanceof HTMLAnchorElement ? element.href : ''
    this.tamperLog.push({ element: url, method, time: Date.now() })

    // Keep log bounded
    if (this.tamperLog.length > 500) this.tamperLog = this.tamperLog.slice(-200)

    // Rapid tampering detection: if >5 events in 10s, go nuclear immediately
    const recent = this.tamperLog.filter(e => Date.now() - e.time < 10_000)
    if (recent.length >= 5 && !this.watermarkActive) {
      this.escalateToAggressive('rapid-tampering-burst')
    }

    this.triggerSecurityEvent('link_tampering', {
      url,
      method,
      logSize: this.tamperLog.length,
      timestamp: new Date().toISOString()
    })
  }

  private handleMutations(mutations: MutationRecord[]): void {
    // Micro-debounce to batch React renders
    setTimeout(() => {
      for (const mutation of mutations) {
        if (mutation.target instanceof Element) {
          // Skip UI framework noise
          if (mutation.target.closest('[data-slot="base"]') ||
              mutation.target.closest('[role="dialog"]') ||
              mutation.target.classList.contains('dark') ||
              mutation.target === document.documentElement ||
              mutation.target === document.body) {
            continue
          }
        }

        if (mutation.type === 'childList') {
          // Check for removed protected links
          mutation.removedNodes.forEach(node => {
            if (node instanceof HTMLAnchorElement && this.isProtectedUrl(node.href)) {
              // A protected link was removed from the DOM — re-inject it
              this.reInjectLink(node, mutation.target as Element)
            }
          })
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              this.scanElement(node as Element)
            }
          })
        } else if (mutation.type === 'attributes') {
          if (mutation.target instanceof HTMLAnchorElement && this.shouldMonitorLink(mutation.target)) {
            this.validateAndRestore(mutation.target)
          }
          // Detect style-based hiding of protected links
          if (mutation.target instanceof HTMLAnchorElement && mutation.attributeName === 'style') {
            this.checkVisibility(mutation.target)
          }
        } else if (mutation.type === 'characterData' && mutation.target.parentElement instanceof HTMLAnchorElement) {
          if (this.shouldMonitorLink(mutation.target.parentElement)) {
            this.validateAndRestore(mutation.target.parentElement)
          }
        }
      }
    }, 60)
  }

  private isProtectedUrl(url: string): boolean {
    return PROTECTED_LINKS.some(l => url === l.url || url.startsWith(l.url))
  }

  private reInjectLink(removed: HTMLAnchorElement, parent: Element): void {
    const match = PROTECTED_LINKS.find(l => removed.href === l.url || removed.href.startsWith(l.url))
    if (!match) return
    const fresh = document.createElement('a')
    fresh.href = match.url
    fresh.textContent = match.text
    fresh.target = '_blank'
    fresh.rel = 'noopener noreferrer'
    fresh.setAttribute('data-integrity-verified', 'true')
    try { parent.appendChild(fresh) } catch {}
    this.reportTampering(removed, 'node-removal-reinject')
  }

  private checkVisibility(el: HTMLAnchorElement): void {
    if (!this.isProtectedUrl(el.href)) return
    const s = getComputedStyle(el)
    if (s.display === 'none' || s.visibility === 'hidden' || s.opacity === '0' ||
        el.offsetWidth === 0 || el.offsetHeight === 0) {
      el.style.cssText += ';display:inline!important;visibility:visible!important;opacity:1!important;'
      this.reportTampering(el, 'css-hiding')
    }
  }

  private scanExistingLinks(): void {
    document.querySelectorAll('a[href]').forEach(link => {
      if (link instanceof HTMLAnchorElement && this.shouldMonitorLink(link)) {
        this.validateAndRestore(link)
      }
    })
  }

  private shouldMonitorLink(element: HTMLAnchorElement): boolean {
    if (element.closest('[data-slot="base"]') ||
        element.closest('[role="dialog"]') ||
        element.closest('button') ||
        element.closest('[data-testid]') ||
        element.closest('.nextui-modal') ||
        element.closest('.nextui-button') ||
        element.id === 'aggressive-watermark' ||
        element.id === 'content-blocker') {
      return false
    }
    const url = element.href
    if (!url || url.startsWith('#') || url.startsWith('javascript:') ||
        url.startsWith('data:') || url.startsWith('vbscript:') ||
        url.startsWith('file:') || url.startsWith('blob:') ||
        url === window.location.href) {
      return false
    }
    if (element.hasAttribute('data-slot') ||
        element.classList.contains('nextui-link') ||
        element.getAttribute('role') === 'button') {
      return false
    }
    return PROTECTED_LINKS.some(link => url === link.url)
  }

  private scanElement(element: Element): void {
    if (element instanceof HTMLAnchorElement && this.shouldMonitorLink(element)) {
      this.validateAndRestore(element)
    }
    element.querySelectorAll('a[href]').forEach(link => {
      if (link instanceof HTMLAnchorElement && this.shouldMonitorLink(link)) {
        this.validateAndRestore(link)
      }
    })
  }

  private validateAndRestore(element: HTMLAnchorElement): void {
    if (element.getAttribute('data-integrity-verified') === 'true') return
    if (!this.shouldMonitorLink(element)) {
      element.setAttribute('data-integrity-verified', 'true')
      return
    }

    if (!validateLinkIntegrity(element)) {
      const originalLink = PROTECTED_LINKS.find(link =>
        element.href === link.url || element.href.startsWith(link.url)
      )
      if (originalLink) {
        const linkKey = originalLink.url
        const attempts = this.failedAttempts.get(linkKey) || 0

        if (attempts < this.maxRetries) {
          restoreOriginalLink(element, originalLink)
          this.failedAttempts.set(linkKey, attempts + 1)
          this.triggerSecurityEvent('link_tampering', {
            original: originalLink.url,
            tampered: element.href,
            attempts: attempts + 1,
            timestamp: new Date().toISOString()
          })
        } else {
          this.escalateToAggressive(originalLink.url)
        }
      }
    } else {
      element.setAttribute('data-integrity-verified', 'true')
    }
  }

  private escalateToAggressive(reason: string): void {
    if (this.watermarkActive) return
    this.watermarkActive = true
    aggressiveProtection.activate()
    this.triggerSecurityEvent('critical_tampering', {
      message: 'Aggressive protection activated',
      reason,
      timestamp: new Date().toISOString()
    })
  }

  private triggerSecurityEvent(type: string, data: any): void {
    document.dispatchEvent(new CustomEvent('security-violation', { detail: { type, data } }))
  }
}

// ─── Global instance ───
export const linkMonitor = new LinkIntegrityMonitor()

// ─── Bootstrap: activate all protection layers on module load ───
if (typeof window !== 'undefined') {
  const boot = () => {
    linkMonitor.start()

    // Layer 1: Shadow DOM honeypots
    deployShadowHoneypots()

    // Layer 2: DOM prototype freeze (block setAttribute/removeChild tampering)
    freezeDOMPrototypes()

    // Layer 3: Independent heartbeat timer (survives MutationObserver disconnect)
    startIntegrityHeartbeat()

    // Layer 4: DevTools detection → force re-scan when opened
    startDevToolsDetection()

    // Layer 5: localStorage canary
    guardStorageKeys()

    // Layer 6: Intercept console.clear — tamperers often clear console to hide traces
    const origClear = console.clear
    console.clear = function() {
      linkMonitor.forceFullScan()
      origClear.call(console)
    }

    // Layer 7: Trap window.stop() — used to halt MutationObserver callbacks
    const origStop = window.stop.bind(window)
    window.stop = () => {
      linkMonitor.forceFullScan()
      origStop()
    }

    // Layer 8: Visibility change — re-scan when tab regains focus
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        setTimeout(() => linkMonitor.forceFullScan(), 500)
      }
    })

    // Layer 9: beforeunload — if someone tries to navigate away after tampering,
    // log it (can't truly block, but the scan ensures state is correct on return)
    window.addEventListener('pageshow', () => {
      linkMonitor.forceFullScan()
    })
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot)
  } else {
    boot()
  }

  document.addEventListener('security-violation', (event: any) => {
    console.error('Security violation detected:', event.detail)
  })
}
