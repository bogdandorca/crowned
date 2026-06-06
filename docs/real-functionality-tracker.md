# Crowned Real Functionality Tracker

Last updated: June 6, 2026

## Purpose

This document tracks the work needed to turn the Crowned donor leaderboard into a real product. The app now has provider-backed payment/auth flows and server persistence, and the public leaderboard starts empty until confirmed gifts are recorded.

Use this tracker as the single checklist for implementation status. Update the status column and task checkboxes whenever a feature moves forward.

## Status Legend

- **Not started**: No implementation exists beyond the current prototype.
- **Planned**: Scope and acceptance criteria are defined, but coding has not started.
- **In progress**: Implementation has started but is not fully verified.
- **Complete**: Feature is implemented, tested, documented, and wired into the app.
- **Blocked**: Waiting on a product, provider, account, credential, or architecture decision.

## Implementation Principles

- Keep the current no-build static frontend until a backend need forces a build or framework change.
- Add backend seams behind small service functions before changing UI behavior.
- Preserve donor-focused language and the existing restrained visual direction.
- Prefer incremental vertical slices that can be tested end to end.
- Update `FEATURES.md` when a feature changes, ships, or is removed.

## Feature Completion Overview

| Area | Target real functionality | Current state | Status | Owner/notes |
|---|---|---|---|---|
| Backend API | Server endpoints for leaderboard reads, donation creation, auth session reads, and share links | Leaderboard, donations, Stripe webhook, Google auth/session, admin, health, and share-link endpoints exist | Complete | Public leaderboard rows are created only from confirmed donations |
| Database | Persistent donors, donation transactions, organizations, leaderboard periods, and share records | PostgreSQL persists donations, share links, sessions, and OAuth states when configured; JSON remains the local fallback | Complete | Uses `DATABASE_URL` or `POSTGRES_URL`; SQLite is not supported |
| Authentication | Real donor sign-in and session state | Google OAuth start/callback and HTTP-only session cookie are wired | Complete | Requires `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `APP_BASE_URL` |
| Payments | Real checkout and payment confirmation | Stripe Checkout creation and signed webhook confirmation are wired | Complete | Requires `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` for live Stripe confirmation |
| Leaderboard totals | Completed gifts update all-time/month totals and rankings | Confirmed server donations are folded into leaderboard totals | Complete | Uses PostgreSQL in production and JSON fallback for local demo mode |
| Refresh | Fetch fresh leaderboard data from server | Refresh button calls the frontend leaderboard API service, then shows a toast | Complete | Returned rows come from confirmed server donations |
| Guest donations | Guest donor identity persists across devices or resolves after checkout | Guest checkout starts server-side Stripe checkout using browser-local donor token/name; Google sign-in can link matching guest donations through OAuth state | Complete | Cross-device linking depends on a donor signing in from the browser that created the guest gift |
| Share images | Export story/feed card to PNG | Browser SVG-to-canvas export downloads PNG files | Complete | Uses generated share art matching the card data |
| Share links | Copyable public rank/donor links | Server share-link API persists share records and returns `/share/:id` URLs | Complete | Public `/share/:id` page rendering and metadata are wired |
| Social sharing | Open platform share flows where supported | Facebook sharer opens, native share is used when available, Instagram falls back to copied link | Complete | Instagram web posting is platform-limited |
| Admin data management | Manage donors, periods, imports, adjustments, and visibility | Token-protected manual donation and CSV export APIs exist | In progress | Donor edit/list, period configuration, visibility controls, and polished UI remain future admin work |
| Observability | Runtime logs/errors for donation and API flows | Structured request completion and failure logs are available in production or with `CROWNED_LOGS=json` | Complete | Responses include `X-Request-Id` for correlation |
| Deployment config | Environment-driven production config | `.env.example`, Dockerfile, deployment docs, runtime dependencies, and health checks are in place | Complete | Production provider accounts and secrets must be supplied outside the repo |

## Recommended Delivery Plan

### Phase 1: Backend Foundation

Goal: create a real persistence and API layer while keeping the existing frontend UI intact.

- [x] Decide storage technology for the first production version.
- [x] Define database schema for donors, donations, sessions, OAuth identities, and share links.
- [x] Add API route conventions to `server.js` or introduce a minimal backend module.
- [x] Implement `GET /api/leaderboard?period=all|month`.
- [x] Implement `POST /api/donations` for server-side donation records.
- [x] Replace direct mocked leaderboard reads behind a frontend data service.
- [x] Add regression tests for ranking using server-returned data.
- [x] Update `FEATURES.md`.

Completion criteria:

- App still serves locally with `npm start`.
- Leaderboard renders from API data instead of hard-coded `DONORS`.
- Tests prove all-time/month ranking, rank deltas, and current-user rank window still work.

### Phase 2: Real Donation Flow

Goal: make a completed gift create a durable donation record and update the leaderboard.

- [x] Pick payment provider and checkout style.
- [x] Add server-side checkout/session creation endpoint.
- [x] Add webhook endpoint for confirmed payments.
- [x] Persist confirmed donation records only from trusted server/payment events.
- [x] Update donation modal to call the checkout endpoint.
- [x] Show processing, success, failure, and retry states.
- [x] Fold confirmed donations into leaderboard totals.
- [x] Add tests for amount validation, checkout creation, webhook confirmation, and leaderboard updates.
- [x] Update `FEATURES.md`.

Completion criteria:

- Prototype payment toasts are gone from the real payment path.
- Confirmed gifts survive page reloads.
- A completed gift can change projected and actual rank.

### Phase 3: Real Authentication And Donor Identity

Goal: replace mocked Google sign-in with a real donor identity model.

- [x] Pick auth provider and sign-in methods.
- [x] Add server session endpoint.
- [x] Map auth identities to donor profiles.
- [x] Replace hard-coded `signedInDonorId`.
- [x] Preserve guest checkout for donors who do not sign in.
- [x] Add account-linking behavior for guest donations after sign-in.
- [x] Add signed-in, signed-out, and auth-error tests.
- [ ] Add expired-session cleanup tests.
- [x] Update `FEATURES.md`.

Completion criteria:

- Signed-in donor highlight and rank projection use the authenticated donor.
- Google sign-in button no longer sets a hard-coded donor id.
- Guest donors have a clear path to attach gifts to a real profile.

### Phase 4: Sharing And Export

Goal: make share-card actions produce real output.

- [x] Implement client-side PNG export for story and feed formats.
- [x] Add real Save Image / Download Image behavior with fallback copy.
- [x] Generate stable share URLs for donors/ranks.
- [x] Implement Copy Link with the Clipboard API and fallback state.
- [x] Open supported social share URLs or native share sheet where available.
- [x] Add tests for share-card rendering inputs and action fallbacks.
- [x] Update `FEATURES.md`.

Completion criteria:

- Save Image produces an actual image file.
- Copy Link copies a usable URL.
- Social buttons either open a real supported flow or clearly fall back to download/copy.

### Phase 5: Admin And Data Operations

Goal: let an organization maintain leaderboard data without editing source code.

- [ ] Define the minimum admin role and permissions.
- [ ] Add donor create/edit/list workflow.
- [ ] Add manual donation adjustment workflow with audit fields.
- [ ] Add leaderboard period configuration.
- [ ] Add donor visibility/anonymity controls.
- [ ] Add CSV import/export if needed.
- [ ] Add tests for admin validation and permission boundaries.
- [ ] Update `FEATURES.md`.

Completion criteria:

- A non-developer can manage donor records and leaderboard periods.
- Manual adjustments are auditable.
- Public leaderboard output reflects admin changes after refresh.

### Phase 6: Production Hardening

Goal: make the app deployable and supportable.

- [x] Add environment configuration for API base URL, payment keys, auth keys, and public app URL.
- [x] Add structured server logging for API/payment/auth failures.
- [x] Add error responses that do not leak secrets.
- [x] Add smoke tests for the public app and API health.
- [x] Document production deployment.
- [x] Update `FEATURES.md`.

Completion criteria:

- A clean clone can be configured from documented environment variables.
- Health checks and smoke tests catch obvious deployment failures.
- Sensitive keys are not committed or exposed to the browser.

## Immediate Next Plan

The first implementation plan should be **Phase 1: Backend Foundation** because payments, auth, refresh, and share links all need persistent server data.

Suggested first vertical slice:

- [x] Add a small API module while preserving the static server.
- [x] Move leaderboard reads behind `GET /api/leaderboard`.
- [x] Add a frontend fetch service with a mocked-data fallback for local resilience.
- [x] Keep all current UI components unchanged except their data source.
- [x] Run focused Node regression tests and add API-level tests.

## Open Decisions

These choices block precise implementation details:

- [x] Database: PostgreSQL for production, with JSON fallback for local demo mode.
- [x] Auth provider: Google OAuth directly, Auth.js, Clerk, Supabase Auth, or another provider.
- [x] Payment provider: Stripe, PayPal, donor-platform integration, or a custom processor.
- [x] Deployment target: single Node service, static host plus API service, or managed full-stack host.
- [ ] Public donor privacy rules: full names, initials, anonymous donors, opt-out, or amount hiding.

## Tracking Rules

- Mark a feature **Complete** only after implementation, tests, and `FEATURES.md` updates are done.
- If work starts but cannot ship because of credentials/provider setup, mark it **Blocked** and note the exact dependency.
- Keep prototype-only behavior visible in this document until it is removed or replaced.
- Add new rows when a real product requirement appears that is not covered by the overview table.
