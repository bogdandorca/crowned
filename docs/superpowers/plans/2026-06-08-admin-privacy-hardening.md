# Admin Privacy Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish Crowned's remaining admin, privacy, and session-cleanup platform gaps without changing the no-build architecture.

**Architecture:** Keep the single Node server and existing `x-admin-token` admin guard. Add donor profiles, period settings, CSV import, and session cleanup to both store implementations, then apply privacy centrally before leaderboard/share output reaches the browser. Replace the placeholder admin page with a static operational console served by the existing server.

**Tech Stack:** Node `http`, CommonJS server modules, browser-loaded JSX for the public app, static HTML/admin JavaScript, JSON fallback store, PostgreSQL store, Node regression tests.

---

### Task 1: Admin Donor Profiles And Privacy

**Files:**
- Modify: `tests/live-readiness.test.js`
- Modify: `src/server/json-store.js`
- Modify: `src/server/postgres-store.js`
- Modify: `src/server/create-server.js`
- Modify: `src/data/leaderboard-core.js`

- [ ] **Step 1: Write failing tests**

Add tests that:

- `GET /api/admin/donors` rejects unauthorized requests.
- `POST /api/admin/donors` creates/updates donor privacy settings.
- `GET /api/leaderboard` excludes hidden donors.
- anonymous donors display as `Anonymous donor`.
- amount-hidden donors include `amountHidden: true`.

- [ ] **Step 2: Verify RED**

Run: `node tests/live-readiness.test.js`

Expected: FAIL because admin donor APIs and privacy shaping do not exist.

- [ ] **Step 3: Implement minimal store and route support**

Add `upsertDonorProfile`, `donorProfiles`, and `donorProfileById` to JSON and Postgres stores. Add admin donor routes with existing `requireAdmin`. Pass profiles into leaderboard display.

- [ ] **Step 4: Implement privacy shaping**

Apply hidden/anonymous/amount-hidden rules in the leaderboard helper or immediately around it, keeping existing row fields compatible.

- [ ] **Step 5: Verify GREEN**

Run: `node tests/live-readiness.test.js`

Expected: PASS.

### Task 2: Period Settings

**Files:**
- Modify: `tests/live-readiness.test.js`
- Modify: `src/server/json-store.js`
- Modify: `src/server/postgres-store.js`
- Modify: `src/server/create-server.js`

- [ ] **Step 1: Write failing tests**

Add tests for:

- `GET /api/admin/periods` returning `all` and `month`.
- `POST /api/admin/periods` updating a label and active flag.
- inactive periods returning `400` from public leaderboard reads.

- [ ] **Step 2: Verify RED**

Run: `node tests/live-readiness.test.js`

Expected: FAIL because period settings APIs do not exist.

- [ ] **Step 3: Implement period settings**

Add store methods `periodSettings` and `upsertPeriodSetting`. Validate period ids as `all` or `month`. Check active setting in `serveLeaderboardApi`.

- [ ] **Step 4: Verify GREEN**

Run: `node tests/live-readiness.test.js`

Expected: PASS.

### Task 3: CSV Import And Session Cleanup

**Files:**
- Modify: `tests/live-readiness.test.js`
- Modify: `tests/provider-backed-flows.test.js`
- Modify: `src/server/json-store.js`
- Modify: `src/server/postgres-store.js`
- Modify: `src/server/create-server.js`
- Modify: `src/server/http-utils.js`

- [ ] **Step 1: Write failing tests**

Add tests that:

- `POST /api/admin/import.csv` imports confirmed manual donations from CSV.
- invalid CSV returns `400`.
- expired sessions are ignored by `GET /api/session`.
- `POST /api/admin/sessions/cleanup` removes expired sessions and stale OAuth states.

- [ ] **Step 2: Verify RED**

Run: `node tests/live-readiness.test.js && node tests/provider-backed-flows.test.js`

Expected: FAIL because import and expiry cleanup do not exist.

- [ ] **Step 3: Implement CSV and cleanup**

Parse a small CSV format with headers `donorId,displayName,amount,note`. Add `expiresAt` to new sessions, filter expired sessions in lookups, and add cleanup store methods.

- [ ] **Step 4: Verify GREEN**

Run: `node tests/live-readiness.test.js && node tests/provider-backed-flows.test.js`

Expected: PASS.

### Task 4: Admin Console

**Files:**
- Modify: `tests/live-readiness.test.js`
- Modify: `src/server/create-server.js`

- [ ] **Step 1: Write failing test**

Assert `/admin` renders operational controls for token entry, donor profile management, manual adjustment, periods, CSV import, export, and cleanup.

- [ ] **Step 2: Verify RED**

Run: `node tests/live-readiness.test.js`

Expected: FAIL because `/admin` is still a placeholder.

- [ ] **Step 3: Implement static admin console**

Replace placeholder HTML with a compact no-build admin console using native forms and fetch calls. Keep styling restrained and accessible.

- [ ] **Step 4: Verify GREEN**

Run: `node tests/live-readiness.test.js`

Expected: PASS.

### Task 5: Documentation And Final Verification

**Files:**
- Modify: `FEATURES.md`
- Modify: `docs/real-functionality-tracker.md`
- Modify: `docs/deployment.md`
- Modify: `docs/service-setup.md`

- [ ] **Step 1: Update docs**

Mark admin data management complete if all APIs, UI, tests, and docs are in place. Document privacy behavior, CSV import, session cleanup, and admin console usage.

- [ ] **Step 2: Run full verification**

Run: `npm test`

Expected: all regression tests pass.

- [ ] **Step 3: Review diff**

Run: `git diff --stat` and inspect changed files for unrelated edits.
