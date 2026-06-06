# Crowned Features

Last reviewed: June 5, 2026

## Status Legend

- **Live / mocked data**: Feature is visible and functional, but uses hard-coded donor data from `src/data/leaderboard-data.jsx`.
- **Live / backend API with mocked source**: Feature reads through the server/API seam, but the API is still backed by mocked donor data rather than a database.
- **Live / provider-backed when configured**: Feature calls real provider-backed server APIs and returns explicit configuration errors until required environment variables are set.
- **Live / local-only data**: Feature stores or reads browser-local state, usually `localStorage`, with no backend sync.
- **Live / no data required**: Feature is present and does not need application data.
- **Prototype / toast-only**: Feature has a UI affordance but does not perform the real external action yet.
- **Removed**: Feature or utility code was intentionally removed from the active app.

## Feature Inventory

| Feature | Status | Data Source | Notes |
|---|---|---|---|
| Dependency-ready Node server | Live / no data required | `server.js`, `src/server/create-server.js`, `package.json` runtime dependencies | `server.js` is now a thin dotenv-enabled entrypoint; reusable HTTP routing lives under `src/server/` and can use installed runtime packages. |
| Static Crowned website shell | Live / no data required | None | Served by the Node server on port `8765`; browser loads React, ReactDOM, Babel, and local JSX modules from `src/` directly. The same server now exposes backend APIs. |
| Read-only leaderboard API | Live / backend API with mocked source | `GET /api/leaderboard?period=all\|month` backed by `src/data/leaderboard-core.js` | Returns ranked donors, top standings rows, nearby current-user rows, the requested period, and active donor id. |
| Full-width pastel donor leaderboard layout | Live / backend API with mocked source | Frontend `loadLeaderboardDisplay` service with local fallback to shared mocked donor rows | Current presentation is a refined website layout, not the obsolete iOS device wrapper; leaderboard content is centered and width-constrained on large screens. |
| SVG favicon and browser title | Live / no data required | None | Uses the root `favicon.svg` and the Crowned donor leaderboard page title. |
| Sticky brand header | Live / mocked data | Tweak defaults plus selected tab | Shows the organization wordmark, donor leaderboard label, season text, and refresh button. |
| Refresh leaderboard button | Live / backend API with mocked source | Frontend leaderboard API service | Fetches the current leaderboard payload from `/api/leaderboard` and then displays a "Leaderboard refreshed" toast. The returned data is still sourced from mocked donors. |
| All Time / This Month tab switch | Live / mocked data | `allTime` and `thisMonth` fields in `DONORS` | Re-sorts the same donor pool by the selected total and changes season copy. |
| Rank delta indicators | Live / mocked data | Derived from the two mocked leaderboard orderings | Shows movement relative to the other tab's ranking. |
| Leading patron hero | Live / mocked data | Top donor from `rankedFor(tab)` | Highlights the current first-place donor with name and animated amount. |
| Top-three podium cards | Live / mocked data | Top three donors from `rankedFor(tab)` | Shows rank, initials avatar, medal ring, animated amount, share button, and optional "You" state. |
| Full standings list | Live / mocked data | Display sections from `leaderboardDisplayFor({ donorId, tab })` | Shows positions 4-10 with initials avatar, amount, rank delta, share button, and optional "You" state. |
| Current-user rank window | Live / mocked data | Signed-in donor id plus ranked mocked donors | When the signed-in donor ranks below the top 10, shows a subtle separator followed by five nearby places with the signed-in donor centered as the third row when possible. |
| FLIP-style list reshuffle animation | Live / no data required | DOM positions and current row order | Animates row movement when the tab changes and animations are enabled. |
| Animated donation amounts | Live / no data required | Numeric value passed to `AnimatedNumber` | Counts amounts up when values change; can be disabled through tweaks. |
| Initials avatars and medal styling | Live / mocked data | Donor names, hue, and rank | Uses generated initials and gradient rings; no real donor photos are present. |
| Donor badge labels | Removed from active UI | `badge` field remains in `DONORS` | Labels such as Founding Donor, Visionary Circle, and Patron are not rendered in the leaderboard or share cards right now. |
| Floating Make a Gift CTA | Live / no data required | None | Opens the donation modal when no share or donate modal is active. |
| Donation modal | Live / provider-backed when configured | Modal state, guest identity, entered amount, and `POST /api/donations` | Supports sign-in prompt, amount selection, and provider checkout creation. Missing Stripe config is shown as a checkout configuration error. |
| Amount presets | Live / no data required | None | Supports `$25`, `$50`, `$100`, and `$250` choices. |
| Custom donation amount input | Live / no data required | User-entered modal state | Accepts decimal-like numeric input after stripping non-number characters. |
| Guest donor token | Live / local-only data | `localStorage` key `crowned_guest_donor_token` | Creates a stable browser-local donor id for guest gifts. |
| Guest donation display name | Live / local-only data | `localStorage` key `crowned_guest_donor_name` | Required for the first guest gift; saved locally for later guest gifts. |
| Local donation receipt records | Removed from active checkout flow | `localStorage` helper remains for identity regression coverage | Provider checkout now starts through the backend instead of recording local-only receipts. |
| Stripe checkout creation | Live / provider-backed when configured | `POST /api/donations`, `stripe` package, `STRIPE_SECRET_KEY`, `APP_BASE_URL` | Creates a pending donation and Stripe Checkout Session. Missing Stripe config returns an explicit 503 error. |
| Stripe webhook confirmation | Live / provider-backed when configured | `POST /api/stripe/webhook` and server JSON store | Confirms matching pending donations and folds confirmed gifts into leaderboard totals. |
| Stripe webhook signature verification | Live / provider-backed when configured | `stripe` package and `STRIPE_WEBHOOK_SECRET` | Verifies signed Stripe webhook payloads before confirming donations when the webhook secret is configured. |
| Payment method tiles | Live / provider-backed when configured | Stripe checkout endpoint | Apple Pay, Google Pay, PayPal, and card buttons all start the backend checkout path with their selected method label. Stripe wallet availability depends on Stripe account/payment-method configuration. |
| Google sign-in button | Live / provider-backed when configured | `GET /api/auth/google/start`, `GET /api/auth/google/callback`, `google-auth-library`, Google OAuth env vars | Starts Google OAuth and creates an HTTP-only `crowned_session` cookie on callback. Missing Google config returns an explicit 503 error. |
| Signed-in donor highlight | Live / provider-backed when configured | `GET /api/session` and OAuth guest-linking state | Highlights the authenticated donor when a valid `crowned_session` cookie exists. Guest donations started before Google sign-in can be linked during OAuth callback. |
| Projected rank panel | Live / provider-backed when configured | Authenticated donor id plus current leaderboard totals | Shows current rank, projected rank, projected total, and amount remaining to reach the next rank for the signed-in donor. |
| Share rank modal | Live / mocked data | Selected donor and organization name | Opens from podium or row cards and renders a share-card preview. |
| Story and feed share-card formats | Live / mocked data | Selected donor and selected format | Supports 9:16 story and 1:1 feed previews. |
| Server share links | Live / backend API with mocked source | `POST /api/share-links`, `GET /api/share-links/:id` | Persists share records in the server store and returns public `/share/:id` URLs. |
| Public share pages | Live / backend API with mocked source | `GET /share/:id` | Renders a public donor rank page with share metadata for generated share links. |
| Instagram and Facebook share buttons | Live / provider-backed when configured | Share-link API plus browser share/open APIs | Facebook opens a real sharer URL. Instagram uses native share when available or copies the generated link as a fallback. |
| Save Image action | Live / no data required | Browser SVG-to-canvas export | Generates and downloads a PNG for the selected story/feed format. |
| Copy Link action | Live / backend API with mocked source | Share-link API plus Clipboard API fallback | Creates a real server share URL and copies it to the clipboard. |
| Toast notifications | Live / no data required | Local component state | Used for refresh, sign-in, payment, and share action feedback. |
| Tweak defaults | Live / no data required | `TWEAK_DEFAULTS` in `src/app.jsx` | Controls organization name, serif font, gold intensity, background darkness, animation toggle, and accent color. |
| Edit-mode tweaks panel | Live / local host integration | Host `postMessage` edit-mode protocol in `src/dev/tweaks-panel.jsx` | Opens only when the embedding host sends edit-mode messages; writes changes back through `__edit_mode_set_keys`. |
| Curated accent and typography controls | Live / no data required | Tweak values | Provides curated color chips, serif font select, sliders, and animation toggle. |
| Responsive mobile layout | Live / no data required | CSS media queries | Converts podium cards to a single column and makes the donate modal full-screen on small viewports. |
| Ambient visual effect atoms | Removed | None | Obsolete `LightRays`, `GoldParticles`, `Confetti`, and `Crown` exports were removed; the current product direction intentionally avoids rays, particles, and confetti. |
| Health checks | Live / no data required | `GET /healthz`, `GET /readyz` | Returns JSON readiness responses with request ids for deployment smoke checks. |
| Admin manual donations | Live / provider-backed when configured | `POST /api/admin/donations` with `ADMIN_TOKEN` | Creates confirmed manual adjustments through token-protected server APIs. A polished admin UI is still future work. |
| Admin donation export | Live / provider-backed when configured | `GET /api/admin/export.csv` with `ADMIN_TOKEN` | Exports all donation records as CSV through a token-protected server API. |
| Structured request logging | Live / no data required | `src/server/logger.js`, `CROWNED_LOGS=json`, `NODE_ENV=production` | Emits JSON request completion and failure logs in production or when explicitly enabled. |
| Deployment configuration | Live / no data required | `.env.example`, `Dockerfile`, `docs/deployment.md` | Documents required secrets, Stripe/Google setup, Docker execution, health checks, and production storage notes. |

