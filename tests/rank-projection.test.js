const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const dataPath = path.resolve(__dirname, '..', 'src/data/leaderboard-data.jsx');
const dataSource = fs.readFileSync(dataPath, 'utf8');
const context = {
  window: {},
  console,
  assert,
};

vm.runInNewContext(`${dataSource}

const below = projectedRankForGift({ donorId: 'tudi', tab: 'all', giftAmount: 33300 });
assert.equal(below.currentRank, 2);
assert.equal(below.projectedRank, 2);
assert.equal(below.projectedTotal, 284500);
assert.equal(below.remainingToNext, 1);
assert.equal(below.thresholdToNext, 33301);
assert.equal(below.nextRankLabel, 'No. 1');

const above = projectedRankForGift({ donorId: 'tudi', tab: 'all', giftAmount: 33301 });
assert.equal(above.currentRank, 2);
assert.equal(above.projectedRank, 1);
assert.equal(above.projectedTotal, 284501);
assert.equal(above.remainingToNext, 0);
assert.equal(above.thresholdToNext, 33301);
assert.equal(above.nextRankLabel, 'No. 1');
`, context);

console.log('rank projection regression passed');
