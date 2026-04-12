import { toIsoDate } from "../../shared/date.js";

export { toIsoDate };

export const getDateRange = (days, now = new Date()) => {
  const end = new Date(now);
  end.setHours(0, 0, 0, 0);

  const start = new Date(end);
  start.setDate(start.getDate() - (days - 1));

  return {
    start: toIsoDate(start),
    end: toIsoDate(end)
  };
};

export const daysBetween = (first, second) =>
  Math.round((first.getTime() - second.getTime()) / 86400000);
