const assert = require('assert');
const EventEmitter = require('events');
const fs = require('fs');
const os = require('os');
const path = require('path');
const Stripe = require('stripe');

const { createServer } = require('../src/server/create-server');

function dispatch(server, { url, method = 'GET', body = null, headers = {} }) {
  return new Promise((resolve) => {
    const req = new EventEmitter();
    req.url = url;
    req.method = method;
    req.headers = headers;

    const res = {
      writeHead(status, responseHeaders) {
        this.status = status;
        this.headers = responseHeaders;
      },
      end(payload) {
        resolve({
          status: this.status,
          headers: this.headers,
          body: payload ? String(payload) : '',
        });
      },
    };

    server.emit('request', req, res);

    process.nextTick(() => {
      if (body != null) req.emit('data', Buffer.from(body));
      req.emit('end');
    });
  });
}

(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'crowned-live-ready-'));
  const webhookSecret = 'whsec_test_secret';
  const server = createServer({
    root: path.resolve(__dirname, '..'),
    storePath: path.join(tmp, 'crowned-store.json'),
    env: {
      APP_BASE_URL: 'http://localhost:8765',
      ADMIN_TOKEN: 'admin-secret',
      STRIPE_SECRET_KEY: 'sk_test_123',
      STRIPE_WEBHOOK_SECRET: webhookSecret,
      GOOGLE_CLIENT_ID: 'google-client',
      GOOGLE_CLIENT_SECRET: 'google-secret',
    },
    fetchImpl: async (url) => {
      if (String(url).includes('stripe.com')) {
        return {
          ok: true,
          async json() {
            return { id: 'cs_live_ready', url: 'https://checkout.stripe.com/c/pay/cs_live_ready' };
          },
        };
      }
      throw new Error(`Unexpected fetch URL: ${url}`);
    },
  });

  const health = await dispatch(server, { url: '/healthz' });
  assert.equal(health.status, 200);
  assert.equal(JSON.parse(health.body).ok, true);
  assert(health.headers['X-Request-Id'], 'health responses should include a request id');

  const unauthorizedAdmin = await dispatch(server, { url: '/api/admin/donations', method: 'POST', body: '{}' });
  assert.equal(unauthorizedAdmin.status, 401);

  const manualAdjustment = await dispatch(server, {
    url: '/api/admin/donations',
    method: 'POST',
    headers: { 'x-admin-token': 'admin-secret', 'content-type': 'application/json' },
    body: JSON.stringify({
      donorId: 'guest_live',
      displayName: 'Live Donor',
      amount: 125,
      note: 'Founding pledge',
    }),
  });
  assert.equal(manualAdjustment.status, 201);
  assert.equal(JSON.parse(manualAdjustment.body).donation.status, 'confirmed');

  const leaderboard = await dispatch(server, { url: '/api/leaderboard?period=all&donorId=guest_live' });
  const guestLive = JSON.parse(leaderboard.body).ranked.find(donor => donor.id === 'guest_live');
  assert.equal(guestLive.amount, 125);

  const checkout = await dispatch(server, {
    url: '/api/donations',
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      donorId: 'guest_stripe',
      displayName: 'Stripe Donor',
      amount: 75,
      method: 'Card',
    }),
  });
  assert.equal(checkout.status, 201);

  const webhookPayload = JSON.stringify({
    type: 'checkout.session.completed',
    data: { object: { id: 'cs_live_ready' } },
  });
  const stripeSignature = Stripe.webhooks.generateTestHeaderString({
    payload: webhookPayload,
    secret: webhookSecret,
  });
  const webhook = await dispatch(server, {
    url: '/api/stripe/webhook',
    method: 'POST',
    headers: { 'stripe-signature': stripeSignature },
    body: webhookPayload,
  });
  assert.equal(webhook.status, 200);
  assert.equal(JSON.parse(webhook.body).donation.status, 'confirmed');

  const share = await dispatch(server, {
    url: '/api/share-links',
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ donorId: 'guest_live', format: 'story', period: 'all' }),
  });
  const sharePayload = JSON.parse(share.body);
  const sharePage = await dispatch(server, { url: `/share/${sharePayload.share.id}` });
  assert.equal(sharePage.status, 200);
  assert.match(sharePage.body, /Live Donor/);
  assert.match(sharePage.body, /Founding pledge|Every gift writes the legacy/);

  const adminExport = await dispatch(server, {
    url: '/api/admin/export.csv',
    headers: { 'x-admin-token': 'admin-secret' },
  });
  assert.equal(adminExport.status, 200);
  assert.match(adminExport.body, /guest_live/);

  const envExample = fs.readFileSync(path.resolve(__dirname, '../.env.example'), 'utf8');
  assert.match(envExample, /DATABASE_URL=postgres:\/\//);
  assert.doesNotMatch(envExample, /SQLITE/i);

  console.log('live readiness regression passed');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
