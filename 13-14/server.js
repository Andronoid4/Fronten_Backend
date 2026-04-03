const express = require('express');
const https = require('https'); // Используем только https
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

const app = express(); // Сначала создаем приложение

// Настройки SSL (убедись, что файлы в той же папке)
const options = {
    key: fs.readFileSync(path.join(__dirname, 'localhost-key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'localhost.pem'))
};

// Создаем ОДИН сервер (HTTPS)
const server = https.createServer(options, app);

const io = socketIo(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.use(cors({ origin: '*', methods: ['GET', 'POST'] }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

let subscriptions = [];

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

// WebSocket
io.on('connection', (socket) => {
    console.log('🔌 Клиент подключён:', socket.id);

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

    socket.on('disconnect', () => {
        console.log('🔌 Клиент отключён:', socket.id);
    });
});

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`🚀 Secure server running at https://localhost:${PORT}`);
});