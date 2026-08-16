import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import * as path from 'path';
import * as fs from 'fs';

// Store the SQLite database in a persistent local data directory or root
const DB_DIR = process.env.DB_DIR || path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_PATH = process.env.DB_PATH || path.join(DB_DIR, 'incidents.db');

export const sqlite: Database.Database = new Database(DB_PATH);

export const db = drizzle(sqlite, { schema });

export function initDb() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS operational_events (
      id TEXT PRIMARY KEY,
      site TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      source TEXT NOT NULL,
      type TEXT NOT NULL,
      message TEXT NOT NULL,
      payload TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id TEXT PRIMARY KEY,
      site TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      type TEXT NOT NULL,
      severity TEXT NOT NULL CHECK(severity IN ('critical', 'high', 'medium', 'low')),
      description TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'investigating', 'resolved'))
    );


    CREATE TABLE IF NOT EXISTS alert_events (
      alert_id TEXT NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
      event_id TEXT NOT NULL REFERENCES operational_events(id) ON DELETE CASCADE,
      role TEXT NOT NULL CHECK(role IN ('trigger', 'context')),
      PRIMARY KEY (alert_id, event_id)
    );

    CREATE TABLE IF NOT EXISTS follow_up_notes (
      id TEXT PRIMARY KEY,
      alert_id TEXT NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
      text TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_events_site_time ON operational_events(site, timestamp);
    CREATE INDEX IF NOT EXISTS idx_events_source_time ON operational_events(source, timestamp);
    CREATE INDEX IF NOT EXISTS idx_alerts_site_status ON alerts(site, status);
    CREATE INDEX IF NOT EXISTS idx_alert_events_alert ON alert_events(alert_id);
    CREATE INDEX IF NOT EXISTS idx_follow_up_notes_alert ON follow_up_notes(alert_id);
  `);
}

initDb();
