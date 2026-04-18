const express     = require('express');
const db          = require('../db');
const requireAuth = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// ── POST /api/reflections ────────────────────────────
router.post('/', async (req, res) => {
  const { mood, mode, answers, trip_id } = req.body;
  if (!mood) return res.status(400).json({ error: 'Настроение обязательно' });

  const row = await db.one(
    'INSERT INTO reflections (user_id, trip_id, mood, mode, answers) VALUES ($1,$2,$3,$4,$5) RETURNING id',
    [req.userId, trip_id || null, mood, mode || 'quick', JSON.stringify(answers || [])]
  );
  res.json({ ok: true, id: row.id });
});

// ── GET /api/reflections ─────────────────────────────
router.get('/', async (req, res) => {
  const rows = await db.query(
    `SELECT r.*, t.name as trip_name, t.emoji as trip_emoji
     FROM reflections r
     LEFT JOIN trips t ON t.id = r.trip_id
     WHERE r.user_id = $1
     ORDER BY r.created_at DESC
     LIMIT 50`,
    [req.userId]
  );
  res.json(rows);
});

module.exports = router;
