'use client'

import { useEffect } from 'react'

type Connection = {
  effectiveType?: string
  saveData?: boolean
  downlink?: number
  rtt?: number
  addEventListener?: (type: 'change', listener: () => void) => void
  removeEventListener?: (type: 'change', listener: () => void) => void
}

/**
 * Reads the browser's own network estimate (Network Information API). Chrome/Android expose it,
 * Safari/Firefox do not — in that case we fall back to the measured load time of this page.
 */
const readQuality = (): 'slow' | 'fast' | 'unknown' => {
  if (typeof navigator === 'undefined') return 'unknown'

  const connection = (navigator as Navigator & { connection?: Connection }).connection

  if (connection) {
    if (connection.saveData) return 'slow'
    if (connection.effectiveType && /^(slow-)?2g$|^3g$/.test(connection.effectiveType)) return 'slow'
    if (connection.effectiveType || typeof connection.downlink === 'number') return 'fast'
  }

  if (typeof performance !== 'undefined') {
    const entry = performance.getEntriesByType('navigation')[0] as
      | PerformanceNavigationTiming
      | undefined
    if (entry?.domContentLoadedEventEnd && entry.domContentLoadedEventEnd < 2500) return 'fast'
    if (entry?.domContentLoadedEventEnd) return 'slow'
  }

  return 'unknown'
}

/**
 * Writes `data-network` on <html>. `globals.css` uses it to drop backdrop blurs, long transitions
 * and looping decorative animations on slow links — the same UI, cheaper to paint and scroll.
 * Renders nothing.
 */
export function NetworkQualityProvider() {
  useEffect(() => {
    const root = document.documentElement

    const apply = () => {
      const quality = readQuality()
      if (quality === 'unknown') root.removeAttribute('data-network')
      else root.dataset.network = quality
    }

    apply()

    const connection = (navigator as Navigator & { connection?: Connection }).connection
    connection?.addEventListener?.('change', apply)

    return () => connection?.removeEventListener?.('change', apply)
  }, [])

  return null
}
