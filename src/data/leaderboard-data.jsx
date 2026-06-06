// Crowned - browser globals for shared leaderboard data + ranking helpers

const {
  DONORS,
  donorsWithDonations,
  fullName,
  initials,
  fmtMoney,
  rankedFor,
  projectedRankForGift,
  leaderboardDisplayFor,
} = window.CrownedLeaderboardCore;

Object.assign(window, {
  DONORS,
  donorsWithDonations,
  fullName,
  initials,
  fmtMoney,
  rankedFor,
  projectedRankForGift,
  leaderboardDisplayFor,
});
