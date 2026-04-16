const CACHE_NAME = 'todo-app-cache-v2';
const ASSETS = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './manifest.json',
    './icons/favicon.ico',
    './icons/icon-16x16.png',
    './icons/icon-32x32.png',
    './icons/icon-48x48.png',
    './icons/icon-64x64.png',
    './icons/icon-128x128.png',
    './icons/icon-152x152.png',
    './icons/icon-192x192.png',
    './icons/icon-256x256.png',
    './icons/icon-512x512.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(ASSETS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys.filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            )
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            return fetch(event.request)
                .then((networkResponse) => {
                    if (!networkResponse || networkResponse.status !== 200) return networkResponse;
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
                    return networkResponse;
                })
                .catch(() => caches.match('./index.html'));
        })
    );
});

// ==================== PUSH УВЕДОМЛЕНИЯ ====================
self.addEventListener('push', (event) => {
    console.log('🔔 Push событие:', event);
    
    let data = {
        title: '📌 Новая заметка',
        body: 'У вас новая заметка',
        reminderId: null,
        icon: './icons/favicon-192x192.png',
        badge: './icons/favicon-48x48.png'
    };

    if (event.data) {
        try {
            const parsed = event.data.json();
            data = { ...data, ...parsed };
            console.log('Данные push:', data);
        } catch (err) {
            console.error('Ошибка парсинга push:', err);
        }
    }

    // ✅ ДОБАВЛЯЕМ КНОПКУ "ОТЛОЖИТЬ" ТОЛЬКО ДЛЯ НАПОМИНАНИЙ
    const options = {
        body: data.body,
        icon: data.icon,
        badge: data.badge,
        vibrate: [100, 50, 100],
        data: { reminderId: data.reminderId },
        // ✅ КНОПКИ ДЕЙСТВИЙ (Snooze)
        actions: data.reminderId ? [
            { 
                action: 'snooze', 
                title: '⏰ Отложить на 5 мин',
                icon: './icons/favicon-48x48.png'
            }
        ] : []
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
            .then(() => console.log('✅ Уведомление показано'))
            .catch(err => console.error('❌ Ошибка уведомления:', err))
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
                        body: 'Перенесено на 5 минут',
                        icon: './icons/favicon-192x192.png',
                        badge: './icons/favicon-48x48.png',
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