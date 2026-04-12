import { toIsoDate } from "../../shared/date.js";

export { toIsoDate };

export const formatDay = (value) =>
  new Date(`${value}T00:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short"
  });

export const getTodayIso = () => toIsoDate(new Date());
