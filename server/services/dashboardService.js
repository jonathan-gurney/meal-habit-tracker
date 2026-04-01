import {
  ALLOWED_DASHBOARD_RANGES,
  VALID_CATEGORIES,
  categoryScore
} from "../constants.js";
import { HOME_STREAK_BADGES } from "../../shared/badges.js";
import { daysBetween, getDateRange, toIsoDate } from "../utils/date.js";

const emptySummary = () => ({
  takeaway: { count: 0, averageAmountPence: null, totalAmountPence: 0, amountEntryCount: 0 },
  ate_out: { count: 0, averageAmountPence: null, totalAmountPence: 0, amountEntryCount: 0 },
  ate_home: { count: 0, averageAmountPence: null, totalAmountPence: 0, amountEntryCount: 0 }
});

const buildTimeline = ({ start, end, entriesByDate }) => {
  const timeline = [];
  const summary = emptySummary();
  const cursor = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);

  while (cursor <= endDate) {
    const current = toIsoDate(cursor);
    const entry = entriesByDate.get(current) ?? null;
    const category = entry?.category ?? null;

    if (category) {
      summary[category].count += 1;

      if (Number.isInteger(entry.amountPence)) {
        summary[category].totalAmountPence += entry.amountPence;
        summary[category].amountEntryCount += 1;
      }
    }

    timeline.push({
      date: current,
      category,
      score: category ? categoryScore[category] : 0
    });

    cursor.setDate(cursor.getDate() + 1);
  }

  for (const categorySummary of Object.values(summary)) {
    if (categorySummary.amountEntryCount > 0) {
      categorySummary.averageAmountPence = Math.round(
        categorySummary.totalAmountPence / categorySummary.amountEntryCount
      );
    }
  }

  return { summary, timeline };
};

