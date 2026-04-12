export const fetchDashboardData = async (days, signal) => {
  const response = await fetch(`/api/dashboard?days=${days}`, { signal });

  if (!response.ok) {
    throw new Error("Unable to load dashboard");
  }

  return response.json();
};

export const saveMealEntry = async ({ date, category, amountPence }) => {
  const response = await fetch("/api/entries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ date, category, amountPence })
  });

  if (!response.ok) {
    throw new Error("Save failed");
  }

  return response.json();
};
