import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../server/index.js";

describe("Meal Habit Tracker API", () => {
  let appInstance;
  let tempDirectory;

  beforeEach(() => {
    tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "meal-habit-tracker-"));
  });

  afterEach(() => {
    if (appInstance) {
      appInstance.close();
      appInstance = null;
    }

    fs.rmSync(tempDirectory, { recursive: true, force: true });
    vi.useRealTimers();
  });

  const bootApp = (now = "2026-03-25T12:00:00.000Z") => {
    appInstance = createApp({
      dbPath: path.join(tempDirectory, "meals.db"),
      distPath: path.join(tempDirectory, "missing-dist"),
      nowProvider: () => new Date(now)
    });

    return appInstance.app;
  };

  it("rejects invalid entry payloads", async () => {
    const app = bootApp();

    const response = await request(app)
      .post("/api/entries")
      .send({ date: "25-03-2026", category: "snack", amountPence: -100 });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Invalid payload" });
  });

  it("creates and updates entries for the same day", async () => {
    const app = bootApp();

    await request(app)
      .post("/api/entries")
      .send({ date: "2026-03-25", category: "ate_home", amountPence: 875 })
      .expect(201);

    await request(app)
      .post("/api/entries")
      .send({ date: "2026-03-25", category: "takeaway", amountPence: 1325 })
      .expect(201);

    const dashboard = await request(app).get("/api/dashboard?days=30").expect(200);

    expect(dashboard.body.summary).toEqual({
      takeaway: {
        count: 1,
        averageAmountPence: 1325,
        totalAmountPence: 1325,
        amountEntryCount: 1
      },
      ate_out: {
        count: 0,
        averageAmountPence: null,
        totalAmountPence: 0,
        amountEntryCount: 0
      },
      ate_home: {
        count: 0,
        averageAmountPence: null,
        totalAmountPence: 0,
        amountEntryCount: 0
      }
    });
    expect(dashboard.body.totalTracked).toBe(1);
    expect(dashboard.body.recentEntries).toEqual([
      { date: "2026-03-25", category: "takeaway", amountPence: 1325 }
    ]);
    expect(dashboard.body.rewards.currentStreak).toBe(0);
  });

  it("builds dashboard totals, recent entries, and a complete timeframe timeline", async () => {
    const app = bootApp();

    const entries = [
      { date: "2026-03-25", category: "ate_home", amountPence: 900 },
      { date: "2026-03-24", category: "ate_out" },
      { date: "2026-03-22", category: "takeaway", amountPence: 1500 },
      { date: "2026-03-20", category: "ate_home", amountPence: 700 }
    ];

    for (const entry of entries) {
      await request(app).post("/api/entries").send(entry).expect(201);
    }

    const response = await request(app).get("/api/dashboard?days=7").expect(200);

    expect(response.body.summary).toEqual({
      takeaway: {
        count: 1,
        averageAmountPence: 1500,
        totalAmountPence: 1500,
        amountEntryCount: 1
      },
      ate_out: {
        count: 1,
        averageAmountPence: null,
        totalAmountPence: 0,
        amountEntryCount: 0
      },
      ate_home: {
        count: 2,
        averageAmountPence: 800,
        totalAmountPence: 1600,
        amountEntryCount: 2
      }
    });
    expect(response.body.totalTracked).toBe(4);
    expect(response.body.timeline).toHaveLength(7);
    expect(response.body.timeline[0]).toEqual({
      date: "2026-03-19",
      category: null,
      score: 0
    });
    expect(response.body.timeline.at(-1)).toEqual({
      date: "2026-03-25",
      category: "ate_home",
      score: 1
    });
    expect(response.body.recentEntries).toEqual([
      { date: "2026-03-25", category: "ate_home", amountPence: 900 },
      { date: "2026-03-24", category: "ate_out", amountPence: null },
      { date: "2026-03-22", category: "takeaway", amountPence: 1500 },
      { date: "2026-03-20", category: "ate_home", amountPence: 700 }
    ]);
  });

  it("defaults unsupported dashboard ranges to 30 days", async () => {
    const app = bootApp();

    await request(app)
      .post("/api/entries")
      .send({ date: "2026-03-25", category: "ate_home" })
      .expect(201);

    const response = await request(app).get("/api/dashboard?days=12").expect(200);

    expect(response.body.timeline).toHaveLength(30);
    expect(response.body.timeline[0].date).toBe("2026-02-24");
    expect(response.body.timeline.at(-1).date).toBe("2026-03-25");
  });

  it("keeps spend optional while calculating category averages for the selected range", async () => {
    const app = bootApp();

    await request(app)
      .post("/api/entries")
      .send({ date: "2026-03-25", category: "takeaway", amountPence: 1050 })
      .expect(201);
    await request(app)
      .post("/api/entries")
      .send({ date: "2026-03-24", category: "takeaway" })
      .expect(201);
    await request(app)
      .post("/api/entries")
      .send({ date: "2026-03-23", category: "takeaway", amountPence: 1950 })
      .expect(201);

    const response = await request(app).get("/api/dashboard?days=7").expect(200);

    expect(response.body.summary.takeaway).toMatchObject({
      count: 3,
      totalAmountPence: 3000,
      amountEntryCount: 2,
      averageAmountPence: 1500
    });
  });

  it("calculates a streak when entries include today", async () => {
    const app = bootApp();

    for (const date of ["2026-03-25", "2026-03-24", "2026-03-23"]) {
      await request(app)
        .post("/api/entries")
        .send({ date, category: "ate_home" })
        .expect(201);
    }

    const response = await request(app).get("/api/dashboard?days=30").expect(200);

    expect(response.body.streak).toBe(3);
    expect(response.body.rewards.currentStreak).toBe(3);
    expect(response.body.rewards.unlockedCount).toBe(1);
    expect(response.body.rewards.badges[0].earnedOn).toBe("2026-03-25");
  });

  it("calculates a streak when the latest entry is yesterday", async () => {
    const app = bootApp();

    for (const date of ["2026-03-24", "2026-03-23", "2026-03-22"]) {
      await request(app)
        .post("/api/entries")
        .send({ date, category: "ate_out" })
        .expect(201);
    }

    const response = await request(app).get("/api/dashboard?days=30").expect(200);

    expect(response.body.streak).toBe(3);
    expect(response.body.rewards.currentStreak).toBe(0);
  });

  it("returns a zero streak when the chain is broken before yesterday", async () => {
    const app = bootApp();

    for (const date of ["2026-03-23", "2026-03-22"]) {
      await request(app)
        .post("/api/entries")
        .send({ date, category: "takeaway" })
        .expect(201);
    }

    const response = await request(app).get("/api/dashboard?days=30").expect(200);

    expect(response.body.streak).toBe(0);
  });
});
