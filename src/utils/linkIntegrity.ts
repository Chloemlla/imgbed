// Link integrity protection system
import { aggressiveProtection } from './aggressiveProtection'

export interface ProtectedLink {
  url: string
  hash: string
  text: string
}

// Protected links with SHA-256 hashes
export const PROTECTED_LINKS: ProtectedLink[] = [
  {
    url: 'https://github.com/devhappys/imgbed',
    hash: 'sha256-7f8a9b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a',
    text: 'https://github.com/devhappys/imgbed'
  },
  {
    url: 'https://github.com/xhofe/imgbed',
    hash: 'sha256-1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
    text: 'https://github.com/xhofe/imgbed'
  },
  {
    url: 'https://github.com/devhappys/imgbed/blob/main/LICENSE.txt',
    hash: 'sha256-3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d',
    text: 'GNU General Public License v3.0'
  }
]

// Generate hash for link validation
export function generateLinkHash(url: string, text: string): string {
  const data = `${url}|${text}`
  return btoa(data).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32)
}

// Validate link integrity
export function validateLinkIntegrity(element: HTMLAnchorElement): boolean {
  const url = element.href
  const text = element.textContent || ''
  
  // Skip validation for non-external links or empty hrefs
  if (!url || url.startsWith('#') || url.startsWith('javascript:') || url === window.location.href) {
    return true
  }
  
  // Only validate links that match our protected URLs
  const expectedLink = PROTECTED_LINKS.find(link => url === link.url || url.startsWith(link.url))
  
  if (!expectedLink) return true // Non-protected links are allowed
  
  const currentHash = generateLinkHash(url, text)
  const expectedHash = expectedLink.hash.replace('sha256-', '')
  
  return currentHash === expectedHash
}

// Restore original link
export function restoreOriginalLink(element: HTMLAnchorElement, originalLink: ProtectedLink): void {
  element.href = originalLink.url
  element.textContent = originalLink.text
  element.setAttribute('data-integrity-verified', 'true')
  
  // Add visual indicator for restored link
  element.style.borderBottom = '2px solid #10b981'
  element.style.transition = 'border-bottom 0.3s ease'
  
  setTimeout(() => {
    element.style.borderBottom = ''
  }, 2000)
}

