const CACHE_NAME = 'app-shell-v3';
const DYNAMIC_CACHE_NAME = 'dynamic-content-v2';
const ASSETS = [
    '/',
    '/index.html',
    '/app.js',
    '/styles.css',
    '/manifest.json',
    '/icons/favicon.ico',
    '/icons/favicon-16x16.png',
    '/icons/favicon-32x32.png',
    '/icons/favicon-48x48.png',
    '/icons/favicon-64x64.png',
    '/icons/favicon-128x128.png',
    '/icons/favicon-152x152.png',
    '/icons/favicon-192x192.png',
    '/icons/favicon-256x256.png',
    '/icons/favicon-512x512.png'
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

// ==================== PUSH УВЕДОМЛЕНИЯ ====================
self.addEventListener('push', (event) => {
    console.log('🔔 Push событие:', event);
    
    let data = {
        title: '📌 Новая заметка',
        body: 'У вас новая заметка',
        reminderId: null
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

    // ✅ ДОБАВЛЯЕМ КНОПКУ "ОТЛОЖИТЬ" ТОЛЬКО ДЛЯ НАПОМИНАНИЙ
    const options = {
        body: data.body,
        icon: '/icons/favicon-192x192.png',
        badge: '/icons/favicon-48x48.png',
        vibrate: [100, 50, 100],
        data: { reminderId: data.reminderId },
        // ✅ КНОПКА ДЕЙСТВИЯ
        actions: data.reminderId ? [
            { 
                action: 'snooze', 
                title: '⏰ Отложить на 5 мин',
                icon: '/icons/favicon-48x48.png'
            }
        ] : []
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
            .then(() => console.log('Уведомление показано'))
            .catch(err => console.error('Ошибка показа уведомления:', err))
    );
});

// ==================== КЛИК ПО УВЕДОМЛЕНИЮ ====================
self.addEventListener('notificationclick', (event) => {
    console.log('🔔 Клик по уведомлению, action:', event.action);
    event.notification.close();
    
    // ✅ ОБРАБОТКА КНОПКИ "ОТЛОЖИТЬ"
    if (event.action === 'snooze') {
        const reminderId = event.notification.data.reminderId;
        console.log('⏰ Snooze нажат, reminderId:', reminderId);
        
        event.waitUntil(
            fetch(`${self.location.origin}/snooze?reminderId=${reminderId}`, {
                method: 'POST'
            })
            .then((response) => {
                if (response.ok) {
                    // Показываем уведомление об успешном откладывании
                    return self.registration.showNotification('⏰ Напоминание отложено', {
                        body: 'Напоминание перенесено на 5 минут',
                        icon: '/icons/favicon-192x192.png',
                        badge: '/icons/favicon-48x48.png',
                        vibrate: [100, 50, 100]
                    });
                }
            })
            .catch(err => console.error('Snooze failed:', err))
        );
    } else {
        // Обычный клик — открываем приложение
        event.waitUntil(
            clients.matchAll({ type: 'window' })
                .then((clientList) => {
                    for (const client of clientList) {
                        if (client.url === self.location.origin && 'focus' in client) {
                            return client.focus();
                        }
                    }
                    if (clients.openWindow) return clients.openWindow('./');
                })
        );
    }
});