const assert = require('assert');
const path = require('path');

const {
  DONORS,
  projectedRankForGift,
  leaderboardDisplayFor,
} = require(path.resolve(__dirname, '..', 'src/data/leaderboard-core.js'));

const paidDonations = [
  ['andrei', 'Andrei Popa', 100],
  ['marina', 'Marina Ionescu', 94],
  ['oliver', 'Oliver Popa', 88],
  ['priya', 'Priya Raghunathan', 82],
  ['sebastian', 'Sebastian Cole', 76],
  ['isabella', 'Isabella Moreau', 70],
  ['theodore', 'Theodore Lindqvist', 64],
  ['aisha', 'Aisha Okonkwo', 58],
  ['rafael', 'Rafael Santos', 52],
  ['hana', 'Hana Fujimoto', 46],
  ['lena', 'Lena Weiss', 40],
  ['samir', 'Samir Nassar', 34],
  ['tudi', 'Tudi', 28],
  ['eleanor', 'Eleanor Hart', 22],
  ['noah', 'Noah Kim', 16],
  ['camille', 'Camille Dubois', 10],
  ['mateo', 'Mateo Rivera', 4],
].map(([donorId, displayName, amount], index) => ({
  id: `donation_${index + 1}`,
  donorId,
  displayName,
  amount,
  status: 'confirmed',
}));

assert.equal(DONORS.length, 0, 'leaderboard should not ship with seeded test donors');

const emptyDisplay = leaderboardDisplayFor({ donorId: 'tudi', tab: 'all' });
assert.deepEqual(emptyDisplay.ranked, []);
assert.deepEqual(emptyDisplay.topRows, []);
assert.deepEqual(emptyDisplay.nearbyRows, []);

const below = projectedRankForGift({ donorId: 'marina', tab: 'all', giftAmount: 6, donations: paidDonations });
assert.equal(below.currentRank, 2);
assert.equal(below.projectedRank, 2);
assert.equal(below.projectedTotal, 100);
assert.equal(below.remainingToNext, 1);
assert.equal(below.thresholdToNext, 7);
assert.equal(below.nextRankLabel, 'No. 1');

const above = projectedRankForGift({ donorId: 'marina', tab: 'all', giftAmount: 7, donations: paidDonations });
assert.equal(above.currentRank, 2);
assert.equal(above.projectedRank, 1);
assert.equal(above.projectedTotal, 101);
assert.equal(above.remainingToNext, 0);
assert.equal(above.thresholdToNext, 7);
assert.equal(above.nextRankLabel, 'No. 1');

const display = leaderboardDisplayFor({ donorId: 'tudi', tab: 'all', donations: paidDonations });
assert.deepEqual(display.topRows.map(d => d.rank), [4, 5, 6, 7, 8, 9, 10]);
assert.equal(display.shouldShowNearby, true);
assert.equal(display.nearbyRows.length, 5);
assert.equal(display.nearbyRows[2].id, 'tudi');
assert.equal(display.nearbyRows[2].rank > 10, true);

const topTenDisplay = leaderboardDisplayFor({ donorId: 'andrei', tab: 'all', donations: paidDonations });
assert.equal(topTenDisplay.shouldShowNearby, false);
assert.equal(topTenDisplay.nearbyRows.length, 0);

console.log('rank projection regression passed');
