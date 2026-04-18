const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'database.db');
const db = new Database(DB_PATH);

// Включаем WAL режим — лучше производительность
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ════════════════════════════════
//  СОЗДАНИЕ ТАБЛИЦ
// ════════════════════════════════

db.exec(`

  -- Пользователи
  CREATE TABLE IF NOT EXISTS users (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    email           TEXT    NOT NULL UNIQUE,
    password_hash   TEXT    NOT NULL,
    name            TEXT    NOT NULL DEFAULT '',
    created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
    gdpr_consent_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  -- Путешествия
  CREATE TABLE IF NOT EXISTS trips (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL,
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
    created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- Блоки информации о путешествии (Duration, Highlight и т.д.)
  CREATE TABLE IF NOT EXISTS trip_info (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    trip_id INTEGER NOT NULL,
    label   TEXT    NOT NULL,
    value   TEXT    NOT NULL DEFAULT '',
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
  );

  -- Логистика (расписание / чеклист дня)
  CREATE TABLE IF NOT EXISTS logistics (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    trip_id    INTEGER NOT NULL,
    time       TEXT    NOT NULL DEFAULT '',
    icon       TEXT    NOT NULL DEFAULT '·',
    text       TEXT    NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
  );

  -- Рефлексии
  CREATE TABLE IF NOT EXISTS reflections (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL,
    trip_id    INTEGER,
    mood       TEXT    NOT NULL DEFAULT '',
    mode       TEXT    NOT NULL DEFAULT 'quick',
    answers    TEXT    NOT NULL DEFAULT '[]',
    created_at TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE SET NULL
  );

  -- Заметки
  CREATE TABLE IF NOT EXISTS notes (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    trip_id    INTEGER NOT NULL,
    user_id    INTEGER NOT NULL,
    text       TEXT    NOT NULL DEFAULT '',
    created_at TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- Список вещей
  CREATE TABLE IF NOT EXISTS pack_items (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    trip_id  INTEGER NOT NULL,
    user_id  INTEGER NOT NULL,
    label    TEXT    NOT NULL,
    checked  INTEGER NOT NULL DEFAULT 0,
    category TEXT    NOT NULL DEFAULT '',
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- Напоминания
  CREATE TABLE IF NOT EXISTS reminders (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL,
    trip_id    INTEGER,
    title      TEXT    NOT NULL,
    date       TEXT    NOT NULL,
    done       INTEGER NOT NULL DEFAULT 0,
    created_at TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE SET NULL
  );

`);

module.exports = db;