const calculateStreak = (trackedRows, now) => {
  if (trackedRows.length === 0) {
    return 0;
  }

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  let expected = new Date(today);

  if (trackedRows[0].date !== toIsoDate(today)) {
    const latest = new Date(`${trackedRows[0].date}T00:00:00`);
    if (daysBetween(today, latest) === 1) {
      expected = latest;
    }
  }

  let streak = 0;
  for (const row of trackedRows) {
    const current = new Date(`${row.date}T00:00:00`);
    if (daysBetween(expected, current) === 0) {
      streak += 1;
      expected.setDate(expected.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
};

const calculateEatHomeCurrentStreak = (trackedRows, now) => {
  if (trackedRows.length === 0) {
    return 0;
  }

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  let expected = toIsoDate(today);
  let index = 0;

  if (trackedRows[0].date !== expected) {
    const latest = new Date(`${trackedRows[0].date}T00:00:00`);
    if (daysBetween(today, latest) !== 1) {
      return 0;
    }
    expected = trackedRows[0].date;
  }

  let streak = 0;

  while (index < trackedRows.length) {
    const row = trackedRows[index];

    if (row.date !== expected || row.category !== "ate_home") {
      break;
    }

    streak += 1;
    const current = new Date(`${row.date}T00:00:00`);
    current.setDate(current.getDate() - 1);
    expected = toIsoDate(current);
    index += 1;
  }

  return streak;
};

const calculateCurrentLoggedStreak = (trackedRows, now) => calculateStreak(trackedRows, now);

const hasBalancedMonthWindow = (windowRows) => {
  const ateOutDays = windowRows.filter((row) => row.category === "ate_out").length;
  const ateHomeDays = windowRows.filter((row) => row.category === "ate_home").length;
  return ateOutDays <= 5 && ateHomeDays === windowRows.length - ateOutDays;
};

const hasTakeawayLightWindow = (windowRows) =>
  windowRows.filter((row) => row.category === "takeaway").length <= 5;

const buildBadgeProgress = (trackedRows, now) => {
  const chronologicalRows = [...trackedRows].reverse();
  let currentRun = 0;
  let longestRun = 0;
  let homeDays = 0;
  const earnedDates = new Map();
  const rewardCounts = new Map(HOME_STREAK_BADGES.map((badge) => [badge.id, 0]));

  for (const row of chronologicalRows) {
    if (row.category === "ate_home") {
      homeDays += 1;
      currentRun += 1;
      longestRun = Math.max(longestRun, currentRun);

      for (const badge of HOME_STREAK_BADGES.filter((item) => item.type === "home_streak")) {
        if (currentRun >= badge.streak && !earnedDates.has(badge.id)) {
          earnedDates.set(badge.id, row.date);
        }

        if (currentRun === badge.streak) {
          rewardCounts.set(badge.id, rewardCounts.get(badge.id) + 1);
        }
      }
    } else {
      currentRun = 0;
    }
  }

  let continuousRun = [];
  for (const row of chronologicalRows) {
    const previous = continuousRun[continuousRun.length - 1];
    if (!previous) {
      continuousRun = [row];
    } else {
      const previousDate = new Date(`${previous.date}T00:00:00`);
      previousDate.setDate(previousDate.getDate() + 1);
      if (toIsoDate(previousDate) === row.date) {
        continuousRun.push(row);
      } else {
        continuousRun = [row];
      }
    }

    if (continuousRun.length >= 30) {
      const latestWindow = continuousRun.slice(-30);
      const badgeChecks = [
        { id: "balanced_month_30", passed: hasBalancedMonthWindow(latestWindow) },
        { id: "takeaway_light_30", passed: hasTakeawayLightWindow(latestWindow) }
      ];

      for (const badgeCheck of badgeChecks) {
        if (!badgeCheck.passed) {
          continue;
        }

        if (!earnedDates.has(badgeCheck.id)) {
          earnedDates.set(badgeCheck.id, row.date);
        }
        rewardCounts.set(badgeCheck.id, (rewardCounts.get(badgeCheck.id) ?? 0) + 1);
      }
    }
  }

  const currentStreak = calculateEatHomeCurrentStreak(trackedRows, now);
  const currentLoggedStreak = calculateCurrentLoggedStreak(trackedRows, now);
  const badges = HOME_STREAK_BADGES.map((badge) => ({
    ...badge,
    unlocked: earnedDates.has(badge.id),
    earnedOn: earnedDates.get(badge.id) ?? null,
    rewardCount: rewardCounts.get(badge.id) ?? 0,
    progress:
      badge.type === "continuous_window"
        ? Math.min(currentLoggedStreak, badge.streak)
        : Math.min(currentStreak, badge.streak),
    remaining:
      badge.type === "continuous_window"
        ? Math.max(badge.streak - currentLoggedStreak, 0)
        : Math.max(badge.streak - currentStreak, 0)
  }));

  const unlockedCount = badges.filter((badge) => badge.unlocked).length;

  return {
    currentStreak,
    longestStreak: longestRun,
    totalHomeDays: homeDays,
    unlockedCount,
    totalBadges: badges.length,
    nextBadge: badges.find((badge) => !badge.unlocked) ?? null,
    badges
  };
};

export const isValidEntryPayload = ({ date, category, amountPence }) => {
  const hasValidAmount =
    amountPence === undefined ||
    amountPence === null ||
    (Number.isInteger(amountPence) && amountPence >= 0);

  return (
    Boolean(date) &&
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    VALID_CATEGORIES.includes(category) &&
    hasValidAmount
  );
};

export const resolveDashboardRange = (days) =>
  ALLOWED_DASHBOARD_RANGES.includes(days) ? days : 30;

export const buildDashboardResponse = (repository, days, now = new Date()) => {
  const safeDays = resolveDashboardRange(days);
  const { start, end } = getDateRange(safeDays, now);

  const entries = repository.getEntriesInRange(start, end);
  const entriesByDate = new Map(
    entries.map((row) => [
      row.date,
      { category: row.category, amountPence: row.amount_pence ?? null }
    ])
  );
  const { summary, timeline } = buildTimeline({ start, end, entriesByDate });

  return {
    summary,
    timeline,
    recentEntries: repository.getRecentEntries().map((row) => ({
      date: row.date,
      category: row.category,
      amountPence: row.amount_pence ?? null
    })),
    streak: calculateStreak(repository.getTrackedDatesDesc(), now),
    totalTracked: repository.getTotalTracked(),
    rewards: buildBadgeProgress(repository.getTrackedDatesDesc(), now)
  };
};
