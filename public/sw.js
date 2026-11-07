/*
 * Self-destructing service worker.
 *
 * The offline mode was removed and this file replaces any worker installed by the old build.
 * A browser that still has the old registration checks this URL, installs this version, and
 * then this worker releases the clients and unregisters itself. Every open tab refreshes once
 * so pages stop being served from the retired cache (the 503 "from service worker" screen).
 *
 * It deliberately has no fetch handler: after activation, every request goes to the network.
 * Remove this file and the headers entry in next.config.ts once installed devices have migrated.
 */

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Take over open pages first so the refresh below lands on the network build.
      await self.clients.claim()

      const keys = await caches.keys()
      await Promise.all(keys.map((key) => caches.delete(key)))

      await self.registration.unregister()

      const clients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      })

      await Promise.all(
        clients.map((client) => client.navigate(client.url).catch(() => null)),
      )
    })(),
  )
})
