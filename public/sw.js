/* HamOwj service worker: app-shell caching, static asset caching, offline navigation. */
const VERSION = 'hamowj-v1'
const STATIC_CACHE = `${VERSION}-static`
const PAGE_CACHE = `${VERSION}-pages`
const CORE_ASSETS = [
  '/offline',
  '/manifest.webmanifest',
  '/hamowj-mark.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
]

const isStaticAsset = (url) =>
  url.pathname.startsWith('/_next/static/') ||
  /\.(?:css|js|woff2?|png|jpe?g|svg|webp|avif|ico)$/i.test(url.pathname)

const networkFirst = async (request, cacheName, fallback) => {
  const cache = await caches.open(cacheName)

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 4000)
    const response = await fetch(request, { signal: controller.signal })
    clearTimeout(timeout)

    if (response && response.ok) {
      void cache.put(request, response.clone())
    }
    return response
  } catch {
    const cached = await cache.match(request)
    if (cached) return cached

    if (fallback) {
      const fallbackResponse = await caches.match(fallback)
      if (fallbackResponse) return fallbackResponse
    }

    return new Response('آفلاین', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }
}

const cacheFirst = async (request, cacheName) => {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  if (cached) return cached

  const response = await fetch(request)
  if (response && response.ok) void cache.put(request, response.clone())
  return response
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      Promise.all(CORE_ASSETS.map((url) => cache.add(url).catch(() => undefined))),
    ),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !key.startsWith(VERSION))
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting()

  if (event.data === 'CLEAR_CACHES') {
    event.waitUntil(
      caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key)))),
    )
  }
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // Auth and realtime traffic must never be replayed from a shared cache.
  if (
    url.pathname.startsWith('/api/auth') ||
    url.pathname.includes('/hubs/') ||
    url.pathname.startsWith('/api/live')
  ) {
    return
  }

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, PAGE_CACHE, '/offline'))
    return
  }

  if (url.origin === self.location.origin && isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE))
    return
  }

  if (url.origin === self.location.origin && url.pathname.startsWith('/api/')) {
    // The IndexedDB cache is auth-aware; the service worker deliberately leaves API
    // responses to the app so one user's data is never served to another.
    return
  }
})
