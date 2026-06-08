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
const DEFAULT_SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

function sessionTtlSeconds(env) {
  const configured = Number(env.SESSION_TTL_SECONDS);
  return Number.isFinite(configured) ? configured : DEFAULT_SESSION_TTL_SECONDS;
}

function sessionExpiry(env) {
  return new Date(Date.now() + sessionTtlSeconds(env) * 1000).toISOString();
}

async function serveLeaderboardApi(req, res, { store }) {
  const requestUrl = new URL(req.url || '/', 'http://localhost');
  const period = requestUrl.searchParams.get('period') || 'all';
  const donorId = requestUrl.searchParams.get('donorId') || 'tudi';

  if (period !== 'all' && period !== 'month') {
    return sendJson(res, 400, { error: 'Unsupported leaderboard period' });
  }

  if (store.periodSettings) {
    const settings = await store.periodSettings();
    const setting = settings.find(item => item.period === period);
    if (setting && !setting.active) {
      return sendJson(res, 400, { error: 'Leaderboard period is inactive' });
    }
  }

  const donorProfiles = store.donorProfiles ? await store.donorProfiles() : [];
  const display = leaderboardDisplayFor({
    donorId,
    tab: period,
    donations: await store.confirmedDonations(),
    donorProfiles,
  });
  return sendJson(res, 200, {
    period,
    activeDonorId: donorId,
    ...display,
  });
}

function donorTotals(donations = []) {
  const totals = new Map();
  donations.forEach((donation) => {
    const donorId = String(donation.donorId || '').trim();
    if (!donorId) return;
    const current = totals.get(donorId) || { allTime: 0, donationCount: 0 };
    current.allTime += Math.max(0, Number(donation.amount) || 0);
    current.donationCount += 1;
    totals.set(donorId, current);
  });
  return totals;
}

async function serveAdminDonors(req, res, { store, env }) {
  if (!requireAdmin(req, res, env)) return;

  if (req.method === 'GET') {
    const profiles = store.donorProfiles ? await store.donorProfiles() : [];
    const totals = donorTotals(await store.confirmedDonations());
    const donors = profiles.map(profile => ({
      ...profile,
      totals: totals.get(profile.donorId) || { allTime: 0, donationCount: 0 },
    }));
    return sendJson(res, 200, { donors });
  }

  try {
    const body = await readJsonBody(req);
    const donorId = String(body.donorId || '').trim();
    if (!donorId) return sendJson(res, 400, { error: 'Donor profile requires a donor id' });
    const displayName = String(body.displayName || body.publicName || donorId).trim();
    if (!displayName) return sendJson(res, 400, { error: 'Donor profile requires a display name' });
    if (!store.upsertDonorProfile) return sendJson(res, 503, { error: 'Donor profiles are not supported by this store' });
    const donor = await store.upsertDonorProfile({
      donorId,
      displayName,
      publicName: body.publicName,
      anonymous: body.anonymous,
      hidden: body.hidden,
      showAmount: body.showAmount,
    });
    return sendJson(res, 201, { donor });
  } catch (error) {
    return sendJson(res, 400, { error: 'Invalid donor profile request' });
  }
}

