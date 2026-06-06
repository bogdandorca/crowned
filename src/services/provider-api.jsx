// Crowned - provider-backed browser API helpers

async function parseApiResponse(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || 'Request failed');
  }
  return payload;
}

async function loadAuthSession({ fetchImpl = window.fetch } = {}) {
  if (typeof fetchImpl !== 'function') return { signedIn: false, donor: null };
  const response = await fetchImpl('/api/session', {
    headers: { Accept: 'application/json' },
  });
  return parseApiResponse(response);
}

async function startGoogleSignIn({ guestDonorId = '', fetchImpl = window.fetch } = {}) {
  const guestParam = guestDonorId ? `?guestDonorId=${encodeURIComponent(guestDonorId)}` : '';
  const response = await fetchImpl(`/api/auth/google/start${guestParam}`, {
    headers: { Accept: 'application/json' },
  });
  return parseApiResponse(response);
}

async function createDonationCheckout({ donorId, displayName, amount, method, fetchImpl = window.fetch }) {
  const response = await fetchImpl('/api/donations', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ donorId, displayName, amount, method }),
  });
  return parseApiResponse(response);
}

async function syncDonationCheckout({ donationId, fetchImpl = window.fetch }) {
  const response = await fetchImpl(`/api/donations/${encodeURIComponent(donationId)}/sync`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
    },
  });
  return parseApiResponse(response);
}

async function createShareLink({ donorId, format, period = 'all', fetchImpl = window.fetch }) {
  const response = await fetchImpl('/api/share-links', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ donorId, format, period }),
  });
  return parseApiResponse(response);
}

Object.assign(window, {
  loadAuthSession,
  startGoogleSignIn,
  createDonationCheckout,
  syncDonationCheckout,
  createShareLink,
});
