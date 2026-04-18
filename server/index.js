require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express    = require('express');
const cookieParser = require('cookie-parser');
const cors       = require('cors');
const path       = require('path');

// Инициализируем базу данных при старте
require('./db');

const app = express();

// ── Middleware ──────────────────────────────────────
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? false                          // в продакшне — тот же домен
    : 'http://localhost:3000',
  credentials: true
}));

// ── Статические файлы (фронтенд) ───────────────────
app.use(express.static(path.join(__dirname, '..', 'public')));

// ── API маршруты ────────────────────────────────────
app.use('/api/auth',        require('./routes/auth'));
app.use('/api/trips',       require('./routes/trips'));
app.use('/api/reflections', require('./routes/reflections'));
app.use('/api/plan',        require('./routes/plan'));
app.use('/api/user',        require('./routes/user'));

// ── Конфигурация для фронтенда (безопасно отдаём ключ Google) ──
app.get('/api/config', (req, res) => {
  res.json({ googleMapsKey: process.env.GOOGLE_MAPS_KEY });
});

// ── Все остальные запросы → index.html (SPA) ───────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// ── Запуск ──────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✦ Un Bel Viaggio сервер запущен на http://localhost:${PORT}`);
});
