export const MEAL_OPTIONS = [
  { value: "takeaway", label: "Takeaway", accent: "#ff7a59" },
  { value: "ate_out", label: "Ate out", accent: "#ffd166" },
  { value: "ate_home", label: "Ate at home", accent: "#06d6a0" }
];

export const TIMEFRAMES = [
  { value: "7", label: "Week" },
  { value: "30", label: "Month" },
  { value: "90", label: "3 Months" },
  { value: "180", label: "6 Months" },
  { value: "365", label: "Year" }
];

export const optionLookup = Object.fromEntries(
  MEAL_OPTIONS.map((option) => [option.value, option])
);
