# Backend-Ready Static Reorganization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganize Crowned into a backend-ready static `src/` layout while preserving the current no-build browser JSX runtime and behavior.

**Architecture:** Keep direct `<script type="text/babel">` loading and browser global exports, but move files into clearer app, data, service, feature, UI, and dev-tool boundaries. Split active shared atoms from unused ambient effects, and separate local donation storage from mocked leaderboard data so future backend APIs have clear replacement points.

**Tech Stack:** Static Node server, browser React 18 UMD, ReactDOM UMD, Babel Standalone, plain JSX files exporting globals through `Object.assign(window, ...)`, Node `assert` regression tests.

---

## File Structure

Create:

- `src/app.jsx`: moved current app shell and page composition.
- `src/data/leaderboard-data.jsx`: mocked donors, display helpers, ranking, rank projection.
- `src/services/donation-storage.jsx`: guest donor token/name helpers and browser-local donation receipt helpers.
- `src/ui/atoms.jsx`: shared active UI atoms and React hook globals (`Avatar`, `AnimatedNumber`, `useState`, `useEffect`, `useRef`, `useLayoutEffect`).
- `src/features/leaderboard/podium.jsx`: moved podium/leading-patron UI.
- `src/features/leaderboard/rows.jsx`: moved standing rows and FLIP reshuffle UI.
- `src/features/donation/donate.jsx`: moved donate CTA/modal and mocked payment UI.
- `src/features/share/share-card.jsx`: moved share modal/share-card preview.
- `src/dev/tweaks-panel.jsx`: moved host edit-mode tweaks utility.

Modify:

- `index.html`: update script paths to `src/...` in dependency order.
- `tests/pastel-luxury-redesign.test.js`: read moved feature files and assert cleanup.
- `tests/rank-projection.test.js`: read `src/data/leaderboard-data.jsx`.
- `tests/guest-donation-identity.test.js`: read `src/services/donation-storage.jsx`.
- `tests/no-ios-wrapper.test.js`: read `src/app.jsx`.
- `FEATURES.md`: update file references, feature inventory, and ambient effects status.

Remove:

- Root JSX app files after moved equivalents are in place: `app.jsx`, `data.jsx`, `donate.jsx`, `effects.jsx`, `podium.jsx`, `rows.jsx`, `sharecard.jsx`, `tweaks-panel.jsx`.
- Unused ambient exports from the active code path: `Crown`, `LightRays`, `GoldParticles`, `Confetti`.

Do not modify:

- `server.js`
- `package.json`
- `favicon.svg`
- `ecosystem.config.js`
- `logs/.gitkeep`

Implementation must preserve the current uncommitted content of each moved file. Treat the existing dirty worktree as user-owned source material.

## Task 1: Update Regression Tests For Target Layout

**Files:**

- Modify: `tests/pastel-luxury-redesign.test.js`
- Modify: `tests/rank-projection.test.js`
- Modify: `tests/guest-donation-identity.test.js`
- Modify: `tests/no-ios-wrapper.test.js`

- [ ] **Step 1: Write target-layout test changes**

In `tests/pastel-luxury-redesign.test.js`, change file reads to:

```js
const app = fs.readFileSync(path.join(root, 'src/app.jsx'), 'utf8');
const podium = fs.readFileSync(path.join(root, 'src/features/leaderboard/podium.jsx'), 'utf8');
const donate = fs.readFileSync(path.join(root, 'src/features/donation/donate.jsx'), 'utf8');
const rows = fs.readFileSync(path.join(root, 'src/features/leaderboard/rows.jsx'), 'utf8');
const atoms = fs.readFileSync(path.join(root, 'src/ui/atoms.jsx'), 'utf8');
```

Add assertions:

```js
assert(
  atoms.includes('function Avatar') && atoms.includes('function AnimatedNumber'),
  'active shared atoms should keep Avatar and AnimatedNumber'
);
assert(
  !atoms.includes('function LightRays') &&
    !atoms.includes('function GoldParticles') &&
    !atoms.includes('function Confetti') &&
    !atoms.includes('function Crown'),
  'unused ambient effects should not remain in the active shared atoms module'
);
```

In `tests/rank-projection.test.js`, change:

```js
const dataPath = path.resolve(__dirname, '..', 'src/data/leaderboard-data.jsx');
```

In `tests/guest-donation-identity.test.js`, change:

```js
const dataPath = path.resolve(__dirname, '..', 'src/services/donation-storage.jsx');
```

In `tests/no-ios-wrapper.test.js`, change:

```js
const app = fs.readFileSync(path.join(root, 'src/app.jsx'), 'utf8');
```

- [ ] **Step 2: Run tests and verify RED**

Run:

```bash
node tests/pastel-luxury-redesign.test.js
node tests/rank-projection.test.js
node tests/guest-donation-identity.test.js
node tests/no-ios-wrapper.test.js
```

Expected: touched tests fail with `ENOENT` because the new `src/` files do not exist yet. If a test fails for syntax or assertion reasons instead, fix the test before moving production files.

