const CACHE_NAME = 'todo-app-cache-v2';
const ASSETS = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './manifest.json',
    './icons/favicon.ico',
    './icons/favicon-16x16.png',
    './icons/favicon-32x32.png',
    './icons/favicon-48x48.png',
    './icons/favicon-64x64.png',
    './icons/favicon-128x128.png',
    './icons/favicon-256x256.png',
    './icons/favicon-512x512.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('📦 Кэширование ресурсов...');
                return cache.addAll(ASSETS);
            })
            .then(() => {
                console.log('✅ Все ресурсы закэшированы');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('❌ Ошибка кэширования:', error);
            })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((cacheName) => cacheName !== CACHE_NAME)
                        .map((cacheName) => {
                            console.log('🗑️ Удаление старого кэша:', cacheName);
                            return caches.delete(cacheName);
                        })
                );
            })
            .then(() => {
                console.log('✅ Service Worker активирован');
                return self.clients.claim();
            })
    );
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') {
        return;
    }
    
    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                
                return fetch(event.request)
                    .then((networkResponse) => {
                        if (!networkResponse || networkResponse.status !== 200) {
                            return networkResponse;
                        }
                      
                        const responseClone = networkResponse.clone();
                      
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseClone);
                            });
                      
                        return networkResponse;
                    })
                    .catch(() => {
                        return caches.match('./index.html');
                    });
            })
    );
});