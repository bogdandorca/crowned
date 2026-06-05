# Backend-Ready Static Reorganization Design

Date: 2026-06-05

## Goal

Prepare Crowned for backend integration without introducing a build step yet. The app should remain a static React/Babel prototype served by `server.js`, while its files and naming make the future backend boundaries clear.

## Current State

Crowned is loaded by `index.html` through ordered browser JSX scripts. The app has:

- mocked leaderboard data and ranking helpers in `data.jsx`;
- local-only guest donor identity and donation receipt persistence through `localStorage`;
- mocked Google sign-in as donor `tudi`;
- toast-only refresh, payment, and share actions;
- UI split across root-level JSX files;
- regression tests that inspect file contents and data helper behavior.

All current regression tests pass. Runtime asset checks passed on a temporary port because the default `8765` port was already occupied.

## Chosen Approach

Use a shallow `src` organization while preserving direct browser script loading.

This avoids a bundler or framework migration, keeps risk low, and still gives the next backend phase clear places to replace mocked/local behavior with real services.

## Target Structure

Keep root files that define the static app boundary:

- `index.html`
- `server.js`
- `package.json`
- `favicon.svg`
- `tests/`
- `FEATURES.md`
- `AGENTS.md`
- `CLAUDE.md`

Move app code under `src/`:

- `src/app.jsx`: main app shell, global state, page composition.
- `src/data/leaderboard-data.jsx`: mocked donor data, ranking helpers, rank projection.
- `src/services/donation-storage.jsx`: browser-local guest identity and donation records.
- `src/features/leaderboard/podium.jsx`: leading patron and top-three cards.
- `src/features/leaderboard/rows.jsx`: full standings list and reshuffle animation.
- `src/features/donation/donate.jsx`: floating gift CTA, donation modal, mocked payment actions.
- `src/features/share/share-card.jsx`: share modal and share-card preview.
- `src/ui/atoms.jsx`: shared active atoms such as `Avatar` and `AnimatedNumber`.
- `src/dev/tweaks-panel.jsx`: host edit-mode tweaks utility.

Because the app still has no bundler, files will continue to export browser globals through `Object.assign(window, ...)`. `index.html` will load scripts in dependency order.

## Cleanup Rules

Remove only code that is clearly unused and conflicts with the current product direction:

- remove `LightRays`;
- remove `GoldParticles`;
- remove `Confetti`;
- remove `Crown`.

Keep `Avatar` and `AnimatedNumber`, because they are active dependencies of the leaderboard and share UI.

Keep the tweaks panel, but move it under `src/dev/` so it is clearly development/host tooling rather than product functionality.

Do not add a bundler, package manager change, framework, backend API, database, authentication provider, or payment provider in this pass.

## Backend Readiness Seams

The reorganization should make these future replacements obvious:

- `leaderboard-data.jsx` can later become an API-backed leaderboard provider.
- `donation-storage.jsx` can later become a donation API client or client-side cache around backend donor identity.
- `DonateModal` can later call a real checkout/payment service instead of recording local receipts.
- mocked Google sign-in can later be replaced by real auth while keeping `signedInDonorId` as the app-level identity seam.
- share actions can later call a real image export/link generation service.

## Tests And Docs

Update tests to read the moved files from `src/`.

Update `FEATURES.md` to describe the new file locations, removed unused ambient effects, and unchanged runtime model.

## Verification

After implementation:

1. Run every Node regression test under `tests/`.
2. Start the static server. If port `8765` is occupied, use a temporary alternate `PORT`.
3. Verify `/`, the moved JSX script assets, and `favicon.svg` return `200`.
4. Confirm no server process is left running from verification.

## Non-Goals

- No backend implementation.
- No data fetching.
- No real checkout.
- No real OAuth.
- No generated share images.
- No design refresh beyond preserving existing behavior during the reorganization.
