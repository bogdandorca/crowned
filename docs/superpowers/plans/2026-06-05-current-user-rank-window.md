# Current User Rank Window Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show the signed-in donor's leaderboard place below the top 10 with a separator and five nearby rows.

**Architecture:** Add a pure display helper near the mocked ranking helpers, then have `App` split the ranked donors into top standings and the current-user nearby window. Reuse `LeaderRow` for both row groups so styling, sharing, animation, and active donor highlighting stay consistent.

**Tech Stack:** Browser-loaded JSX modules, React, inline styles, Node regression tests using `vm`.

---

## File Structure

- Modify `src/data/leaderboard-data.jsx`: extend mock donors and add `leaderboardDisplayFor`.
- Modify `src/app.jsx`: compute display sections and pass them to `LeaderList`.
- Modify `src/features/leaderboard/rows.jsx`: render an optional separator and nearby rows.
- Modify `tests/rank-projection.test.js`: add display-window regression assertions.
- Modify `tests/pastel-luxury-redesign.test.js`: add string-level coverage for the app/list integration.
- Modify `FEATURES.md`: document the feature.

### Task 1: Display Helper and Regression Test

**Files:**
- Modify: `tests/rank-projection.test.js`
- Modify: `src/data/leaderboard-data.jsx`

- [ ] **Step 1: Write the failing test**

Add assertions that `leaderboardDisplayFor({ tab: 'all', activeDonorId: 'tudi' })` returns rank 4-10 in `topRows`, returns five `nearbyRows`, and places `tudi` at index 2.

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/rank-projection.test.js`
Expected: FAIL because `leaderboardDisplayFor` is not defined.

- [ ] **Step 3: Write minimal implementation**

Extend `DONORS` so `tudi` ranks below 10 in the default ranking, and add `leaderboardDisplayFor({ tab, activeDonorId })` that returns `{ ranked, topRows, nearbyRows, shouldShowNearby }`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/rank-projection.test.js`
Expected: PASS.

### Task 2: Leaderboard Rendering

**Files:**
- Modify: `src/app.jsx`
- Modify: `src/features/leaderboard/rows.jsx`
- Modify: `tests/pastel-luxury-redesign.test.js`

- [ ] **Step 1: Write the failing integration test**

Add string assertions that `App` calls `leaderboardDisplayFor`, `LeaderList` receives `nearbyRows`, and `rows.jsx` renders a `StandingsSeparator`.

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/pastel-luxury-redesign.test.js`
Expected: FAIL because the integration strings are absent.

- [ ] **Step 3: Write minimal implementation**

Update `App` to use `leaderboardDisplayFor`. Update `LeaderList` to accept `nearbyRows` and render a subtle separator plus the second row group only when rows exist.

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/pastel-luxury-redesign.test.js`
Expected: PASS.

### Task 3: Docs and Full Verification

**Files:**
- Modify: `FEATURES.md`

- [ ] **Step 1: Update feature inventory**

Document the current-user rank window and note that mocked data now includes enough donors to show it.

- [ ] **Step 2: Run focused tests**

Run:
- `node tests/rank-projection.test.js`
- `node tests/pastel-luxury-redesign.test.js`

Expected: both PASS.

- [ ] **Step 3: Run all regression tests**

Run each file under `tests/` with Node.
Expected: all PASS.
