const assert = require('assert');
const EventEmitter = require('events');
const fs = require('fs');
const os = require('os');
const path = require('path');
const Stripe = require('stripe');

const { createServer } = require('../src/server/create-server');
const { createJsonStore } = require('../src/server/json-store');

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

  const unauthorizedDonors = await dispatch(server, { url: '/api/admin/donors' });
  assert.equal(unauthorizedDonors.status, 401);

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

  const anonymousGift = await dispatch(server, {
    url: '/api/admin/donations',
    method: 'POST',
    headers: { 'x-admin-token': 'admin-secret', 'content-type': 'application/json' },
    body: JSON.stringify({
      donorId: 'guest_anon',
      displayName: 'Ada Private',
      amount: 400,
    }),
  });
  assert.equal(anonymousGift.status, 201);

  const hiddenGift = await dispatch(server, {
    url: '/api/admin/donations',
    method: 'POST',
    headers: { 'x-admin-token': 'admin-secret', 'content-type': 'application/json' },
    body: JSON.stringify({
      donorId: 'guest_hidden',
      displayName: 'Hidden Donor',
      amount: 350,
    }),
  });
  assert.equal(hiddenGift.status, 201);

  const privateAmountGift = await dispatch(server, {
    url: '/api/admin/donations',
    method: 'POST',
    headers: { 'x-admin-token': 'admin-secret', 'content-type': 'application/json' },
    body: JSON.stringify({
      donorId: 'guest_private_amount',
      displayName: 'Private Amount',
      amount: 300,
    }),
  });
  assert.equal(privateAmountGift.status, 201);

  const donorProfile = await dispatch(server, {
    url: '/api/admin/donors',
    method: 'POST',
    headers: { 'x-admin-token': 'admin-secret', 'content-type': 'application/json' },
    body: JSON.stringify({
      donorId: 'guest_anon',
      displayName: 'Ada Private',
      publicName: '',
      anonymous: true,
      hidden: false,
      showAmount: true,
    }),
  });
  assert.equal(donorProfile.status, 201);
  assert.equal(JSON.parse(donorProfile.body).donor.anonymous, true);

  const hiddenProfile = await dispatch(server, {
    url: '/api/admin/donors',
    method: 'POST',
    headers: { 'x-admin-token': 'admin-secret', 'content-type': 'application/json' },
    body: JSON.stringify({
      donorId: 'guest_hidden',
      displayName: 'Hidden Donor',
      hidden: true,
    }),
  });
  assert.equal(hiddenProfile.status, 201);

  const amountProfile = await dispatch(server, {
    url: '/api/admin/donors',
    method: 'POST',
    headers: { 'x-admin-token': 'admin-secret', 'content-type': 'application/json' },
    body: JSON.stringify({
      donorId: 'guest_private_amount',
      displayName: 'Private Amount',
      showAmount: false,
    }),
  });
  assert.equal(amountProfile.status, 201);

  const donorList = await dispatch(server, {
    url: '/api/admin/donors',
    headers: { 'x-admin-token': 'admin-secret' },
  });
  assert.equal(donorList.status, 200);
  assert(JSON.parse(donorList.body).donors.some(donor => donor.donorId === 'guest_anon'));

  const privateLeaderboard = await dispatch(server, { url: '/api/leaderboard?period=all&donorId=guest_anon' });
  const privatePayload = JSON.parse(privateLeaderboard.body);
  assert(!privatePayload.ranked.some(donor => donor.id === 'guest_hidden'), 'hidden donors should not appear publicly');
  const anonymousDonor = privatePayload.ranked.find(donor => donor.id === 'guest_anon');
  assert.equal(anonymousDonor.first, 'Anonymous');
  assert.equal(anonymousDonor.last, 'donor');
  const amountHiddenDonor = privatePayload.ranked.find(donor => donor.id === 'guest_private_amount');
  assert.equal(amountHiddenDonor.amountHidden, true);
  assert.equal(amountHiddenDonor.amount, 0);

  const periods = await dispatch(server, {
    url: '/api/admin/periods',
    headers: { 'x-admin-token': 'admin-secret' },
  });
  assert.equal(periods.status, 200);
  assert.deepEqual(JSON.parse(periods.body).periods.map(period => period.period), ['all', 'month']);

  const updatedPeriod = await dispatch(server, {
    url: '/api/admin/periods',
    method: 'POST',
    headers: { 'x-admin-token': 'admin-secret', 'content-type': 'application/json' },
    body: JSON.stringify({
      period: 'month',
      label: 'Founder Month',
      active: false,
    }),
  });
  assert.equal(updatedPeriod.status, 200);
  assert.equal(JSON.parse(updatedPeriod.body).period.label, 'Founder Month');

  const inactivePeriod = await dispatch(server, { url: '/api/leaderboard?period=month' });
  assert.equal(inactivePeriod.status, 400);
  assert.match(JSON.parse(inactivePeriod.body).error, /inactive/i);

  const csvImport = await dispatch(server, {
    url: '/api/admin/import.csv',
    method: 'POST',
    headers: { 'x-admin-token': 'admin-secret', 'content-type': 'text/csv' },
    body: 'donorId,displayName,amount,note\ncsv_donor,CSV Donor,210,Imported pledge\n',
  });
  assert.equal(csvImport.status, 201);
  assert.equal(JSON.parse(csvImport.body).imported, 1);

  const csvLeaderboard = await dispatch(server, { url: '/api/leaderboard?period=all&donorId=csv_donor' });
  const csvDonor = JSON.parse(csvLeaderboard.body).ranked.find(donor => donor.id === 'csv_donor');
  assert.equal(csvDonor.amount, 210);

  const invalidCsv = await dispatch(server, {
    url: '/api/admin/import.csv',
    method: 'POST',
    headers: { 'x-admin-token': 'admin-secret', 'content-type': 'text/csv' },
    body: 'name,total\nNope,100\n',
  });
  assert.equal(invalidCsv.status, 400);

  const directStore = createJsonStore({ filePath: path.join(tmp, 'crowned-store.json') });
  const expiredSession = directStore.createSession({
    donorId: 'expired_donor',
    displayName: 'Expired Donor',
    email: 'expired@example.com',
    expiresAt: '2000-01-01T00:00:00.000Z',
  });
  const expiredApiSession = await dispatch(server, {
    url: '/api/session',
    headers: { cookie: `crowned_session=${expiredSession.id}` },
  });
  assert.equal(JSON.parse(expiredApiSession.body).signedIn, false);

  const cleanup = await dispatch(server, {
    url: '/api/admin/sessions/cleanup',
    method: 'POST',
    headers: { 'x-admin-token': 'admin-secret' },
  });
  assert.equal(cleanup.status, 200);
  assert.equal(JSON.parse(cleanup.body).removed.sessions, 1);

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

  const adminPage = await dispatch(server, { url: '/admin' });
  assert.equal(adminPage.status, 200);
  assert.match(adminPage.body, /Admin token/);
  assert.match(adminPage.body, /Donor profiles/);
  assert.match(adminPage.body, /Manual adjustment/);
  assert.match(adminPage.body, /Leaderboard periods/);
  assert.match(adminPage.body, /CSV import/);
  assert.match(adminPage.body, /Export donations/);
  assert.match(adminPage.body, /Cleanup expired sessions/);

  const envExample = fs.readFileSync(path.resolve(__dirname, '../.env.example'), 'utf8');
  assert.match(envExample, /DATABASE_URL=postgres:\/\//);
  assert.doesNotMatch(envExample, /SQLITE/i);

  console.log('live readiness regression passed');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
