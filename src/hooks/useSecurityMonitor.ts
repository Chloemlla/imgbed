import { useEffect, useRef } from 'react'
import { linkMonitor } from '../utils/linkIntegrity'

export interface SecurityEvent {
  type: 'link_tampering' | 'dom_mutation' | 'integrity_violation'
  data: any
  timestamp: string
}

export function useSecurityMonitor() {
  const eventsRef = useRef<SecurityEvent[]>([])
  const isMonitoringRef = useRef(false)

  useEffect(() => {
    if (isMonitoringRef.current) return

    // Start link integrity monitoring
    linkMonitor.start()
    isMonitoringRef.current = true

    // Listen for security events
    const handleSecurityViolation = (event: CustomEvent) => {
      const securityEvent: SecurityEvent = {
        type: event.detail.type,
        data: event.detail.data,
        timestamp: new Date().toISOString()
      }
      
      eventsRef.current.push(securityEvent)
      
      // Keep only last 100 events to prevent memory issues
      if (eventsRef.current.length > 100) {
        eventsRef.current = eventsRef.current.slice(-100)
      }

      // Log security violation
      console.warn('🔒 Security Monitor Alert:', securityEvent)
      
      // Optional: Send to analytics or monitoring service
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'security_violation', {
          event_category: 'security',
          event_label: securityEvent.type,
          value: 1
        })
      }
    }

    document.addEventListener('security-violation', handleSecurityViolation as EventListener)

    // Cleanup function
    return () => {
      document.removeEventListener('security-violation', handleSecurityViolation as EventListener)
      linkMonitor.stop()
      isMonitoringRef.current = false
    }
  }, [])

  return {
    getSecurityEvents: () => eventsRef.current,
    clearEvents: () => { eventsRef.current = [] },
    isMonitoring: () => isMonitoringRef.current
  }
}
