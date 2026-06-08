# Crowned Features

Last reviewed: June 8, 2026

## Status Legend

- **Live / donation-backed data**: Feature is visible and functional, with public leaderboard rows created only from confirmed server donation records.
- **Live / backend API**: Feature reads through the server/API seam.
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
| Read-only leaderboard API | Live / donation-backed data | `GET /api/leaderboard?period=all\|month` backed by confirmed donation records | Returns ranked donors, top standings rows, nearby current-user rows, the requested period, and active donor id. Applies donor privacy settings before returning public rows. A fresh store returns an empty leaderboard until gifts are confirmed. |
| Full-width pastel donor leaderboard layout | Live / donation-backed data | Frontend `loadLeaderboardDisplay` service with local fallback to the shared ranking helper | Current presentation is a refined website layout, not the obsolete iOS device wrapper; leaderboard content is centered and width-constrained on large screens. |
| SVG favicon and browser title | Live / no data required | None | Uses the root `favicon.svg` and the Crowned donor leaderboard page title. |
| Sticky brand header | Live / backend API | Tweak defaults plus selected tab | Shows the organization wordmark, donor leaderboard label, season text, and refresh button. |
| Refresh leaderboard button | Live / donation-backed data | Frontend leaderboard API service | Fetches the current leaderboard payload from `/api/leaderboard` and then displays a "Leaderboard refreshed" toast. |
| All Time / This Month tab switch | Live / donation-backed data | Confirmed donation totals | Re-sorts confirmed donors by all-time or monthly totals and changes season copy. |
| Rank delta indicators | Live / donation-backed data | Derived from the two donation-backed leaderboard orderings | Shows movement relative to the other tab's ranking. |
| Leading patron hero | Live / donation-backed data | Top donor from confirmed donations | Highlights the current first-place donor with name and animated amount. |
| Top-three podium cards | Live / donation-backed data | Top three donors from confirmed donations | Shows rank, initials avatar, medal ring, animated amount, share button, and optional "You" state. |
| Full standings list | Live / donation-backed data | Display sections from `leaderboardDisplayFor({ donorId, tab, donations })` | Shows positions 4-10 with initials avatar, amount, rank delta, share button, and optional "You" state. |
| Empty leaderboard state | Live / donation-backed data | Confirmed donation totals | Shows a quiet empty state on a fresh deployment until the first confirmed gift appears. |
| Current-user rank window | Live / donation-backed data | Signed-in donor id plus ranked confirmed donors | When the signed-in donor ranks below the top 10, shows a subtle separator followed by five nearby places with the signed-in donor centered as the third row when possible. |
| FLIP-style list reshuffle animation | Live / no data required | DOM positions and current row order | Animates row movement when the tab changes and animations are enabled. |
| Animated donation amounts | Live / no data required | Numeric value passed to `AnimatedNumber` | Counts amounts up when values change; can be disabled through tweaks. Donors with hidden amounts render a private gift label instead of a public total. |
| Initials avatars and medal styling | Live / donation-backed data | Donor names, hue, and rank | Uses generated initials and gradient rings; no real donor photos are present. |
| Donor badge labels | Removed from active UI | Confirmed donor rows still carry an internal badge value | Labels such as Guest donor are not rendered in the leaderboard or share cards right now. |
| Floating Make a Gift CTA | Live / no data required | None | Opens the donation modal when no share or donate modal is active. |
| Donation modal | Live / provider-backed when configured | Modal state, guest identity, entered amount, and `POST /api/donations` | Supports sign-in prompt, amount selection, and one Stripe checkout action. Missing Stripe config is shown as a checkout configuration error. |
| Amount presets | Live / no data required | None | Supports `$25`, `$50`, `$100`, and `$250` choices. |
| Custom donation amount input | Live / no data required | User-entered modal state | Accepts decimal-like numeric input after stripping non-number characters. |
| Guest donor token | Live / local-only data | `localStorage` key `crowned_guest_donor_token` | Creates a stable browser-local donor id for guest gifts. |
| Guest donation display name | Live / local-only data | `localStorage` key `crowned_guest_donor_name` | Required for guest checkout, saved locally, and editable on each signed-out gift. |
| Local donation receipt records | Removed from active checkout flow | `localStorage` helper remains for identity regression coverage | Provider checkout now starts through the backend instead of recording local-only receipts. |
| Stripe checkout creation | Live / provider-backed when configured | `POST /api/donations`, `stripe` package, `STRIPE_SECRET_KEY`, `APP_BASE_URL` | Creates a pending donation and Stripe Checkout Session. Missing Stripe config returns an explicit 503 error. |
| Stripe checkout return sync | Live / provider-backed when configured | `POST /api/donations/:id/sync` and Stripe Checkout Session lookup | After Stripe redirects back with `checkout=success`, verifies the stored session with Stripe, confirms paid donations, refreshes the leaderboard, and clears checkout URL params. |
| Stripe webhook confirmation | Live / provider-backed when configured | `POST /api/stripe/webhook` and server store | Confirms matching pending donations from Stripe webhook events and folds confirmed gifts into leaderboard totals. |
| Stripe webhook signature verification | Live / provider-backed when configured | `stripe` package and `STRIPE_WEBHOOK_SECRET` | Verifies signed Stripe webhook payloads before confirming donations when the webhook secret is configured. |
| Single Stripe checkout button | Live / provider-backed when configured | Stripe checkout endpoint | One "Continue to Stripe" button starts the backend checkout path; Stripe controls available payment methods inside hosted Checkout. |
| Google sign-in button | Live / provider-backed when configured | `GET /api/auth/google/start`, `GET /api/auth/google/callback`, `google-auth-library`, Google OAuth env vars | Starts Google OAuth and creates an HTTP-only `crowned_session` cookie on callback. Missing Google config returns an explicit 503 error. |
| Signed-in donor highlight | Live / provider-backed when configured | `GET /api/session` and OAuth guest-linking state | Highlights the authenticated donor when a valid, unexpired `crowned_session` cookie exists. Guest donations started before Google sign-in can be linked during OAuth callback. |
| Projected rank panel | Live / provider-backed when configured | Authenticated donor id plus current leaderboard totals | Shows current rank, projected rank, projected total, and amount remaining to reach the next rank for the signed-in donor. |
| Share rank modal | Live / donation-backed data | Selected donor and organization name | Opens from podium or row cards and renders a share-card preview. |
| Story and feed share-card formats | Live / donation-backed data | Selected donor and selected format | Supports 9:16 story and 1:1 feed previews. |
| Server share links | Live / backend API | `POST /api/share-links`, `GET /api/share-links/:id` | Persists share records in the server store and returns public `/share/:id` URLs. |
| Public share pages | Live / donation-backed data | `GET /share/:id` | Renders a public donor rank page with share metadata for generated share links. |
| Instagram and Facebook share buttons | Live / provider-backed when configured | Share-link API plus browser share/open APIs | Facebook opens a real sharer URL. Instagram uses native share when available or copies the generated link as a fallback. |
| Save Image action | Live / no data required | Browser SVG-to-canvas export | Generates and downloads a PNG for the selected story/feed format. |
| Copy Link action | Live / backend API | Share-link API plus Clipboard API fallback | Creates a real server share URL and copies it to the clipboard. |
| Toast notifications | Live / no data required | Local component state | Used for refresh, sign-in, payment, and share action feedback. |
| Tweak defaults | Live / no data required | `TWEAK_DEFAULTS` in `src/app.jsx` | Controls organization name, serif font, gold intensity, background darkness, animation toggle, and accent color. |
| Edit-mode tweaks panel | Live / local host integration | Host `postMessage` edit-mode protocol in `src/dev/tweaks-panel.jsx` | Opens only when the embedding host sends edit-mode messages; writes changes back through `__edit_mode_set_keys`. |
| Curated accent and typography controls | Live / no data required | Tweak values | Provides curated color chips, serif font select, sliders, and animation toggle. |
| Responsive mobile layout | Live / no data required | CSS media queries | Converts podium cards to a single column and makes the donate modal full-screen on small viewports. |
| Ambient visual effect atoms | Removed | None | Obsolete `LightRays`, `GoldParticles`, `Confetti`, and `Crown` exports were removed; the current product direction intentionally avoids rays, particles, and confetti. |
| Health checks | Live / no data required | `GET /healthz`, `GET /readyz` | Returns JSON readiness responses with request ids for deployment smoke checks. |
| Admin console | Live / backend API | `GET /admin` plus token-protected admin APIs | Provides a no-build operational console for donor profiles, manual adjustments, period settings, CSV import/export, and expired-session cleanup. |
| Admin donor profiles and privacy | Live / backend API | `GET /api/admin/donors`, `POST /api/admin/donors` with `ADMIN_TOKEN` | Lets admins manage public names, anonymous donors, hidden donors, and amount visibility. Public leaderboard, share cards, and share pages honor these settings. |
| Admin leaderboard periods | Live / backend API | `GET /api/admin/periods`, `POST /api/admin/periods` with `ADMIN_TOKEN` | Lets admins rename and activate/deactivate the all-time and monthly leaderboard periods. Inactive periods are rejected by public leaderboard reads. |
| Admin manual donations | Live / backend API | `POST /api/admin/donations` with `ADMIN_TOKEN` | Creates confirmed manual adjustments through token-protected server APIs with audit notes. |
| Admin CSV import | Live / backend API | `POST /api/admin/import.csv` with `ADMIN_TOKEN` | Imports confirmed manual donation rows from CSV headers `donorId,displayName,amount,note`. |
| Admin donation export | Live / provider-backed when configured | `GET /api/admin/export.csv` with `ADMIN_TOKEN` | Exports all donation records as CSV through a token-protected server API. |
| Expired-session cleanup | Live / backend API | Session expiry plus `POST /api/admin/sessions/cleanup` with `ADMIN_TOKEN` | Google sessions include an expiry timestamp, expired sessions are ignored by `/api/session`, and admins can remove expired sessions and stale OAuth states. |
| Structured request logging | Live / no data required | `src/server/logger.js`, `CROWNED_LOGS=json`, `NODE_ENV=production` | Emits JSON request completion and failure logs in production or when explicitly enabled. |
| Deployment configuration | Live / no data required | `.env.example`, `Dockerfile`, `docs/deployment.md` | Documents required secrets, Stripe/Google setup, Docker execution, health checks, and production storage notes. |