async function serveAdminPeriods(req, res, { store, env }) {
  if (!requireAdmin(req, res, env)) return;

  if (!store.periodSettings || !store.upsertPeriodSetting) {
    return sendJson(res, 503, { error: 'Period settings are not supported by this store' });
  }

  if (req.method === 'GET') {
    return sendJson(res, 200, { periods: await store.periodSettings() });
  }

  try {
    const body = await readJsonBody(req);
    if (body.period !== 'all' && body.period !== 'month') {
      return sendJson(res, 400, { error: 'Unsupported leaderboard period' });
    }
    const label = String(body.label || '').trim();
    if (!label) return sendJson(res, 400, { error: 'Period setting requires a label' });
    const period = await store.upsertPeriodSetting({
      period: body.period,
      label,
      active: body.active,
    });
    return sendJson(res, 200, { period });
  } catch (error) {
    return sendJson(res, 400, { error: 'Invalid period setting request' });
  }
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

async function serveGoogleCallback(req, res, { google, store, env }) {
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
    session = await store.createSession({ ...donor, expiresAt: sessionExpiry(env) });
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
    'Set-Cookie': sessionCookie(session.id, { maxAge: sessionTtlSeconds(env) }),
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
  const donorProfiles = store.donorProfiles ? await store.donorProfiles() : [];
  const donor = leaderboardDisplayFor({
    donorId: share.donorId,
    tab: share.period,
    donations: await store.confirmedDonations(),
    donorProfiles,
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
    <p><strong>${escapeHtml(donor ? `#${donor.rank} · ${donor.amountHidden ? 'Private gift' : `$${Math.round(donor.amount).toLocaleString('en-US')}`}` : 'Shared rank')}</strong></p>
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

function parseCsvLine(line) {
  const values = [];
  let current = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"' && quoted && next === '"') {
      current += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

function parseDonationCsv(raw) {
  const lines = String(raw || '').split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  if (lines.length < 2) throw new Error('CSV import requires at least one donation row');
  const headers = parseCsvLine(lines[0]);
  ['donorId', 'displayName', 'amount'].forEach((header) => {
    if (!headers.includes(header)) throw new Error(`CSV import requires ${header} column`);
  });
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row = {};
    headers.forEach((header, index) => { row[header] = values[index] || ''; });
    const amount = Math.max(0, Number(row.amount) || 0);
    if (!String(row.donorId || '').trim()) throw new Error('CSV row requires a donor id');
    if (!String(row.displayName || '').trim()) throw new Error('CSV row requires a display name');
    if (amount < 1) throw new Error('CSV row amount must be at least $1');
    return {
      donorId: row.donorId,
      displayName: row.displayName,
      amount,
      method: row.method || 'CSV import',
      note: row.note || '',
    };
  });
}

async function serveAdminImportCsv(req, res, { store, env }) {
  if (!requireAdmin(req, res, env)) return;
  try {
    const rows = parseDonationCsv(await readRawBody(req));
    const donations = [];
    for (const row of rows) {
      donations.push(await store.createManualDonation(row));
    }
    return sendJson(res, 201, { imported: donations.length, donations });
  } catch (error) {
    return sendJson(res, 400, { error: error.message || 'Invalid CSV import' });
  }
}

async function serveAdminSessionCleanup(req, res, { store, env }) {
  if (!requireAdmin(req, res, env)) return;
  if (!store.cleanupExpiredSessions) return sendJson(res, 503, { error: 'Session cleanup is not supported by this store' });
  return sendJson(res, 200, { removed: await store.cleanupExpiredSessions() });
}

function serveAdminPage(_req, res) {
  return send(res, 200, `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Crowned Admin</title>
  <style>
    :root { color-scheme: light; --ink: #302b26; --muted: rgba(48,43,38,.64); --line: rgba(96,73,45,.16); --panel: rgba(255,255,255,.62); --accent: #6d755f; }
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; font-family: Arial, sans-serif; background: #fbf7f0; color: var(--ink); }
    main { width: min(1120px, calc(100vw - 32px)); margin: 0 auto; padding: 34px 0 56px; }
    header { display: flex; justify-content: space-between; gap: 18px; align-items: end; margin-bottom: 22px; border-bottom: 1px solid var(--line); padding-bottom: 18px; }
    h1, h2 { font-family: Georgia, serif; font-weight: 600; letter-spacing: 0; margin: 0; }
    h1 { font-size: clamp(34px, 5vw, 54px); line-height: .95; }
    h2 { font-size: 22px; margin-bottom: 14px; }
    p { color: var(--muted); line-height: 1.5; }
    section { padding: 18px 0 22px; border-bottom: 1px solid var(--line); }
    .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
    .wide { grid-column: 1 / -1; }
    label { display: grid; gap: 6px; font-size: 12px; font-weight: 700; color: rgba(48,43,38,.72); }
    input, textarea, select { width: 100%; border: 1px solid var(--line); background: rgba(255,255,255,.72); color: var(--ink); border-radius: 8px; padding: 10px 11px; font: inherit; }
    textarea { min-height: 120px; resize: vertical; }
    button, a.button { border: 1px solid rgba(86,99,78,.28); border-radius: 8px; background: rgba(86,99,78,.12); color: #36402f; padding: 10px 13px; font-weight: 800; text-decoration: none; cursor: pointer; }
    button.secondary { background: transparent; }
    .actions { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; margin-top: 14px; }
    .checks { display: flex; gap: 14px; flex-wrap: wrap; align-items: center; }
    .checks label { display: inline-flex; grid-auto-flow: column; align-items: center; gap: 7px; }
    .checks input { width: auto; }
    .status { min-height: 24px; color: var(--muted); font-size: 13px; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; background: var(--panel); }
    th, td { text-align: left; padding: 10px 8px; border-bottom: 1px solid var(--line); font-size: 13px; }
    th { color: rgba(48,43,38,.58); font-size: 11px; letter-spacing: 1px; text-transform: uppercase; }
    @media (max-width: 760px) { header, .grid { display: block; } label { margin-bottom: 12px; } }
  </style>
</head>
<body>
  <main>
    <header>
      <div>
        <h1>Crowned Admin</h1>
        <p>Manage donor records, privacy, periods, imports, exports, and session cleanup.</p>
      </div>
      <label>Admin token
        <input id="admin-token" type="password" autocomplete="off" placeholder="x-admin-token" />
      </label>
    </header>

    <section>
      <h2>Donor profiles</h2>
      <div class="grid">
        <label>Donor id <input id="donor-id" /></label>
        <label>Display name <input id="donor-display-name" /></label>
        <label>Public name <input id="donor-public-name" /></label>
        <div class="checks">
          <label><input id="donor-anonymous" type="checkbox" /> Anonymous</label>
          <label><input id="donor-hidden" type="checkbox" /> Hidden</label>
          <label><input id="donor-show-amount" type="checkbox" checked /> Show amount</label>
        </div>
      </div>
      <div class="actions">
        <button id="save-donor">Save donor</button>
        <button id="load-donors" class="secondary">Refresh donors</button>
      </div>
      <table aria-label="Donor profiles table">
        <thead><tr><th>Donor</th><th>Public</th><th>Privacy</th><th>Total</th></tr></thead>
        <tbody id="donors-body"><tr><td colspan="4">No donor profiles loaded.</td></tr></tbody>
      </table>
    </section>

    <section>
      <h2>Manual adjustment</h2>
      <div class="grid">
        <label>Donor id <input id="gift-donor-id" /></label>
        <label>Display name <input id="gift-display-name" /></label>
        <label>Amount <input id="gift-amount" type="number" min="1" step="1" /></label>
        <label>Note <input id="gift-note" /></label>
      </div>
      <div class="actions"><button id="add-gift">Add adjustment</button></div>
    </section>

    <section>
      <h2>Leaderboard periods</h2>
      <div class="grid">
        <label>Period
          <select id="period-id"><option value="all">All Time</option><option value="month">This Month</option></select>
        </label>
        <label>Label <input id="period-label" value="All Time" /></label>
        <div class="checks"><label><input id="period-active" type="checkbox" checked /> Active</label></div>
      </div>
      <div class="actions">
        <button id="save-period">Save period</button>
        <button id="load-periods" class="secondary">Refresh periods</button>
      </div>
    </section>

    <section>
      <h2>CSV import</h2>
      <p>Headers: donorId, displayName, amount, note.</p>
      <textarea id="csv-input" spellcheck="false">donorId,displayName,amount,note</textarea>
      <div class="actions"><button id="import-csv">Import CSV</button></div>
    </section>

    <section>
      <h2>Data operations</h2>
      <div class="actions">
        <button id="export-donations">Export donations</button>
        <button id="cleanup-sessions">Cleanup expired sessions</button>
      </div>
      <p class="status" id="status" role="status"></p>
    </section>
  </main>
  <script>
    const $ = id => document.getElementById(id);
    const status = message => { $('status').textContent = message; };
    const token = () => $('admin-token').value.trim();
    async function api(path, options = {}) {
      const response = await fetch(path, {
        ...options,
        headers: { 'x-admin-token': token(), ...(options.headers || {}) },
      });
      const text = await response.text();
      const payload = text && (response.headers.get('content-type') || '').includes('json') ? JSON.parse(text) : text;
      if (!response.ok) throw new Error(payload.error || 'Admin request failed');
      return payload;
    }
    async function loadDonors() {
      const payload = await api('/api/admin/donors');
      $('donors-body').innerHTML = payload.donors.length ? payload.donors.map(donor => '<tr><td>' + donor.donorId + '<br>' + donor.displayName + '</td><td>' + (donor.publicName || '') + '</td><td>' + [donor.anonymous ? 'anonymous' : '', donor.hidden ? 'hidden' : '', donor.showAmount ? '' : 'amount private'].filter(Boolean).join(', ') + '</td><td>$' + Math.round(donor.totals.allTime).toLocaleString('en-US') + '</td></tr>').join('') : '<tr><td colspan="4">No donor profiles found.</td></tr>';
      status('Donor profiles loaded.');
    }
    async function loadPeriods() {
      const payload = await api('/api/admin/periods');
      const period = payload.periods.find(item => item.period === $('period-id').value) || payload.periods[0];
      $('period-id').value = period.period;
      $('period-label').value = period.label;
      $('period-active').checked = period.active;
      status('Leaderboard periods loaded.');
    }
    $('save-donor').onclick = async () => {
      await api('/api/admin/donors', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ donorId: $('donor-id').value, displayName: $('donor-display-name').value, publicName: $('donor-public-name').value, anonymous: $('donor-anonymous').checked, hidden: $('donor-hidden').checked, showAmount: $('donor-show-amount').checked }) });
      await loadDonors();
    };
    $('load-donors').onclick = () => loadDonors().catch(error => status(error.message));
    $('add-gift').onclick = async () => {
      const payload = { donorId: $('gift-donor-id').value, displayName: $('gift-display-name').value, amount: $('gift-amount').value, note: $('gift-note').value };
      await api('/api/admin/donations', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
      status('Manual adjustment added.');
    };
    $('save-period').onclick = async () => {
      await api('/api/admin/periods', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ period: $('period-id').value, label: $('period-label').value, active: $('period-active').checked }) });
      status('Leaderboard period saved.');
    };
    $('load-periods').onclick = () => loadPeriods().catch(error => status(error.message));
    $('period-id').onchange = () => { $('period-label').value = $('period-id').value === 'month' ? 'This Month' : 'All Time'; };
    $('import-csv').onclick = async () => {
      const payload = await api('/api/admin/import.csv', { method: 'POST', headers: { 'content-type': 'text/csv' }, body: $('csv-input').value });
      status('Imported ' + payload.imported + ' donation row(s).');
    };
    $('export-donations').onclick = async () => {
      const response = await fetch('/api/admin/export.csv', { headers: { 'x-admin-token': token() } });
      const text = await response.text();
      if (!response.ok) throw new Error(text || 'Could not export donations');
      const url = URL.createObjectURL(new Blob([text], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'crowned-donations.csv';
      link.click();
      URL.revokeObjectURL(url);
      status('Donation export downloaded.');
    };
    $('cleanup-sessions').onclick = async () => {
      const payload = await api('/api/admin/sessions/cleanup', { method: 'POST' });
      status('Removed ' + payload.removed.sessions + ' expired session(s).');
    };
  </script>
</body>
</html>`, {
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
        return serveGoogleCallback(req, res, { google, store, env });
      }
      if (req.method === 'GET' && urlPath === '/api/session') {
        return serveSessionApi(req, res, { store });
      }
      if ((req.method === 'GET' || req.method === 'POST') && urlPath === '/api/admin/donors') {
        return serveAdminDonors(req, res, { store, env });
      }
      if ((req.method === 'GET' || req.method === 'POST') && urlPath === '/api/admin/periods') {
        return serveAdminPeriods(req, res, { store, env });
      }
      if (req.method === 'POST' && urlPath === '/api/admin/import.csv') {
        return serveAdminImportCsv(req, res, { store, env });
      }
      if (req.method === 'POST' && urlPath === '/api/admin/sessions/cleanup') {
        return serveAdminSessionCleanup(req, res, { store, env });
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
  serveAdminDonors,
  serveAdminPeriods,
  serveAdminImportCsv,
  serveAdminSessionCleanup,
  serveCreateShareLink,
  serveShareLink,
  servePublicSharePage,
  serveAdminDonation,
  serveAdminExport,
};
