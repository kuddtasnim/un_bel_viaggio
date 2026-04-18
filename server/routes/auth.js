const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const db       = require('../db');
const requireAuth = require('../middleware/auth');

const router = express.Router();

// ── Вспомогательная функция: выдать JWT cookie ──────
function issueToken(res, user) {
  const token = jwt.sign(
    { userId: user.id, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

// ── POST /api/auth/register ─────────────────────────
router.post('/register', async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name)
    return res.status(400).json({ error: 'Заполните все поля' });
  if (password.length < 8)
    return res.status(400).json({ error: 'Пароль минимум 8 символов' });

  const existing = await db.one('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
  if (existing)
    return res.status(409).json({ error: 'Этот email уже зарегистрирован' });

  const hash = await bcrypt.hash(password, 12);
  const user = await db.one(
    'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, name',
    [email.toLowerCase().trim(), hash, name.trim()]
  );

  issueToken(res, user);
  res.json({ ok: true, name: user.name });
});

// ── POST /api/auth/login ────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: 'Введите email и пароль' });

  const user = await db.one('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
  if (!user || !(await bcrypt.compare(password, user.password_hash)))
    return res.status(401).json({ error: 'Неверный email или пароль' });

  issueToken(res, user);
  res.json({ ok: true, name: user.name });
});

// ── POST /api/auth/logout ───────────────────────────
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ ok: true });
});

// ── GET /api/auth/me ────────────────────────────────
router.get('/me', requireAuth, async (req, res) => {
  const user = await db.one(
    'SELECT id, email, name, created_at FROM users WHERE id = $1',
    [req.userId]
  );
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
  res.json(user);
});

module.exports = router;
