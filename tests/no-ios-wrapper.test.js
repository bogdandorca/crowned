const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'app.jsx'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const iosFramePath = path.join(root, 'ios-frame.jsx');

assert(
  !app.includes('<IOSDevice'),
  'app.jsx should not render the leaderboard inside IOSDevice'
);
assert(
  !app.includes('</IOSDevice>'),
  'app.jsx should not close an IOSDevice wrapper'
);
assert(
  !html.includes('src="ios-frame.jsx"'),
  'index.html should not load the iOS frame script for the website build'
);
assert(
  !fs.existsSync(iosFramePath),
  'the obsolete iOS frame module should be removed from the website'
);

console.log('no-ios-wrapper regression passed');
