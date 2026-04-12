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

const calculateConsecutiveStreak = (trackedRows, now, categoryFilter = null) => {
  if (trackedRows.length === 0) return 0;

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  let expected = toIsoDate(today);

  if (trackedRows[0].date !== expected) {
    const latest = new Date(`${trackedRows[0].date}T00:00:00`);
    if (daysBetween(today, latest) !== 1) return 0;
    expected = trackedRows[0].date;
  }

  let streak = 0;
  for (const row of trackedRows) {
    if (row.date !== expected) break;
    if (categoryFilter !== null && row.category !== categoryFilter) break;
    streak += 1;
    const current = new Date(`${row.date}T00:00:00`);
    current.setDate(current.getDate() - 1);
    expected = toIsoDate(current);
  }

  return streak;
};

const hasBalancedMonthWindow = (windowRows) => {
  const ateOutDays = windowRows.filter((row) => row.category === "ate_out").length;
  const ateHomeDays = windowRows.filter((row) => row.category === "ate_home").length;
  return ateOutDays <= 5 && ateHomeDays === windowRows.length - ateOutDays;
};

const hasTakeawayLightWindow = (windowRows) =>
  windowRows.filter((row) => row.category === "takeaway").length <= 5;

const CONTINUOUS_WINDOW_CONFIG = {
  balanced_month_30: { hardBreakCategory: "takeaway", limitCategory: "ate_out", limit: 5 },
  takeaway_light_30: { hardBreakCategory: null, limitCategory: "takeaway", limit: 5 }
};

const calculateContinuousWindowProgress = (badgeId, windowRows) => {
  const config = CONTINUOUS_WINDOW_CONFIG[badgeId];
  if (!config) return 0;

  let progress = 0;
  let limitCount = 0;

  for (const row of [...windowRows].reverse()) {
    if (config.hardBreakCategory && row.category === config.hardBreakCategory) break;
    if (row.category === config.limitCategory) {
      limitCount += 1;
      if (limitCount > config.limit) break;
    }
    progress += 1;
    if (progress === 30) break;
  }

  return progress;
};

const getCurrentContinuousRows = (trackedRows, now) => {
  const streakLength = calculateConsecutiveStreak(trackedRows, now);
  return trackedRows.slice(0, streakLength).reverse();
};

const buildHomeStreakCounts = (chronologicalRows) => {
  const homeStreakBadges = HOME_STREAK_BADGES.filter((b) => b.type === "home_streak");
  const earnedDates = new Map();
  const rewardCounts = new Map(HOME_STREAK_BADGES.map((b) => [b.id, 0]));
  let currentRun = 0;
  let longestRun = 0;
  let homeDays = 0;

  for (const row of chronologicalRows) {
    if (row.category === "ate_home") {
      homeDays += 1;
      currentRun += 1;
      longestRun = Math.max(longestRun, currentRun);

      for (const badge of homeStreakBadges) {
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

  return { longestRun, homeDays, earnedDates, rewardCounts };
};

const buildContinuousWindowCounts = (chronologicalRows, earnedDates, rewardCounts) => {
  const continuousWindowState = { balanced_month_30: false, takeaway_light_30: false };
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

      for (const { id, passed } of badgeChecks) {
        if (!passed) {
          continuousWindowState[id] = false;
          continue;
        }
        if (!earnedDates.has(id)) earnedDates.set(id, row.date);
        if (!continuousWindowState[id]) {
          rewardCounts.set(id, (rewardCounts.get(id) ?? 0) + 1);
          continuousWindowState[id] = true;
        }
      }
    } else {
      continuousWindowState.balanced_month_30 = false;
      continuousWindowState.takeaway_light_30 = false;
    }
  }
};

const buildBadgeProgress = (trackedRows, now) => {
  const chronologicalRows = [...trackedRows].reverse();
  const { longestRun, homeDays, earnedDates, rewardCounts } = buildHomeStreakCounts(chronologicalRows);
  buildContinuousWindowCounts(chronologicalRows, earnedDates, rewardCounts);

  const currentStreak = calculateConsecutiveStreak(trackedRows, now, "ate_home");
  const currentWindowRows = getCurrentContinuousRows(trackedRows, now).slice(-30);

  const badges = HOME_STREAK_BADGES.map((badge) => {
    const progress =
      badge.type === "continuous_window"
        ? calculateContinuousWindowProgress(badge.id, currentWindowRows)
        : Math.min(currentStreak, badge.streak);

    return {
      ...badge,
      unlocked: earnedDates.has(badge.id),
      earnedOn: earnedDates.get(badge.id) ?? null,
      rewardCount: rewardCounts.get(badge.id) ?? 0,
      progress,
      remaining: Math.max(badge.streak - progress, 0)
    };
  });

  return {
    currentStreak,
    longestStreak: longestRun,
    totalHomeDays: homeDays,
    unlockedCount: badges.filter((b) => b.unlocked).length,
    totalBadges: badges.length,
    nextBadge: badges.find((b) => !b.unlocked) ?? null,
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

  const trackedDates = repository.getTrackedDatesDesc();

  return {
    summary,
    timeline,
    recentEntries: repository.getRecentEntries().map((row) => ({
      date: row.date,
      category: row.category,
      amountPence: row.amount_pence ?? null
    })),
    streak: calculateConsecutiveStreak(trackedDates, now),
    totalTracked: repository.getTotalTracked(),
    rewards: buildBadgeProgress(trackedDates, now)
  };
};
