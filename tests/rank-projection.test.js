const assert = require('assert');
const path = require('path');

const {
  DONORS,
  projectedRankForGift,
  leaderboardDisplayFor,
} = require(path.resolve(__dirname, '..', 'src/data/leaderboard-core.js'));

DONORS.forEach((donor) => {
  assert(
    donor.allTime >= 1 && donor.allTime <= 100,
    `${donor.id} all-time test amount should be between $1 and $100`
  );
  assert(
    donor.thisMonth >= 1 && donor.thisMonth <= 100,
    `${donor.id} monthly test amount should be between $1 and $100`
  );
});

const below = projectedRankForGift({ donorId: 'marina', tab: 'all', giftAmount: 6 });
assert.equal(below.currentRank, 2);
assert.equal(below.projectedRank, 2);
assert.equal(below.projectedTotal, 100);
assert.equal(below.remainingToNext, 1);
assert.equal(below.thresholdToNext, 7);
assert.equal(below.nextRankLabel, 'No. 1');

const above = projectedRankForGift({ donorId: 'marina', tab: 'all', giftAmount: 7 });
assert.equal(above.currentRank, 2);
assert.equal(above.projectedRank, 1);
assert.equal(above.projectedTotal, 101);
assert.equal(above.remainingToNext, 0);
assert.equal(above.thresholdToNext, 7);
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

console.log('rank projection regression passed');
