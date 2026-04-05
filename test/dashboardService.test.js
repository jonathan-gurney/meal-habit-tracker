import { describe, expect, it } from "vitest";
import {
  buildDashboardResponse,
  isValidEntryPayload,
  resolveDashboardRange
} from "../server/services/dashboardService.js";

describe("dashboardService", () => {
  it("validates entry payloads", () => {
    expect(isValidEntryPayload({ date: "2026-03-25", category: "ate_home" })).toBe(true);
    expect(
      isValidEntryPayload({ date: "2026-03-25", category: "ate_home", amountPence: 1250 })
    ).toBe(true);
    expect(isValidEntryPayload({ date: "03-25-2026", category: "ate_home" })).toBe(false);
    expect(isValidEntryPayload({ date: "2026-03-25", category: "snack" })).toBe(false);
    expect(
      isValidEntryPayload({ date: "2026-03-25", category: "ate_home", amountPence: -20 })
    ).toBe(false);
  });

  it("defaults unsupported ranges to 30 days", () => {
    expect(resolveDashboardRange(7)).toBe(7);
    expect(resolveDashboardRange(12)).toBe(30);
  });

  it("builds dashboard response from repository data", () => {
    const repository = {
      getEntriesInRange: () => [
        { date: "2026-03-23", category: "ate_home", amount_pence: 800 },
        { date: "2026-03-25", category: "takeaway", amount_pence: 1450 }
      ],
      getRecentEntries: () => [
        { date: "2026-03-25", category: "takeaway", amount_pence: 1450 }
      ],
      getTrackedDatesDesc: () => [
        { date: "2026-03-25", category: "takeaway" },
        { date: "2026-03-24", category: "ate_home" },
        { date: "2026-03-23", category: "ate_home" }
      ],
      getTotalTracked: () => 3
    };

    const result = buildDashboardResponse(repository, 7, new Date("2026-03-25T12:00:00.000Z"));

    expect(result.summary).toEqual({
      takeaway: {
        count: 1,
        averageAmountPence: 1450,
        totalAmountPence: 1450,
        amountEntryCount: 1
      },
      ate_out: {
        count: 0,
        averageAmountPence: null,
        totalAmountPence: 0,
        amountEntryCount: 0
      },
      ate_home: {
        count: 1,
        averageAmountPence: 800,
        totalAmountPence: 800,
        amountEntryCount: 1
      }
    });
    expect(result.timeline).toHaveLength(7);
    expect(result.timeline.at(-1)).toEqual({
      date: "2026-03-25",
      category: "takeaway",
      score: 3
    });
    expect(result.streak).toBe(3);
    expect(result.totalTracked).toBe(3);
    expect(result.recentEntries).toEqual([
      { date: "2026-03-25", category: "takeaway", amountPence: 1450 }
    ]);
    expect(result.rewards).toMatchObject({
      currentStreak: 0,
      longestStreak: 2,
      totalHomeDays: 2,
      unlockedCount: 0,
      totalBadges: 8
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

  it("averages spend only across entries where an amount was logged", () => {
    const repository = {
      getEntriesInRange: () => [
        { date: "2026-03-24", category: "takeaway", amount_pence: 1200 },
        { date: "2026-03-25", category: "takeaway", amount_pence: null },
        { date: "2026-03-23", category: "takeaway", amount_pence: 1800 }
      ],
      getRecentEntries: () => [],
      getTrackedDatesDesc: () => [],
      getTotalTracked: () => 3
    };

    const result = buildDashboardResponse(repository, 7, new Date("2026-03-25T12:00:00.000Z"));

    expect(result.summary.takeaway).toMatchObject({
      count: 3,
      totalAmountPence: 3000,
      amountEntryCount: 2,
      averageAmountPence: 1500
    });
  });

  it("awards the balanced month badge for 30 continuous days with <= 5 eat-out days", () => {
    const trackedDates = Array.from({ length: 30 }, (_, index) => {
      const date = new Date("2026-03-25T00:00:00.000Z");
      date.setDate(date.getDate() - index);
      return {
        date: date.toISOString().slice(0, 10),
        category: index < 5 ? "ate_out" : "ate_home"
      };
    });
    const repository = {
      getEntriesInRange: () => [],
      getRecentEntries: () => [],
      getTrackedDatesDesc: () => trackedDates,
      getTotalTracked: () => 30
    };

    const result = buildDashboardResponse(repository, 30, new Date("2026-03-25T12:00:00.000Z"));

    const balancedMonthBadge = result.rewards.badges.find((badge) => badge.id === "balanced_month_30");
    expect(balancedMonthBadge).toMatchObject({
      unlocked: true,
      earnedOn: "2026-03-25",
      rewardCount: 1,
      progress: 30
    });
  });

  it("awards the takeaway-light badge for 30 continuous days with <= 5 takeaways", () => {
    const trackedDates = Array.from({ length: 30 }, (_, index) => {
      const date = new Date("2026-03-25T00:00:00.000Z");
      date.setDate(date.getDate() - index);
      return {
        date: date.toISOString().slice(0, 10),
        category: index < 5 ? "takeaway" : "ate_home"
      };
    });
    const repository = {
      getEntriesInRange: () => [],
      getRecentEntries: () => [],
      getTrackedDatesDesc: () => trackedDates,
      getTotalTracked: () => 30
    };

    const result = buildDashboardResponse(repository, 30, new Date("2026-03-25T12:00:00.000Z"));

    const takeawayLightBadge = result.rewards.badges.find((badge) => badge.id === "takeaway_light_30");
    expect(takeawayLightBadge).toMatchObject({
      unlocked: true,
      earnedOn: "2026-03-25",
      rewardCount: 1,
      progress: 30
    });
  });

  it("shows continuous badge progress based on the latest 30-day window", () => {
    const trackedDates = Array.from({ length: 30 }, (_, index) => {
      const date = new Date("2026-03-25T00:00:00.000Z");
      date.setDate(date.getDate() - index);
      return {
        date: date.toISOString().slice(0, 10),
        category: index < 7 ? "takeaway" : "ate_home"
      };
    });
    const repository = {
      getEntriesInRange: () => [],
      getRecentEntries: () => [],
      getTrackedDatesDesc: () => trackedDates,
      getTotalTracked: () => 30
    };

    const result = buildDashboardResponse(repository, 30, new Date("2026-03-25T12:00:00.000Z"));

    const balancedMonthBadge = result.rewards.badges.find((badge) => badge.id === "balanced_month_30");
    const takeawayLightBadge = result.rewards.badges.find((badge) => badge.id === "takeaway_light_30");

    expect(balancedMonthBadge).toMatchObject({
      progress: 0,
      remaining: 30
    });
    expect(takeawayLightBadge).toMatchObject({
      progress: 5,
      remaining: 25
    });
  });

  it("resets balanced month progress when a takeaway appears in the current run", () => {
    const trackedDates = Array.from({ length: 13 }, (_, index) => {
      const date = new Date("2026-03-25T00:00:00.000Z");
      date.setDate(date.getDate() - index);
      return {
        date: date.toISOString().slice(0, 10),
        category: index < 4 ? "takeaway" : "ate_home"
      };
    });
    const repository = {
      getEntriesInRange: () => [],
      getRecentEntries: () => [],
      getTrackedDatesDesc: () => trackedDates,
      getTotalTracked: () => 13
    };

    const result = buildDashboardResponse(repository, 30, new Date("2026-03-25T12:00:00.000Z"));
    const balancedMonthBadge = result.rewards.badges.find((badge) => badge.id === "balanced_month_30");

    expect(balancedMonthBadge).toMatchObject({
      progress: 0,
      remaining: 30
    });
  });

  it("resets takeaway light progress after the sixth takeaway in the current run", () => {
    const trackedDates = Array.from({ length: 16 }, (_, index) => {
      const date = new Date("2026-03-25T00:00:00.000Z");
      date.setDate(date.getDate() - index);
      return {
        date: date.toISOString().slice(0, 10),
        category: index < 6 ? "takeaway" : "ate_home"
      };
    });
    const repository = {
      getEntriesInRange: () => [],
      getRecentEntries: () => [],
      getTrackedDatesDesc: () => trackedDates,
      getTotalTracked: () => 16
    };

    const result = buildDashboardResponse(repository, 30, new Date("2026-03-25T12:00:00.000Z"));
    const takeawayLightBadge = result.rewards.badges.find((badge) => badge.id === "takeaway_light_30");

    expect(takeawayLightBadge).toMatchObject({
      progress: 5,
      remaining: 25
    });
  });

  it("counts continuous-window badge rewards once per qualifying run", () => {
    const trackedDates = Array.from({ length: 35 }, (_, index) => {
      const date = new Date("2026-03-25T00:00:00.000Z");
      date.setDate(date.getDate() - index);
      return {
        date: date.toISOString().slice(0, 10),
        category: "ate_home"
      };
    });
    const repository = {
      getEntriesInRange: () => [],
      getRecentEntries: () => [],
      getTrackedDatesDesc: () => trackedDates,
      getTotalTracked: () => 35
    };

    const result = buildDashboardResponse(repository, 30, new Date("2026-03-25T12:00:00.000Z"));

    const balancedMonthBadge = result.rewards.badges.find((badge) => badge.id === "balanced_month_30");
    const takeawayLightBadge = result.rewards.badges.find((badge) => badge.id === "takeaway_light_30");

    expect(balancedMonthBadge.rewardCount).toBe(1);
    expect(takeawayLightBadge.rewardCount).toBe(1);
  });
});
