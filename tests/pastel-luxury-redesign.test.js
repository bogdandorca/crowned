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
  donate.includes('Make a Gift') && !donate.includes('Take the Crown'),
  'primary donate CTA should use restrained giving language'
);

console.log('pastel-luxury redesign regression passed');
