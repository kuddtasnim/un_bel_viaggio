const express     = require('express');
const db          = require('../db');
const requireAuth = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// ── POST /api/reflections — сохранить рефлексию ──────
router.post('/', (req, res) => {
  const { mood, mode, answers, trip_id } = req.body;

  if (!mood) return res.status(400).json({ error: 'Настроение обязательно' });

  const result = db.prepare(`
    INSERT INTO reflections (user_id, trip_id, mood, mode, answers)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    req.userId,
    trip_id || null,
    mood,
    mode || 'quick',
    JSON.stringify(answers || [])
  );

  res.json({ ok: true, id: result.lastInsertRowid });
});

// ── GET /api/reflections — история рефлексий ─────────
router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT r.*, t.name as trip_name, t.emoji as trip_emoji
    FROM reflections r
    LEFT JOIN trips t ON t.id = r.trip_id
    WHERE r.user_id = ?
    ORDER BY r.created_at DESC
    LIMIT 50
  `).all(req.userId);

  const parsed = rows.map(r => ({
    ...r,
    answers: JSON.parse(r.answers || '[]')
  }));

  res.json(parsed);
});

module.exports = router;
