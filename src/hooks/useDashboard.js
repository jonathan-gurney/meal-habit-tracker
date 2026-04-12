import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchDashboardData } from "../api/dashboardApi";
import { MEAL_OPTIONS } from "../constants";

export const useDashboard = () => {
  const [timeframe, setTimeframe] = useState("30");
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async (days) => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchDashboardData(days);
      setDashboard(data);
    } catch {
      setError("Dashboard data could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard(timeframe);
  }, [timeframe, loadDashboard]);

  const summaryCards = useMemo(() => {
    if (!dashboard) return [];
    return MEAL_OPTIONS.map((option) => ({
      ...option,
      count: dashboard.summary[option.value]?.count ?? 0,
      averageAmountPence: dashboard.summary[option.value]?.averageAmountPence ?? null
    }));
  }, [dashboard]);

  return {
    timeframe,
    setTimeframe,
    dashboard,
    loading,
    error,
    summaryCards,
    loadDashboard
  };
};
