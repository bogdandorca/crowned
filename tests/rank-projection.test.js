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

const below = projectedRankForGift({ donorId: 'marina', tab: 'all', giftAmount: 16500 });
assert.equal(below.currentRank, 2);
assert.equal(below.projectedRank, 2);
assert.equal(below.projectedTotal, 284500);
assert.equal(below.remainingToNext, 1);
assert.equal(below.thresholdToNext, 16501);
assert.equal(below.nextRankLabel, 'No. 1');

const above = projectedRankForGift({ donorId: 'marina', tab: 'all', giftAmount: 16501 });
assert.equal(above.currentRank, 2);
assert.equal(above.projectedRank, 1);
assert.equal(above.projectedTotal, 284501);
assert.equal(above.remainingToNext, 0);
assert.equal(above.thresholdToNext, 16501);
assert.equal(above.nextRankLabel, 'No. 1');

const display = leaderboardDisplayFor({ donorId: 'tudi', tab: 'all' });
assert.deepEqual(display.topRows.map(d => d.rank), [4, 5, 6, 7, 8, 9, 10]);
assert.equal(display.shouldShowNearby, true);
assert.equal(display.nearbyRows.length, 5);
assert.equal(display.nearbyRows[2].id, 'tudi');
assert.equal(display.nearbyRows[2].rank > 10, true);

const topTenDisplay = leaderboardDisplayFor({ donorId: 'andrei', tab: 'all' });
assert.equal(topTenDisplay.shouldShowNearby, false);
assert.equal(topTenDisplay.nearbyRows.length, 0);
`, context);

console.log('rank projection regression passed');
