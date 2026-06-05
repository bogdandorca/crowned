const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const dataPath = path.resolve(__dirname, '..', 'src/services/donation-storage.jsx');
const dataSource = fs.readFileSync(dataPath, 'utf8');

function createStorage() {
  const values = new Map();
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    },
  };
}

const storage = createStorage();
const context = {
  window: {
    localStorage: storage,
    crypto: {
      getRandomValues(bytes) {
        for (let i = 0; i < bytes.length; i += 1) bytes[i] = i + 1;
        return bytes;
      },
    },
  },
  storage,
  console,
  assert,
};

vm.runInNewContext(`${dataSource}

const token = getOrCreateGuestDonorToken(storage);
assert.match(token, /^guest_[a-z0-9]+$/);
assert.equal(getOrCreateGuestDonorToken(storage), token);

const displayName = saveGuestDonorName('  Ada Lovelace  ', storage);
assert.equal(displayName, 'Ada Lovelace');
assert.equal(getGuestDonorName(storage), 'Ada Lovelace');

const receipt = recordDonation({
  donorId: token,
  displayName,
  amount: 75,
  method: 'Card',
}, storage);

assert.match(receipt.id, /^donation_[a-z0-9]+$/);
assert.equal(receipt.donorId, token);
assert.equal(receipt.displayName, 'Ada Lovelace');
assert.equal(receipt.amount, 75);

const donations = donationsForDonor(token, storage);
assert.equal(donations.length, 1);
assert.equal(donations[0].donorId, token);
assert.equal(donations[0].displayName, 'Ada Lovelace');
`, context);

console.log('guest donation identity regression passed');
