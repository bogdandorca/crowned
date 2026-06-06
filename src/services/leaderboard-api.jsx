// Crowned - frontend leaderboard API client with local fallback

function localLeaderboardDisplay({ donorId, tab }) {
  return leaderboardDisplayFor({ donorId, tab });
}

async function loadLeaderboardDisplay({ donorId, tab, fetchImpl = window.fetch }) {
  const period = tab === 'month' ? 'month' : 'all';
  const donorParam = donorId ? `&donorId=${encodeURIComponent(donorId)}` : '';
  const fallback = () => localLeaderboardDisplay({ donorId, tab: period });

  if (typeof fetchImpl !== 'function') return fallback();

  try {
    const response = await fetchImpl(`/api/leaderboard?period=${period}${donorParam}`, {
      headers: { Accept: 'application/json' },
    });
    if (!response || !response.ok) return fallback();
    const payload = await response.json();
    if (!payload || !Array.isArray(payload.ranked)) return fallback();
    return payload;
  } catch (error) {
    return fallback();
  }
}

Object.assign(window, {
  loadLeaderboardDisplay,
  localLeaderboardDisplay,
});
