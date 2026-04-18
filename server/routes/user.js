const express     = require('express');
const db          = require('../db');
const requireAuth = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// ── GET /api/user/export — скачать все свои данные ───
router.get('/export', (req, res) => {
  const user        = db.prepare('SELECT id, email, name, created_at FROM users WHERE id = ?').get(req.userId);
  const trips       = db.prepare('SELECT * FROM trips WHERE user_id = ?').all(req.userId);
  const reflections = db.prepare('SELECT * FROM reflections WHERE user_id = ?').all(req.userId);
  const notes       = db.prepare('SELECT * FROM notes WHERE user_id = ?').all(req.userId);
  const reminders   = db.prepare('SELECT * FROM reminders WHERE user_id = ?').all(req.userId);

  // Обогащаем путешествия
  const fullTrips = trips.map(t => ({
    ...t,
    info:      db.prepare('SELECT label, value FROM trip_info WHERE trip_id = ?').all(t.id),
    logistics: db.prepare('SELECT time, icon, text FROM logistics WHERE trip_id = ?').all(t.id),
    pack:      db.prepare('SELECT label, checked, category FROM pack_items WHERE trip_id = ?').all(t.id)
  }));

  const exportData = {
    exported_at: new Date().toISOString(),
    user,
    trips: fullTrips,
    reflections: reflections.map(r => ({ ...r, answers: JSON.parse(r.answers || '[]') })),
    notes,
    reminders
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="un-bel-viaggio-data.json"');
  res.json(exportData);
});

// ── DELETE /api/user/account — удалить аккаунт ───────
// Все связанные данные удалятся каскадно (ON DELETE CASCADE в БД)
router.delete('/account', (req, res) => {
  db.prepare('DELETE FROM users WHERE id = ?').run(req.userId);
  res.clearCookie('token');
  res.json({ ok: true, message: 'Аккаунт и все данные удалены' });
});

// ── PUT /api/user/profile — обновить имя ─────────────
router.put('/profile', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Имя обязательно' });

  db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name.trim(), req.userId);
  res.json({ ok: true });
});

module.exports = router;
