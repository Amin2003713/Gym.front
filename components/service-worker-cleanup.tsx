'use client'

import { useEffect } from 'react'

const RELOAD_FLAG = 'hamowj:sw-cleanup-reloaded'

/**
 * The service worker belonged to the removed offline mode. A device that installed the old
 * worker can still be controlled by it, and a 404 at `/sw.js` is not enough to retire it.
 * This runs on every page load and does the local cleanup a visitor would otherwise have to do
 * by hand: unregister, clear CacheStorage, refresh once onto the network build.
 */
export function ServiceWorkerCleanup() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    let cancelled = false

    void (async () => {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations()
        if (registrations.length === 0) return

        await Promise.all(registrations.map((registration) => registration.unregister()))

        if ('caches' in window) {
          const keys = await caches.keys()
          await Promise.all(keys.map((key) => caches.delete(key)))
        }

        if (cancelled || sessionStorage.getItem(RELOAD_FLAG) === '1') return
        sessionStorage.setItem(RELOAD_FLAG, '1')
        window.location.reload()
      } catch {
        // Cleanup is best-effort; the kill-switch worker in /sw.js covers the next visit.
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  return null
}
