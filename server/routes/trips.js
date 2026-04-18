const express     = require('express');
const db          = require('../db');
const requireAuth = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// ── GET /api/trips ───────────────────────────────────
router.get('/', async (req, res) => {
  const trips = await db.query(
    'SELECT * FROM trips WHERE user_id = $1 ORDER BY date DESC, created_at DESC',
    [req.userId]
  );

  const full = await Promise.all(trips.map(async t => {
    const info      = await db.query('SELECT label, value FROM trip_info WHERE trip_id = $1', [t.id]);
    const logistics = await db.query('SELECT * FROM logistics WHERE trip_id = $1 ORDER BY sort_order', [t.id]);
    const pack      = await db.query('SELECT * FROM pack_items WHERE trip_id = $1 ORDER BY id', [t.id]);
    return {
      ...t,
      info,
      logistics: logistics.map(l => ({ time: l.time, icon: l.icon, text: l.text })),
      pack: pack.map(p => ({ id: p.id, label: p.label, checked: p.checked, category: p.category })),
      song: { title: t.song_title, artist: t.song_artist, id: t.song_id }
    };
  }));

  res.json(full);
});

// ── GET /api/trips/:id ───────────────────────────────
router.get('/:id', async (req, res) => {
  const trip = await db.one(
    'SELECT * FROM trips WHERE id = $1 AND user_id = $2',
    [req.params.id, req.userId]
  );
  if (!trip) return res.status(404).json({ error: 'Не найдено' });

  const info      = await db.query('SELECT label, value FROM trip_info WHERE trip_id = $1', [trip.id]);
  const logistics = await db.query('SELECT * FROM logistics WHERE trip_id = $1 ORDER BY sort_order', [trip.id]);
  const pack      = await db.query('SELECT * FROM pack_items WHERE trip_id = $1 ORDER BY id', [trip.id]);
  const notes     = await db.query('SELECT * FROM notes WHERE trip_id = $1 ORDER BY created_at DESC', [trip.id]);

  res.json({
    ...trip,
    info,
    logistics: logistics.map(l => ({ time: l.time, icon: l.icon, text: l.text })),
    pack: pack.map(p => ({ id: p.id, label: p.label, checked: p.checked, category: p.category })),
    notes,
    song: { title: trip.song_title, artist: trip.song_artist, id: trip.song_id }
  });
});

