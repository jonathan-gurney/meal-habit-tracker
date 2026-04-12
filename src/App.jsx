import { useDashboard } from "./hooks/useDashboard";
import { useMealForm } from "./hooks/useMealForm";
import { usePageNav } from "./hooks/usePageNav";
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
import { TIMEFRAMES, optionLookup } from "./constants";

function App() {
  const { timeframe, setTimeframe, dashboard, loading, error, summaryCards, loadDashboard } =
    useDashboard();

  const { activePage, openBadgePage, openDashboardPage } = usePageNav();

  const {
    selectedMeal,
    setSelectedMeal,
    selectedDate,
    setSelectedDate,
    amountSpent,
    setAmountSpent,
    submitting,
    status,
    saveEntry
  } = useMealForm(() => loadDashboard(timeframe));

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
          amountSpent={amountSpent}
          onAmountSpentChange={setAmountSpent}
          onSubmit={saveEntry}
          submitting={submitting}
          status={status.message}
          statusType={status.type}
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

          {error && <p className="status status--error">{error}</p>}
          {loading && !dashboard && <p className="status">Loading dashboard...</p>}

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
