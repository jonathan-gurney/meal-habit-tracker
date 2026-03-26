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
        { date: "2026-03-25", category: "takeaway" },
        { date: "2026-03-24", category: "ate_home" },
        { date: "2026-03-23", category: "ate_home" }
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
    expect(result.rewards).toMatchObject({
      currentStreak: 0,
      longestStreak: 2,
      totalHomeDays: 2,
      unlockedCount: 0,
      totalBadges: 6
    });
  });

  it("builds badge progress from at-home streaks", () => {
    const repository = {
      getEntriesInRange: () => [],
      getRecentEntries: () => [],
      getTrackedDatesDesc: () => [
        { date: "2026-03-25", category: "ate_home" },
        { date: "2026-03-24", category: "ate_home" },
        { date: "2026-03-23", category: "ate_home" },
        { date: "2026-03-22", category: "ate_home" },
        { date: "2026-03-21", category: "ate_home" },
        { date: "2026-03-20", category: "ate_home" },
        { date: "2026-03-19", category: "ate_home" },
        { date: "2026-03-18", category: "takeaway" }
      ],
      getTotalTracked: () => 8
    };

    const result = buildDashboardResponse(repository, 30, new Date("2026-03-25T12:00:00.000Z"));

    expect(result.rewards.currentStreak).toBe(7);
    expect(result.rewards.longestStreak).toBe(7);
    expect(result.rewards.totalHomeDays).toBe(7);
    expect(result.rewards.unlockedCount).toBe(2);
    expect(result.rewards.nextBadge).toMatchObject({
      id: "home_streak_14",
      remaining: 7
    });
    expect(result.rewards.badges[0]).toMatchObject({
      id: "home_streak_3",
      unlocked: true,
      earnedOn: "2026-03-21",
      rewardCount: 1
    });
    expect(result.rewards.badges[1]).toMatchObject({
      id: "home_streak_7",
      unlocked: true,
      earnedOn: "2026-03-25",
      rewardCount: 1
    });
  });

  it("counts how many separate times each badge threshold has been earned", () => {
    const repository = {
      getEntriesInRange: () => [],
      getRecentEntries: () => [],
      getTrackedDatesDesc: () => [
        { date: "2026-03-25", category: "takeaway" },
        { date: "2026-03-24", category: "ate_home" },
        { date: "2026-03-23", category: "ate_home" },
        { date: "2026-03-22", category: "ate_home" },
        { date: "2026-03-21", category: "takeaway" },
        { date: "2026-03-20", category: "ate_home" },
        { date: "2026-03-19", category: "ate_home" },
        { date: "2026-03-18", category: "ate_home" },
        { date: "2026-03-17", category: "ate_home" },
        { date: "2026-03-16", category: "ate_home" },
        { date: "2026-03-15", category: "ate_home" },
        { date: "2026-03-14", category: "ate_home" }
      ],
      getTotalTracked: () => 12
    };

    const result = buildDashboardResponse(repository, 30, new Date("2026-03-25T12:00:00.000Z"));

    expect(result.rewards.badges[0]).toMatchObject({
      id: "home_streak_3",
      rewardCount: 2
    });
    expect(result.rewards.badges[1]).toMatchObject({
      id: "home_streak_7",
      rewardCount: 1
    });
  });
});
