const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const faviconPath = path.join(root, 'favicon.svg');

assert(
  html.includes('<link rel="icon" type="image/svg+xml" href="/favicon.svg" />'),
  'index.html should link the Crowned SVG favicon'
);
assert(
  fs.existsSync(faviconPath),
  'favicon.svg should exist at the site root'
);

const favicon = fs.readFileSync(faviconPath, 'utf8');
assert(
  favicon.includes('Crowned favicon') && favicon.includes('>C<') && favicon.includes('#fbf7f0') && favicon.includes('#695126'),
  'favicon.svg should use the page C mark colors and letter'
);

console.log('favicon regression passed');
