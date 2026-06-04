const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'app.jsx'), 'utf8');
const podium = fs.readFileSync(path.join(root, 'podium.jsx'), 'utf8');
const donate = fs.readFileSync(path.join(root, 'donate.jsx'), 'utf8');

assert(
  app.includes('pastelSurface') && app.includes('blushWash') && app.includes('sageInk'),
  'app shell should expose pastel luxury color tokens'
);
assert(
  !app.includes('980px') && app.includes('pageGutter') && app.includes("width: '100%'"),
  'large-screen layout should use a full-width website shell instead of a narrow centered app canvas'
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
  donate.includes('RankProjectionPanel') && donate.includes("projectedRankForGift({ donorId: 'tudi', tab, giftAmount: amount })"),
  'donation modal should show Tudi projected leaderboard rank for the selected gift amount'
);

console.log('pastel-luxury redesign regression passed');
