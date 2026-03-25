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
  ...overrides
});

describe("App", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
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
