import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createEntryRepository, initializeDatabase } from "./db.js";
import { buildDashboardResponse, isValidEntryPayload } from "./services/dashboardService.js";

export const createApp = ({
  dbPath = path.join(path.resolve(process.cwd(), "data"), "meals.db"),
  distPath = path.resolve(process.cwd(), "dist"),
  nowProvider = () => new Date()
} = {}) => {
  const app = express();
  const db = initializeDatabase(dbPath);
  const repository = createEntryRepository(db);

  app.use(express.json());

  app.post("/api/entries", (req, res) => {
    const payload = req.body ?? {};

    if (!isValidEntryPayload(payload)) {
      return res.status(400).json({ error: "Invalid payload" });
    }

    repository.upsertEntry(payload.date, payload.category);
    return res.status(201).json({ success: true });
  });

  app.get("/api/dashboard", (req, res) => {
    const days = Number.parseInt(req.query.days, 10) || 30;
    return res.json(buildDashboardResponse(repository, days, nowProvider()));
  });

  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  return {
    app,
    db,
    close() {
      db.close();
    }
  };
};

const isMainModule =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isMainModule) {
  const port = process.env.PORT || 3001;
  const { app } = createApp();
  app.listen(port, () => {
    console.log(`Meal Habit Tracker running on port ${port}`);
  });
}

export { buildDashboardResponse };
