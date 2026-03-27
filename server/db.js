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
      amount_pence INTEGER CHECK(amount_pence IS NULL OR amount_pence >= 0),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  const columns = db.prepare("PRAGMA table_info(meal_entries)").all();
  const hasAmountPence = columns.some((column) => column.name === "amount_pence");

  if (!hasAmountPence) {
    db.exec(`
      ALTER TABLE meal_entries
      ADD COLUMN amount_pence INTEGER CHECK(amount_pence IS NULL OR amount_pence >= 0)
    `);
  }

  return db;
};

export const createEntryRepository = (db) => {
  const statements = {
    upsert: db.prepare(`
      INSERT INTO meal_entries (date, category, amount_pence)
      VALUES (?, ?, ?)
      ON CONFLICT(date) DO UPDATE SET
        category = excluded.category,
        amount_pence = excluded.amount_pence
    `),
    entriesInRange: db.prepare(`
      SELECT date, category, amount_pence
      FROM meal_entries
      WHERE date BETWEEN ? AND ?
      ORDER BY date ASC
    `),
    recent: db.prepare(`
      SELECT date, category, amount_pence
      FROM meal_entries
      ORDER BY date DESC
      LIMIT 8
    `),
    trackedDatesDesc: db.prepare(`
      SELECT date, category, amount_pence
      FROM meal_entries
      ORDER BY date DESC
    `),
    totalTracked: db.prepare("SELECT COUNT(*) AS count FROM meal_entries")
  };

  return {
    upsertEntry(date, category, amountPence) {
      statements.upsert.run(date, category, amountPence);
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
