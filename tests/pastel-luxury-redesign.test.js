const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'src/app.jsx'), 'utf8');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const podium = fs.readFileSync(path.join(root, 'src/features/leaderboard/podium.jsx'), 'utf8');
const donate = fs.readFileSync(path.join(root, 'src/features/donation/donate.jsx'), 'utf8');
const rows = fs.readFileSync(path.join(root, 'src/features/leaderboard/rows.jsx'), 'utf8');
const share = fs.readFileSync(path.join(root, 'src/features/share/share-card.jsx'), 'utf8');
const atoms = fs.readFileSync(path.join(root, 'src/ui/atoms.jsx'), 'utf8');
const leaderboardServicePath = path.join(root, 'src/services/leaderboard-api.jsx');
const leaderboardService = fs.existsSync(leaderboardServicePath)
  ? fs.readFileSync(leaderboardServicePath, 'utf8')
  : '';
const providerServicePath = path.join(root, 'src/services/provider-api.jsx');
const providerService = fs.existsSync(providerServicePath)
  ? fs.readFileSync(providerServicePath, 'utf8')
  : '';
const shareActionsPath = path.join(root, 'src/services/share-actions.jsx');
const shareActions = fs.existsSync(shareActionsPath)
  ? fs.readFileSync(shareActionsPath, 'utf8')
  : '';

