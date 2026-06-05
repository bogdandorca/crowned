// Crowned - browser-local donor identity and donation receipt storage

const GUEST_DONOR_TOKEN_KEY = 'crowned_guest_donor_token';
const GUEST_DONOR_NAME_KEY = 'crowned_guest_donor_name';
const DONATION_RECORDS_KEY = 'crowned_donation_records';

function browserStorage() {
  try {
    return window.localStorage || null;
  } catch (error) {
    return null;
  }
}

function randomId(prefix) {
  const cryptoSource = (window && window.crypto) || null;
  if (cryptoSource && cryptoSource.getRandomValues) {
    const bytes = new Uint8Array(12);
    cryptoSource.getRandomValues(bytes);
    return prefix + '_' + Array.from(bytes, b => b.toString(36).padStart(2, '0')).join('');
  }
  return prefix + '_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function readJson(storage, key, fallback) {
  if (!storage) return fallback;
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    return fallback;
  }
}

function writeJson(storage, key, value) {
  if (!storage) return;
  storage.setItem(key, JSON.stringify(value));
}

function getOrCreateGuestDonorToken(storage = browserStorage()) {
  if (!storage) return randomId('guest');
  const existing = storage.getItem(GUEST_DONOR_TOKEN_KEY);
  if (existing) return existing;
  const token = randomId('guest');
  storage.setItem(GUEST_DONOR_TOKEN_KEY, token);
  return token;
}

function getGuestDonorName(storage = browserStorage()) {
  if (!storage) return '';
  return storage.getItem(GUEST_DONOR_NAME_KEY) || '';
}

function saveGuestDonorName(name, storage = browserStorage()) {
  const clean = String(name || '').trim();
  if (storage && clean) storage.setItem(GUEST_DONOR_NAME_KEY, clean);
  return clean;
}

function recordDonation({ donorId, displayName, amount, method }, storage = browserStorage()) {
  const cleanDonorId = String(donorId || '').trim();
  if (!cleanDonorId) throw new Error('Donation requires a donor id');

  const record = {
    id: randomId('donation'),
    donorId: cleanDonorId,
    displayName: String(displayName || '').trim(),
    amount: Math.max(0, Number(amount) || 0),
    method,
    createdAt: new Date().toISOString(),
  };
  const records = readJson(storage, DONATION_RECORDS_KEY, []);
  records.push(record);
  writeJson(storage, DONATION_RECORDS_KEY, records);
  return record;
}

function donationsForDonor(donorId, storage = browserStorage()) {
  const records = readJson(storage, DONATION_RECORDS_KEY, []);
  return records.filter(record => record.donorId === donorId);
}

Object.assign(window, {
  getOrCreateGuestDonorToken,
  getGuestDonorName,
  saveGuestDonorName,
  recordDonation,
  donationsForDonor,
});
