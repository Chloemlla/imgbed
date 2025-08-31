// Aggressive anti-tampering protection system
import { PROTECTED_LINKS } from './linkIntegrity'

export class AggressiveProtectionSystem {
  private static instance: AggressiveProtectionSystem
  private isActive: boolean = false
  private watermarkInterval: number | null = null
  private blockingObserver: MutationObserver | null = null
  private contentBlocker: HTMLElement | null = null
  private watermarkOverlay: HTMLElement | null = null

  private constructor() {}

  static getInstance(): AggressiveProtectionSystem {
    if (!AggressiveProtectionSystem.instance) {
      AggressiveProtectionSystem.instance = new AggressiveProtectionSystem()
    }
    return AggressiveProtectionSystem.instance
  }

  activate(): void {
    if (this.isActive) return
    
    this.isActive = true
    console.error('🚨 ACTIVATING AGGRESSIVE PROTECTION MODE 🚨')
    
    // Create watermark overlay first
    this.createFullScreenWatermark()
    
    // Then block content rendering
    this.blockAllContentRendering()
    
    // Disable page interactions
    this.disablePageInteractions()
    
    // Monitor and prevent removal attempts
    this.preventRemovalAttempts()
  }

  private createFullScreenWatermark(): void {
    // Remove existing watermark if any
    const existing = document.getElementById('aggressive-watermark')
    if (existing) existing.remove()

    this.watermarkOverlay = document.createElement('div')
    this.watermarkOverlay.id = 'aggressive-watermark'
    this.watermarkOverlay.style.cssText = `
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      z-index: 2147483647 !important;
      pointer-events: none !important;
      user-select: none !important;
      overflow: hidden !important;
      background: repeating-linear-gradient(
        15deg,
        rgba(255, 0, 0, 0.15) 0px,
        rgba(255, 0, 0, 0.15) 30px,
        rgba(255, 255, 0, 0.1) 30px,
        rgba(255, 255, 0, 0.1) 60px
      ) !important;
    `

    // Create dense watermark pattern
    const watermarkUrls = PROTECTED_LINKS.map(link => link.url)
    let watermarkContent = ''
    
    // Create multiple layers of watermarks
    for (let layer = 0; layer < 5; layer++) {
      for (let i = 0; i < 50; i++) {
        const url = watermarkUrls[i % watermarkUrls.length]
        const rotation = Math.random() * 360
        const x = Math.random() * 120 - 10 // Allow overflow
        const y = Math.random() * 120 - 10
        const size = 10 + Math.random() * 8
        const opacity = 0.3 + Math.random() * 0.4
        
        watermarkContent += `
          <div style="
            position: absolute !important;
            top: ${y}% !important;
            left: ${x}% !important;
            transform: rotate(${rotation}deg) !important;
            font-family: 'Courier New', monospace !important;
            font-size: ${size}px !important;
            font-weight: bold !important;
            color: rgba(255, 0, 0, ${opacity}) !important;
            white-space: nowrap !important;
            user-select: none !important;
            pointer-events: none !important;
            z-index: ${2147483647 - layer} !important;
          ">${url}</div>
        `
      }
    }
    
    this.watermarkOverlay.innerHTML = watermarkContent
    document.body.appendChild(this.watermarkOverlay)
    
    // Animate watermark opacity
    let opacity = 0.4
    let direction = 1
    this.watermarkInterval = window.setInterval(() => {
      opacity += direction * 0.03
      if (opacity >= 0.9 || opacity <= 0.4) direction *= -1
      if (this.watermarkOverlay) {
        this.watermarkOverlay.style.opacity = opacity.toString()
      }
    }, 100)
  }

  private blockAllContentRendering(): void {
    // Remove existing blocker if any
    const existing = document.getElementById('content-blocker')
    if (existing) existing.remove()

    this.contentBlocker = document.createElement('div')
    this.contentBlocker.id = 'content-blocker'
    this.contentBlocker.style.cssText = `
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      z-index: 2147483646 !important;
      background: rgba(0, 0, 0, 0.8) !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      backdrop-filter: blur(10px) !important;
      user-select: none !important;
    `
    
    const warningBox = document.createElement('div')
    warningBox.style.cssText = `
      background: linear-gradient(135deg, #ff0000, #cc0000) !important;
      color: white !important;
      padding: 40px !important;
      border-radius: 15px !important;
      border: 5px solid #ffffff !important;
      max-width: 600px !important;
      text-align: center !important;
      font-family: 'Courier New', monospace !important;
      box-shadow: 0 0 50px rgba(255, 0, 0, 0.5) !important;
      animation: pulse 2s infinite !important;
    `
    
    warningBox.innerHTML = `
      <style>
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
      </style>
      <h1 style="font-size: 24px; margin-bottom: 20px; color: #ffffff;">🚨 严重安全警告 🚨</h1>
      <p style="font-size: 16px; margin-bottom: 15px;">检测到持续的开源链接篡改行为</p>
      <p style="font-size: 14px; margin-bottom: 20px;">系统已启动保护模式</p>
      <div style="background: rgba(255, 255, 255, 0.9); color: #000; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="font-weight: bold; margin-bottom: 10px;">受保护的开源地址：</p>
        ${PROTECTED_LINKS.map(link => `<p style="font-size: 12px; word-break: break-all; margin: 5px 0;">${link.url}</p>`).join('')}
      </div>
      <p style="font-size: 12px; opacity: 0.9;">页面功能已被限制以维护开源信息完整性</p>
    `
    
    this.contentBlocker.appendChild(warningBox)
    document.body.appendChild(this.contentBlocker)
  }

