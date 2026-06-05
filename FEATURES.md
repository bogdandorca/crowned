# Crowned Features

Last reviewed: June 5, 2026

## Status Legend

- **Live / mocked data**: Feature is visible and functional, but uses hard-coded donor data from `src/data/leaderboard-data.jsx`.
- **Live / local-only data**: Feature stores or reads browser-local state, usually `localStorage`, with no backend sync.
- **Live / no data required**: Feature is present and does not need application data.
- **Prototype / toast-only**: Feature has a UI affordance but does not perform the real external action yet.
- **Removed**: Feature or utility code was intentionally removed from the active app.

## Feature Inventory

| Feature | Status | Data Source | Notes |
|---|---|---|---|
| Static Crowned website shell | Live / no data required | None | Served by `server.js` on port `8765`; browser loads React, ReactDOM, Babel, and local JSX modules from `src/` directly. |
| Full-width pastel donor leaderboard layout | Live / mocked data | Hard-coded donor rows in `DONORS` | Current presentation is a refined website layout, not the obsolete iOS device wrapper. |
| SVG favicon and browser title | Live / no data required | None | Uses the root `favicon.svg` and the Crowned donor leaderboard page title. |
| Sticky brand header | Live / mocked data | Tweak defaults plus selected tab | Shows the organization wordmark, donor leaderboard label, season text, and refresh button. |
| Refresh leaderboard button | Prototype / toast-only | None | Displays a "Leaderboard refreshed" toast; it does not fetch fresh data. |
| All Time / This Month tab switch | Live / mocked data | `allTime` and `thisMonth` fields in `DONORS` | Re-sorts the same donor pool by the selected total and changes season copy. |
| Rank delta indicators | Live / mocked data | Derived from the two mocked leaderboard orderings | Shows movement relative to the other tab's ranking. |
| Leading patron hero | Live / mocked data | Top donor from `rankedFor(tab)` | Highlights the current first-place donor with name and animated amount. |
| Top-three podium cards | Live / mocked data | Top three donors from `rankedFor(tab)` | Shows rank, initials avatar, medal ring, badge, animated amount, share button, and optional "You" state. |
| Full standings list | Live / mocked data | Remaining donors from `rankedFor(tab)` | Shows positions 4-10 with initials avatar, badge, amount, rank delta, share button, and optional "You" state. |
| FLIP-style list reshuffle animation | Live / no data required | DOM positions and current row order | Animates row movement when the tab changes and animations are enabled. |
| Animated donation amounts | Live / no data required | Numeric value passed to `AnimatedNumber` | Counts amounts up when values change; can be disabled through tweaks. |
| Initials avatars and medal styling | Live / mocked data | Donor names, hue, and rank | Uses generated initials and gradient rings; no real donor photos are present. |
| Donor badge labels | Live / mocked data | `badge` field in `DONORS` | Labels such as Founding Donor, Visionary Circle, and Patron are hard-coded. |
| Floating Make a Gift CTA | Live / no data required | None | Opens the donation modal when no share or donate modal is active. |
| Donation modal | Live / local-only data | Modal state, guest identity, and entered amount | Supports sign-in prompt, amount selection, payment method tiles, and local donation recording. |
| Amount presets | Live / no data required | None | Supports `$25`, `$50`, `$100`, and `$250` choices. |
| Custom donation amount input | Live / no data required | User-entered modal state | Accepts decimal-like numeric input after stripping non-number characters. |
| Guest donor token | Live / local-only data | `localStorage` key `crowned_guest_donor_token` | Creates a stable browser-local donor id for guest gifts. |
| Guest donation display name | Live / local-only data | `localStorage` key `crowned_guest_donor_name` | Required for the first guest gift; saved locally for later guest gifts. |
| Local donation receipt records | Live / local-only data | `localStorage` key `crowned_donation_records` | Records donor id, display name, amount, method, and timestamp. These records do not update leaderboard totals yet. |
| Payment method tiles | Prototype / toast-only | Local modal state | Apple Pay, Google Pay, PayPal, and card buttons record a local receipt and show a toast; no real processor is connected. |
| Google sign-in button | Prototype / mocked data | Hard-coded donor id `tudi` | Clicking "Continue with Google" signs the user in as Tudi locally; no OAuth provider is connected. |
| Signed-in donor highlight | Live / mocked data | Hard-coded signed-in donor id `tudi` | Highlights the matching podium card or row with a "You" badge after mocked Google sign-in. |
| Projected rank panel | Live / mocked data | Mocked leaderboard totals plus current gift amount | Shows current rank, projected rank, projected total, and amount remaining to reach the next rank for signed-in donor Tudi. |
| Share rank modal | Live / mocked data | Selected donor and organization name | Opens from podium or row cards and renders a share-card preview. |
| Story and feed share-card formats | Live / mocked data | Selected donor and selected format | Supports 9:16 story and 1:1 feed previews. |
| Instagram and Facebook share buttons | Prototype / toast-only | None | Buttons show an "Opening..." toast only; they do not launch native sharing or platform URLs. |
| Save Image action | Prototype / toast-only | None | Shows a "Saved to Photos" toast; no image export is generated yet. |
| Copy Link action | Prototype / toast-only | None | Shows a "Link copied" toast; no real share URL is generated yet. |
| Toast notifications | Live / no data required | Local component state | Used for refresh, sign-in, payment, and share action feedback. |
| Tweak defaults | Live / no data required | `TWEAK_DEFAULTS` in `src/app.jsx` | Controls organization name, serif font, gold intensity, background darkness, animation toggle, and accent color. |
| Edit-mode tweaks panel | Live / local host integration | Host `postMessage` edit-mode protocol in `src/dev/tweaks-panel.jsx` | Opens only when the embedding host sends edit-mode messages; writes changes back through `__edit_mode_set_keys`. |
| Curated accent and typography controls | Live / no data required | Tweak values | Provides curated color chips, serif font select, sliders, and animation toggle. |
| Responsive mobile layout | Live / no data required | CSS media queries | Converts podium cards to a single column and makes the donate modal full-screen on small viewports. |
| Ambient visual effect atoms | Removed | None | Obsolete `LightRays`, `GoldParticles`, `Confetti`, and `Crown` exports were removed; the current product direction intentionally avoids rays, particles, and confetti. |

