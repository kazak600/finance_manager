const CACHE_NAME = 'finance-manager-v1'
const APP_SHELL_URLS = ['/', '/index.html', '/manifest.webmanifest']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL_URLS)),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
    ),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  const isApiRequest = url.port === '8787' || 
                       url.pathname.includes('/auth/') || 
                       url.pathname.includes('/transactions') || 
                       url.pathname.includes('/stats/') || 
                       url.pathname.includes('/templates') ||
                       url.pathname.includes('/export/') ||
                       url.pathname.includes('/health')

  // Do not cache API requests or non-GET requests
  if (event.request.method !== 'GET' || isApiRequest) {
    return
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse
      }

      return fetch(event.request)
        .then((networkResponse) => {
          const responseCopy = networkResponse.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseCopy))
          return networkResponse
        })
        .catch(() => caches.match('/index.html'))
    }),
  )
})
