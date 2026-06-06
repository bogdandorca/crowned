const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DEFAULT_STORE = {
  donations: [],
  shareLinks: [],
  sessions: [],
  oauthStates: [],
};

function randomId(prefix) {
  return `${prefix}_${crypto.randomBytes(12).toString('hex')}`;
}

function createJsonStore({ filePath = path.join(process.cwd(), 'data/crowned-store.json') } = {}) {
  function read() {
    try {
      return { ...DEFAULT_STORE, ...JSON.parse(fs.readFileSync(filePath, 'utf8')) };
    } catch (error) {
      return { ...DEFAULT_STORE };
    }
  }

  function write(next) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(next, null, 2));
    return next;
  }

  function createDonationAttempt({ donorId, displayName, amount, method }) {
    const state = read();
    const donation = {
      id: randomId('donation'),
      donorId: String(donorId || '').trim(),
      displayName: String(displayName || '').trim(),
      amount: Math.max(0, Number(amount) || 0),
      method: String(method || 'Card'),
      status: 'pending',
      provider: 'stripe',
      providerSessionId: null,
      createdAt: new Date().toISOString(),
      confirmedAt: null,
    };
    state.donations.push(donation);
    write(state);
    return donation;
  }

  function createManualDonation({ donorId, displayName, amount, method = 'Manual adjustment', note = '' }) {
    const state = read();
    const now = new Date().toISOString();
    const donation = {
      id: randomId('donation'),
      donorId: String(donorId || '').trim(),
      displayName: String(displayName || '').trim(),
      amount: Math.max(0, Number(amount) || 0),
      method,
      status: 'confirmed',
      provider: 'admin',
      providerSessionId: null,
      note: String(note || '').trim(),
      createdAt: now,
      confirmedAt: now,
    };
    state.donations.push(donation);
    write(state);
    return donation;
  }

  function attachStripeSession(donationId, sessionId) {
    const state = read();
    const donation = state.donations.find(item => item.id === donationId);
    if (!donation) return null;
    donation.providerSessionId = sessionId;
    write(state);
    return donation;
  }

  function confirmStripeSession(sessionId) {
    const state = read();
    const donation = state.donations.find(item => item.providerSessionId === sessionId);
    if (!donation) return null;
    donation.status = 'confirmed';
    donation.confirmedAt = donation.confirmedAt || new Date().toISOString();
    write(state);
    return donation;
  }

  function confirmedDonations() {
    return read().donations.filter(donation => donation.status === 'confirmed');
  }

  function allDonations() {
    return read().donations;
  }

  function createShareLink({ donorId, format = 'story', period = 'all' }) {
    const state = read();
    const share = {
      id: randomId('share'),
      donorId: String(donorId || '').trim(),
      format: format === 'square' ? 'square' : 'story',
      period: period === 'month' ? 'month' : 'all',
      createdAt: new Date().toISOString(),
    };
    state.shareLinks.push(share);
    write(state);
    return share;
  }

  function shareLinkById(id) {
    return read().shareLinks.find(share => share.id === id) || null;
  }

  function createSession({ donorId, displayName, email }) {
    const state = read();
    const session = {
      id: randomId('session'),
      donorId,
      displayName,
      email,
      createdAt: new Date().toISOString(),
    };
    state.sessions.push(session);
    write(state);
    return session;
  }

  function sessionById(id) {
    return read().sessions.find(session => session.id === id) || null;
  }

  function createOAuthState({ state, guestDonorId }) {
    const store = read();
    store.oauthStates = store.oauthStates.filter(item => item.state !== state);
    store.oauthStates.push({ state, guestDonorId: guestDonorId || '', createdAt: new Date().toISOString() });
    write(store);
  }

  function consumeOAuthState(state) {
    const store = read();
    const found = store.oauthStates.find(item => item.state === state) || null;
    store.oauthStates = store.oauthStates.filter(item => item.state !== state);
    write(store);
    return found;
  }

  function linkGuestDonations({ guestDonorId, donorId, displayName }) {
    const store = read();
    let changes = 0;
    store.donations.forEach((donation) => {
      if (donation.donorId === guestDonorId && (donation.status === 'pending' || donation.status === 'confirmed')) {
        donation.donorId = donorId;
        donation.displayName = displayName || donation.displayName;
        changes += 1;
      }
    });
    write(store);
    return changes;
  }

  return {
    read,
    write,
    createDonationAttempt,
    createManualDonation,
    attachStripeSession,
    confirmStripeSession,
    confirmedDonations,
    allDonations,
    createShareLink,
    shareLinkById,
    createSession,
    sessionById,
    createOAuthState,
    consumeOAuthState,
    linkGuestDonations,
  };
}

module.exports = { createJsonStore };
