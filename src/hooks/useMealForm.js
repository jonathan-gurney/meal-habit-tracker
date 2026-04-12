import { useState } from "react";
import { saveMealEntry } from "../api/dashboardApi";
import { getTodayIso } from "../utils/date";

const parseAmountSpent = (value) => {
  if (value.trim() === "") return null;
  if (!/^\d+(\.\d{1,2})?$/.test(value)) return undefined;
  return Math.round(Number(value) * 100);
};

export const useMealForm = (onSaveSuccess) => {
  const [selectedMeal, setSelectedMeal] = useState("ate_home");
  const [selectedDate, setSelectedDate] = useState(getTodayIso());
  const [amountSpent, setAmountSpent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState({ message: "", type: "" });

  const saveEntry = async (event) => {
    event.preventDefault();
    setStatus({ message: "", type: "" });

    if (selectedDate > getTodayIso()) {
      setStatus({ message: "Date cannot be in the future.", type: "error" });
      return;
    }

    const parsedAmount = parseAmountSpent(amountSpent);

    if (parsedAmount === undefined) {
      setStatus({
        message: "Enter the amount in pounds and pence, for example 12.50.",
        type: "error"
      });
      return;
    }

    setSubmitting(true);

    try {
      await saveMealEntry({
        date: selectedDate,
        category: selectedMeal,
        amountPence: parsedAmount
      });
      await onSaveSuccess();
      setAmountSpent("");
      setStatus({ message: "Meal habit logged for the day.", type: "success" });
    } catch (_error) {
      setStatus({
        message: "Something went wrong while saving your meal habit.",
        type: "error"
      });
    } finally {
      setSubmitting(false);
    }
  };

  return {
    selectedMeal,
    setSelectedMeal,
    selectedDate,
    setSelectedDate,
    amountSpent,
    setAmountSpent,
    submitting,
    status,
    saveEntry
  };
};
