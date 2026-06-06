const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const { leaderboardDisplayFor } = require('../data/leaderboard-core');
const { createStore } = require('./store');
const { createStripeProvider } = require('./stripe-provider');
const { createGoogleAuthProvider } = require('./google-auth-provider');
const { createLogger, newRequestId } = require('./logger');
const {
  MIME,
  send,
  sendJson,
  readRawBody,
  readJsonBody,
  cookieValue,
  sessionCookie,
  publicBaseUrl,
} = require('./http-utils');

const DEFAULT_PORT = Number(process.env.PORT) || 8765;
const DEFAULT_ROOT = path.resolve(__dirname, '../..');

async function serveLeaderboardApi(req, res, { store }) {
  const requestUrl = new URL(req.url || '/', 'http://localhost');
  const period = requestUrl.searchParams.get('period') || 'all';
  const donorId = requestUrl.searchParams.get('donorId') || 'tudi';

  if (period !== 'all' && period !== 'month') {
    return sendJson(res, 400, { error: 'Unsupported leaderboard period' });
  }

  const display = leaderboardDisplayFor({ donorId, tab: period, donations: await store.confirmedDonations() });
  return sendJson(res, 200, {
    period,
    activeDonorId: donorId,
    ...display,
  });
}

async function serveDonationApi(req, res, { store, stripe }) {
  try {
    const body = await readJsonBody(req);
    const amount = Math.max(0, Number(body.amount) || 0);
    const donorId = String(body.donorId || '').trim();
    const displayName = String(body.displayName || '').trim();
    if (!donorId) return sendJson(res, 400, { error: 'Donation requires a donor id' });
    if (!displayName) return sendJson(res, 400, { error: 'Donation requires a display name' });
    if (amount < 1) return sendJson(res, 400, { error: 'Donation amount must be at least $1' });

    const donation = await store.createDonationAttempt({
      donorId,
      displayName,
      amount,
      method: body.method || 'Card',
    });
    const checkout = await stripe.createCheckoutSession({ donation });
    if (!checkout.ok) return sendJson(res, checkout.status || 502, { error: checkout.error });
    await store.attachStripeSession(donation.id, checkout.sessionId);
    return sendJson(res, 201, {
      donation: { ...donation, providerSessionId: checkout.sessionId },
      checkoutUrl: checkout.checkoutUrl,
    });
  } catch (error) {
    return sendJson(res, 400, { error: 'Invalid donation request' });
  }
}

async function serveDonationSyncApi(req, res, { store, stripe }) {
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  const donationId = urlPath.split('/').slice(-2)[0];
  const donation = await store.donationById(donationId);
  if (!donation) return sendJson(res, 404, { error: 'Donation not found' });
  if (donation.status === 'confirmed') return sendJson(res, 200, { donation });
  if (!donation.providerSessionId) {
    return sendJson(res, 409, { error: 'Donation is still waiting for Stripe checkout' });
  }

  const lookup = await stripe.retrieveCheckoutSession({ sessionId: donation.providerSessionId });
  if (!lookup.ok) return sendJson(res, lookup.status || 502, { error: lookup.error });
  const session = lookup.session || {};
  const isPaid = session.payment_status === 'paid' || session.status === 'complete';
  if (!isPaid) {
    return sendJson(res, 409, { error: 'Stripe checkout is not paid yet' });
  }

  const confirmed = await store.confirmStripeSession(donation.providerSessionId);
  return sendJson(res, 200, { donation: confirmed || donation });
}

function serveGoogleStart(_req, res, { google }) {
  const start = google.startUrl();
  if (!start.ok) return sendJson(res, start.status || 503, { error: start.error });
  return sendJson(res, 200, { redirectUrl: start.redirectUrl, state: start.state });
}