## Task 2: Move Code Into `src/` And Split Backend Seams

**Files:**

- Create: `src/app.jsx`
- Create: `src/data/leaderboard-data.jsx`
- Create: `src/services/donation-storage.jsx`
- Create: `src/ui/atoms.jsx`
- Create: `src/features/leaderboard/podium.jsx`
- Create: `src/features/leaderboard/rows.jsx`
- Create: `src/features/donation/donate.jsx`
- Create: `src/features/share/share-card.jsx`
- Create: `src/dev/tweaks-panel.jsx`
- Modify: `index.html`
- Delete: root JSX files listed in the File Structure section

- [ ] **Step 1: Create target directories**

Run:

```bash
mkdir -p src/data src/services src/ui src/features/leaderboard src/features/donation src/features/share src/dev
```

- [ ] **Step 2: Move feature files without rewriting behavior**

Move current files to their target paths:

```bash
mv app.jsx src/app.jsx
mv podium.jsx src/features/leaderboard/podium.jsx
mv rows.jsx src/features/leaderboard/rows.jsx
mv donate.jsx src/features/donation/donate.jsx
mv sharecard.jsx src/features/share/share-card.jsx
mv tweaks-panel.jsx src/dev/tweaks-panel.jsx
```

- [ ] **Step 3: Split `data.jsx` into leaderboard data and donation storage**

Create `src/data/leaderboard-data.jsx` from `data.jsx` with only:

```js
const DONORS = [
  // existing donor records unchanged
];

function fullName(d) { return d.last ? d.first + ' ' + d.last : d.first; }
function initials(d) { return ((d.first[0] || '') + (d.last[0] || d.first[1] || '')).toUpperCase(); }

function fmtMoney(n) {
  return '$' + Math.round(n).toLocaleString('en-US');
}

function rankedFor(tab) {
  // existing implementation unchanged
}

function projectedRankForGift({ donorId, tab = 'all', giftAmount = 0 }) {
  // existing implementation unchanged
}

Object.assign(window, {
  DONORS,
  fullName,
  initials,
  fmtMoney,
  rankedFor,
  projectedRankForGift,
});
```

Create `src/services/donation-storage.jsx` from the storage-related functions currently in `data.jsx`:

```js
const GUEST_DONOR_TOKEN_KEY = 'crowned_guest_donor_token';
const GUEST_DONOR_NAME_KEY = 'crowned_guest_donor_name';
const DONATION_RECORDS_KEY = 'crowned_donation_records';

function browserStorage() {
  try {
    return window.localStorage || null;
  } catch (error) {
    return null;
  }
}

function randomId(prefix) {
  // existing implementation unchanged
}

function readJson(storage, key, fallback) {
  // existing implementation unchanged
}

function writeJson(storage, key, value) {
  // existing implementation unchanged
}

function getOrCreateGuestDonorToken(storage = browserStorage()) {
  // existing implementation unchanged
}

function getGuestDonorName(storage = browserStorage()) {
  // existing implementation unchanged
}

function saveGuestDonorName(name, storage = browserStorage()) {
  // existing implementation unchanged
}

function recordDonation({ donorId, displayName, amount, method }, storage = browserStorage()) {
  // existing implementation unchanged
}

function donationsForDonor(donorId, storage = browserStorage()) {
  // existing implementation unchanged
}

Object.assign(window, {
  getOrCreateGuestDonorToken,
  getGuestDonorName,
  saveGuestDonorName,
  recordDonation,
  donationsForDonor,
});
```

Delete root `data.jsx` only after both target files exist.

- [ ] **Step 4: Split active atoms from `effects.jsx`**

Create `src/ui/atoms.jsx` with:

```js
const { useState, useEffect, useRef, useLayoutEffect } = React;

const RING = {
  gold: 'linear-gradient(135deg, #c9b37d, #fff8e6 48%, #8b6b34)',
  platinum: 'linear-gradient(135deg, #b9c5c8, #ffffff 48%, #7f8b8e)',
  bronze: 'linear-gradient(135deg, #d5b7a5, #fff1e7 48%, #a88973)',
  plain: 'linear-gradient(135deg, #d9d2c5, #fdf8ef)',
};

function Avatar({ donor, size = 56, ring = 'plain', initialsColor }) {
  // existing implementation unchanged
}

function AnimatedNumber({ value, animate = true, prefix = '$', className, style }) {
  // existing implementation unchanged
}

Object.assign(window, { Avatar, AnimatedNumber });
```

Do not include `Crown`, `crownSvg`, `LightRays`, `GoldParticles`, or `Confetti`. Delete root `effects.jsx` only after `src/ui/atoms.jsx` exists.

- [ ] **Step 5: Update browser script paths**

In `index.html`, replace the root JSX script block with:

