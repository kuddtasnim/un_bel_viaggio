const { Pool } = require('pg');

// Railway автоматически подставляет DATABASE_URL
// Локально — добавь DATABASE_URL в .env
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }  // Railway требует SSL
    : false
});

// ── Хелпер для запросов ──────────────────────────────
// Использование: const rows = await db.query('SELECT...', [param1, param2])
const db = {
  async query(text, params) {
    const res = await pool.query(text, params);
    return res.rows;
  },
  async one(text, params) {
    const res = await pool.query(text, params);
    return res.rows[0] || null;
  }
};

// ── Создание таблиц при первом запуске ───────────────
async function initSchema() {
  await pool.query(`

    CREATE TABLE IF NOT EXISTS users (
      id              SERIAL PRIMARY KEY,
      email           TEXT    NOT NULL UNIQUE,
      password_hash   TEXT    NOT NULL,
      name            TEXT    NOT NULL DEFAULT '',
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      gdpr_consent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS trips (
      id          SERIAL PRIMARY KEY,
      user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name        TEXT    NOT NULL,
      emoji       TEXT    NOT NULL DEFAULT '✈️',
      sub         TEXT    NOT NULL DEFAULT '',
      status      TEXT    NOT NULL DEFAULT 'plan',
      country     TEXT    NOT NULL DEFAULT '',
      date        TEXT    NOT NULL DEFAULT '',
      description TEXT    NOT NULL DEFAULT '',
      song_title  TEXT    NOT NULL DEFAULT '',
      song_artist TEXT    NOT NULL DEFAULT '',
      song_id     TEXT    NOT NULL DEFAULT '',
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS trip_info (
      id      SERIAL PRIMARY KEY,
      trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
      label   TEXT    NOT NULL,
      value   TEXT    NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS logistics (
      id         SERIAL PRIMARY KEY,
      trip_id    INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
      time       TEXT    NOT NULL DEFAULT '',
      icon       TEXT    NOT NULL DEFAULT '·',
      text       TEXT    NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS reflections (
      id         SERIAL PRIMARY KEY,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      trip_id    INTEGER REFERENCES trips(id) ON DELETE SET NULL,
      mood       TEXT    NOT NULL DEFAULT '',
      mode       TEXT    NOT NULL DEFAULT 'quick',
      answers    JSONB   NOT NULL DEFAULT '[]',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS notes (
      id         SERIAL PRIMARY KEY,
      trip_id    INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      text       TEXT    NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS pack_items (
      id       SERIAL PRIMARY KEY,
      trip_id  INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
      user_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      label    TEXT    NOT NULL,
      checked  BOOLEAN NOT NULL DEFAULT FALSE,
      category TEXT    NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS reminders (
      id         SERIAL PRIMARY KEY,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      trip_id    INTEGER REFERENCES trips(id) ON DELETE SET NULL,
      title      TEXT    NOT NULL,
      date       TEXT    NOT NULL,
      icon       TEXT    NOT NULL DEFAULT '🔔',
      done       BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

  `);
  console.log('✦ Схема базы данных готова');
}

initSchema().catch(err => {
  console.error('Ошибка инициализации БД:', err.message);
  process.exit(1);
});

module.exports = db;
