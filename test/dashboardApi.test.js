import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchDashboardData, saveMealEntry } from "../src/api/dashboardApi";

describe("dashboardApi", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches dashboard data", async () => {
    const payload = { summary: {}, timeline: [], rewards: { badges: [] } };
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => payload
    });

    await expect(fetchDashboardData("30")).resolves.toEqual(payload);
    expect(global.fetch).toHaveBeenCalledWith("/api/dashboard?days=30");
  });

  it("throws when dashboard fetch fails", async () => {
    global.fetch.mockResolvedValueOnce({ ok: false });

    await expect(fetchDashboardData("30")).rejects.toThrow("Unable to load dashboard");
  });

  it("posts entry data", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    });

    await expect(
      saveMealEntry({ date: "2026-03-25", category: "ate_home" })
    ).resolves.toEqual({ success: true });

    expect(global.fetch).toHaveBeenCalledWith("/api/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: "2026-03-25", category: "ate_home" })
    });
  });

  it("throws when saving fails", async () => {
    global.fetch.mockResolvedValueOnce({ ok: false });

    await expect(
      saveMealEntry({ date: "2026-03-25", category: "ate_home" })
    ).rejects.toThrow("Save failed");
  });
});
