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
  const DONORS = [
    { id: 'andrei',    first: 'Andrei',    last: 'Popa',       badge: 'Founding Donor',   hue: 38,  allTime: 100, thisMonth: 60 },
    { id: 'marina',    first: 'Marina',    last: 'Ionescu',    badge: 'Visionary Circle', hue: 204, allTime: 94,  thisMonth: 48 },
    { id: 'oliver',    first: 'Oliver',    last: 'Popa',       badge: 'Legacy Circle',    hue: 286, allTime: 88,  thisMonth: 84 },
    { id: 'priya',     first: 'Priya',     last: 'Raghunathan',badge: 'Platinum Patron',  hue: 162, allTime: 82,  thisMonth: 72 },
    { id: 'sebastian', first: 'Sebastian', last: 'Cole',       badge: 'Gold Benefactor',  hue: 18,  allTime: 76,  thisMonth: 24 },
    { id: 'isabella',  first: 'Isabella',  last: 'Moreau',     badge: 'Cornerstone',      hue: 332, allTime: 70,  thisMonth: 12 },
    { id: 'theodore',  first: 'Theodore',  last: 'Lindqvist',  badge: 'Diamond Guild',    hue: 198, allTime: 64,  thisMonth: 6  },
    { id: 'aisha',     first: 'Aisha',     last: 'Okonkwo',    badge: 'Monthly Champion', hue: 96,  allTime: 58,  thisMonth: 100 },
    { id: 'rafael',    first: 'Rafael',    last: 'Santos',     badge: 'Patron',           hue: 254, allTime: 52,  thisMonth: 78 },
    { id: 'hana',      first: 'Hana',      last: 'Fujimoto',   badge: 'Rising Star',      hue: 8,   allTime: 46,  thisMonth: 90 },
    { id: 'lena',      first: 'Lena',      last: 'Weiss',      badge: 'Patron',           hue: 124, allTime: 40,  thisMonth: 54 },
    { id: 'samir',     first: 'Samir',     last: 'Nassar',     badge: 'Patron',           hue: 232, allTime: 34,  thisMonth: 36 },
    { id: 'tudi',      first: 'Tudi',      last: '',           badge: 'Steward Circle',   hue: 212, allTime: 28,  thisMonth: 96 },
    { id: 'eleanor',   first: 'Eleanor',   last: 'Hart',       badge: 'Sustaining Patron',hue: 44,  allTime: 22,  thisMonth: 30 },
    { id: 'noah',      first: 'Noah',      last: 'Kim',        badge: 'Patron',           hue: 176, allTime: 16,  thisMonth: 66 },
    { id: 'camille',   first: 'Camille',   last: 'Dubois',     badge: 'Supporter',        hue: 314, allTime: 10,  thisMonth: 42 },
    { id: 'mateo',     first: 'Mateo',     last: 'Rivera',     badge: 'Supporter',        hue: 24,  allTime: 4,   thisMonth: 18 },
  ];

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
