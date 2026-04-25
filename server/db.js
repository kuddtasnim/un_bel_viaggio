/**
 * db.js — universal database adapter
 *
 * LOCAL  (no DATABASE_URL in .env)  → SQLite via better-sqlite3
 * RAILWAY (DATABASE_URL is set)     → PostgreSQL via pg
 *
 * Both expose the same async API:
 *   db.query(sql, params) → rows[]
 *   db.one(sql, params)   → row | null
 */

const USE_PG = !!process.env.DATABASE_URL;

// ════════════════════════════════════════════════
//  POSTGRESQL (Railway / production)
// ════════════════════════════════════════════════
if (USE_PG) {
  const { Pool } = require('pg');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

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

  // Create tables (PostgreSQL syntax)
  pool.query(`
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
      tags       JSONB   NOT NULL DEFAULT '[]',
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
  `)
    .then(() => console.log('✦ PostgreSQL schema ready'))
    .catch(err => { console.error('DB init error:', err.message); process.exit(1); });

  module.exports = db;

// ════════════════════════════════════════════════
//  SQLITE (local development)
// ════════════════════════════════════════════════
} else {
  const path = require('path');
  const Database = require('better-sqlite3');

  const DB_PATH = path.join(__dirname, '..', 'database.db');
  const db_file = new Database(DB_PATH);
  db_file.pragma('journal_mode = WAL');
  db_file.pragma('foreign_keys = ON');

  // Convert PostgreSQL syntax → SQLite
  function pgToSqlite(sql) {
    return sql
      .replace(/\$\d+/g, '?')
      .replace(/SERIAL\s+PRIMARY\s+KEY/gi, 'INTEGER PRIMARY KEY AUTOINCREMENT')
      .replace(/TIMESTAMPTZ/gi, 'TEXT')
      .replace(/JSONB/gi, 'TEXT')
      .replace(/BOOLEAN/gi, 'INTEGER')
      .replace(/\bTRUE\b/g, '1')
      .replace(/\bFALSE\b/g, '0')
      .replace(/NOW\(\)/gi, "datetime('now')")
      .replace(/\s+RETURNING\s+[\w\s,*]+/gi, '');
  }

  // Run INSERT/UPDATE/DELETE and return inserted row if RETURNING was requested
  function runWrite(text, params) {
    const hasReturning = /RETURNING/i.test(text);
    const sql  = pgToSqlite(text);
    const info = db_file.prepare(sql).run(...(params || []));

    if (hasReturning) {
      const tableMatch = sql.match(/INTO\s+(\w+)/i);
      if (tableMatch && info.lastInsertRowid) {
        return db_file
          .prepare(`SELECT * FROM ${tableMatch[1]} WHERE id = ?`)
          .get(info.lastInsertRowid) || { id: info.lastInsertRowid };
      }
      return { id: info.lastInsertRowid };
    }
    return null;
  }

  const db = {
    async query(text, params = []) {
      const sql = pgToSqlite(text);
      if (/^\s*(INSERT|UPDATE|DELETE|CREATE|DROP|ALTER)/i.test(sql)) {
        const row = runWrite(text, params);
        return row ? [row] : [];
      }
      return db_file.prepare(sql).all(...params);
    },
    async one(text, params = []) {
      const sql = pgToSqlite(text);
      if (/^\s*(INSERT|UPDATE|DELETE)/i.test(sql)) {
        return runWrite(text, params);
      }
      return db_file.prepare(sql).get(...params) || null;
    }
  };

  // Create tables
  db_file.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      email           TEXT    NOT NULL UNIQUE,
      password_hash   TEXT    NOT NULL,
      name            TEXT    NOT NULL DEFAULT '',
      created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
      gdpr_consent_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS trips (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
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
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS trip_info (
      id      INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
      label   TEXT    NOT NULL,
      value   TEXT    NOT NULL DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS logistics (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id    INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
      time       TEXT    NOT NULL DEFAULT '',
      icon       TEXT    NOT NULL DEFAULT '·',
      text       TEXT    NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS reflections (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      trip_id    INTEGER REFERENCES trips(id) ON DELETE SET NULL,
      mood       TEXT    NOT NULL DEFAULT '',
      mode       TEXT    NOT NULL DEFAULT 'quick',
      answers    TEXT    NOT NULL DEFAULT '[]',
      tags       TEXT    NOT NULL DEFAULT '[]',
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS notes (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id    INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      text       TEXT    NOT NULL DEFAULT '',
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS pack_items (
      id       INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id  INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
      user_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      label    TEXT    NOT NULL,
      checked  INTEGER NOT NULL DEFAULT 0,
      category TEXT    NOT NULL DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS reminders (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      trip_id    INTEGER REFERENCES trips(id) ON DELETE SET NULL,
      title      TEXT    NOT NULL,
      date       TEXT    NOT NULL,
      icon       TEXT    NOT NULL DEFAULT '🔔',
      done       INTEGER NOT NULL DEFAULT 0,
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );
  `);
  console.log('✦ SQLite schema ready →', DB_PATH);

  module.exports = db;
}