async function serveGoogleCallback(req, res, { google, store }) {
  const requestUrl = new URL(req.url || '/', 'http://localhost');
  let completed;
  try {
    completed = await google.completeCallback({ code: requestUrl.searchParams.get('code') });
  } catch (error) {
    return sendJson(res, 502, { error: 'Google sign-in failed. Check OAuth configuration and retry.' });
  }
  if (!completed.ok) return sendJson(res, completed.status || 502, { error: completed.error });
  const donor = {
    donorId: completed.donor.donorId || completed.donor.id,
    displayName: completed.donor.displayName,
    email: completed.donor.email,
  };
  let session;
  try {
    session = await store.createSession(donor);
    const state = await store.consumeOAuthState(requestUrl.searchParams.get('state') || '');
    if (state?.guestDonorId) {
      await store.linkGuestDonations({
        guestDonorId: state.guestDonorId,
        donorId: donor.donorId,
        displayName: donor.displayName,
      });
    }
  } catch (error) {
    return sendJson(res, 503, { error: 'Google sign-in could not be saved because the database is unavailable' });
  }
  return send(res, 302, '', {
    Location: '/',
    'Set-Cookie': sessionCookie(session.id),
  });
}

async function serveSessionApi(req, res, { store }) {
  const sessionId = cookieValue(req, 'crowned_session');
  const session = sessionId ? await store.sessionById(sessionId) : null;
  return sendJson(res, 200, {
    signedIn: !!session,
    donor: session ? {
      id: session.donorId,
      displayName: session.displayName,
      email: session.email,
    } : null,
  });
}

async function serveStripeWebhook(req, res, { store, stripe, env }) {
  try {
    const payload = await readRawBody(req);
    const verified = stripe.constructWebhookEvent({
      payload,
      signature: req.headers?.['stripe-signature'] || '',
      webhookSecret: env.STRIPE_WEBHOOK_SECRET || '',
    });
    if (!verified.ok) return sendJson(res, verified.status || 400, { error: verified.error });
    const event = verified.event;
    if (event.type === 'checkout.session.completed' && event.data?.object?.id) {
      const donation = await store.confirmStripeSession(event.data.object.id);
      return sendJson(res, 200, { received: true, donation });
    }
    return sendJson(res, 200, { received: true });
  } catch (error) {
    return sendJson(res, 400, { error: 'Invalid webhook payload' });
  }
}

