import {
  ALLOWED_DASHBOARD_RANGES,
  VALID_CATEGORIES,
  categoryScore
} from "../constants.js";
import { daysBetween, getDateRange, toIsoDate } from "../utils/date.js";

const emptySummary = () => ({
  takeaway: 0,
  ate_out: 0,
  ate_home: 0
});

const buildTimeline = ({ start, end, entriesByDate }) => {
  const timeline = [];
  const summary = emptySummary();
  const cursor = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);

  while (cursor <= endDate) {
    const current = toIsoDate(cursor);
    const category = entriesByDate.get(current) ?? null;

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

export const isValidEntryPayload = ({ date, category }) => {
  return (
    Boolean(date) &&
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    VALID_CATEGORIES.includes(category)
  );
};

export const resolveDashboardRange = (days) =>
  ALLOWED_DASHBOARD_RANGES.includes(days) ? days : 30;

export const buildDashboardResponse = (repository, days, now = new Date()) => {
  const safeDays = resolveDashboardRange(days);
  const { start, end } = getDateRange(safeDays, now);

  const entries = repository.getEntriesInRange(start, end);
  const entriesByDate = new Map(entries.map((row) => [row.date, row.category]));
  const { summary, timeline } = buildTimeline({ start, end, entriesByDate });

  return {
    summary,
    timeline,
    recentEntries: repository.getRecentEntries(),
    streak: calculateStreak(repository.getTrackedDatesDesc(), now),
    totalTracked: repository.getTotalTracked()
  };
};
