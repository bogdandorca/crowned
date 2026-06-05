# Crowned Agent Instructions

## Project Shape

- Crowned is a small static donor leaderboard app served by [server.js](server.js).
- The app uses browser-loaded JSX modules under [src](src), including [src/app.jsx](src/app.jsx), [src/data/leaderboard-data.jsx](src/data/leaderboard-data.jsx), [src/services/donation-storage.jsx](src/services/donation-storage.jsx), [src/features/donation/donate.jsx](src/features/donation/donate.jsx), [src/features/leaderboard/podium.jsx](src/features/leaderboard/podium.jsx), and [src/features/leaderboard/rows.jsx](src/features/leaderboard/rows.jsx).
- There is no build step in [package.json](package.json); `npm start` runs the local static server.
- Keep changes narrowly scoped. This repo often has visual polish and copy changes in progress, so do not revert unrelated edits.

## Development Workflow

- Prefer `rg` and `rg --files` for literal file and text discovery.
- When changing frontend code, use the `frontend-ui-consistency` skill if it is available in the current session before editing UI components, styles, layout, or user-facing copy.
- Before changing behavior, inspect the relevant component and the matching regression tests under [tests](tests).
- Preserve the existing inline style/component style unless a task explicitly asks for a broader refactor.
- Avoid adding a bundler, package manager change, or framework unless the user explicitly requests it.
- Update [FEATURES.md](FEATURES.md) after every new feature, every change to an existing feature, and every feature removal.

## Running And Verifying

- Start the app with `npm start`; by default it listens on port `8765`.
- Run regression tests directly with Node, for example `node tests/pastel-luxury-redesign.test.js`.
- If a change touches multiple user-facing flows, run all test files under [tests](tests) with Node.
- If you cannot run a verification command, say exactly what was skipped and why.

## UI And Content Guidelines

- Keep the product feel restrained, refined, and donor-focused.
- Prefer quiet giving language over competitive or casino-like copy.
- Maintain responsive layouts for both desktop and mobile; avoid text overlap and oversized controls.
- Do not reintroduce the obsolete iOS device wrapper or decorative particle/confetti effects.
