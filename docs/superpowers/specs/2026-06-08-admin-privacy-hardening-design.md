# Admin Privacy Hardening Design

## Context

Crowned already has donation-backed leaderboard data, provider-backed Stripe and Google flows, share links, health checks, PostgreSQL persistence, and a JSON fallback for local demo use. The remaining product gaps are concentrated in admin operations, session cleanup, and donor privacy rules.

The implementation must preserve the current no-build frontend and single Node server. It should not introduce staff accounts, a framework migration, or broad UI refactors.

## Goals

- Let an organization maintain donor records and leaderboard settings without editing source code.
- Let admins choose how donors appear publicly: named, anonymous, hidden, and amount visibility.
- Add durable session expiry behavior and cleanup coverage.
- Provide a lightweight but usable admin page instead of the current placeholder.
- Keep Stripe, Google, share, and existing leaderboard flows working as they do today.

## Non-Goals

- Multi-user admin accounts or role-based staff login.
- A bundler, SPA router, or frontend framework migration.
- Complex campaign management beyond the current all-time and monthly leaderboard periods.
- Provider-specific donor CRM integrations.

## Architecture

The server remains the single static and API service. Admin operations continue to use the existing `x-admin-token` protection. Store implementations gain a small donor-profile model, period settings, CSV import, and session expiry helpers, implemented for both PostgreSQL and JSON fallback.

Leaderboard shaping stays in `src/data/leaderboard-core.js`, but it receives optional donor profiles and period settings from the store. Privacy is applied before rows are sent to the browser or rendered in public share pages, so existing UI components do not need to understand hidden donors or anonymous naming rules.

The `/admin` page becomes a static HTML admin console served by the same server. It stores the token only in browser session state, calls the admin APIs with `x-admin-token`, and provides compact forms for donor profiles, manual adjustments, period settings, CSV import, and export.

## Data Model

Donor profile:

- `donorId`: stable donor id.
- `displayName`: admin-facing preferred name.
- `publicName`: optional public name override.
- `anonymous`: when true, public rows display as `Anonymous donor`.
- `hidden`: when true, donor donations are excluded from public leaderboard and share lookup.
- `showAmount`: when false, public rows still rank by amount, but display amount as hidden metadata.
- `updatedAt`: last profile update timestamp.

Period settings:

- `period`: `all` or `month`.
- `label`: public label used by admin tools and future UI copy.
- `active`: whether the period is available to leaderboard reads.
- `updatedAt`: last update timestamp.

Sessions receive an `expiresAt` timestamp. `GET /api/session` ignores expired sessions. Admin cleanup removes expired sessions and stale OAuth state records.

## API Shape

Existing admin guard remains unchanged:

- Missing `ADMIN_TOKEN`: `503`.
- Missing or wrong `x-admin-token`: `401`.

New or expanded admin APIs:

- `GET /api/admin/donors`: list donor profiles plus aggregate donation totals.
- `POST /api/admin/donors`: create or update one donor profile.
- `GET /api/admin/periods`: return period settings.
- `POST /api/admin/periods`: update one period setting.
- `POST /api/admin/import.csv`: import manual confirmed donations from CSV.
- `POST /api/admin/sessions/cleanup`: delete expired sessions and stale OAuth states.

Existing APIs remain:

- `POST /api/admin/donations`: confirmed manual adjustment.
- `GET /api/admin/export.csv`: donation export.

## UI

The admin UI is restrained and operational. It has no marketing hero and no decorative effects. The first screen is the working console:

- token field;
- donor profile table with create/update form;
- manual donation adjustment form;
- period settings form;
- CSV import textarea/file input;
- export link/action;
- status/error region.

The page uses native forms and fetch calls so it can live inside `create-server.js` or a small server-owned template without adding client build tooling.

## Error Handling

Admin APIs validate required ids, names, amount values, supported periods, and CSV headers. Provider secrets are never exposed. Admin UI displays concise status messages from API responses.

Privacy changes are applied centrally when leaderboard data is generated. Hidden donors are excluded. Anonymous donors are renamed. Amount-hidden donors keep rank ordering but expose `amountHidden: true` so UI can show a quiet private amount label instead of a dollar total.

## Testing

Use TDD for each behavior:

- admin donor permissions and validation;
- donor anonymity, visibility, and hidden amount behavior in leaderboard and share pages;
- period activation/validation;
- CSV import of manual donations;
- expired session cleanup and ignored expired sessions;
- admin page contains the expected operational controls.

Run the focused tests during each slice, then `npm test` before completion.
