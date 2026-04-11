const CACHE_NAME = 'cadastro-digital-v1';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
];

// Install: pre-cache essential assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Push: handle incoming push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch (e) {
    payload = {
      title: 'Cadastro Digital',
      body: event.data.text(),
    };
  }

  // Determine action label based on notification type
  const notifType = payload.data?.type || '';
  let actionLabel = 'Ver detalhes';
  if (notifType === 'new_response_corretor' || notifType === 'new_response') {
    actionLabel = 'Ver respostas';
  } else if (notifType === 'status_change_corretor') {
    actionLabel = 'Ver cadastro';
  }

  const options = {
    body: payload.body || 'Nova notificação',
    icon: payload.icon || '/icons/icon-192x192.png',
    badge: payload.badge || '/icons/icon-72x72.png',
    tag: payload.tag || 'cadastro-digital-notification',
    data: {
      url: payload.url || '/dashboard',
      ...payload.data,
    },
    vibrate: [200, 100, 200],
    requireInteraction: false,
    actions: [
      { action: 'open', title: actionLabel },
      { action: 'dismiss', title: 'Dispensar' },
    ],
  };

  event.waitUntil(
    (async () => {
      // Show the notification
      await self.registration.showNotification(payload.title || 'Cadastro Digital', options);
      // Update PWA badge with unread count if available
      if (navigator.setAppBadge) {
        try {
          const badgeCount = payload.data?.badgeCount;
          if (typeof badgeCount === 'number' && badgeCount > 0) {
            await navigator.setAppBadge(badgeCount);
          } else {
            // Increment: just set a generic badge indicator
            await navigator.setAppBadge();
          }
        } catch (e) {
          // setAppBadge not supported or failed silently
        }
      }
    })()
  );
});

// Notification click: open the app or focus existing window
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // Clear PWA badge when user interacts with notification
  if (navigator.clearAppBadge) {
    navigator.clearAppBadge().catch(() => {});
  }

  if (event.action === 'dismiss') return;

  const urlToOpen = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Try to focus an existing window
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      // Open a new window if none exists
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});

// Message: handle messages from the main app (e.g., clear badge on app focus)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_BADGE') {
    if (navigator.clearAppBadge) {
      navigator.clearAppBadge().catch(() => {});
    }
  }
});

// Fetch: network-first for API calls, cache-first for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Network-first for API calls
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          return response;
        })
        .catch(() => {
          return caches.match(request);
        })
    );
    return;
  }

  // Cache-first for static assets (JS, CSS, images, fonts)
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|webp|svg|woff2?|ttf|eot)$/) ||
    url.hostname.includes('cloudfront.net') ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clone);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // Network-first for HTML pages (SPA navigation)
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(request).then((cached) => {
          return cached || caches.match('/');
        });
      })
  );
});