## Current Data Model

- The leaderboard starts from the hard-coded `DONORS` array in `src/data/leaderboard-core.js`, which includes more than 10 donors so below-top-10 current-user placement can be exercised locally.
- The server exposes `GET /api/leaderboard?period=all|month`, and the browser reads it through `src/services/leaderboard-api.jsx` with a local fallback.
- Server runtime state persists in PostgreSQL when `DATABASE_URL` or `POSTGRES_URL` is configured, with JSON storage as the local fallback for demo use.
- Stripe Checkout and Google OAuth are wired behind provider adapters and require environment variables before live provider calls can succeed.
- Runtime dependencies are installed through `package.json`, including `stripe`, `google-auth-library`, `dotenv`, `cookie`, and `pg`.
- Admin APIs support manual confirmed donations and CSV export; a polished donor management interface is still future work.
- Guest identities and donation receipts persist only in the current browser through `localStorage` helpers in `src/services/donation-storage.jsx`.
- Confirmed server donations are folded into leaderboard totals through `leaderboardDisplayFor({ donations })`.
- Share actions create persisted share links, copy real URLs, and export image files.

## Backend Readiness

- `src/data/leaderboard-core.js` is the shared mocked leaderboard provider for Node and browser use until a database-backed repository replaces it.
- `src/services/leaderboard-api.jsx` is the browser API seam for leaderboard reads and should remain the UI entry point as the backend becomes real.
- `src/server/store.js` chooses PostgreSQL when configured and falls back to `src/server/json-store.js` for local runtime persistence.
- `src/server/postgres-store.js` owns PostgreSQL persistence for donations, sessions, share links, and OAuth linking state.
- `src/server/stripe-provider.js` owns Stripe Checkout Session creation.
- `src/server/google-auth-provider.js` owns Google OAuth start/callback provider logic.
- `src/server/create-server.js` owns server routing and can be imported directly by tests or future tooling.
- `src/server/http-utils.js` owns shared response, body parsing, MIME, and cookie helpers.
- `src/server/logger.js` owns structured request logging.
- `src/services/provider-api.jsx` is the browser seam for auth, donation checkout, and share-link calls.
- `src/services/share-actions.jsx` owns share image export and clipboard behavior.
- `.env.example`, `Dockerfile`, and `docs/deployment.md` describe the production runtime configuration.

## Regression Coverage

- `tests/pastel-luxury-redesign.test.js` covers the current website layout direction, restrained donation copy, donate modal shape, signed-in donor highlighting, guest-donation identity hooks, and projected-rank presentation.
- `tests/leaderboard-api.test.js` covers the read-only leaderboard API payload, period validation, and current-user nearby row window.
- `tests/provider-backed-flows.test.js` covers missing provider configuration errors, Stripe checkout creation, webhook confirmation, leaderboard total updates, share-link persistence, and Google OAuth callback session creation.
- `tests/dependency-ready-server.test.js` covers the dependency-ready server structure and runtime dependency declarations.
- `tests/live-readiness.test.js` covers signed Stripe webhooks, admin donation/export APIs, public share pages, health checks, request ids, and Postgres deployment configuration.
- `tests/rank-projection.test.js` covers rank projection thresholds and the below-top-10 current-user display window.
- `tests/guest-donation-identity.test.js` covers guest token persistence, guest name persistence, and local donation record lookup.
- `tests/no-ios-wrapper.test.js` confirms the obsolete iOS frame is not present.
- `tests/favicon.test.js` confirms the Crowned SVG favicon is linked and present.
