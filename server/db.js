import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

export const initializeDatabase = (dbPath) => {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS meal_entries (
      date TEXT PRIMARY KEY,
      category TEXT NOT NULL CHECK(category IN ('takeaway', 'ate_out', 'ate_home')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  return db;
};

export const createEntryRepository = (db) => {
  const statements = {
    upsert: db.prepare(`
      INSERT INTO meal_entries (date, category)
      VALUES (?, ?)
      ON CONFLICT(date) DO UPDATE SET
        category = excluded.category
    `),
    entriesInRange: db.prepare(`
      SELECT date, category
      FROM meal_entries
      WHERE date BETWEEN ? AND ?
      ORDER BY date ASC
    `),
    recent: db.prepare(`
      SELECT date, category
      FROM meal_entries
      ORDER BY date DESC
      LIMIT 8
    `),
    trackedDatesDesc: db.prepare(`
      SELECT date
      FROM meal_entries
      ORDER BY date DESC
    `),
    totalTracked: db.prepare("SELECT COUNT(*) AS count FROM meal_entries")
  };

  return {
    upsertEntry(date, category) {
      statements.upsert.run(date, category);
    },
    getEntriesInRange(start, end) {
      return statements.entriesInRange.all(start, end);
    },
    getRecentEntries() {
      return statements.recent.all();
    },
    getTrackedDatesDesc() {
      return statements.trackedDatesDesc.all();
    },
    getTotalTracked() {
      return statements.totalTracked.get().count;
    }
  };
};