  private disablePageInteractions(): void {
    try {
      // Disable all form inputs and buttons
      const interactiveElements = document.querySelectorAll('input, button, select, textarea, a')
      interactiveElements.forEach(element => {
        try {
          if (element instanceof HTMLElement) {
            element.style.pointerEvents = 'none'
            element.style.opacity = '0.3'
            element.setAttribute('disabled', 'true')
          }
        } catch (e) {
          // Ignore individual element errors
        }
      })
      
      // Disable scrolling
      if (document.body) {
        document.body.style.overflow = 'hidden'
      }
      if (document.documentElement) {
        document.documentElement.style.overflow = 'hidden'
      }
    } catch (e) {
      console.error('Error disabling page interactions:', e)
    }
  }

  private preventRemovalAttempts(): void {
    // Monitor attempts to remove protection elements
    this.blockingObserver = new MutationObserver((mutations) => {
      try {
        mutations.forEach(mutation => {
          if (mutation.type === 'childList') {
            // Check if protection elements were removed
            if (!document.getElementById('aggressive-watermark') && this.watermarkOverlay) {
              console.error('🚨 Watermark removal detected - recreating')
              this.createFullScreenWatermark()
            }
            
            if (!document.getElementById('content-blocker') && this.contentBlocker) {
              console.error('🚨 Content blocker removal detected - recreating')
              this.blockAllContentRendering()
            }
            
            // Remove any new content that's not our protection
            if (mutation.addedNodes) {
              mutation.addedNodes.forEach(node => {
                try {
                  if (node && node.nodeType === Node.ELEMENT_NODE) {
                    const element = node as Element
                    if (element && element.id !== 'aggressive-watermark' && 
                        element.id !== 'content-blocker' &&
                        !element.closest('#aggressive-watermark') &&
                        !element.closest('#content-blocker')) {
                      // Remove unauthorized new content
                      element.remove()
                    }
                  }
                } catch (e) {
                  // Ignore errors during node processing
                }
              })
            }
          }
          
          // Prevent style modifications to protection elements
          if (mutation.type === 'attributes' && mutation.target instanceof Element) {
            const target = mutation.target
            if (target && (target.id === 'aggressive-watermark' || target.id === 'content-blocker')) {
              // Restore protection element styles if modified
              if (target.id === 'aggressive-watermark' && this.watermarkOverlay) {
                this.createFullScreenWatermark()
              } else if (target.id === 'content-blocker' && this.contentBlocker) {
                this.blockAllContentRendering()
              }
            }
          }
        })
      } catch (e) {
        console.error('Protection system error:', e)
      }
    })
    
    this.blockingObserver.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class', 'id']
    })
  }

  deactivate(): void {
    if (!this.isActive) return
    
    this.isActive = false
    
    // Clear watermark animation
    if (this.watermarkInterval) {
      clearInterval(this.watermarkInterval)
      this.watermarkInterval = null
    }
    
    // Remove protection elements
    if (this.watermarkOverlay) {
      this.watermarkOverlay.remove()
      this.watermarkOverlay = null
    }
    
    if (this.contentBlocker) {
      this.contentBlocker.remove()
      this.contentBlocker = null
    }
    
    // Stop blocking observer
    if (this.blockingObserver) {
      this.blockingObserver.disconnect()
      this.blockingObserver = null
    }
    
    // Re-enable page interactions
    document.body.style.overflow = ''
    document.documentElement.style.overflow = ''
    
    const disabledElements = document.querySelectorAll('[disabled="true"]')
    disabledElements.forEach(element => {
      if (element instanceof HTMLElement) {
        element.style.pointerEvents = ''
        element.style.opacity = ''
        element.removeAttribute('disabled')
      }
    })
  }

  isProtectionActive(): boolean {
    return this.isActive
  }
}

// Global protection instance
export const aggressiveProtection = AggressiveProtectionSystem.getInstance()
