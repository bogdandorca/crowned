# Real Backend Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the first real backend API seam for leaderboard data while preserving the current static Crowned frontend behavior.

**Architecture:** Keep `server.js` as the single Node server for static assets, but add a small JSON API for leaderboard reads. Reuse the existing donor/ranking logic through a CommonJS-compatible data module, then make the browser JSX data file expose the same helpers through `window`. Add a frontend service that can fetch API data and fall back to local mocked helpers so the no-build app still runs in simple static contexts.

**Tech Stack:** Node `http`, CommonJS modules, browser React JSX globals, Node `assert` regression tests.

---

## File Structure

- Create `src/data/leaderboard-core.js`: shared donor records and pure ranking/display helpers.
- Modify `src/data/leaderboard-data.jsx`: browser global wrapper around `leaderboard-core.js` behavior.
- Create `src/services/leaderboard-api.jsx`: frontend API/fallback service for leaderboard reads.
- Modify `src/app.jsx`: load leaderboard display through the service and refresh from the API.
- Modify `server.js`: route `GET /api/leaderboard?period=all|month` before static file serving.
- Modify `index.html`: load `src/services/leaderboard-api.jsx` before `src/app.jsx`.
- Create `tests/leaderboard-api.test.js`: server-level API regression coverage.
- Modify `tests/rank-projection.test.js`: test shared core helpers directly.
- Modify `tests/pastel-luxury-redesign.test.js`: assert app uses the service seam.
- Modify `FEATURES.md`: document the backend API seam and refresh behavior status.
- Modify `docs/real-functionality-tracker.md`: mark the first backend-foundation slice in progress/partially complete.

## Task 1: Shared Leaderboard Core

**Files:**
- Create: `src/data/leaderboard-core.js`
- Modify: `src/data/leaderboard-data.jsx`
- Modify: `tests/rank-projection.test.js`

- [x] **Step 1: Write the failing test**

Update `tests/rank-projection.test.js` to require `src/data/leaderboard-core.js` and assert the exported helpers produce the existing rank projection and nearby-row behavior.

- [x] **Step 2: Run test to verify it fails**

Run: `node tests/rank-projection.test.js`

Expected: FAIL with `Cannot find module` for `src/data/leaderboard-core.js`.

- [x] **Step 3: Write minimal implementation**

Move the existing pure donor/ranking helpers into `src/data/leaderboard-core.js`, export them through `module.exports`, and change `src/data/leaderboard-data.jsx` into a browser global wrapper with the same helper names.

- [x] **Step 4: Run test to verify it passes**

Run: `node tests/rank-projection.test.js`

Expected: PASS.

## Task 2: Leaderboard API Endpoint

**Files:**
- Modify: `server.js`
- Create: `tests/leaderboard-api.test.js`

- [x] **Step 1: Write the failing API test**

Add a test that starts the server on an ephemeral port through exported `createServer`, requests `/api/leaderboard?period=all`, and asserts JSON includes `period`, `ranked`, `topRows`, and `nearbyRows`.

- [x] **Step 2: Run test to verify it fails**

Run: `node tests/leaderboard-api.test.js`

Expected: FAIL because `server.js` does not export `createServer` or route `/api/leaderboard`.

- [x] **Step 3: Write minimal implementation**

Refactor `server.js` to export `createServer`, `send`, and `serveStatic`, keep the existing listen behavior when run directly, and add `GET /api/leaderboard?period=all|month` using `leaderboardDisplayFor`.

- [x] **Step 4: Run test to verify it passes**

Run: `node tests/leaderboard-api.test.js`

Expected: PASS.

## Task 3: Frontend API Service

**Files:**
- Create: `src/services/leaderboard-api.jsx`
- Modify: `src/app.jsx`
- Modify: `index.html`
- Modify: `tests/pastel-luxury-redesign.test.js`

- [x] **Step 1: Write the failing frontend seam test**

Assert `index.html` loads `src/services/leaderboard-api.jsx`, `src/app.jsx` calls `loadLeaderboardDisplay`, and the refresh button triggers an async leaderboard load instead of toast-only behavior.

- [x] **Step 2: Run test to verify it fails**

Run: `node tests/pastel-luxury-redesign.test.js`

Expected: FAIL because the frontend service does not exist and the app computes display data directly.

- [x] **Step 3: Write minimal implementation**

Add `loadLeaderboardDisplay({ donorId, tab, fetchImpl })`, expose it on `window`, load it from `index.html`, and update `App` to initialize from local fallback data then refresh from `/api/leaderboard`.

- [x] **Step 4: Run focused tests**

Run:
- `node tests/pastel-luxury-redesign.test.js`
- `node tests/rank-projection.test.js`
- `node tests/leaderboard-api.test.js`

Expected: all PASS.

## Task 4: Documentation And Tracker Updates

**Files:**
- Modify: `FEATURES.md`
- Modify: `docs/real-functionality-tracker.md`

- [x] **Step 1: Update feature inventory**

Document that the backend server now exposes a real leaderboard read endpoint, while storage/payments/auth remain prototype-only.

- [x] **Step 2: Update tracker**

Mark the Backend API first slice as in progress/partially complete and check off the API-read work items that now exist.

- [x] **Step 3: Run all regression tests**

Run each file in `tests/` with Node.

Expected: all PASS.