## Current Data Model

- The leaderboard is backed by the hard-coded `DONORS` array in `src/data/leaderboard-data.jsx`.
- There is no backend API, database, donor import, payment processor, or real authentication provider.
- Guest identities and donation receipts persist only in the current browser through `localStorage` helpers in `src/services/donation-storage.jsx`.
- Local donation receipts are not folded into `DONORS` in `src/data/leaderboard-data.jsx`, so completed mock gifts do not change leaderboard rank or totals.
- Share actions and refresh actions are currently UI feedback only.

## Backend Readiness

- `src/data/leaderboard-data.jsx` is the current mocked leaderboard provider and is the primary future API replacement seam.
- `src/services/donation-storage.jsx` owns browser-local guest identity and receipt persistence until a backend donor/donation API exists.
- `src/features/donation/donate.jsx` still uses mocked payment actions and should later call a real checkout service.
- `signedInDonorId` in `src/app.jsx` remains the app-level identity seam for replacing mocked Google sign-in.
- Share actions in `src/features/share/share-card.jsx` remain toast-only until export/link generation exists.

## Regression Coverage

- `tests/pastel-luxury-redesign.test.js` covers the current website layout direction, restrained donation copy, donate modal shape, signed-in donor highlighting, guest-donation identity hooks, and projected-rank presentation.
- `tests/rank-projection.test.js` covers rank projection thresholds.
- `tests/guest-donation-identity.test.js` covers guest token persistence, guest name persistence, and local donation record lookup.
- `tests/no-ios-wrapper.test.js` confirms the obsolete iOS frame is not present.
- `tests/favicon.test.js` confirms the Crowned SVG favicon is linked and present.
