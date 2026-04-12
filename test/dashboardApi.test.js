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

    const controller = new AbortController();
    await expect(fetchDashboardData("30", controller.signal)).resolves.toEqual(payload);
    expect(global.fetch).toHaveBeenCalledWith("/api/dashboard?days=30", {
      signal: controller.signal
    });
  });

  it("rejects with an AbortError when the request is aborted", async () => {
    const controller = new AbortController();
    const abortError = new DOMException("The user aborted a request.", "AbortError");
    global.fetch.mockRejectedValueOnce(abortError);

    const err = await fetchDashboardData("30", controller.signal).catch((e) => e);
    expect(err.name).toBe("AbortError");
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
      saveMealEntry({ date: "2026-03-25", category: "ate_home", amountPence: 1299 })
    ).resolves.toEqual({ success: true });

    expect(global.fetch).toHaveBeenCalledWith("/api/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: "2026-03-25",
        category: "ate_home",
        amountPence: 1299
      })
    });
  });

  it("throws when saving fails", async () => {
    global.fetch.mockResolvedValueOnce({ ok: false });

    await expect(
      saveMealEntry({ date: "2026-03-25", category: "ate_home", amountPence: null })
    ).rejects.toThrow("Save failed");
  });
});
