// Crowned - shared donor data and ranking helpers

(function initLeaderboardCore(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.CrownedLeaderboardCore = api;
  }
})(typeof window !== 'undefined' ? window : globalThis, function createLeaderboardCore() {
  const DONORS = [];

  function fullName(d) { return d.last ? d.first + ' ' + d.last : d.first; }
  function initials(d) { return ((d.first[0] || '') + (d.last[0] || d.first[1] || '')).toUpperCase(); }

  function fmtMoney(n) {
    return '$' + Math.round(n).toLocaleString('en-US');
  }

  function donorsWithDonations(donations = []) {
    const donorMap = new Map(DONORS.map(donor => [donor.id, { ...donor }]));
    donations
      .filter(donation => donation && donation.status === 'confirmed')
      .forEach((donation) => {
        const donorId = String(donation.donorId || '').trim();
        if (!donorId) return;
        const amount = Math.max(0, Number(donation.amount) || 0);
        const existing = donorMap.get(donorId);
        if (existing) {
          existing.allTime += amount;
          existing.thisMonth += amount;
          return;
        }
        const displayName = String(donation.displayName || 'Guest donor').trim();
        const parts = displayName.split(/\s+/);
        donorMap.set(donorId, {
          id: donorId,
          first: parts[0] || 'Guest',
          last: parts.slice(1).join(' '),
          badge: 'Guest donor',
          hue: 146,
          allTime: amount,
          thisMonth: amount,
        });
      });
    return Array.from(donorMap.values());
  }

  function rankedFor(tab, options = {}) {
    const donors = donorsWithDonations(options.donations || []);
    const key = tab === 'month' ? 'thisMonth' : 'allTime';
    const otherKey = tab === 'month' ? 'allTime' : 'thisMonth';

    const order = (k) => [...donors].sort((a, b) => b[k] - a[k]).map(d => d.id);
    const thisOrder = order(key);
    const otherOrder = order(otherKey);
    const otherRankOf = {};
    otherOrder.forEach((id, i) => { otherRankOf[id] = i + 1; });

    return thisOrder.map((id, i) => {
      const d = donors.find(x => x.id === id);
      const rank = i + 1;
      const delta = otherRankOf[id] - rank;
      return { ...d, rank, amount: d[key], delta };
    });
  }

  function projectedRankForGift({ donorId, tab = 'all', giftAmount = 0, donations = [] }) {
    const gift = Math.max(0, Number(giftAmount) || 0);
    const ranked = rankedFor(tab, { donations });
    const donor = ranked.find(d => d.id === donorId);
    if (!donor) return null;

    const projectedTotal = donor.amount + gift;
    const ahead = ranked.filter(d => d.id !== donorId && d.amount >= projectedTotal);
    const projectedRank = ahead.length + 1;
    const next = ranked.find(d => d.rank === donor.rank - 1) || null;
    const thresholdToNext = next ? Math.max(0, next.amount - donor.amount + 1) : 0;
    const remainingToNext = Math.max(0, thresholdToNext - gift);

    return {
      donor,
      currentRank: donor.rank,
      projectedRank,
      currentTotal: donor.amount,
      projectedTotal,
      giftAmount: gift,
      thresholdToNext,
      remainingToNext,
      nextRankLabel: next ? `No. ${next.rank}` : `No. ${donor.rank}`,
    };
  }

  function leaderboardDisplayFor({ donorId, tab = 'all', topLimit = 10, windowSize = 5, donations = [] }) {
    const ranked = rankedFor(tab, { donations });
    const topRows = ranked.filter(d => d.rank > 3 && d.rank <= topLimit);
    const activeIndex = ranked.findIndex(d => d.id === donorId);
    const shouldShowNearby = activeIndex >= topLimit;

    if (!shouldShowNearby) {
      return { ranked, topRows, nearbyRows: [], shouldShowNearby };
    }

    const preferredStart = activeIndex - 2;
    const maxStart = Math.max(0, ranked.length - windowSize);
    const start = Math.max(0, Math.min(preferredStart, maxStart));
    const nearbyRows = ranked.slice(start, start + windowSize);

    return { ranked, topRows, nearbyRows, shouldShowNearby };
  }

  return {
    DONORS,
    donorsWithDonations,
    fullName,
    initials,
    fmtMoney,
    rankedFor,
    projectedRankForGift,
    leaderboardDisplayFor,
  };
});
