import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

const MEAL_OPTIONS = [
  { value: "takeaway", label: "Takeaway", accent: "#ff7a59" },
  { value: "ate_out", label: "Ate out", accent: "#ffd166" },
  { value: "ate_home", label: "Ate at home", accent: "#06d6a0" }
];

const TIMEFRAMES = [
  { value: "7", label: "Week" },
  { value: "30", label: "Month" },
  { value: "90", label: "3 Months" },
  { value: "180", label: "6 Months" },
  { value: "365", label: "Year" }
];

const optionLookup = Object.fromEntries(
  MEAL_OPTIONS.map((option) => [option.value, option])
);

const formatDay = (value) =>
  new Date(`${value}T00:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short"
  });

function App() {
  const [selectedMeal, setSelectedMeal] = useState("ate_home");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [timeframe, setTimeframe] = useState("30");
  const [dashboard, setDashboard] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState("");

  const fetchDashboard = async () => {
    const response = await fetch(`/api/dashboard?days=${timeframe}`);
    if (!response.ok) {
      throw new Error("Unable to load dashboard");
    }

    const data = await response.json();
    setDashboard(data);
  };

  useEffect(() => {
    fetchDashboard().catch(() => {
      setStatus("Dashboard data could not be loaded.");
    });
  }, [timeframe]);

  const saveEntry = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setStatus("");

    try {
      const response = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDate,
          category: selectedMeal
        })
      });

      if (!response.ok) {
        throw new Error("Save failed");
      }

      await fetchDashboard();
      setStatus("Meal habit logged for the day.");
    } catch (error) {
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

  const streak = dashboard?.streak ?? 0;
  const totalTracked = dashboard?.totalTracked ?? 0;

  return (
    <main className="shell">
      <section className="hero">
        <div className="hero__copy">
          <span className="eyebrow">Meal Habit Tracker</span>
          <h1>Track how you eat, then spot the pattern at a glance.</h1>
          <p>
            Log a single meal habit for each day and explore how often you
            choose takeaway, eat out, or eat at home across different windows
            of time.
          </p>
        </div>
        <div className="hero__stats">
          <article className="stat">
            <span>Tracked Days</span>
            <strong>{totalTracked}</strong>
          </article>
          <article className="stat">
            <span>Current Streak</span>
            <strong>{streak} days</strong>
          </article>
        </div>
      </section>

      <section className="layout">
        <form className="panel panel--form" onSubmit={saveEntry}>
          <div className="panel__header">
            <h2>Daily Log</h2>
            <p>One entry per day. Saving again updates that day’s habit.</p>
          </div>

          <label className="field">
            <span>Date</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              max={new Date().toISOString().slice(0, 10)}
            />
          </label>

          <div className="field">
            <span>Meal Habit</span>
            <div className="optionGrid">
              {MEAL_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={
                    option.value === selectedMeal
                      ? "choice choice--active"
                      : "choice"
                  }
                  onClick={() => setSelectedMeal(option.value)}
                >
                  <span
                    className="choice__dot"
                    style={{ backgroundColor: option.accent }}
                  />
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <button className="primaryButton" type="submit" disabled={submitting}>
            {submitting ? "Saving..." : "Save Daily Habit"}
          </button>

          {status ? <p className="status">{status}</p> : null}
        </form>

        <div className="dashboard">
          <section className="panel panel--filters">
            <div className="panel__header">
              <h2>Dashboard</h2>
              <p>Filter the trend to focus on the time period you care about.</p>
            </div>

            <div className="timeframeRow">
              {TIMEFRAMES.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={
                    option.value === timeframe
                      ? "timePill timePill--active"
                      : "timePill"
                  }
                  onClick={() => setTimeframe(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </section>

          <section className="cardGrid">
            {summaryCards.map((card) => (
              <article className="panel metricCard" key={card.value}>
                <span className="metricCard__label">{card.label}</span>
                <strong style={{ color: card.accent }}>{card.count}</strong>
              </article>
            ))}
          </section>

          <section className="chartGrid">
            <article className="panel chartPanel">
              <div className="panel__header">
                <h2>Daily Pattern</h2>
                <p>Each day shows the chosen category as a weighted activity.</p>
              </div>
              <div className="chartWrap">
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={dashboard?.timeline ?? []}>
                    <defs>
                      <linearGradient
                        id="timelineFill"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="5%" stopColor="#7c5cff" stopOpacity={0.7} />
                        <stop offset="95%" stopColor="#7c5cff" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatDay}
                      stroke="rgba(255,255,255,0.45)"
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      ticks={[0, 1, 2, 3]}
                      tickFormatter={(value) =>
                        ["", "Home", "Out", "Takeaway"][value] || ""
                      }
                      stroke="rgba(255,255,255,0.45)"
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#151922",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "16px"
                      }}
                      formatter={(value, _name, item) => [
                        optionLookup[item.payload.category]?.label ?? "No entry",
                        "Habit"
                      ]}
                      labelFormatter={formatDay}
                    />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="#9b87f5"
                      strokeWidth={3}
                      fill="url(#timelineFill)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </article>

            <article className="panel chartPanel">
              <div className="panel__header">
                <h2>Habit Split</h2>
                <p>Share of logged days within the selected timeframe.</p>
              </div>
              <div className="chartWrap">
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={summaryCards}
                      dataKey="count"
                      nameKey="label"
                      innerRadius={78}
                      outerRadius={110}
                      paddingAngle={4}
                    >
                      {summaryCards.map((entry) => (
                        <Cell key={entry.value} fill={entry.accent} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "#151922",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "16px"
                      }}
                      labelStyle={{ color: "#f5f7fb" }}
                      itemStyle={{ color: "#f5f7fb" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </article>
          </section>

          <section className="panel">
            <div className="panel__header">
              <h2>Recent Entries</h2>
              <p>Your latest logged days, shown most recent first.</p>
            </div>
            <div className="entryList">
              {(dashboard?.recentEntries ?? []).map((entry) => (
                <div className="entryRow" key={entry.date}>
                  <span>{formatDay(entry.date)}</span>
                  <strong
                    style={{ color: optionLookup[entry.category]?.accent ?? "#fff" }}
                  >
                    {optionLookup[entry.category]?.label ?? entry.category}
                  </strong>
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

export default App;
