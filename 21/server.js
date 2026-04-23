const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { createClient } = require("redis");

const app = express();
app.use(express.json());

const PORT = 3000;

// === Конфигурация ===
const ACCESS_SECRET = "access_secret";
const REFRESH_SECRET = "refresh_secret";
const ACCESS_EXPIRES_IN = "15m";
const REFRESH_EXPIRES_IN = "7d";

// TTL для кэша (в секундах)
const USERS_CACHE_TTL = 60;       // 1 минута
const PRODUCTS_CACHE_TTL = 600;   // 10 минут

// === Хранилища (in-memory для учебной цели) ===
// User: { id, username, passwordHash, role, blocked }
const users = [];
// Product: { id, name, price, description }
const products = [];
const refreshTokens = new Set();

// === Redis client ===
const redisClient = createClient({ url: "redis://127.0.0.1:6379" });
redisClient.on("error", (err) => console.error("Redis error:", err));

async function initRedis() {
  await redisClient.connect();
  console.log("✓ Redis connected");
}

// === Генерация токенов ===
function generateAccessToken(user) {
  return jwt.sign(
    { sub: user.id, username: user.username, role: user.role },
    ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRES_IN }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    { sub: user.id, username: user.username, role: user.role },
    REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRES_IN }
  );
}

// === Middleware ===
function authMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }

  try {
    const payload = jwt.verify(token, ACCESS_SECRET);
    const user = users.find((u) => u.id === payload.sub);
    if (!user || user.blocked) {
      return res.status(401).json({ error: "User not found or blocked" });
    }
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

function roleMiddleware(allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}

// Кэширование: чтение
function cacheMiddleware(keyBuilder, ttl) {
  return async (req, res, next) => {
    try {
      const key = keyBuilder(req);
      const cached = await redisClient.get(key);
      if (cached) {
        return res.json({ source: "cache", data: JSON.parse(cached) });
      }
      req.cacheKey = key;
      req.cacheTTL = ttl;
      next();
    } catch (err) {
      console.error("Cache read error:", err);
      next();
    }
  };
}

// Кэширование: запись
async function saveToCache(key, data, ttl) {
  try {
    await redisClient.set(key, JSON.stringify(data), { EX: ttl });
  } catch (err) {
    console.error("Cache save error:", err);
  }
}

// Инвалидация кэша
async function invalidateUsersCache(userId = null) {
  try {
    await redisClient.del("users:all");
    if (userId) await redisClient.del(`users:${userId}`);
  } catch (err) {
    console.error("Users cache invalidate error:", err);
  }
}

async function invalidateProductsCache(productId = null) {
  try {
    await redisClient.del("products:all");
    if (productId) await redisClient.del(`products:${productId}`);
  } catch (err) {
    console.error("Products cache invalidate error:", err);
  }
}

// === AUTH ===
app.post("/api/auth/register", async (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "username and password are required" });
  }
  if (users.some((u) => u.username === username)) {
    return res.status(409).json({ error: "username already exists" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = {
    id: String(users.length + 1),
    username,
    passwordHash,
    role: role || "user",
    blocked: false
  };
  users.push(user);

  res.status(201).json({ id: user.id, username: user.username, role: user.role, blocked: user.blocked });
});

app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "username and password are required" });
  }
  const user = users.find((u) => u.username === username);
  if (!user || user.blocked) {
    return res.status(401).json({ error: "Invalid credentials or user is blocked" });
  }
  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  refreshTokens.add(refreshToken);

  res.json({ accessToken, refreshToken });
});

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
    if (!user || user.blocked) {
      return res.status(401).json({ error: "User not found or blocked" });
    }

    refreshTokens.delete(refreshToken);
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);
    refreshTokens.add(newRefreshToken);

    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch {
    return res.status(401).json({ error: "Invalid or expired refresh token" });
  }
});

app.get("/api/auth/me", authMiddleware, roleMiddleware(["user", "seller", "admin"]), (req, res) => {
  const user = users.find((u) => u.id === req.user.sub);
  res.json({ id: user.id, username: user.username, role: user.role, blocked: user.blocked });
});

