const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DEFAULT_STORE = {
  donations: [],
  shareLinks: [],
  sessions: [],
  oauthStates: [],
  donorProfiles: [],
  periodSettings: [],
};

function randomId(prefix) {
  return `${prefix}_${crypto.randomBytes(12).toString('hex')}`;
}

function createJsonStore({ filePath = path.join(process.cwd(), 'data/crowned-store.json') } = {}) {
  function defaultPeriodSettings() {
    const now = new Date().toISOString();
    return [
      { period: 'all', label: 'All Time', active: true, updatedAt: now },
      { period: 'month', label: 'This Month', active: true, updatedAt: now },
    ];
  }

  function read() {
    try {
      const state = { ...DEFAULT_STORE, ...JSON.parse(fs.readFileSync(filePath, 'utf8')) };
      return { ...state, periodSettings: state.periodSettings.length ? state.periodSettings : defaultPeriodSettings() };
    } catch (error) {
      return { ...DEFAULT_STORE, periodSettings: defaultPeriodSettings() };
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

  function donationById(id) {
    return read().donations.find(donation => donation.id === id) || null;
  }

  function confirmedDonations() {
    return read().donations.filter(donation => donation.status === 'confirmed');
  }

  function allDonations() {
    return read().donations;
  }

  function normalizeDonorProfile(input) {
    const now = new Date().toISOString();
    const donorId = String(input.donorId || '').trim();
    const displayName = String(input.displayName || input.publicName || donorId).trim();
    return {
      donorId,
      displayName,
      publicName: String(input.publicName || '').trim(),
      anonymous: !!input.anonymous,
      hidden: !!input.hidden,
      showAmount: input.showAmount === false ? false : true,
      updatedAt: input.updatedAt || now,
    };
  }

  function donorProfiles() {
    return read().donorProfiles.map(normalizeDonorProfile);
  }

  function donorProfileById(donorId) {
    const id = String(donorId || '').trim();
    return donorProfiles().find(profile => profile.donorId === id) || null;
  }

  function upsertDonorProfile(input) {
    const profile = normalizeDonorProfile({ ...input, updatedAt: new Date().toISOString() });
    const state = read();
    state.donorProfiles = state.donorProfiles.filter(item => item.donorId !== profile.donorId);
    state.donorProfiles.push(profile);
    write(state);
    return profile;
  }

  function normalizePeriodSetting(input) {
    const period = input.period === 'month' ? 'month' : 'all';
    return {
      period,
      label: String(input.label || (period === 'month' ? 'This Month' : 'All Time')).trim(),
      active: input.active === false ? false : true,
      updatedAt: input.updatedAt || new Date().toISOString(),
    };
  }

  function periodSettings() {
    return read().periodSettings.map(normalizePeriodSetting).sort((a, b) => (a.period === 'all' ? -1 : 1));
  }

  function upsertPeriodSetting(input) {
    const period = normalizePeriodSetting({ ...input, updatedAt: new Date().toISOString() });
    const state = read();
    state.periodSettings = state.periodSettings.filter(item => item.period !== period.period);
    state.periodSettings.push(period);
    write(state);
    return period;
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

  function isExpired(value, now = Date.now()) {
    return value && Date.parse(value) <= now;
  }

  function createSession({ donorId, displayName, email, expiresAt }) {
    const state = read();
    const session = {
      id: randomId('session'),
      donorId,
      displayName,
      email,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt || null,
    };
    state.sessions.push(session);
    write(state);
    return session;
  }

  function sessionById(id) {
    const session = read().sessions.find(item => item.id === id) || null;
    if (!session || isExpired(session.expiresAt)) return null;
    return session;
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

  function cleanupExpiredSessions({ now = new Date(), oauthMaxAgeMs = 60 * 60 * 1000 } = {}) {
    const state = read();
    const nowMs = now instanceof Date ? now.getTime() : Date.parse(now);
    const beforeSessions = state.sessions.length;
    const beforeStates = state.oauthStates.length;
    state.sessions = state.sessions.filter(session => !isExpired(session.expiresAt, nowMs));
    state.oauthStates = state.oauthStates.filter((item) => {
      const created = Date.parse(item.createdAt || '');
      return Number.isFinite(created) && nowMs - created <= oauthMaxAgeMs;
    });
    write(state);
    return {
      sessions: beforeSessions - state.sessions.length,
      oauthStates: beforeStates - state.oauthStates.length,
    };
  }

  return {
    read,
    write,
    createDonationAttempt,
    createManualDonation,
    attachStripeSession,
    confirmStripeSession,
    donationById,
    confirmedDonations,
    allDonations,
    donorProfiles,
    donorProfileById,
    upsertDonorProfile,
    periodSettings,
    upsertPeriodSetting,
    createShareLink,
    shareLinkById,
    createSession,
    sessionById,
    cleanupExpiredSessions,
    createOAuthState,
    consumeOAuthState,
    linkGuestDonations,
  };
}

module.exports = { createJsonStore };
