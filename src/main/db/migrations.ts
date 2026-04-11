import type Database from 'better-sqlite3'

/**
 * Migration 005: Add streaming and WebSocket flags to requests table
 * Safe to call multiple times (handles duplicate column errors)
 */
export function migrateAddStreamingAndWebSocketFlags(db: Database.Database): void {
  const migrations = [
    `ALTER TABLE requests ADD COLUMN is_streaming INTEGER DEFAULT 0`,
    `ALTER TABLE requests ADD COLUMN is_websocket INTEGER DEFAULT 0`,
  ]

  for (const migration of migrations) {
    try {
      db.exec(migration)
    } catch (err) {
      // Ignore error if column already exists
      if (!String(err).includes('duplicate column name')) {
        throw err
      }
    }
  }
}

/**
 * Run all database migrations — create tables and indexes.
 * Safe to call multiple times (uses IF NOT EXISTS).
 */
export function runMigrations(db: Database.Database): void {
  db.exec(`
    -- Sessions table
    CREATE TABLE IF NOT EXISTS sessions (
      id          TEXT PRIMARY KEY,
      name        TEXT,
      target_url  TEXT,
      status      TEXT NOT NULL DEFAULT 'stopped',
      created_at  INTEGER NOT NULL,
      stopped_at  INTEGER
    );

    -- HTTP request records
    CREATE TABLE IF NOT EXISTS requests (
      id               TEXT PRIMARY KEY,
      session_id       TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      sequence         INTEGER NOT NULL,
      timestamp        INTEGER NOT NULL,
      method           TEXT NOT NULL,
      url              TEXT NOT NULL,
      request_headers  TEXT,
      request_body     TEXT,
      status_code      INTEGER,
      response_headers TEXT,
      response_body    TEXT,
      content_type     TEXT,
      initiator        TEXT,
      duration_ms      INTEGER
    );

    -- JS Hook capture records
    CREATE TABLE IF NOT EXISTS js_hooks (
      id                 INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id         TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      timestamp          INTEGER NOT NULL,
      hook_type          TEXT NOT NULL,
      function_name      TEXT NOT NULL,
      arguments          TEXT,
      result             TEXT,
      call_stack         TEXT,
      related_request_id TEXT
    );

    -- Storage snapshots
    CREATE TABLE IF NOT EXISTS storage_snapshots (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id   TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      timestamp    INTEGER NOT NULL,
      domain       TEXT NOT NULL,
      storage_type TEXT NOT NULL,
      data         TEXT
    );

    -- AI analysis reports
    CREATE TABLE IF NOT EXISTS analysis_reports (
      id                TEXT PRIMARY KEY,
      session_id        TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      created_at        INTEGER NOT NULL,
      llm_provider      TEXT NOT NULL,
      llm_model         TEXT NOT NULL,
      prompt_tokens     INTEGER,
      completion_tokens INTEGER,
      report_content    TEXT
    );

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_requests_session ON requests(session_id, sequence);
    CREATE INDEX IF NOT EXISTS idx_requests_url ON requests(url);
    CREATE INDEX IF NOT EXISTS idx_js_hooks_session ON js_hooks(session_id, timestamp);
    CREATE INDEX IF NOT EXISTS idx_storage_session ON storage_snapshots(session_id, timestamp);
    CREATE INDEX IF NOT EXISTS idx_reports_session ON analysis_reports(session_id);
  `)

  // Run additional migrations
  migrateAddStreamingAndWebSocketFlags(db)
}