// ── POST /api/trips ──────────────────────────────────
router.post('/', async (req, res) => {
  const { name, emoji, sub, status, country, date, start_date, end_date, description, song, info, logistics } = req.body;
  if (!name) return res.status(400).json({ error: 'Название обязательно' });

  const effectiveDate = start_date || date || '';

  const trip = await db.one(
    `INSERT INTO trips (user_id, name, emoji, sub, status, country, date, description, song_title, song_artist, song_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
    [req.userId, name, emoji||'✈️', sub||'', status||'plan', country||'', effectiveDate,
     description||'', song?.title||'', song?.artist||'', song?.id||'']
  );

  if (Array.isArray(info)) {
    for (const i of info)
      await db.query('INSERT INTO trip_info (trip_id, label, value) VALUES ($1,$2,$3)', [trip.id, i.label, i.value]);
  }
  if (Array.isArray(logistics)) {
    for (const [idx, l] of logistics.entries())
      await db.query('INSERT INTO logistics (trip_id, time, icon, text, sort_order) VALUES ($1,$2,$3,$4,$5)',
        [trip.id, l.time||'', l.icon||'·', l.text, idx]);
  }

  res.json({ ok: true, id: trip.id });
});

// ── POST /api/trips/:id/song ─────────────────────────
router.post('/:id/song', async (req, res) => {
  const trip = await db.one('SELECT id FROM trips WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
  if (!trip) return res.status(404).json({ error: 'Не найдено' });
  const { song_title, song_artist, song_id } = req.body;
  await db.query(
    'UPDATE trips SET song_title=$1, song_artist=$2, song_id=$3 WHERE id=$4',
    [song_title||'', song_artist||'', song_id||'', trip.id]
  );
  res.json({ ok: true });
});

// ── PUT /api/trips/:id ───────────────────────────────
router.put('/:id', async (req, res) => {
  const trip = await db.one('SELECT id FROM trips WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
  if (!trip) return res.status(404).json({ error: 'Не найдено' });

  const { name, emoji, sub, status, country, date, start_date, end_date, description, song, info, logistics } = req.body;
  const effectiveDate = start_date || date || '';

  await db.query(
    `UPDATE trips SET name=$1, emoji=$2, sub=$3, status=$4, country=$5, date=$6,
     description=$7, song_title=$8, song_artist=$9, song_id=$10 WHERE id=$11`,
    [name, emoji||'✈️', sub||'', status||'plan', country||'', effectiveDate, description||'',
     song?.title||'', song?.artist||'', song?.id||'', trip.id]
  );

  if (Array.isArray(info)) {
    await db.query('DELETE FROM trip_info WHERE trip_id = $1', [trip.id]);
    for (const i of info)
      await db.query('INSERT INTO trip_info (trip_id, label, value) VALUES ($1,$2,$3)', [trip.id, i.label, i.value]);
  }
  if (Array.isArray(logistics)) {
    await db.query('DELETE FROM logistics WHERE trip_id = $1', [trip.id]);
    for (const [idx, l] of logistics.entries())
      await db.query('INSERT INTO logistics (trip_id, time, icon, text, sort_order) VALUES ($1,$2,$3,$4,$5)',
        [trip.id, l.time||'', l.icon||'·', l.text, idx]);
  }

  res.json({ ok: true });
});

// ── DELETE /api/trips/:id ────────────────────────────
router.delete('/:id', async (req, res) => {
  const trip = await db.one('SELECT id FROM trips WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
  if (!trip) return res.status(404).json({ error: 'Не найдено' });
  await db.query('DELETE FROM trips WHERE id = $1', [trip.id]);
  res.json({ ok: true });
});

// ── GET /api/trips/:id/notes ─────────────────────────
router.get('/:id/notes', async (req, res) => {
  const trip = await db.one('SELECT id FROM trips WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
  if (!trip) return res.status(404).json({ error: 'Не найдено' });
  const notes = await db.query('SELECT * FROM notes WHERE trip_id = $1 ORDER BY created_at DESC', [trip.id]);
  res.json(notes);
});

// ── POST /api/trips/:id/notes ────────────────────────
router.post('/:id/notes', async (req, res) => {
  const trip = await db.one('SELECT id FROM trips WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
  if (!trip) return res.status(404).json({ error: 'Не найдено' });
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Текст обязателен' });
  const note = await db.one(
    'INSERT INTO notes (trip_id, user_id, text) VALUES ($1,$2,$3) RETURNING id',
    [trip.id, req.userId, text]
  );
  res.json({ ok: true, id: note.id });
});

// ── GET /api/trips/:id/pack ──────────────────────────
router.get('/:id/pack', async (req, res) => {
  const trip = await db.one('SELECT id FROM trips WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
  if (!trip) return res.status(404).json({ error: 'Не найдено' });
  const items = await db.query('SELECT * FROM pack_items WHERE trip_id = $1 ORDER BY category, id', [trip.id]);
  res.json(items);
});

// ── POST /api/trips/:id/pack ─────────────────────────
router.post('/:id/pack', async (req, res) => {
  const trip = await db.one('SELECT id FROM trips WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
  if (!trip) return res.status(404).json({ error: 'Не найдено' });
  const { items } = req.body;
  if (!Array.isArray(items)) return res.status(400).json({ error: 'items должен быть массивом' });

  await db.query('DELETE FROM pack_items WHERE trip_id = $1', [trip.id]);
  for (const i of items)
    await db.query(
      'INSERT INTO pack_items (trip_id, user_id, label, category, checked) VALUES ($1,$2,$3,$4,$5)',
      [trip.id, req.userId, i.label, i.category||'', i.checked ? true : false]
    );

  res.json({ ok: true });
});

// ── PATCH /api/trips/:id/pack/:itemId ────────────────
router.patch('/:id/pack/:itemId', async (req, res) => {
  const item = await db.one('SELECT id FROM pack_items WHERE id = $1 AND user_id = $2', [req.params.itemId, req.userId]);
  if (!item) return res.status(404).json({ error: 'Не найдено' });
  await db.query('UPDATE pack_items SET checked = $1 WHERE id = $2', [req.body.checked ? true : false, item.id]);
  res.json({ ok: true });
});

// ── GET /api/trips/reminders/all ─────────────────────
router.get('/reminders/all', async (req, res) => {
  const reminders = await db.query(
    'SELECT * FROM reminders WHERE user_id = $1 ORDER BY date',
    [req.userId]
  );
  res.json(reminders);
});

// ── POST /api/trips/reminders/add ────────────────────
router.post('/reminders/add', async (req, res) => {
  const { title, date, trip_id, icon } = req.body;
  if (!title || !date) return res.status(400).json({ error: 'Название и дата обязательны' });

  const rem = await db.one(
    'INSERT INTO reminders (user_id, trip_id, title, date, icon) VALUES ($1,$2,$3,$4,$5) RETURNING id',
    [req.userId, trip_id || null, title, date, icon || '🔔']
  );
  res.json({ ok: true, id: rem.id });
});

// ── PATCH /api/trips/reminders/:id ───────────────────
router.patch('/reminders/:id', async (req, res) => {
  const rem = await db.one('SELECT id FROM reminders WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
  if (!rem) return res.status(404).json({ error: 'Не найдено' });
  await db.query('UPDATE reminders SET done = $1 WHERE id = $2', [req.body.done ? true : false, rem.id]);
  res.json({ ok: true });
});

// ── DELETE /api/trips/reminders/:id ──────────────────
router.delete('/reminders/:id', async (req, res) => {
  const rem = await db.one('SELECT id FROM reminders WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
  if (!rem) return res.status(404).json({ error: 'Не найдено' });
  await db.query('DELETE FROM reminders WHERE id = $1', [rem.id]);
  res.json({ ok: true });
});

module.exports = router;
