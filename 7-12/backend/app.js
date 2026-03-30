const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const PORT = 8000;


const app = express();
app.use(express.json());
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});
app.use("/uploads", (req, res, next) => {
    res.set("Access-Control-Allow-Origin", "*");
    next();
}, express.static(path.join(__dirname, "uploads")));

// ===== НАСТРОЙКА MULTER =====
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = "uploads/";
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb(new Error("Только изображения"));
        }
    },
});

// ===== СЕКРЕТЫ И НАСТРОЙКИ =====
const ACCESS_SECRET = "access_secret";
const REFRESH_SECRET = "refresh_secret";
const ACCESS_EXPIRES_IN = "15m";
const REFRESH_EXPIRES_IN = "7d";

// ===== БАЗЫ ДАННЫХ =====
const adminPasswordHash = "$2b$10$7R.tJ3YVp9G5RkZ1N.CHeuMIsfS.2xV3pYmGvE7H9e1n.Gk6f7u6i";
const users = [
    { 
        id: "0", 
        username: "admin", 
        passwordHash: adminPasswordHash, 
        role: "admin" 
    }
];

console.log("✅ Базовая учетная запись создана: admin / admin123");
const products = [];
const refreshTokens = new Set();

// ===== ГЕНЕРАЦИЯ ID =====
function generateProductId() {
    return 'PROD-' + Math.random().toString(36).substr(2, 9).toUpperCase();
}

// ===== ГЕНЕРАЦИЯ ТОКЕНОВ (с ролью!) =====
function generateAccessToken(user) {
    return jwt.sign(
        { 
            sub: user.id, 
            username: user.username, 
            role: user.role 
        },
        ACCESS_SECRET,
        { expiresIn: ACCESS_EXPIRES_IN }
    );
}

function generateRefreshToken(user) {
    return jwt.sign(
        { 
            sub: user.id, 
            username: user.username, 
            role: user.role 
        },
        REFRESH_SECRET,
        { expiresIn: REFRESH_EXPIRES_IN }
    );
}

// ===== MIDDLEWARE: Аутентификация =====
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: "Access token is required" });
    }

    jwt.verify(token, ACCESS_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: "Invalid or expired access token" });
        }
        req.user = user;
        next();
    });
}

// ===== MIDDLEWARE: Проверка роли =====
function checkRole(allowedRoles) {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: "Доступ запрещён. Недостаточно прав." });
        }
        next();
    };
}

// ===== ЭНДПОИНТЫ АВТОРИЗАЦИИ =====

// Регистрация (Гость)
app.post("/api/auth/register", async (req, res) => {
    const { username, password, role } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "username and password are required" });
    }

    const exists = users.some((u) => u.username === username);
    if (exists) {
        return res.status(409).json({ error: "username already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = { 
        id: String(users.length + 1), 
        username, 
        passwordHash, 
        role: role || "user"
    };
    users.push(user);

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    refreshTokens.add(refreshToken);

    res.status(201).json({ 
        id: user.id, 
        username: user.username, 
        role: user.role,
        accessToken, 
        refreshToken 
    });
});
app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    
    // Вывод в терминал для контроля (проверь его!)
    console.log(`--- ПОПЫТКА ВХОДА: [${username}] / [${password}] ---`);

    if (!username || !password) {
        return res.status(400).json({ error: "username and password are required" });
    }

    const user = users.find((u) => u.username === username);
    
    if (!user) {
        return res.status(401).json({ error: "Пользователь не найден" });
    }

    // 1. Проверка для админа "в лоб" (без bcrypt)
    const isExplicitAdmin = (username === 'admin' && password === 'admin123');
    
    // 2. Обычная проверка для остальных
    let isPasswordValid = false;
    try {
        isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    } catch (e) {
        isPasswordValid = false;
    }

    if (isExplicitAdmin || isPasswordValid) {
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);
        refreshTokens.add(refreshToken);

        console.log("✅ ВХОД РАЗРЕШЕН");
        return res.json({ 
            id: user.id,
            username: user.username,
            role: user.role,
            accessToken, 
            refreshToken 
        });
    }

    console.log("❌ ОШИБКА: Пароль не подошел");
    res.status(401).json({ error: "Invalid credentials" });
});

// Обновление токенов (Гость)
app.post("/api/auth/refresh", (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).json({ error: "refreshToken is required" });
    }

    if (!refreshTokens.has(refreshToken)) {
        return res.status(401).json({ error: "Invalid refresh token" });
    }

    try {
        const payload = jwt.verify(refreshToken, REFRESH_SECRET);
        const user = users.find((u) => u.id === payload.sub);

        if (!user) {
            return res.status(401).json({ error: "User not found" });
        }

        refreshTokens.delete(refreshToken);
        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);
        refreshTokens.add(newRefreshToken);

        res.json({ 
            id: user.id,
            username: user.username,
            role: user.role,
            accessToken: newAccessToken, 
            refreshToken: newRefreshToken 
        });
    } catch (err) {
        return res.status(401).json({ error: "Invalid or expired refresh token" });
    }
});

// Текущий пользователь (Все аутентифицированные)
app.get("/api/auth/me", authenticateToken, (req, res) => {
    const user = users.find((u) => u.id === req.user.sub);
    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }
    res.json({ 
        id: user.id, 
        username: user.username, 
        role: user.role 
    });
});

// ===== ЭНДПОИНТЫ ПОЛЬЗОВАТЕЛЕЙ (Только Админ) =====

// Получить всех пользователей
app.get("/api/users", authenticateToken, checkRole(["admin"]), (req, res) => {
    const usersList = users.map(u => ({
        id: u.id,
        username: u.username,
        role: u.role
    }));
    res.json(usersList);
});

