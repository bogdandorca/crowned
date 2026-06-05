// Crowned - mocked leaderboard data + ranking helpers

// A single pool of 10 donors. Each tab ranks all of them by a different
// amount, producing a genuine reshuffle.
const DONORS = [
  { id: 'andrei',    first: 'Andrei',    last: 'Popa',       badge: 'Founding Donor',   hue: 38,  allTime: 284500, thisMonth: 17500 },
  { id: 'tudi',      first: 'Tudi',      last: '',           badge: 'Visionary Circle', hue: 212, allTime: 251200, thisMonth: 38400 },
  { id: 'oliver',    first: 'Oliver',    last: 'Popa',       badge: 'Legacy Circle',    hue: 286, allTime: 198750, thisMonth: 28900 },
  { id: 'priya',     first: 'Priya',     last: 'Raghunathan',badge: 'Platinum Patron',  hue: 162, allTime: 176400, thisMonth: 19700 },
  { id: 'sebastian', first: 'Sebastian', last: 'Cole',       badge: 'Gold Benefactor',  hue: 18,  allTime: 142000, thisMonth: 12300 },
  { id: 'isabella',  first: 'Isabella',  last: 'Moreau',     badge: 'Cornerstone',      hue: 332, allTime: 128900, thisMonth: 9800  },
  { id: 'theodore',  first: 'Theodore',  last: 'Lindqvist',  badge: 'Diamond Guild',    hue: 198, allTime: 97300,  thisMonth: 6400  },
  { id: 'aisha',     first: 'Aisha',     last: 'Okonkwo',    badge: 'Monthly Champion', hue: 96,  allTime: 84600,  thisMonth: 42800 },
  { id: 'rafael',    first: 'Rafael',    last: 'Santos',     badge: 'Patron',           hue: 254, allTime: 61200,  thisMonth: 24100 },
  { id: 'hana',      first: 'Hana',      last: 'Fujimoto',   badge: 'Rising Star',      hue: 8,   allTime: 48750,  thisMonth: 31500 },
];

function fullName(d) { return d.last ? d.first + ' ' + d.last : d.first; }
function initials(d) { return ((d.first[0] || '') + (d.last[0] || d.first[1] || '')).toUpperCase(); }

function fmtMoney(n) {
  return '$' + Math.round(n).toLocaleString('en-US');
}

// Returns donors sorted desc by the given tab's amount, each annotated with
// rank, the active amount, and the rank delta vs the other tab.
function rankedFor(tab) {
  const key = tab === 'month' ? 'thisMonth' : 'allTime';
  const otherKey = tab === 'month' ? 'allTime' : 'thisMonth';

  const order = (k) => [...DONORS].sort((a, b) => b[k] - a[k]).map(d => d.id);
  const thisOrder = order(key);
  const otherOrder = order(otherKey);
  const otherRankOf = {};
  otherOrder.forEach((id, i) => { otherRankOf[id] = i + 1; });

  return thisOrder.map((id, i) => {
    const d = DONORS.find(x => x.id === id);
    const rank = i + 1;
    const delta = otherRankOf[id] - rank;
    return { ...d, rank, amount: d[key], delta };
  });
}

function projectedRankForGift({ donorId, tab = 'all', giftAmount = 0 }) {
  const key = tab === 'month' ? 'thisMonth' : 'allTime';
  const gift = Math.max(0, Number(giftAmount) || 0);
  const ranked = rankedFor(tab);
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

Object.assign(window, {
  DONORS,
  fullName,
  initials,
  fmtMoney,
  rankedFor,
  projectedRankForGift,
});
