import { MEAL_OPTIONS } from "../constants";
import { getTodayIso } from "../utils/date";
import ChoiceButton from "./ChoiceButton";
import PanelHeader from "./PanelHeader";

function DailyLogForm({
  selectedDate,
  onDateChange,
  selectedMeal,
  onMealChange,
  amountSpent,
  onAmountSpentChange,
  onSubmit,
  submitting,
  status
}) {
  return (
    <form className="panel panel--form" onSubmit={onSubmit}>
      <PanelHeader
        title="Daily Log"
        description="One entry per day. Saving again updates that day’s habit."
      />

      <label className="field">
        <span>Date</span>
        <input
          type="date"
          value={selectedDate}
          onChange={(event) => onDateChange(event.target.value)}
          max={getTodayIso()}
        />
      </label>

      <div className="field">
        <span>Meal Habit</span>
        <div className="optionGrid">
          {MEAL_OPTIONS.map((option) => (
            <ChoiceButton
              key={option.value}
              isActive={option.value === selectedMeal}
              accent={option.accent}
              label={option.label}
              onClick={() => onMealChange(option.value)}
            />
          ))}
        </div>
      </div>

      <label className="field">
        <span>Amount Spent (GBP, optional)</span>
        <input
          type="text"
          inputMode="decimal"
          placeholder="0.00"
          value={amountSpent}
          onChange={(event) => onAmountSpentChange(event.target.value)}
        />
      </label>

      <button className="primaryButton" type="submit" disabled={submitting}>
        {submitting ? "Saving..." : "Save Daily Habit"}
      </button>

      {status ? <p className="status">{status}</p> : null}
    </form>
  );
}

export default DailyLogForm;