async function serveCreateShareLink(req, res, { store, env, port }) {
  try {
    const body = await readJsonBody(req);
    if (!String(body.donorId || '').trim()) {
      return sendJson(res, 400, { error: 'Share link requires a donor id' });
    }
    const share = await store.createShareLink({
      donorId: body.donorId,
      format: body.format,
      period: body.period,
    });
    return sendJson(res, 201, {
      share,
      url: `${publicBaseUrl(env, port)}/share/${share.id}`,
    });
  } catch (error) {
    return sendJson(res, 400, { error: 'Invalid share link request' });
  }
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function servePublicSharePage(req, res, { store }) {
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  const id = urlPath.split('/').pop();
  const share = await store.shareLinkById(id);
  if (!share) return send(res, 404, 'Share link not found', { 'Content-Type': 'text/plain; charset=utf-8' });
  const donor = leaderboardDisplayFor({
    donorId: share.donorId,
    tab: share.period,
    donations: await store.confirmedDonations(),
  }).ranked.find(item => item.id === share.donorId);
  const title = donor ? `${donor.first}${donor.last ? ` ${donor.last}` : ''} is #${donor.rank}` : 'Crowned donor rank';
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)} · Crowned</title>
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="Every gift writes the legacy." />
  <style>
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; font-family: Arial, sans-serif; background: #fbf7f0; color: #302b26; }
    main { width: min(92vw, 520px); text-align: center; padding: 48px 24px; }
    h1 { font-family: Georgia, serif; font-size: clamp(42px, 9vw, 74px); line-height: .95; margin: 0 0 18px; }
    p { color: rgba(48,43,38,.68); line-height: 1.55; }
    strong { color: #7c5f30; }
  </style>
</head>
<body>
  <main>
    <h1>${escapeHtml(donor ? `${donor.first}${donor.last ? ` ${donor.last}` : ''}` : 'Crowned')}</h1>
    <p><strong>${escapeHtml(donor ? `#${donor.rank} · $${Math.round(donor.amount).toLocaleString('en-US')}` : 'Shared rank')}</strong></p>
    <p>Every gift writes the legacy.</p>
    <p><a href="/">View the leaderboard</a></p>
  </main>
</body>
</html>`;
  return send(res, 200, html, { 'Content-Type': 'text/html; charset=utf-8' });
}

function requireAdmin(req, res, env) {
  const token = env.ADMIN_TOKEN || '';
  if (!token) {
    sendJson(res, 503, { error: 'ADMIN_TOKEN is required for admin APIs' });
    return false;
  }
  if (req.headers?.['x-admin-token'] !== token) {
    sendJson(res, 401, { error: 'Unauthorized admin request' });
    return false;
  }
  return true;
}

async function serveAdminDonation(req, res, { store, env }) {
  if (!requireAdmin(req, res, env)) return;
  try {
    const body = await readJsonBody(req);
    const amount = Math.max(0, Number(body.amount) || 0);
    if (!String(body.donorId || '').trim()) return sendJson(res, 400, { error: 'Admin donation requires a donor id' });
    if (!String(body.displayName || '').trim()) return sendJson(res, 400, { error: 'Admin donation requires a display name' });
    if (amount < 1) return sendJson(res, 400, { error: 'Admin donation amount must be at least $1' });
    const donation = await store.createManualDonation({
      donorId: body.donorId,
      displayName: body.displayName,
      amount,
      method: body.method,
      note: body.note,
    });
    return sendJson(res, 201, { donation });
  } catch (error) {
    return sendJson(res, 400, { error: 'Invalid admin donation request' });
  }
}

async function serveAdminExport(req, res, { store, env }) {
  if (!requireAdmin(req, res, env)) return;
  const lines = [['id', 'donorId', 'displayName', 'amount', 'status', 'provider', 'method', 'note', 'createdAt', 'confirmedAt']];
  (await store.allDonations()).forEach((donation) => {
    lines.push([
      donation.id,
      donation.donorId,
      donation.displayName,
      donation.amount,
      donation.status,
      donation.provider,
      donation.method,
      donation.note || '',
      donation.createdAt,
      donation.confirmedAt || '',
    ]);
  });
  const csv = lines.map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');
  return send(res, 200, csv, { 'Content-Type': 'text/csv; charset=utf-8' });
}

function serveAdminPage(_req, res) {
  return send(res, 200, `<!doctype html>
<html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>Crowned Admin</title></head>
<body><main><h1>Crowned Admin</h1><p>Use the admin APIs with <code>x-admin-token</code> to add manual adjustments and export donations.</p></main></body></html>`, {
    'Content-Type': 'text/html; charset=utf-8',
  });
}

async function serveShareLink(req, res, { store }) {
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  const id = urlPath.split('/').pop();
  const share = await store.shareLinkById(id);
  if (!share) return sendJson(res, 404, { error: 'Share link not found' });
  return sendJson(res, 200, { share });
}

function isInsideRoot(root, filePath) {
  const relative = path.relative(root, filePath);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function serveStatic(req, res, { root = DEFAULT_ROOT } = {}) {
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  const safe = path.normalize(urlPath).replace(/^([\\/])+/, '');
  let filePath = path.join(root, safe);

  if (!isInsideRoot(root, filePath)) return send(res, 403, 'Forbidden');

  fs.stat(filePath, (err, stat) => {
    if (err || !stat) {
      return send(res, 404, 'Not found');
    }
    if (stat.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }
    fs.readFile(filePath, (e, data) => {
      if (e) return send(res, 404, 'Not found');
      const type = MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
      send(res, 200, data, { 'Content-Type': type });
    });
  });
}

function createServer({ root = DEFAULT_ROOT, store: injectedStore, storePath, env = process.env, fetchImpl, stripeClient, googleOAuthClient, postgresPool, port = DEFAULT_PORT } = {}) {
  const store = injectedStore || createStore({ env, storePath, postgresPool });
  const stripe = createStripeProvider({ env, fetchImpl, stripeClient });
  const google = createGoogleAuthProvider({ env, fetchImpl, googleOAuthClient });
  const logger = createLogger({ env });

  const handler = async (req, res) => {
    const requestId = newRequestId();
    const startedAt = Date.now();
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    let statusCode = 200;

    const originalWriteHead = res.writeHead;
    res.writeHead = function writeHeadWithRequestId(status, headers = {}) {
      statusCode = status;
      return originalWriteHead.call(this, status, { 'X-Request-Id': requestId, ...headers });
    };

    const originalEnd = res.end;
    res.end = function endWithLog(...args) {
      logger.info('request.completed', {
        requestId,
        method: req.method,
        path: urlPath,
        status: statusCode,
        durationMs: Date.now() - startedAt,
      });
      return originalEnd.apply(this, args);
    };

    try {
      if (req.method === 'GET' && (urlPath === '/healthz' || urlPath === '/readyz')) {
        return sendJson(res, 200, { ok: true });
      }
      if (req.method === 'GET' && urlPath === '/api/leaderboard') {
        return serveLeaderboardApi(req, res, { store });
      }
      if (req.method === 'POST' && urlPath === '/api/donations') {
        return serveDonationApi(req, res, { store, stripe });
      }
      if (req.method === 'POST' && urlPath.startsWith('/api/donations/') && urlPath.endsWith('/sync')) {
        return serveDonationSyncApi(req, res, { store, stripe });
      }
      if (req.method === 'POST' && urlPath === '/api/stripe/webhook') {
        return serveStripeWebhook(req, res, { store, stripe, env });
      }
      if (req.method === 'GET' && urlPath === '/api/auth/google/start') {
        const requestUrl = new URL(req.url || '/', 'http://localhost');
        const guestDonorId = requestUrl.searchParams.get('guestDonorId') || '';
        const state = guestDonorId ? `guest_${Date.now()}_${Math.random().toString(36).slice(2)}` : '';
        if (state) {
          try {
            await store.createOAuthState({ state, guestDonorId });
          } catch (error) {
            return sendJson(res, 503, { error: 'Google sign-in could not be started because the database is unavailable' });
          }
        }
        if (state) {
          const start = google.startUrl({ state });
          if (!start.ok) return sendJson(res, start.status || 503, { error: start.error });
          return sendJson(res, 200, { redirectUrl: start.redirectUrl, state: start.state });
        }
        return serveGoogleStart(req, res, { google });
      }
      if (req.method === 'GET' && urlPath === '/api/auth/google/callback') {
        return serveGoogleCallback(req, res, { google, store });
      }
      if (req.method === 'GET' && urlPath === '/api/session') {
        return serveSessionApi(req, res, { store });
      }
      if (req.method === 'POST' && urlPath === '/api/share-links') {
        return serveCreateShareLink(req, res, { store, env, port });
      }
      if (req.method === 'GET' && urlPath.startsWith('/api/share-links/')) {
        return serveShareLink(req, res, { store });
      }
      if (req.method === 'POST' && urlPath === '/api/admin/donations') {
        return serveAdminDonation(req, res, { store, env });
      }
      if (req.method === 'GET' && urlPath === '/api/admin/export.csv') {
        return serveAdminExport(req, res, { store, env });
      }
      if (req.method === 'GET' && urlPath === '/admin') {
        return serveAdminPage(req, res);
      }
      if (req.method === 'GET' && urlPath.startsWith('/share/')) {
        return servePublicSharePage(req, res, { store });
      }
      if (urlPath.startsWith('/api/')) {
        return sendJson(res, 404, { error: 'Not found' });
      }
      return serveStatic(req, res, { root });
    } catch (error) {
      logger.error('request.failed', {
        requestId,
        method: req.method,
        path: urlPath,
        error: error.message,
      });
      if (!res.headersSent && !res.writableEnded) {
        return sendJson(res, 500, { error: 'Internal server error', requestId });
      }
      throw error;
    }
  };

  const server = http.createServer(handler);
  server.handler = handler;
  return server;
}

module.exports = {
  createServer,
  send,
  sendJson,
  serveStatic,
  serveLeaderboardApi,
  serveDonationApi,
  serveDonationSyncApi,
  serveGoogleStart,
  serveGoogleCallback,
  serveSessionApi,
  serveStripeWebhook,
  serveCreateShareLink,
  serveShareLink,
  servePublicSharePage,
  serveAdminDonation,
  serveAdminExport,
};