// === USERS (Admin only) ===
app.get(
  "/api/users",
  authMiddleware,
  roleMiddleware(["admin"]),
  cacheMiddleware(() => "users:all", USERS_CACHE_TTL),
  async (req, res) => {
    const data = users.map((u) => ({ id: u.id, username: u.username, role: u.role, blocked: u.blocked }));
    await saveToCache(req.cacheKey, data, req.cacheTTL);
    res.json({ source: "server", data });
  }
);

app.get(
  "/api/users/:id",
  authMiddleware,
  roleMiddleware(["admin"]),
  cacheMiddleware((req) => `users:${req.params.id}`, USERS_CACHE_TTL),
  async (req, res) => {
    const user = users.find((u) => u.id === req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const data = { id: user.id, username: user.username, role: user.role, blocked: user.blocked };
    await saveToCache(req.cacheKey, data, req.cacheTTL);
    res.json({ source: "server", data });
  }
);

app.put("/api/users/:id", authMiddleware, roleMiddleware(["admin"]), async (req, res) => {
  const { username, role, blocked } = req.body;
  const user = users.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });

  if (username !== undefined) user.username = username;
  if (role !== undefined) user.role = role;
  if (blocked !== undefined) user.blocked = blocked;

  await invalidateUsersCache(user.id);
  res.json({ id: user.id, username: user.username, role: user.role, blocked: user.blocked });
});

app.delete("/api/users/:id", authMiddleware, roleMiddleware(["admin"]), async (req, res) => {
  const user = users.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });

  user.blocked = true;
  await invalidateUsersCache(user.id);
  res.json({ message: "User blocked", id: user.id });
});

// === PRODUCTS ===
app.post("/api/products", authMiddleware, roleMiddleware(["seller", "admin"]), async (req, res) => {
  const { name, price, description } = req.body;
  if (!name || price === undefined) {
    return res.status(400).json({ error: "name and price are required" });
  }

  const product = {
    id: String(products.length + 1),
    name,
    price,
    description: description || ""
  };
  products.push(product);
  await invalidateProductsCache(); // очистка кэша списка

  res.status(201).json(product);
});

app.get(
  "/api/products",
  authMiddleware,
  roleMiddleware(["user", "seller", "admin"]),
  cacheMiddleware(() => "products:all", PRODUCTS_CACHE_TTL),
  async (req, res) => {
    const data = products.map((p) => ({ id: p.id, name: p.name, price: p.price, description: p.description }));
    await saveToCache(req.cacheKey, data, req.cacheTTL);
    res.json({ source: "server", data });
  }
);

app.get(
  "/api/products/:id",
  authMiddleware,
  roleMiddleware(["user", "seller", "admin"]),
  cacheMiddleware((req) => `products:${req.params.id}`, PRODUCTS_CACHE_TTL),
  async (req, res) => {
    const product = products.find((p) => p.id === req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    const data = { id: product.id, name: product.name, price: product.price, description: product.description };
    await saveToCache(req.cacheKey, data, req.cacheTTL);
    res.json({ source: "server", data });
  }
);

app.put("/api/products/:id", authMiddleware, roleMiddleware(["seller", "admin"]), async (req, res) => {
  const { name, price, description } = req.body;
  const product = products.find((p) => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: "Product not found" });

  if (name !== undefined) product.name = name;
  if (price !== undefined) product.price = price;
  if (description !== undefined) product.description = description;

  await invalidateProductsCache(product.id);
  res.json(product);
});

app.delete("/api/products/:id", authMiddleware, roleMiddleware(["admin"]), async (req, res) => {
  const idx = products.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Product not found" });

  const deleted = products.splice(idx, 1)[0];
  await invalidateProductsCache(deleted.id);
  res.json({ message: "Product deleted", id: deleted.id });
});

// === Запуск ===
initRedis().then(() => {
  app.listen(PORT, () => {
    console.log(`✓ Сервер запущен: http://localhost:${PORT}`);
  });
});