## Current Data Model

- The shipped `DONORS` array in `src/data/leaderboard-core.js` is empty; public leaderboard rows are created only from confirmed server donation records.
- The server exposes `GET /api/leaderboard?period=all|month`, and the browser reads it through `src/services/leaderboard-api.jsx` with a local fallback.
- Server runtime state persists in PostgreSQL when `DATABASE_URL` or `POSTGRES_URL` is configured, with JSON storage as the local fallback for demo use.
- Stripe Checkout, Stripe return reconciliation, Stripe webhooks, and Google OAuth are wired behind provider adapters and require environment variables before live provider calls can succeed.
- Runtime dependencies are installed through `package.json`, including `stripe`, `google-auth-library`, `dotenv`, `cookie`, and `pg`.
- Admin APIs and `/admin` support donor profile/privacy management, period settings, manual confirmed donations, CSV import/export, and expired-session cleanup.
- Guest identities and donation receipts persist only in the current browser through `localStorage` helpers in `src/services/donation-storage.jsx`.
- Confirmed server donations are folded into leaderboard totals through `leaderboardDisplayFor({ donations, donorProfiles })`, with hidden donors excluded and anonymous/private-amount display rules applied before public rendering.
- Share actions create persisted share links, copy real URLs, and export image files.

## Backend Readiness

