export const formatDay = (value) =>
  new Date(`${value}T00:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short"
  });

export const getTodayIso = () => new Date().toISOString().slice(0, 10);
