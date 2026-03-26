import { useEffect, useMemo, useState } from "react";
import { fetchDashboardData, saveMealEntry } from "./api/dashboardApi";
import {
  BadgeDetailsPage,
  BadgeSummary,
  DailyLogForm,
  DailyPatternChart,
  HabitSplitChart,
  PanelHeader,
  RecentEntriesList,
  StatCard,
  SummaryCards,
  TimeframeSelector
} from "./components";
import { MEAL_OPTIONS, TIMEFRAMES, optionLookup } from "./constants";
import { getTodayIso } from "./utils/date";

function App() {
  const [selectedMeal, setSelectedMeal] = useState("ate_home");
  const [selectedDate, setSelectedDate] = useState(getTodayIso());
  const [timeframe, setTimeframe] = useState("30");
  const [activePage, setActivePage] = useState(
    window.location.hash === "#badges" ? "badges" : "dashboard"
  );
  const [dashboard, setDashboard] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState("");

  const loadDashboard = async (days) => {
    const data = await fetchDashboardData(days);
    setDashboard(data);
  };

  useEffect(() => {
    loadDashboard(timeframe).catch(() => {
      setStatus("Dashboard data could not be loaded.");
    });
  }, [timeframe]);

  useEffect(() => {
    const syncPage = () => {
      setActivePage(window.location.hash === "#badges" ? "badges" : "dashboard");
    };

    window.addEventListener("hashchange", syncPage);
    return () => window.removeEventListener("hashchange", syncPage);
  }, []);

  const saveEntry = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setStatus("");

    try {
      await saveMealEntry({ date: selectedDate, category: selectedMeal });
      await loadDashboard(timeframe);
      setStatus("Meal habit logged for the day.");
    } catch (_error) {
      setStatus("Something went wrong while saving your meal habit.");
    } finally {
      setSubmitting(false);
    }
  };

  const summaryCards = useMemo(() => {
    if (!dashboard) {
      return [];
    }

    return MEAL_OPTIONS.map((option) => ({
      ...option,
      count: dashboard.summary[option.value] ?? 0
    }));
  }, [dashboard]);

  const openBadgePage = () => {
    window.location.hash = "badges";
  };

  const openDashboardPage = () => {
    window.location.hash = "";
  };

  if (activePage === "badges") {
    return <BadgeDetailsPage rewards={dashboard?.rewards} onBack={openDashboardPage} />;
  }

  return (
    <main className="shell">
      <section className="hero">
        <div className="hero__copy">
          <span className="eyebrow">Meal Habit Tracker</span>
          <h1>Track how you eat, then spot the pattern at a glance.</h1>
          <p>
            Log a single meal habit for each day and explore how often you choose takeaway,
            eat out, or eat at home across different windows of time.
          </p>
        </div>
        <div className="hero__stats">
          <StatCard label="Tracked Days" value={dashboard?.totalTracked ?? 0} />
          <StatCard label="Current Streak" value={`${dashboard?.streak ?? 0} days`} />
        </div>
      </section>

      <section className="layout">
        <DailyLogForm
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          selectedMeal={selectedMeal}
          onMealChange={setSelectedMeal}
          onSubmit={saveEntry}
          submitting={submitting}
          status={status}
        />

        <div className="dashboard">
          <section className="panel panel--filters">
            <PanelHeader
              title="Dashboard"
              description="Filter the trend to focus on the time period you care about."
            />
            <TimeframeSelector
              options={TIMEFRAMES}
              selectedValue={timeframe}
              onChange={setTimeframe}
            />
          </section>

          <SummaryCards cards={summaryCards} />

          <BadgeSummary rewards={dashboard?.rewards} onOpen={openBadgePage} />

          <section className="chartGrid">
            <DailyPatternChart
              timeline={dashboard?.timeline ?? []}
              optionLookup={optionLookup}
            />
            <HabitSplitChart summaryCards={summaryCards} />
          </section>

          <RecentEntriesList
            entries={dashboard?.recentEntries ?? []}
            optionLookup={optionLookup}
          />
        </div>
      </section>
    </main>
  );
}

export default App;
