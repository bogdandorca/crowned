const assert = require('assert');
const EventEmitter = require('events');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { createServer } = require('../server');

function dispatch(handler, { url, method = 'GET', body = null }) {
  return new Promise((resolve) => {
    const req = new EventEmitter();
    req.url = url;
    req.method = method;
    req.headers = {};

    const res = {
      writeHead(status, headers) {
        this.status = status;
        this.headers = headers;
      },
      end(payload) {
        resolve({
          status: this.status,
          headers: this.headers,
          body: payload ? String(payload) : '',
        });
      },
    };

    handler.emit('request', req, res);

    process.nextTick(() => {
      if (body) req.emit('data', Buffer.from(JSON.stringify(body)));
      req.emit('end');
    });
  });
}

(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'crowned-provider-flows-'));
  const storePath = path.join(tmp, 'store.json');
  const server = createServer({
    root: path.resolve(__dirname, '..'),
    storePath,
    env: { APP_BASE_URL: 'http://localhost:8765' },
  });

  const missingStripe = await dispatch(server, {
    method: 'POST',
    url: '/api/donations',
    body: {
      donorId: 'guest_test',
      displayName: 'Ada Lovelace',
      amount: 75,
      method: 'Card',
    },
  });

  assert.equal(missingStripe.status, 503);
  assert.match(JSON.parse(missingStripe.body).error, /STRIPE_SECRET_KEY/);

  const missingGoogle = await dispatch(server, {
    method: 'GET',
    url: '/api/auth/google/start',
  });

  assert.equal(missingGoogle.status, 503);
  assert.match(JSON.parse(missingGoogle.body).error, /GOOGLE_CLIENT_ID/);

  const invalidShare = await dispatch(server, {
    method: 'POST',
    url: '/api/share-links',
    body: {},
  });

  assert.equal(invalidShare.status, 400);
  assert.match(JSON.parse(invalidShare.body).error, /donor id/);

  const share = await dispatch(server, {
    method: 'POST',
    url: '/api/share-links',
    body: {
      donorId: 'tudi',
      format: 'story',
      period: 'all',
    },
  });

  assert.equal(share.status, 201);
  const sharePayload = JSON.parse(share.body);
  assert.match(sharePayload.url, /^http:\/\/localhost:8765\/share\//);
  assert.equal(sharePayload.share.donorId, 'tudi');
  assert.equal(sharePayload.share.format, 'story');

  const loadedShare = await dispatch(server, {
    method: 'GET',
    url: `/api/share-links/${sharePayload.share.id}`,
  });

  assert.equal(loadedShare.status, 200);
  assert.equal(JSON.parse(loadedShare.body).share.id, sharePayload.share.id);

  const configuredServer = createServer({
    root: path.resolve(__dirname, '..'),
    storePath: path.join(tmp, 'configured-store.json'),
    env: {
      APP_BASE_URL: 'http://localhost:8765',
      STRIPE_SECRET_KEY: 'sk_test_123',
      GOOGLE_CLIENT_ID: 'google-client',
      GOOGLE_CLIENT_SECRET: 'google-secret',
    },
    fetchImpl: async (url) => {
      if (String(url).includes('stripe.com')) {
        return {
          ok: true,
          async json() {
            return {
              id: 'cs_test_123',
              url: 'https://checkout.stripe.com/c/pay/cs_test_123',
            };
          },
        };
      }
      if (String(url).includes('oauth2.googleapis.com/token')) {
        return {
          ok: true,
          async json() {
            return { access_token: 'google_access_token' };
          },
        };
      }
      if (String(url).includes('openidconnect.googleapis.com')) {
        return {
          ok: true,
          async json() {
            return { sub: '12345', email: 'ada@example.com', name: 'Ada Lovelace' };
          },
        };
      }
      throw new Error(`Unexpected fetch URL: ${url}`);
    },
  });

  const checkout = await dispatch(configuredServer, {
    method: 'POST',
    url: '/api/donations',
    body: {
      donorId: 'guest_test',
      displayName: 'Ada Lovelace',
      amount: 75,
      method: 'Card',
    },
  });

  assert.equal(checkout.status, 201);
  assert.equal(JSON.parse(checkout.body).checkoutUrl, 'https://checkout.stripe.com/c/pay/cs_test_123');

  const webhook = await dispatch(configuredServer, {
    method: 'POST',
    url: '/api/stripe/webhook',
    body: {
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_test_123' } },
    },
  });

  assert.equal(webhook.status, 200);
  assert.equal(JSON.parse(webhook.body).donation.status, 'confirmed');

  const updatedLeaderboard = await dispatch(configuredServer, {
    method: 'GET',
    url: '/api/leaderboard?period=all&donorId=guest_test',
  });
  const leaderboardPayload = JSON.parse(updatedLeaderboard.body);
  const guestRow = leaderboardPayload.ranked.find(donor => donor.id === 'guest_test');
  assert.equal(guestRow.amount, 75);

  const googleStart = await dispatch(configuredServer, {
    method: 'GET',
    url: '/api/auth/google/start',
  });
  assert.equal(googleStart.status, 200);
  assert.match(JSON.parse(googleStart.body).redirectUrl, /accounts\.google\.com/);

  const googleCallback = await dispatch(configuredServer, {
    method: 'GET',
    url: '/api/auth/google/callback?code=abc123',
  });
  assert.equal(googleCallback.status, 302);
  assert.match(googleCallback.headers['Set-Cookie'], /crowned_session=/);
  assert.equal(googleCallback.headers.Location, '/');

  console.log('provider-backed flows regression passed');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