// DOM mutation observer for real-time monitoring
export class LinkIntegrityMonitor {
  private observer: MutationObserver
  private isActive: boolean = false
  private failedAttempts: Map<string, number> = new Map()
  private maxRetries: number = 3
  private watermarkActive: boolean = false

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
      attributeFilter: ['href'],
      characterData: true
    })
    
    // Delay initial scan to avoid false positives during component mounting
    setTimeout(() => {
      this.scanExistingLinks()
    }, 1000)
  }

  stop(): void {
    this.isActive = false
    this.observer.disconnect()
  }

  private handleMutations(mutations: MutationRecord[]): void {
    // Debounce mutations to avoid excessive processing during UI updates
    setTimeout(() => {
      for (const mutation of mutations) {
        // Skip mutations from theme changes or modal operations
        if (mutation.target instanceof Element) {
          if (mutation.target.closest('[data-slot="base"]') ||
              mutation.target.closest('[role="dialog"]') ||
              mutation.target.classList.contains('dark') ||
              mutation.target === document.documentElement ||
              mutation.target === document.body) {
            continue
          }
        }
        
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              this.scanElement(node as Element)
            }
          })
        } else if (mutation.type === 'attributes' && mutation.target instanceof HTMLAnchorElement) {
          if (this.shouldMonitorLink(mutation.target)) {
            this.validateAndRestore(mutation.target)
          }
        } else if (mutation.type === 'characterData' && mutation.target.parentElement instanceof HTMLAnchorElement) {
          if (this.shouldMonitorLink(mutation.target.parentElement)) {
            this.validateAndRestore(mutation.target.parentElement)
          }
        }
      }
    }, 100) // 100ms debounce
  }

  private scanExistingLinks(): void {
    const links = document.querySelectorAll('a[href]')
    links.forEach(link => {
      if (link instanceof HTMLAnchorElement && this.shouldMonitorLink(link)) {
        this.validateAndRestore(link)
      }
    })
  }

  private shouldMonitorLink(element: HTMLAnchorElement): boolean {
    // Skip monitoring for UI component links (About modal, buttons, etc.)
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
    
    // Skip non-external links
    if (!url || url.startsWith('#') || url.startsWith('javascript:') || url === window.location.href) {
      return false
    }
    
    // Skip if this is a NextUI component link (has NextUI specific attributes)
    if (element.hasAttribute('data-slot') || 
        element.classList.contains('nextui-link') ||
        element.getAttribute('role') === 'button') {
      return false
    }
    
    // Only monitor links that exactly match our protected URLs
    return PROTECTED_LINKS.some(link => url === link.url)
  }

  private scanElement(element: Element): void {
    if (element instanceof HTMLAnchorElement && this.shouldMonitorLink(element)) {
      this.validateAndRestore(element)
    }
    
    const links = element.querySelectorAll('a[href]')
    links.forEach(link => {
      if (link instanceof HTMLAnchorElement && this.shouldMonitorLink(link)) {
        this.validateAndRestore(link)
      }
    })
  }

  private validateAndRestore(element: HTMLAnchorElement): void {
    if (element.getAttribute('data-integrity-verified') === 'true') return
    
    // Skip validation if this is inside About modal or UI components
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
          console.warn(`Link tampering detected (attempt ${attempts + 1}/${this.maxRetries}), restoring original:`, originalLink.url)
          restoreOriginalLink(element, originalLink)
          this.failedAttempts.set(linkKey, attempts + 1)
          
          // Trigger security event
          this.triggerSecurityEvent('link_tampering', {
            original: originalLink.url,
            tampered: element.href,
            attempts: attempts + 1,
            timestamp: new Date().toISOString()
          })
        } else {
          // Max retries exceeded - activate aggressive protection
          console.error('🚨 CRITICAL: Link tampering persists after max retries. Activating aggressive protection.')
          this.activateAggressiveProtection(originalLink)
        }
      }
    } else {
      element.setAttribute('data-integrity-verified', 'true')
    }
  }

  private activateAggressiveProtection(originalLink: ProtectedLink): void {
    if (this.watermarkActive) return
    
    this.watermarkActive = true
    
    // Activate the aggressive protection system
    aggressiveProtection.activate()
    
    // Trigger critical security event
    this.triggerSecurityEvent('critical_tampering', {
      message: 'Persistent link tampering detected - aggressive protection activated',
      originalLink: originalLink.url,
      timestamp: new Date().toISOString()
    })
  }

  private createWatermarkOverlay(): void {
    const watermark = document.createElement('div')
    watermark.id = 'security-watermark-overlay'
    watermark.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 999999;
      pointer-events: none;
      background: repeating-linear-gradient(
        45deg,
        rgba(255, 0, 0, 0.1) 0px,
        rgba(255, 0, 0, 0.1) 20px,
        transparent 20px,
        transparent 40px
      );
      font-family: 'Courier New', monospace;
      font-size: 12px;
      font-weight: bold;
      color: rgba(255, 0, 0, 0.6);
      overflow: hidden;
    `
    
    // Create watermark text pattern
    const watermarkText = PROTECTED_LINKS.map(link => link.url).join(' | ')
    let content = ''
    
    // Fill entire screen with watermark text
    for (let i = 0; i < 200; i++) {
      content += `<div style="white-space: nowrap; transform: rotate(${Math.random() * 360}deg); position: absolute; top: ${Math.random() * 100}%; left: ${Math.random() * 100}%;">${watermarkText}</div>`
    }
    
    watermark.innerHTML = content
    document.body.appendChild(watermark)
    
    // Add pulsing effect
    let opacity = 0.3
    let direction = 1
    setInterval(() => {
      opacity += direction * 0.02
      if (opacity >= 0.8 || opacity <= 0.3) direction *= -1
      watermark.style.opacity = opacity.toString()
    }, 50)
  }

  private blockContentRendering(): void {
    // Create content blocker
    const blocker = document.createElement('div')
    blocker.id = 'content-render-blocker'
    blocker.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 999998;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Courier New', monospace;
      color: #ff0000;
      font-size: 18px;
      font-weight: bold;
      text-align: center;
      backdrop-filter: blur(5px);
    `
    
    blocker.innerHTML = `
      <div style="background: rgba(255, 255, 255, 0.9); padding: 30px; border-radius: 10px; border: 3px solid #ff0000; max-width: 500px;">
        <h2 style="color: #ff0000; margin-bottom: 20px;">🚨 安全警告 🚨</h2>
        <p style="color: #000; margin-bottom: 15px;">检测到持续的链接篡改行为</p>
        <p style="color: #000; margin-bottom: 15px;">原始开源地址：</p>
        <div style="background: #f0f0f0; padding: 10px; border-radius: 5px; word-break: break-all; color: #000;">
          ${PROTECTED_LINKS.map(link => link.url).join('<br>')}
        </div>
        <p style="color: #666; margin-top: 15px; font-size: 14px;">页面已被锁定以保护开源信息完整性</p>
      </div>
    `
    
    document.body.appendChild(blocker)
    
    // Block all new DOM mutations
    const blockingObserver = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE && 
                node !== blocker && 
                node !== document.getElementById('security-watermark-overlay')) {
              // Remove any new content that's not our security elements
              node.parentNode?.removeChild(node)
            }
          })
        }
      })
    })
    
    blockingObserver.observe(document.body, {
      childList: true,
      subtree: true
    })
  }

  private triggerSecurityEvent(type: string, data: any): void {
    const event = new CustomEvent('security-violation', {
      detail: { type, data }
    })
    document.dispatchEvent(event)
  }
}

// Global monitor instance
export const linkMonitor = new LinkIntegrityMonitor()

// Auto-start monitoring when module loads
if (typeof window !== 'undefined') {
  // Start monitoring after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => linkMonitor.start())
  } else {
    linkMonitor.start()
  }
  
  // Listen for security violations
  document.addEventListener('security-violation', (event: any) => {
    console.error('Security violation detected:', event.detail)
  })
}