- `src/data/leaderboard-core.js` owns shared ranking/display helpers for Node and browser use; it no longer ships seeded donor rows.
- `src/services/leaderboard-api.jsx` is the browser API seam for leaderboard reads and should remain the UI entry point as the backend becomes real.
- `src/server/store.js` chooses PostgreSQL when configured and falls back to `src/server/json-store.js` for local runtime persistence.
- `src/server/postgres-store.js` owns PostgreSQL persistence for donations, donor profiles, period settings, sessions, share links, and OAuth linking state.
- `src/server/stripe-provider.js` owns Stripe Checkout Session creation and session lookup for checkout-return reconciliation.
- `src/server/google-auth-provider.js` owns Google OAuth start/callback provider logic.
- `src/server/create-server.js` owns server routing and can be imported directly by tests or future tooling.
- `src/server/http-utils.js` owns shared response, body parsing, MIME, and cookie helpers.
- `src/server/logger.js` owns structured request logging.
- `src/services/provider-api.jsx` is the browser seam for auth, donation checkout, Stripe return sync, and share-link calls.
- `src/services/share-actions.jsx` owns share image export and clipboard behavior.
- `.env.example`, `Dockerfile`, and `docs/deployment.md` describe the production runtime configuration, including optional session lifetime.

## Regression Coverage

- `tests/pastel-luxury-redesign.test.js` covers the current website layout direction, restrained donation copy, donate modal shape, signed-in donor highlighting, guest-donation identity hooks, projected-rank presentation, and private amount labels.
- `tests/leaderboard-api.test.js` covers the read-only leaderboard API payload, period validation, and current-user nearby row window.
- `tests/provider-backed-flows.test.js` covers missing provider configuration errors, Stripe checkout creation, checkout-return reconciliation, webhook confirmation, leaderboard total updates, share-link persistence, Google OAuth callback session creation, and expired session handling.
- `tests/dependency-ready-server.test.js` covers the dependency-ready server structure and runtime dependency declarations.
- `tests/live-readiness.test.js` covers signed Stripe webhooks, admin donor/privacy/period/import/export/cleanup APIs, public share pages, health checks, request ids, admin console controls, and Postgres deployment configuration.
- `tests/rank-projection.test.js` covers rank projection thresholds and the below-top-10 current-user display window.
- `tests/guest-donation-identity.test.js` covers guest token persistence, guest name persistence, and local donation record lookup.
- `tests/no-ios-wrapper.test.js` confirms the obsolete iOS frame is not present.
- `tests/favicon.test.js` confirms the Crowned SVG favicon is linked and present.