assert(
  app.includes('pastelSurface') && app.includes('blushWash') && app.includes('sageInk'),
  'app shell should expose pastel luxury color tokens'
);
assert(
  !app.includes('980px') && app.includes('pageGutter') && app.includes("width: '100%'"),
  'large-screen layout should use a full-width website shell instead of a narrow centered app canvas'
);
assert(
  app.includes('contentMaxWidth') &&
    app.includes("maxWidth: contentMaxWidth") &&
    app.includes('contentShellStyle'),
  'large-screen leaderboard content should be constrained so list names and amounts stay visually connected'
);
assert(
    app.includes('function EmptyLeaderboard') &&
    app.includes('hasLeaderboardRows') &&
    app.includes('No gifts yet') &&
    app.includes('The first confirmed gift will open the standings.'),
  'fresh leaderboards should render an empty state instead of blank mocked donor rows'
);
assert(
  app.includes('headerBleed') &&
    app.includes('marginLeft: headerBleed') &&
    app.includes('paddingLeft: pageGutter') &&
    app.includes('site-header-inner'),
  'sticky header background should span the full page width while centering its content'
);
assert(
  !app.includes('<GoldParticles') && !app.includes('<Confetti'),
  'main page should not render casino-style particles or confetti'
);
assert(
  !podium.includes('<LightRays') && !podium.includes('pedestal base') && !podium.includes('shimmer-sweep'),
  'podium should use quiet patron cards, not rays, pedestals, or shimmer'
);
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
assert(
  podium.includes("justifyContent: 'flex-start'") && podium.includes("marginTop: 'auto'"),
  'top-three patron cards should keep names near the top and only push the footer to the bottom'
);
assert(
  podium.includes('patron-card-avatar') && podium.includes("position: 'absolute'") && podium.includes('paddingRight'),
  'top-three card avatar should not create vertical space between rank label and donor name'
);
assert(
  !podium.includes('<Badge label={donor.badge}') &&
    !rows.includes('{donor.badge}') &&
    !share.includes('<Badge label={donor.badge}'),
  'donor badge subtitles should not render in podium, standing rows, or share cards'
);
assert(
  donate.includes('Make a Gift') && !donate.includes('Take the Crown'),
  'primary donate CTA should use restrained giving language'
);
assert(
  donate.includes('Continue to Stripe') &&
    donate.includes("handlePay('Stripe')") &&
    !donate.includes('function PaymentTile') &&
    !donate.includes('ApplePayGlyph') &&
    !donate.includes('GPayGlyph') &&
    !donate.includes('PayPalGlyph') &&
    !donate.includes('Credit or debit card'),
  'donation modal should expose one Stripe checkout button instead of separate wallet/card payment tiles'
);
assert(
  donate.includes('donate-overlay') &&
    donate.includes('donate-modal-panel') &&
    donate.includes("maxHeight: 'min(760px, calc(100vh - 64px))'") &&
    donate.includes('boxShadow:') &&
    donate.includes('borderRadius: 22'),
  'desktop donate modal should be a contained dialog rather than a full-height sheet'
);
assert(
  app.includes('signedInDonorId') &&
    app.includes('loadAuthSession') &&
    !app.includes("useState('tudi')") &&
    !app.includes("setSignedInDonorId('tudi')") &&
    donate.includes('signedInDonorId') &&
    donate.includes('!signedInDonorId ?') &&
    donate.includes('signedInDonorId &&') &&
    donate.includes("projectedRankForGift({ donorId: signedInDonorId, tab, giftAmount: amount })"),
  'donation modal should use the real signed-in donor session for projected rank'
);
assert(
  app.includes('activeDonorId') &&
    app.includes('activeDonorId={activeDonorId}') &&
    app.includes('setSignedInDonorId(session.donor.id)') &&
    podium.includes('isActiveDonor') &&
    podium.includes('YouBadge') &&
    rows.includes('isActiveDonor') &&
    rows.includes('RowYouBadge'),
  'leaderboard should highlight the signed-in donor across podium cards and standing rows'
);
assert(
  app.includes('loadLeaderboardDisplay({ donorId: activeDonorId, tab })') &&
    app.includes('refreshLeaderboard') &&
    leaderboardService.includes('function loadLeaderboardDisplay') &&
    leaderboardService.includes('/api/leaderboard?') &&
    app.includes('nearbyRows={nearbyRows}') &&
    rows.includes('function StandingsSeparator') &&
    rows.includes('nearbyRows.length > 0') &&
    rows.includes('<StandingsSeparator />'),
  'leaderboard should load through the API service and add a separated nearby row window when the signed-in donor is below the top 10'
);
assert(
  podium.includes('function YouBadge') &&
    rows.includes('function RowYouBadge') &&
    rows.includes('<RowYouBadge />') &&
    !rows.includes('function YouBadge') &&
    !rows.includes('LeaderRow, LeaderList, YouBadge'),
  'row and podium active donor badges should not collide as browser globals'
);
assert(
  app.includes('getOrCreateGuestDonorToken') &&
    app.includes('guestDonorId') &&
    app.includes('guestDonorId={guestDonorId}') &&
    donate.includes('guestDisplayName') &&
    donate.includes('saveGuestDonorName') &&
    donate.includes('saveGuestDonorName(guestName)') &&
    donate.includes('value={pendingGuestName}') &&
    !donate.includes('!guestDisplayName &&') &&
    donate.includes('createDonationCheckout') &&
    donate.includes('donorId: activeDonorId'),
  'guest donors should receive a token and keep an editable checkout display name'
);
assert(
  providerService.includes('function startGoogleSignIn') &&
    providerService.includes('/api/auth/google/start') &&
    providerService.includes('function createDonationCheckout') &&
    providerService.includes('/api/donations') &&
    providerService.includes('function syncDonationCheckout') &&
    providerService.includes('/sync') &&
    donate.includes('createDonationCheckout') &&
    donate.includes('window.location.assign') &&
    donate.includes('startGoogleSignIn({ guestDonorId })'),
  'donation modal should use provider-backed Google sign-in and Stripe checkout APIs'
);
assert(
  app.includes('syncDonationCheckout') &&
    app.includes("checkoutStatus === 'success'") &&
    app.includes('window.history.replaceState') &&
    app.includes('Gift confirmed'),
  'app should reconcile successful Stripe returns and clear checkout query params'
);
assert(
  !app.includes('Signed in with Google as Tudi') &&
    !donate.includes('Signed in with Google as Tudi') &&
    !providerService.includes('Signed in with Google as Tudi') &&
    !app.includes("setSignedInDonorId('tudi')") &&
    !app.includes("toast(`Signed in with Google as"),
  'Google sign-in should not use the obsolete mocked Tudi toast path'
);
assert(
  index.includes('src/app.jsx?v=') &&
    index.includes('src/features/donation/donate.jsx?v=') &&
    index.includes('src/services/provider-api.jsx?v='),
  'local browser-loaded modules should be cache-busted so stale mocked auth code is not reused'
);
assert(
  providerService.includes('function createShareLink') &&
    providerService.includes('/api/share-links') &&
    shareActions.includes('function downloadShareImage') &&
    shareActions.includes('canvas.toBlob') &&
    shareActions.includes('function copyShareLink') &&
    share.includes('createShareLink') &&
    share.includes('downloadShareImage') &&
    share.includes('copyShareLink'),
  'share modal should create real share links, copy them, and export image files'
);
assert(
  !donate.includes('You move to') &&
    !donate.includes('You stay at') &&
    donate.includes('rankNumberStyle') &&
    donate.includes('fontSize: 42') &&
    donate.includes('After gift'),
  'projected rank panel should use large rank numbers and avoid redundant movement copy'
);

console.log('pastel-luxury redesign regression passed');
