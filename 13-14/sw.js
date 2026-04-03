const CACHE_NAME = 'app-shell-v3';
const DYNAMIC_CACHE_NAME = 'dynamic-content-v2';

const ASSETS = [
    '/',
    '/index.html',
    '/app.js',
    '/style.css', 
    '/manifest.json',
    '/content/home.html',
    '/content/about.html',
    '/icons/icon-16x16.png',
    '/icons/icon-32x32.png',
    '/icons/icon-48x48.png',
    '/icons/icon-64x64.png',
    '/icons/icon-128x128.png',
    '/icons/icon-152x152.png',
    '/icons/icon-192x192.png',
    '/icons/icon-256x256.png',
    '/icons/icon-512x512.png'
];
self.addEventListener('install', (event) => {
    console.log('Service Worker: Установка...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Кэширование App Shell...');
                return cache.addAll(ASSETS);
            })
            .then(() => self.skipWaiting())
            .catch((error) => console.error('Ошибка кэширования:', error))
    );
});

self.addEventListener('activate', (event) => {
    console.log('Service Worker: Активация...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.filter((name) => name !== CACHE_NAME && name !== DYNAMIC_CACHE_NAME)
                    .map((name) => {
                        console.log('Удаление старого кэша:', name);
                        return caches.delete(name);
                    })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;
    const url = new URL(event.request.url);
    if (url.origin !== location.origin) return;

    if (url.pathname.startsWith('/content/')) {
        event.respondWith(
            fetch(event.request)
                .then((networkRes) => {
                    const resClone = networkRes.clone();
                    caches.open(DYNAMIC_CACHE_NAME).then((cache) => cache.put(event.request, resClone));
                    return networkRes;
                })
                .catch(() => caches.match(event.request).then((cached) => cached || caches.match('/content/home.html')))
        );
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => cachedResponse || fetch(event.request)
                .then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const responseClone = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
                    }
                    return networkResponse;
                })
                .catch(() => caches.match('/index.html'))
            )
    );
});

self.addEventListener('push', (event) => {
    console.log('🔔 Push событие получено в Service Worker:', event);
    
    let data = {
        title: '📌 Новая заметка',
        body: 'У вас новая заметка',
        icon: '/icons/favicon-192x192.png',
        badge: '/icons/favicon-48x48.png'
    };
    
    if (event.data) {
        try {
            const parsed = event.data.json();
            data = { ...data, ...parsed };
            console.log('Данные уведомления:', data);
        } catch (err) {
            console.error('Ошибка парсинга push данных:', err);
        }
    }
    
    const options = {
        body: data.body,
        icon: data.icon,
        badge: data.badge,
        vibrate: [100, 50, 100],
        data: { dateOfArrival: Date.now() }
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title, options)
            .then(() => console.log('Уведомление показано'))
            .catch(err => console.error('Ошибка показа уведомления:', err))
    );
});

self.addEventListener('notificationclick', (event) => {
    console.log('🔔 Клик по уведомлению:', event);
    event.notification.close();
    event.waitUntil(
        clients.openWindow('/')
            .then(() => console.log('Окно открыто'))
            .catch(err => console.error('Ошибка открытия окна:', err))
    );
});