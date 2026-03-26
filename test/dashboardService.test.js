import { describe, expect, it } from "vitest";
import {
  buildDashboardResponse,
  isValidEntryPayload,
  resolveDashboardRange
} from "../server/services/dashboardService.js";

describe("dashboardService", () => {
  it("validates entry payloads", () => {
    expect(isValidEntryPayload({ date: "2026-03-25", category: "ate_home" })).toBe(true);
    expect(isValidEntryPayload({ date: "03-25-2026", category: "ate_home" })).toBe(false);
    expect(isValidEntryPayload({ date: "2026-03-25", category: "snack" })).toBe(false);
  });

  it("defaults unsupported ranges to 30 days", () => {
    expect(resolveDashboardRange(7)).toBe(7);
    expect(resolveDashboardRange(12)).toBe(30);
  });

  it("builds dashboard response from repository data", () => {
    const repository = {
      getEntriesInRange: () => [
        { date: "2026-03-23", category: "ate_home" },
        { date: "2026-03-25", category: "takeaway" }
      ],
      getRecentEntries: () => [{ date: "2026-03-25", category: "takeaway" }],
      getTrackedDatesDesc: () => [
        { date: "2026-03-25" },
        { date: "2026-03-24" },
        { date: "2026-03-23" }
      ],
      getTotalTracked: () => 3
    };

    const result = buildDashboardResponse(repository, 7, new Date("2026-03-25T12:00:00.000Z"));

    expect(result.summary).toEqual({ takeaway: 1, ate_out: 0, ate_home: 1 });
    expect(result.timeline).toHaveLength(7);
    expect(result.timeline.at(-1)).toEqual({
      date: "2026-03-25",
      category: "takeaway",
      score: 3
    });
    expect(result.streak).toBe(3);
    expect(result.totalTracked).toBe(3);
    expect(result.recentEntries).toEqual([{ date: "2026-03-25", category: "takeaway" }]);
  });
});