// Получить пользователя по ID
app.get("/api/users/:id", authenticateToken, checkRole(["admin"]), (req, res) => {
    const user = users.find((u) => u.id === req.params.id);
    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }
    res.json({
        id: user.id,
        username: user.username,
        role: user.role
    });
});

// Обновить пользователя
app.put("/api/users/:id", authenticateToken, checkRole(["admin"]), (req, res) => {
    const user = users.find((u) => u.id === req.params.id);
    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }

    const { username, role } = req.body;
    if (username) user.username = username;
    if (role) user.role = role;

    res.json({
        id: user.id,
        username: user.username,
        role: user.role
    });
});

// Удалить/Заблокировать пользователя
app.delete("/api/users/:id", authenticateToken, checkRole(["admin"]), (req, res) => {
    const index = users.findIndex((u) => u.id === req.params.id);
    if (index === -1) {
        return res.status(404).json({ error: "User not found" });
    }

    users.splice(index, 1);
    res.status(204).send();
});

// ===== ЭНДПОИНТЫ ТОВАРОВ =====

// Получить все товары (Все аутентифицированные)
app.get("/api/products", authenticateToken, (req, res) => {
    res.json(products);
});

// Получить товар по ID (Все аутентифицированные)
app.get("/api/products/:id", authenticateToken, (req, res) => {
    const product = products.find((p) => p.id === req.params.id);
    if (!product) {
        return res.status(404).json({ error: "Product not found" });
    }
    res.json(product);
});

// Поиск товара по ID или НАЗВАНИЮ (Все аутентифицированные)
app.get("/api/products/search/:query", authenticateToken, (req, res) => {
    const query = req.params.query.toLowerCase(); // Приводим запрос к нижнему регистру
    
    // Используем filter, чтобы найти все совпадения
    const filteredProducts = products.filter((p) => {
        const nameMatch = p.name.toLowerCase().includes(query);
        const idMatch = p.id.toLowerCase() === query;
        return nameMatch || idMatch;
    });

    if (filteredProducts.length === 0) {
        return res.status(404).json({ error: "Товары не найдены" });
    }

    res.json(filteredProducts);
});
// Создать товар (Продавец И Админ)
app.post("/api/products", authenticateToken, checkRole(["seller", "admin"]), upload.single("image"), (req, res) => {
    const { name, price, description } = req.body;

    if (!name || !price) {
        return res.status(400).json({ error: "name and price are required" });
    }

    const product = {
        id: generateProductId(),
        name,
        price,
        description: description || "",
        image: req.file ? `/uploads/${req.file.filename}` : null,
    };

    products.push(product);
    res.status(201).json(product);
});

// Генерация тестовых товаров (Продавец И Админ)
app.post("/api/products/generate", authenticateToken, checkRole(["seller", "admin"]), (req, res) => {
    const { count = 10 } = req.body;

    const productNames = [
        "Смартфон", "Ноутбук", "Планшет", "Наушники", "Часы",
        "Камера", "Монитор", "Клавиатура", "Мышь", "Колонки"
    ];

    const descriptions = [
        "Высокое качество",
        "Отличная цена",
        "Популярная модель",
        "Новинка сезона",
        "Хит продаж"
    ];

    const generatedProducts = [];

    for (let i = 0; i < count; i++) {
        const product = {
            id: generateProductId(),
            name: `${productNames[Math.floor(Math.random() * productNames.length)]} ${Math.floor(Math.random() * 100)}`,
            price: (Math.random() * 10000 + 100).toFixed(2),
            description: descriptions[Math.floor(Math.random() * descriptions.length)],
            image: null,
        };
        products.push(product);
        generatedProducts.push(product);
    }

    console.log(`✅ Сгенерировано ${count} тестовых товаров`);
    res.status(201).json({
        message: `Сгенерировано ${count} товаров`,
        products: generatedProducts,
    });
});

// Обновить товар (Продавец И Админ)
app.put("/api/products/:id", authenticateToken, checkRole(["seller", "admin"]), upload.single("image"), (req, res) => {
    const product = products.find((p) => p.id === req.params.id);
    if (!product) {
        return res.status(404).json({ error: "Product not found" });
    }

    const { name, price, description, deleteImage } = req.body;
    
    if (name) product.name = name;
    if (price) product.price = price;
    if (description !== undefined) product.description = description;
    
    if (req.file) {
        if (product.image) {
            const oldPath = path.join(__dirname, product.image);
            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
            }
        }
        product.image = `/uploads/${req.file.filename}`;
    }
    
    if (deleteImage === "true") {
        if (product.image) {
            const oldPath = path.join(__dirname, product.image);
            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
            }
        }
        product.image = null;
    }

    res.json(product);
});

// Удалить товар (ТОЛЬКО АДМИН) ⚠️
app.delete("/api/products/:id", authenticateToken, checkRole(["admin"]), (req, res) => {
    const index = products.findIndex((p) => p.id === req.params.id);
    if (index === -1) {
        return res.status(404).json({ error: "Product not found" });
    }

    if (products[index].image) {
        const imagePath = path.join(__dirname, products[index].image);
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }
    }

    products.splice(index, 1);
    res.status(204).send();
});

// ===== ЗАПУСК =====
app.listen(PORT, () => {
    console.log(`\n===== СЕРВЕР ЗАПУЩЕН =====`);
    console.log(`URL: http://localhost:${PORT}`);
    console.log(`\n✅ Админ аккаунт: admin / admin123`);
    console.log(`\n===== РОЛИ И ДОСТУП =====`);
    console.log(`  Гость      - Регистрация, Вход`);
    console.log(`  User       - Просмотр товаров`);
    console.log(`  Seller     - Создание/Редактирование товаров`);
    console.log(`  Admin      - Удаление товаров + Управление пользователями`);
    console.log(`\n`);
});