const express     = require('express');
const db          = require('../db');
const requireAuth = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// ── GET /api/user/export ─────────────────────────────
router.get('/export', async (req, res) => {
  const user        = await db.one('SELECT id, email, name, created_at FROM users WHERE id = $1', [req.userId]);
  const trips       = await db.query('SELECT * FROM trips WHERE user_id = $1', [req.userId]);
  const reflections = await db.query('SELECT * FROM reflections WHERE user_id = $1', [req.userId]);
  const notes       = await db.query('SELECT * FROM notes WHERE user_id = $1', [req.userId]);
  const reminders   = await db.query('SELECT * FROM reminders WHERE user_id = $1', [req.userId]);

  const fullTrips = await Promise.all(trips.map(async t => ({
    ...t,
    info:      await db.query('SELECT label, value FROM trip_info WHERE trip_id = $1', [t.id]),
    logistics: await db.query('SELECT time, icon, text FROM logistics WHERE trip_id = $1', [t.id]),
    pack:      await db.query('SELECT label, checked, category FROM pack_items WHERE trip_id = $1', [t.id])
  })));

  const exportData = {
    exported_at: new Date().toISOString(),
    user,
    trips: fullTrips,
    reflections,
    notes,
    reminders
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="un-bel-viaggio-data.json"');
  res.json(exportData);
});

// ── DELETE /api/user/account ─────────────────────────
router.delete('/account', async (req, res) => {
  await db.query('DELETE FROM users WHERE id = $1', [req.userId]);
  res.clearCookie('token');
  res.json({ ok: true, message: 'Аккаунт и все данные удалены' });
});

// ── PUT /api/user/profile ────────────────────────────
router.put('/profile', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Имя обязательно' });
  await db.query('UPDATE users SET name = $1 WHERE id = $2', [name.trim(), req.userId]);
  res.json({ ok: true });
});

module.exports = router;
