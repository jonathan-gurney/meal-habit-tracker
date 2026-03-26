import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import App from "../src/App";

vi.mock("recharts", () => {
  const createStub = (name) => {
    const Stub = () => <div data-chart={name} />;
    Stub.displayName = name;
    return Stub;
  };

  return {
    ResponsiveContainer: createStub("ResponsiveContainer"),
    AreaChart: createStub("AreaChart"),
    Area: createStub("Area"),
    CartesianGrid: createStub("CartesianGrid"),
    XAxis: createStub("XAxis"),
    YAxis: createStub("YAxis"),
    Tooltip: createStub("Tooltip"),
    PieChart: createStub("PieChart"),
    Pie: createStub("Pie"),
    Cell: createStub("Cell")
  };
});

const buildDashboard = (overrides = {}) => ({
  summary: {
    takeaway: 2,
    ate_out: 1,
    ate_home: 4
  },
  timeline: [
    { date: "2026-03-24", category: "ate_out", score: 2 },
    { date: "2026-03-25", category: "ate_home", score: 1 }
  ],
  recentEntries: [
    { date: "2026-03-25", category: "ate_home" },
    { date: "2026-03-24", category: "ate_out" }
  ],
  streak: 5,
  totalTracked: 7,
  rewards: {
    currentStreak: 5,
    longestStreak: 7,
    totalHomeDays: 14,
    unlockedCount: 2,
    totalBadges: 6,
    nextBadge: {
      id: "home_streak_14",
      name: "Kitchen Keeper",
      streak: 14,
      progress: 5,
      remaining: 9,
      unlocked: false,
      earnedOn: null
    },
    badges: [
      {
        id: "home_streak_3",
        name: "Getting Started",
        description: "Eat at home for 3 days in a row.",
        streak: 3,
        rewardCount: 2,
        progress: 3,
        remaining: 0,
        unlocked: true,
        earnedOn: "2026-03-10"
      },
      {
        id: "home_streak_7",
        name: "Weeknight Win",
        description: "Keep an at-home eating streak alive for 7 straight days.",
        streak: 7,
        rewardCount: 1,
        progress: 5,
        remaining: 2,
        unlocked: false,
        earnedOn: null
      },
      {
        id: "home_streak_14",
        name: "Kitchen Keeper",
        description: "Reach 14 consecutive days of eating at home.",
        streak: 14,
        rewardCount: 0,
        progress: 5,
        remaining: 9,
        unlocked: false,
        earnedOn: null
      }
    ]
  },
  ...overrides
});

describe("App", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
    window.location.hash = "";
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.location.hash = "";
  });

  it("loads and renders dashboard data on first paint", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => buildDashboard()
    });

    render(<App />);

    expect(global.fetch).toHaveBeenCalledWith("/api/dashboard?days=30");

    expect(await screen.findByText("Tracked Days")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Takeaway" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ate at home" })).toBeInTheDocument();
    expect(screen.getByText("5 days")).toBeInTheDocument();
    expect(screen.getByText("25 Mar")).toBeInTheDocument();
    expect(screen.getByText("Home streak badges")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "View all badges" })).toBeInTheDocument();
  });

  it("submits a new meal habit and refreshes the dashboard", async () => {
    const user = userEvent.setup();

    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => buildDashboard({ totalTracked: 2, streak: 2 })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () =>
          buildDashboard({
            summary: { takeaway: 3, ate_out: 1, ate_home: 4 },
            totalTracked: 8,
            streak: 6,
            recentEntries: [{ date: "2026-03-25", category: "takeaway" }]
          })
      });

    render(<App />);

    await screen.findByText("Tracked Days");
    fireEvent.change(screen.getByLabelText("Date"), {
      target: { value: "2026-03-25" }
    });
    await user.click(screen.getByRole("button", { name: "Takeaway" }));
    await user.click(screen.getByRole("button", { name: "Save Daily Habit" }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenNthCalledWith(2, "/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: "2026-03-25",
          category: "takeaway"
        })
      });
    });

    expect(await screen.findByText("Meal habit logged for the day.")).toBeInTheDocument();
    const trackedDaysCard = screen.getByText("Tracked Days").closest(".stat");
    const streakCard = screen.getByText("Current Streak").closest(".stat");

    expect(within(trackedDaysCard).getByText("8")).toBeInTheDocument();
    expect(within(streakCard).getByText("6 days")).toBeInTheDocument();
  });

  it("requests a different dashboard range when the timeframe changes", async () => {
    const user = userEvent.setup();

    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => buildDashboard()
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => buildDashboard({ totalTracked: 14, streak: 9 })
      });

    render(<App />);

    await screen.findByText("7");
    await user.click(screen.getByRole("button", { name: "Week" }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenLastCalledWith("/api/dashboard?days=7");
    });
  });

  it("opens the badge detail page from the dashboard", async () => {
    const user = userEvent.setup();

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => buildDashboard()
    });

    render(<App />);

    await screen.findByText("Home streak badges");
    await user.click(screen.getByRole("button", { name: "View all badges" }));

    expect(await screen.findByRole("heading", { name: "Home streak badges" })).toBeInTheDocument();
    expect(screen.getByText("Longest at-home streak")).toBeInTheDocument();
    expect(screen.getByText("Getting Started")).toBeInTheDocument();
    expect(screen.getByText("Awarded 2 times")).toBeInTheDocument();
    expect(screen.getByText("Earned 10 Mar")).toBeInTheDocument();
  });

  it("shows an error when the dashboard fails to load", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false
    });

    render(<App />);

    expect(
      await screen.findByText("Dashboard data could not be loaded.")
    ).toBeInTheDocument();
  });

  it("shows an error when saving fails", async () => {
    const user = userEvent.setup();

    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => buildDashboard()
      })
      .mockResolvedValueOnce({
        ok: false
      });

    render(<App />);

    await screen.findByText("7");
    await user.click(screen.getByRole("button", { name: "Save Daily Habit" }));

    expect(
      await screen.findByText("Something went wrong while saving your meal habit.")
    ).toBeInTheDocument();
  });
});
