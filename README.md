# Meal Habit Tracker

Meal Habit Tracker is a full-stack portfolio project for logging a single meal habit per day and turning that data into a simple personal dashboard. It is designed to show a clean product-focused build: a React frontend, an Express API, SQLite persistence, and a polished responsive UI with lightweight data visualisation.

## Overview

The app helps users answer a straightforward question: how often am I eating takeaway, eating out, or eating at home?

Each day can be logged against one of three categories:

- Takeaway
- Ate out
- Ate at home

The dashboard then surfaces patterns over different time windows so the user can quickly review habits instead of scanning raw entries.

## Portfolio Context

This project is intended as a portfolio piece that demonstrates:

- Building a small full-stack product from scratch
- Designing a responsive React interface with a clear visual style
- Creating a simple REST API with Express
- Persisting user data with SQLite
- Presenting tracked behaviour through summary cards and charts
- Supporting local development and containerised deployment with Docker

## Features

- Daily meal habit logging with one entry per date
- Update-on-save behaviour for existing dates
- Dashboard filters for 7, 30, 90, 180, and 365 day views
- Summary counts for each habit category
- Trend visualisation for daily activity
- Pie chart showing category split in the selected timeframe
- Recent entries list for quick review
- Current streak and total tracked days metrics
- Responsive single-page UI
- SQLite-backed data persistence

## Tech Stack

### Frontend

- React 18
- Vite
- Recharts
- Plain CSS

### Backend

- Node.js
- Express
- better-sqlite3
- SQLite

### Tooling and Deployment

- concurrently for local full-stack development
- Docker
- Docker Compose

## How It Works

- The React app provides the logging form and dashboard UI.
- During local development, Vite serves the frontend on `http://localhost:5173`.
- Vite proxies `/api` requests to the Express server on `http://localhost:3001`.
- The Express backend stores entries in a SQLite database at `data/meals.db`.
- In production, the Express server also serves the built frontend from `dist/`.

## Project Structure

```text
.
├── src/              # React frontend
├── server/           # Express API and SQLite setup
├── shared/           # Shared badge definitions and constants
├── test/             # Vitest unit and integration tests
├── data/             # SQLite database created at runtime
├── .devcontainer/    # VS Code Dev Container configuration
├── Dockerfile
├── docker-compose.yml
└── package.json
```

## Local Development

### Dev Container (recommended)

Open the repo in VS Code and select **Reopen in Container** when prompted, or run the **Dev Containers: Reopen in Container** command. The container installs all dependencies automatically via `postCreateCommand`.

Forwarded ports:

- Frontend UI: `http://localhost:5173`
- API server: `http://localhost:3001`

### Without a container

Install dependencies and start both the frontend and backend:

```bash
npm install
npm run dev
```

Development URLs:

- Frontend UI: `http://localhost:5173`
- API server: `http://localhost:3001`

In development, Vite serves the React app on port `5173` and proxies `/api` requests to the Express server on port `3001`.

## Production Run

Build the frontend bundle and start the Node server:

```bash
npm install
npm run build
npm start
```

Then open:

- App: `http://localhost:3001`

In production, the Express server serves both the built frontend and the API from port `3001`.

## Docker

Run the app with Docker Compose:

```bash
docker compose up --build
```

Then open:

- App: `http://localhost:3001`

The SQLite database is persisted through the `meal_habit_tracker_data` volume.

## API Summary

### `POST /api/entries`

Creates or updates a meal entry for a given date.

Example payload:

```json
{
  "date": "2026-03-25",
  "category": "ate_home"
}
```

Accepted categories:

- `takeaway`
- `ate_out`
- `ate_home`

### `GET /api/dashboard?days=30`

Returns dashboard data for one of the supported ranges:

- `7`
- `30`
- `90`
- `180`
- `365`

The response includes:

- summary totals by category
- timeline data for charts
- recent entries
- current streak
- total tracked days

## Notes

- The database file is created automatically on first run.
- Saving a second entry for the same date replaces the previous category for that day.
- Run `npm test` to execute the full test suite (Vitest + supertest).