```html
  <script type="text/babel" src="src/dev/tweaks-panel.jsx"></script>
  <script type="text/babel" src="src/data/leaderboard-data.jsx"></script>
  <script type="text/babel" src="src/services/donation-storage.jsx"></script>
  <script type="text/babel" src="src/ui/atoms.jsx"></script>
  <script type="text/babel" src="src/features/leaderboard/podium.jsx"></script>
  <script type="text/babel" src="src/features/leaderboard/rows.jsx"></script>
  <script type="text/babel" src="src/features/share/share-card.jsx"></script>
  <script type="text/babel" src="src/features/donation/donate.jsx"></script>
  <script type="text/babel" src="src/app.jsx"></script>
```

- [ ] **Step 6: Run tests and verify GREEN**

Run:

```bash
node tests/pastel-luxury-redesign.test.js
node tests/rank-projection.test.js
node tests/guest-donation-identity.test.js
node tests/no-ios-wrapper.test.js
node tests/favicon.test.js
```

Expected: all pass.

- [ ] **Step 7: Commit reorganization**

Stage all moved code, deleted root JSX files, updated tests, and `index.html`:

```bash
git add src index.html tests/pastel-luxury-redesign.test.js tests/rank-projection.test.js tests/guest-donation-identity.test.js tests/no-ios-wrapper.test.js
git add -u app.jsx data.jsx donate.jsx effects.jsx podium.jsx rows.jsx sharecard.jsx tweaks-panel.jsx
git commit -m "refactor: organize static app for backend readiness"
```

## Task 3: Update Feature Inventory And Backend-Readiness Notes

**Files:**

- Modify: `FEATURES.md`

- [ ] **Step 1: Update file references**

Change root JSX references to the new paths:

- `src/app.jsx`
- `src/data/leaderboard-data.jsx`
- `src/services/donation-storage.jsx`
- `src/features/donation/donate.jsx`
- `src/features/leaderboard/podium.jsx`
- `src/features/leaderboard/rows.jsx`
- `src/features/share/share-card.jsx`
- `src/ui/atoms.jsx`
- `src/dev/tweaks-panel.jsx`

- [ ] **Step 2: Update ambient effects feature row**

Replace the old utility row with:

```md
| Ambient visual effect atoms | Removed | None | Obsolete `LightRays`, `GoldParticles`, `Confetti`, and `Crown` exports were removed; the current product direction intentionally avoids rays, particles, and confetti. |
```

- [ ] **Step 3: Add backend-readiness section**

Add:

```md
## Backend Readiness

- `src/data/leaderboard-data.jsx` is the current mocked leaderboard provider and is the primary future API replacement seam.
- `src/services/donation-storage.jsx` owns browser-local guest identity and receipt persistence until a backend donor/donation API exists.
- `src/features/donation/donate.jsx` still uses mocked payment actions and should later call a real checkout service.
- `signedInDonorId` in `src/app.jsx` remains the app-level identity seam for replacing mocked Google sign-in.
- Share actions in `src/features/share/share-card.jsx` remain toast-only until export/link generation exists.
```

- [ ] **Step 4: Commit docs update**

Run:

```bash
git add FEATURES.md
git commit -m "docs: document backend-ready static layout"
```

## Task 4: Full Runtime Verification

**Files:**

- No code changes expected.

- [ ] **Step 1: Run all Node regressions**

Run:

```bash
node tests/pastel-luxury-redesign.test.js
node tests/rank-projection.test.js
node tests/guest-donation-identity.test.js
node tests/no-ios-wrapper.test.js
node tests/favicon.test.js
```

Expected: all pass.

- [ ] **Step 2: Start static server**

Try default first:

```bash
npm start
```

Expected: server starts on `http://0.0.0.0:8765`. If it fails with `EADDRINUSE`, do not kill the existing process; use:

```bash
PORT=8876 npm start
```

Expected: server starts on `http://0.0.0.0:8876`.

- [ ] **Step 3: Verify runtime assets**

Against the active port, run:

```bash
curl -I http://127.0.0.1:<port>/
curl -I http://127.0.0.1:<port>/src/app.jsx
curl -I http://127.0.0.1:<port>/src/data/leaderboard-data.jsx
curl -I http://127.0.0.1:<port>/src/services/donation-storage.jsx
curl -I http://127.0.0.1:<port>/src/ui/atoms.jsx
curl -I http://127.0.0.1:<port>/src/features/donation/donate.jsx
curl -I http://127.0.0.1:<port>/src/features/share/share-card.jsx
curl -I http://127.0.0.1:<port>/src/features/leaderboard/podium.jsx
curl -I http://127.0.0.1:<port>/src/features/leaderboard/rows.jsx
curl -I http://127.0.0.1:<port>/src/dev/tweaks-panel.jsx
curl -I http://127.0.0.1:<port>/favicon.svg
```

Expected: every response is `HTTP/1.1 200 OK` with the expected content type.

- [ ] **Step 4: Stop temporary server**

Stop only the server started for this task.

- [ ] **Step 5: Final status check**

Run:

```bash
git status --short
```

Expected: clean for plan-created commits, except for any pre-existing user-owned changes intentionally left out of implementation commits.
