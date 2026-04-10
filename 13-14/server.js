const express = require('express');
const https = require('https');
const fs = require('fs');
const socketIo = require('socket.io');
const webpush = require('web-push');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

// VAPID ключи
const vapidKeys = {
    publicKey: 'BEYhObaLbcpqNbEMLK9a_xeHUOU1NM2j4t722SrC9CTmTP66RIVskfhFJGLgqYXB258ofsSl1v1j8TEYnnHRSCA',
    privateKey: '8ljEs2qlf73JnY6LuZM87z9KEt6ZfvRhptsAQY3QLPM'
};

webpush.setVapidDetails(
    'mailto:your-email@example.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey
);

const app = express();

// SSL сертификаты
const options = {
    key: fs.readFileSync(path.join(__dirname, 'localhost-key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'localhost.pem'))
};

const server = https.createServer(options, app);
const io = socketIo(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.use(cors({ origin: '*', methods: ['GET', 'POST'] }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

let subscriptions = [];

// ⏰ Хранилище напоминаний: Map<id, { timeoutId, title, content }>
const reminders = new Map();

// Эндпоинты
app.get('/vapid-public-key', (req, res) => {
    res.json({ publicKey: vapidKeys.publicKey });
});

app.post('/subscribe', (req, res) => {
    const subscription = req.body;
    const exists = subscriptions.some(sub => sub.endpoint === subscription.endpoint);
    if (!exists) {
        subscriptions.push(subscription);
        console.log('✅ Подписка добавлена');
        res.status(201).json({ message: 'Подписка сохранена' });
    } else {
        res.status(200).json({ message: 'Подписка уже есть' });
    }
});

app.post('/unsubscribe', (req, res) => {
    const { endpoint } = req.body;
    subscriptions = subscriptions.filter(sub => sub.endpoint !== endpoint);
    console.log('✅ Подписка удалена');
    res.status(200).json({ message: 'Подписка удалена' });
});

// ⏰ Эндпоинт для откладывания (Snooze)
app.post('/snooze', (req, res) => {
    const reminderId = req.query.reminderId;
    console.log('⏰ Snooze запрос:', reminderId);
    
    if (!reminderId || !reminders.has(reminderId)) {
        return res.status(404).json({ error: 'Reminder not found' });
    }
    
    const reminder = reminders.get(reminderId);
    clearTimeout(reminder.timeoutId);
    
    const newDelay = 5 * 60 * 1000; // 5 минут
    const newTimeoutId = setTimeout(() => {
        const payload = JSON.stringify({
            title: '⏰ Напоминание (отложенное)',
            body: reminder.title,
            reminderId: reminderId
        });
        
        subscriptions.forEach(sub => {
            webpush.sendNotification(sub, payload).catch(err => {
                if (err.statusCode === 410 || err.statusCode === 403) {
                    subscriptions = subscriptions.filter(s => s.endpoint !== sub.endpoint);
                }
            });
        });
        
        reminders.delete(reminderId);
    }, newDelay);
    
    reminders.set(reminderId, { timeoutId: newTimeoutId, title: reminder.title });
    res.status(200).json({ message: 'Reminder snoozed' });
});

// WebSocket
io.on('connection', (socket) => {
    console.log('🔌 Клиент подключён:', socket.id);
    
    // Обычная заметка
    socket.on('newNote', (data) => {
        console.log('📝 Новая заметка:', data);
        io.emit('noteAdded', data);
        
        const payload = JSON.stringify({
            title: '📌 Новая заметка',
            body: data.title || data.content || 'Без названия'
        });
        
        subscriptions.forEach(sub => {
            webpush.sendNotification(sub, payload).catch(err => {
                if (err.statusCode === 410 || err.statusCode === 403) {
                    subscriptions = subscriptions.filter(s => s.endpoint !== sub.endpoint);
                }
            });
        });
    });
    
    // ⏰ НАПОМИНАНИЕ С ПЛАНИРОВАНИЕМ
    socket.on('newReminder', (data) => {
        const { id, title, content, reminderTime } = data;
        const delay = reminderTime - Date.now();
        
        console.log(`⏰ Напоминание запланировано: ${title}`);
        console.log(`⏰ Текущее время: ${new Date().toLocaleString()}`);
        console.log(`⏰ Время напоминания: ${new Date(reminderTime).toLocaleString()}`);
        console.log(`⏰ Задержка: ${delay}мс (${Math.round(delay/1000/60)} мин)`);
        
        if (delay <= 0) {
            console.log('⏰ Время уже прошло, отправляем сразу');
            io.emit('reminderTriggered', { title, content });
            return;
        }
        
        const timeoutId = setTimeout(() => {
            const payload = JSON.stringify({
                title: '⏰ Напоминание',
                body: title,
                reminderId: id // ✅ Важно для snooze
            });
            
            console.log('⏰ Время напоминания пришло:', title);
            
            subscriptions.forEach(sub => {
                webpush.sendNotification(sub, payload).catch(err => {
                    console.error('Push ошибка:', err);
                    if (err.statusCode === 410 || err.statusCode === 403) {
                        subscriptions = subscriptions.filter(s => s.endpoint !== sub.endpoint);
                    }
                });
            });
            
            io.emit('reminderTriggered', { title, content });
            reminders.delete(id);
        }, delay);
        
        reminders.set(id, { timeoutId, title, content });
        console.log('⏰ Таймер установлен, ID:', id);
    });
    
    socket.on('disconnect', () => {
        console.log('🔌 Клиент отключён:', socket.id);
    });
});

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`🚀 Secure server running at https://localhost:${PORT}`);
});