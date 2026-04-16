# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start both frontend (port 5173) and backend (port 3001) concurrently
npm run dev:client   # Start Vite dev server only
npm run dev:server   # Start Express backend with file watching only
npm run build        # Build React frontend to dist/
npm start            # Run production server (serves API + built frontend on port 3001)
npm test             # Run full test suite once (Vitest)
npm run test:watch   # Run tests in watch mode
npm run lint         # Run ESLint
npm run format       # Run Prettier
```

To run a single test file:
```bash
npx vitest run test/dashboardService.test.js
```

## Architecture

Full-stack meal habit tracking app: React 18 + Vite frontend, Express API backend, SQLite (better-sqlite3) persistence. No TypeScript — plain JS with ESLint/Prettier.

### Layers

**Frontend (`src/`)**
- `App.jsx` — top-level layout, page routing, composes hooks and components
- `hooks/` — `useDashboard` (data fetching/state), `useMealForm` (form state + client-side validation), `usePageNav` (badges page nav)
- `api/dashboardApi.js` — thin fetch wrappers for the two API endpoints
- `components/` — presentational React components; all exports re-exported from `components/index.js`
- Charts use Recharts; no CSS framework (plain CSS)

**Backend (`server/`)**
- `index.js` — Express app with two routes: `POST /api/entries` and `GET /api/dashboard`
- `db.js` — SQLite initialization (WAL mode) and `createEntryRepository()` which returns prepared-statement DB accessors
- `services/dashboardService.js` — all complex business logic: timeline building, streak calculation, badge progress. Read this carefully before making changes.
- `constants.js` — valid categories and day ranges used for request validation

**Shared (`shared/`)**
- `badges.js` — badge definitions (8 badges: home-eating streaks at 3/7/14/30/60/100 days, plus "balanced month" and "takeaway light" window badges)
- Re-exported via `shared/constants.js` and `shared/date.js`

### Data Flow

```
User form submission
  → useMealForm (validates: no future dates, valid amount format)
    → saveMealEntry() in dashboardApi.js
      → POST /api/entries
        → isValidEntryPayload() server validation
          → repository.upsertEntry() (INSERT ... ON CONFLICT DO UPDATE for same date)
            → reload: GET /api/dashboard?days=X
              → buildDashboardResponse() in dashboardService
                → entries from DB + streak calc + badge progress
                  → useDashboard state update → re-render
```

### Database Schema

Single table `meal_entries(id, date TEXT UNIQUE, category TEXT, amount_pence INTEGER, created_at, updated_at)`. Upsert pattern means only one entry per date is kept — re-logging a date overwrites the previous entry.

### Dev Proxy

Vite dev server (port 5173) proxies `/api/*` to `http://localhost:3001`. In production, Express serves both the API and the built `dist/` directory from port 3001.

### Testing

Vitest with jsdom (frontend) and supertest (backend integration). Test files live in `test/`. The server integration tests (`server.test.js`) spin up the Express app against an in-memory SQLite database.

### Deployment

Multi-stage Dockerfile builds frontend then serves everything from a minimal Node image on port 3001. `docker-compose.yml` persists SQLite data in a named volume (`meal_habit_tracker_data`). CI runs `npm test` via GitHub Actions on every push.
