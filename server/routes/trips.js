const express     = require('express');
const db          = require('../db');
const requireAuth = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// ── GET /api/trips — все путешествия пользователя ───
router.get('/', (req, res) => {
  const trips = db.prepare('SELECT * FROM trips WHERE user_id = ? ORDER BY date DESC').all(req.userId);

  const full = trips.map(t => {
    const info      = db.prepare('SELECT label, value FROM trip_info WHERE trip_id = ?').all(t.id);
    const logistics = db.prepare('SELECT * FROM logistics WHERE trip_id = ? ORDER BY sort_order').all(t.id);
    const pack      = db.prepare('SELECT * FROM pack_items WHERE trip_id = ? ORDER BY id').all(t.id);
    return {
      ...t,
      info,
      logistics: logistics.map(l => ({ time: l.time, icon: l.icon, text: l.text })),
      pack: pack.map(p => ({ id: p.id, label: p.label, checked: !!p.checked, category: p.category })),
      song: { title: t.song_title, artist: t.song_artist, id: t.song_id }
    };
  });

  res.json(full);
});

// ── GET /api/trips/:id — одно путешествие ───────────
router.get('/:id', (req, res) => {
  const trip = db.prepare('SELECT * FROM trips WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!trip) return res.status(404).json({ error: 'Не найдено' });

  const info      = db.prepare('SELECT label, value FROM trip_info WHERE trip_id = ?').all(trip.id);
  const logistics = db.prepare('SELECT * FROM logistics WHERE trip_id = ? ORDER BY sort_order').all(trip.id);
  const pack      = db.prepare('SELECT * FROM pack_items WHERE trip_id = ? ORDER BY id').all(trip.id);
  const notes     = db.prepare('SELECT * FROM notes WHERE trip_id = ? ORDER BY created_at DESC').all(trip.id);

  res.json({
    ...trip,
    info,
    logistics: logistics.map(l => ({ time: l.time, icon: l.icon, text: l.text })),
    pack: pack.map(p => ({ id: p.id, label: p.label, checked: !!p.checked, category: p.category })),
    notes,
    song: { title: trip.song_title, artist: trip.song_artist, id: trip.song_id }
  });
});

// ── POST /api/trips — создать путешествие ────────────
router.post('/', (req, res) => {
  const { name, emoji, sub, status, country, date, description, song, info, logistics } = req.body;

  if (!name) return res.status(400).json({ error: 'Название обязательно' });

  const result = db.prepare(`
    INSERT INTO trips (user_id, name, emoji, sub, status, country, date, description, song_title, song_artist, song_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.userId,
    name,
    emoji || '✈️',
    sub || '',
    status || 'plan',
    country || '',
    date || '',
    description || '',
    song?.title || '',
    song?.artist || '',
    song?.id || ''
  );

  const tripId = result.lastInsertRowid;

  // Сохраняем info блоки
  if (Array.isArray(info)) {
    const insertInfo = db.prepare('INSERT INTO trip_info (trip_id, label, value) VALUES (?, ?, ?)');
    info.forEach(i => insertInfo.run(tripId, i.label, i.value));
  }

  // Сохраняем логистику
  if (Array.isArray(logistics)) {
    const insertLog = db.prepare('INSERT INTO logistics (trip_id, time, icon, text, sort_order) VALUES (?, ?, ?, ?, ?)');
    logistics.forEach((l, idx) => insertLog.run(tripId, l.time || '', l.icon || '·', l.text, idx));
  }

  res.json({ ok: true, id: tripId });
});

// ── PUT /api/trips/:id — обновить путешествие ────────
router.put('/:id', (req, res) => {
  const trip = db.prepare('SELECT id FROM trips WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!trip) return res.status(404).json({ error: 'Не найдено' });

  const { name, emoji, sub, status, country, date, description, song, info, logistics } = req.body;

  db.prepare(`
    UPDATE trips SET name=?, emoji=?, sub=?, status=?, country=?, date=?, description=?,
    song_title=?, song_artist=?, song_id=? WHERE id=?
  `).run(
    name, emoji, sub, status, country, date, description,
    song?.title || '', song?.artist || '', song?.id || '',
    trip.id
  );

  // Перезаписываем info
  if (Array.isArray(info)) {
    db.prepare('DELETE FROM trip_info WHERE trip_id = ?').run(trip.id);
    const insertInfo = db.prepare('INSERT INTO trip_info (trip_id, label, value) VALUES (?, ?, ?)');
    info.forEach(i => insertInfo.run(trip.id, i.label, i.value));
  }

  // Перезаписываем логистику
  if (Array.isArray(logistics)) {
    db.prepare('DELETE FROM logistics WHERE trip_id = ?').run(trip.id);
    const insertLog = db.prepare('INSERT INTO logistics (trip_id, time, icon, text, sort_order) VALUES (?, ?, ?, ?, ?)');
    logistics.forEach((l, idx) => insertLog.run(trip.id, l.time || '', l.icon || '·', l.text, idx));
  }

  res.json({ ok: true });
});

// ── DELETE /api/trips/:id — удалить путешествие ──────
router.delete('/:id', (req, res) => {
  const trip = db.prepare('SELECT id FROM trips WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!trip) return res.status(404).json({ error: 'Не найдено' });

  db.prepare('DELETE FROM trips WHERE id = ?').run(trip.id);
  res.json({ ok: true });
});

// ── GET /api/trips/:id/notes ─────────────────────────
router.get('/:id/notes', (req, res) => {
  const trip = db.prepare('SELECT id FROM trips WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!trip) return res.status(404).json({ error: 'Не найдено' });

  const notes = db.prepare('SELECT * FROM notes WHERE trip_id = ? ORDER BY created_at DESC').all(trip.id);
  res.json(notes);
});

// ── POST /api/trips/:id/notes ────────────────────────
router.post('/:id/notes', (req, res) => {
  const trip = db.prepare('SELECT id FROM trips WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!trip) return res.status(404).json({ error: 'Не найдено' });

  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Текст обязателен' });

  const result = db.prepare('INSERT INTO notes (trip_id, user_id, text) VALUES (?, ?, ?)').run(trip.id, req.userId, text);
  res.json({ ok: true, id: result.lastInsertRowid });
});

// ── GET /api/trips/:id/pack ──────────────────────────
router.get('/:id/pack', (req, res) => {
  const trip = db.prepare('SELECT id FROM trips WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!trip) return res.status(404).json({ error: 'Не найдено' });

  const items = db.prepare('SELECT * FROM pack_items WHERE trip_id = ? ORDER BY category, id').all(trip.id);
  res.json(items);
});

// ── POST /api/trips/:id/pack ─────────────────────────
router.post('/:id/pack', (req, res) => {
  const trip = db.prepare('SELECT id FROM trips WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!trip) return res.status(404).json({ error: 'Не найдено' });

  const items = req.body.items; // массив { label, category }
  if (!Array.isArray(items)) return res.status(400).json({ error: 'items должен быть массивом' });

  db.prepare('DELETE FROM pack_items WHERE trip_id = ?').run(trip.id);
  const insert = db.prepare('INSERT INTO pack_items (trip_id, user_id, label, category, checked) VALUES (?, ?, ?, ?, ?)');
  items.forEach(i => insert.run(trip.id, req.userId, i.label, i.category || '', i.checked ? 1 : 0));

  res.json({ ok: true });
});

// ── PATCH /api/trips/:id/pack/:itemId — отметить вещь ─
router.patch('/:id/pack/:itemId', (req, res) => {
  const item = db.prepare('SELECT * FROM pack_items WHERE id = ? AND user_id = ?').get(req.params.itemId, req.userId);
  if (!item) return res.status(404).json({ error: 'Не найдено' });

  db.prepare('UPDATE pack_items SET checked = ? WHERE id = ?').run(req.body.checked ? 1 : 0, item.id);
  res.json({ ok: true });
});

// ── GET /api/reminders ───────────────────────────────
router.get('/reminders/all', (req, res) => {
  const reminders = db.prepare('SELECT * FROM reminders WHERE user_id = ? ORDER BY date').all(req.userId);
  res.json(reminders);
});

// ── POST /api/reminders ──────────────────────────────
router.post('/reminders/add', (req, res) => {
  const { title, date, trip_id } = req.body;
  if (!title || !date) return res.status(400).json({ error: 'Название и дата обязательны' });

  const result = db.prepare(
    'INSERT INTO reminders (user_id, trip_id, title, date) VALUES (?, ?, ?, ?)'
  ).run(req.userId, trip_id || null, title, date);

  res.json({ ok: true, id: result.lastInsertRowid });
});

// ── PATCH /api/reminders/:id ─────────────────────────
router.patch('/reminders/:id', (req, res) => {
  const rem = db.prepare('SELECT id FROM reminders WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!rem) return res.status(404).json({ error: 'Не найдено' });

  db.prepare('UPDATE reminders SET done = ? WHERE id = ?').run(req.body.done ? 1 : 0, rem.id);
  res.json({ ok: true });
});

// ── DELETE /api/reminders/:id ────────────────────────
router.delete('/reminders/:id', (req, res) => {
  const rem = db.prepare('SELECT id FROM reminders WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!rem) return res.status(404).json({ error: 'Не найдено' });

  db.prepare('DELETE FROM reminders WHERE id = ?').run(rem.id);
  res.json({ ok: true });
});

module.exports = router;
