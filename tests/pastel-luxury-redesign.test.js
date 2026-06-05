const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'src/app.jsx'), 'utf8');
const podium = fs.readFileSync(path.join(root, 'src/features/leaderboard/podium.jsx'), 'utf8');
const donate = fs.readFileSync(path.join(root, 'src/features/donation/donate.jsx'), 'utf8');
const rows = fs.readFileSync(path.join(root, 'src/features/leaderboard/rows.jsx'), 'utf8');
const atoms = fs.readFileSync(path.join(root, 'src/ui/atoms.jsx'), 'utf8');

assert(
  app.includes('pastelSurface') && app.includes('blushWash') && app.includes('sageInk'),
  'app shell should expose pastel luxury color tokens'
);
assert(
  !app.includes('980px') && app.includes('pageGutter') && app.includes("width: '100%'"),
  'large-screen layout should use a full-width website shell instead of a narrow centered app canvas'
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
  donate.includes('Make a Gift') && !donate.includes('Take the Crown'),
  'primary donate CTA should use restrained giving language'
);
assert(
  donate.includes('PaymentTile label="Credit or debit card"') && !donate.includes('className="share-secondary"\n              style={{ width: \'100%\', height: 50, borderRadius: 14 }}'),
  'credit card payment option should use the same PaymentTile sizing as the other payment buttons'
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
    app.includes("setSignedInDonorId('tudi')") &&
    donate.includes('signedInDonorId') &&
    donate.includes('!signedInDonorId ?') &&
    donate.includes('signedInDonorId &&') &&
    donate.includes("projectedRankForGift({ donorId: signedInDonorId, tab, giftAmount: amount })"),
  'donation modal should replace Google sign-in with projected rank only after mocked Google login'
);
assert(
  app.includes('activeDonorId') &&
    app.includes('activeDonorId={activeDonorId}') &&
    app.includes('onGoogleSignIn={() => setSignedInDonorId') &&
    podium.includes('isActiveDonor') &&
    podium.includes('YouBadge') &&
    rows.includes('isActiveDonor') &&
    rows.includes('YouBadge'),
  'leaderboard should highlight the signed-in donor across podium cards and standing rows'
);
assert(
  app.includes('getOrCreateGuestDonorToken') &&
    app.includes('guestDonorId') &&
    app.includes('guestDonorId={guestDonorId}') &&
    donate.includes('guestDisplayName') &&
    donate.includes('saveGuestDonorName') &&
    donate.includes('recordDonation') &&
    donate.includes('donorId: activeDonorId'),
  'guest donors should receive a token on entry and first donations should be recorded by donor id with a display name'
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
