import express from "express";
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const app = express();
const port = process.env.PORT || 3001;
const dbDirectory = path.resolve(process.cwd(), "data");
const dbPath = path.join(dbDirectory, "meals.db");
const distPath = path.resolve(process.cwd(), "dist");

fs.mkdirSync(dbDirectory, { recursive: true });

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.exec(`
  CREATE TABLE IF NOT EXISTS meal_entries (
    date TEXT PRIMARY KEY,
    category TEXT NOT NULL CHECK(category IN ('takeaway', 'ate_out', 'ate_home')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

app.use(express.json());

const categoryScore = {
  ate_home: 1,
  ate_out: 2,
  takeaway: 3
};

const getDateRange = (days) => {
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setDate(start.getDate() - (days - 1));
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10)
  };
};

const daysBetween = (first, second) =>
  Math.round((first.getTime() - second.getTime()) / 86400000);

app.post("/api/entries", (req, res) => {
  const { date, category } = req.body ?? {};

  if (
    !date ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !["takeaway", "ate_out", "ate_home"].includes(category)
  ) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  const upsert = db.prepare(`
    INSERT INTO meal_entries (date, category)
    VALUES (?, ?)
    ON CONFLICT(date) DO UPDATE SET
      category = excluded.category
  `);

  upsert.run(date, category);
  return res.status(201).json({ success: true });
});

app.get("/api/dashboard", (req, res) => {
  const days = Number.parseInt(req.query.days, 10) || 30;
  const safeDays = [7, 30, 90, 180, 365].includes(days) ? days : 30;
  const { start, end } = getDateRange(safeDays);

  const rows = db
    .prepare(
      `
      SELECT date, category
      FROM meal_entries
      WHERE date BETWEEN ? AND ?
      ORDER BY date ASC
    `
    )
    .all(start, end);

  const summary = {
    takeaway: 0,
    ate_out: 0,
    ate_home: 0
  };

  const entryMap = new Map(rows.map((row) => [row.date, row.category]));
  const timeline = [];
  const cursor = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);

  while (cursor <= endDate) {
    const current = cursor.toISOString().slice(0, 10);
    const category = entryMap.get(current) ?? null;

    if (category) {
      summary[category] += 1;
    }

    timeline.push({
      date: current,
      category,
      score: category ? categoryScore[category] : 0
    });

    cursor.setDate(cursor.getDate() + 1);
  }

  const recentEntries = db
    .prepare(
      `
      SELECT date, category
      FROM meal_entries
      ORDER BY date DESC
      LIMIT 8
    `
    )
    .all();

  const trackedRows = db
    .prepare(
      `
      SELECT date
      FROM meal_entries
      ORDER BY date DESC
    `
    )
    .all();

  let streak = 0;
  if (trackedRows.length > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let expected = new Date(today);

    if (trackedRows[0].date !== today.toISOString().slice(0, 10)) {
      const latest = new Date(`${trackedRows[0].date}T00:00:00`);
      if (daysBetween(today, latest) === 1) {
        expected = latest;
      }
    }

    for (const row of trackedRows) {
      const current = new Date(`${row.date}T00:00:00`);
      if (daysBetween(expected, current) === 0) {
        streak += 1;
        expected.setDate(expected.getDate() - 1);
      } else {
        break;
      }
    }
  }

  const totalTracked = db
    .prepare("SELECT COUNT(*) AS count FROM meal_entries")
    .get().count;

  return res.json({
    summary,
    timeline,
    recentEntries,
    streak,
    totalTracked
  });
});

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.listen(port, () => {
  console.log(`Meal Habit Tracker running on port ${port}`);
});
