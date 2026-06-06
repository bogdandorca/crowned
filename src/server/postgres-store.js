const crypto = require('crypto');
const { Pool } = require('pg');

function randomId(prefix) {
  return `${prefix}_${crypto.randomBytes(12).toString('hex')}`;
}

function normalizeDonation(row) {
  if (!row) return null;
  return {
    id: row.id,
    donorId: row.donor_id,
    displayName: row.display_name,
    amount: Number(row.amount) || 0,
    method: row.method,
    status: row.status,
    provider: row.provider,
    providerSessionId: row.provider_session_id,
    note: row.note || '',
    createdAt: row.created_at,
    confirmedAt: row.confirmed_at,
  };
}

function normalizeShare(row) {
  if (!row) return null;
  return {
    id: row.id,
    donorId: row.donor_id,
    format: row.format,
    period: row.period,
    createdAt: row.created_at,
  };
}

function normalizeSession(row) {
  if (!row) return null;
  return {
    id: row.id,
    donorId: row.donor_id,
    displayName: row.display_name,
    email: row.email,
    createdAt: row.created_at,
  };
}

function quoteIdentifier(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function databaseNameFromConnectionString(connectionString) {
  const url = new URL(connectionString);
  const name = decodeURIComponent((url.pathname || '').replace(/^\//, ''));
  if (!name) throw new Error('DATABASE_URL must include a database name');
  return name;
}

function maintenanceConnectionString(connectionString) {
  const url = new URL(connectionString);
  url.pathname = '/postgres';
  return url.toString();
}

function isMissingDatabaseError(error) {
  return error?.code === '3D000' || /database .* does not exist/i.test(error?.message || '');
}

function createPostgresStore({ connectionString, pool, poolFactory = config => new Pool(config) } = {}) {
  let db = pool || poolFactory({ connectionString });
  let schemaReady = null;

  const schemaSql = `
    CREATE TABLE IF NOT EXISTS donations (
      id TEXT PRIMARY KEY,
      donor_id TEXT NOT NULL,
      display_name TEXT NOT NULL,
      amount NUMERIC NOT NULL,
      method TEXT NOT NULL,
      status TEXT NOT NULL,
      provider TEXT NOT NULL,
      provider_session_id TEXT,
      note TEXT,
      created_at TIMESTAMPTZ NOT NULL,
      confirmed_at TIMESTAMPTZ
    );
    CREATE INDEX IF NOT EXISTS idx_donations_status ON donations(status);
    CREATE INDEX IF NOT EXISTS idx_donations_provider_session ON donations(provider_session_id);

    CREATE TABLE IF NOT EXISTS share_links (
      id TEXT PRIMARY KEY,
      donor_id TEXT NOT NULL,
      format TEXT NOT NULL,
      period TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      donor_id TEXT NOT NULL,
      display_name TEXT NOT NULL,
      email TEXT,
      created_at TIMESTAMPTZ NOT NULL
    );

    CREATE TABLE IF NOT EXISTS oauth_states (
      state TEXT PRIMARY KEY,
      guest_donor_id TEXT,
      created_at TIMESTAMPTZ NOT NULL
    );
  `;

  async function createMissingDatabase() {
    if (pool || !connectionString) throw new Error('Target Postgres database does not exist');
    const databaseName = databaseNameFromConnectionString(connectionString);
    const maintenancePool = poolFactory({ connectionString: maintenanceConnectionString(connectionString) });
    try {
      await maintenancePool.query(`CREATE DATABASE ${quoteIdentifier(databaseName)}`);
    } catch (error) {
      if (error?.code !== '42P04') throw error;
    } finally {
      if (typeof maintenancePool.end === 'function') await maintenancePool.end();
    }
  }

  async function initializeSchema() {
    try {
      await db.query(schemaSql);
    } catch (error) {
      if (!isMissingDatabaseError(error)) throw error;
      await createMissingDatabase();
      if (typeof db.end === 'function') await db.end();
      db = poolFactory({ connectionString });
      await db.query(schemaSql);
    }
  }

  async function ensureSchema() {
    if (!schemaReady) {
      schemaReady = initializeSchema().catch((error) => {
        schemaReady = null;
        throw error;
      });
    }
    return schemaReady;
  }

  async function createDonation({ donorId, displayName, amount, method, status = 'pending', provider = 'stripe', note = '', providerSessionId = null }) {
    await ensureSchema();
    const now = new Date().toISOString();
    const result = await db.query(`
      INSERT INTO donations (id, donor_id, display_name, amount, method, status, provider, provider_session_id, note, created_at, confirmed_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [
      randomId('donation'),
      String(donorId || '').trim(),
      String(displayName || '').trim(),
      Math.max(0, Number(amount) || 0),
      String(method || 'Card'),
      status,
      provider,
      providerSessionId,
      String(note || '').trim(),
      now,
      status === 'confirmed' ? now : null,
    ]);
    return normalizeDonation(result.rows[0]);
  }

  function createDonationAttempt(input) {
    return createDonation({ ...input, status: 'pending', provider: 'stripe' });
  }

  function createManualDonation(input) {
    return createDonation({ ...input, status: 'confirmed', provider: 'admin', method: input.method || 'Manual adjustment' });
  }

  async function attachStripeSession(donationId, sessionId) {
    await ensureSchema();
    const result = await db.query(`
      UPDATE donations
      SET provider_session_id = $1
      WHERE id = $2
      RETURNING *
    `, [sessionId, donationId]);
    return normalizeDonation(result.rows[0]);
  }

  async function confirmStripeSession(sessionId) {
    await ensureSchema();
    const result = await db.query(`
      UPDATE donations
      SET status = 'confirmed', confirmed_at = COALESCE(confirmed_at, $1)
      WHERE provider_session_id = $2
      RETURNING *
    `, [new Date().toISOString(), sessionId]);
    return normalizeDonation(result.rows[0]);
  }

  async function confirmedDonations() {
    await ensureSchema();
    const result = await db.query("SELECT * FROM donations WHERE status = 'confirmed' ORDER BY created_at ASC");
    return result.rows.map(normalizeDonation);
  }

  async function allDonations() {
    await ensureSchema();
    const result = await db.query('SELECT * FROM donations ORDER BY created_at ASC');
    return result.rows.map(normalizeDonation);
  }

  async function createShareLink({ donorId, format = 'story', period = 'all' }) {
    await ensureSchema();
    const result = await db.query(`
      INSERT INTO share_links (id, donor_id, format, period, created_at)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [
      randomId('share'),
      String(donorId || '').trim(),
      format === 'square' ? 'square' : 'story',
      period === 'month' ? 'month' : 'all',
      new Date().toISOString(),
    ]);
    return normalizeShare(result.rows[0]);
  }

  async function shareLinkById(id) {
    await ensureSchema();
    const result = await db.query('SELECT * FROM share_links WHERE id = $1', [id]);
    return normalizeShare(result.rows[0]);
  }

  async function createSession({ donorId, displayName, email }) {
    await ensureSchema();
    const result = await db.query(`
      INSERT INTO sessions (id, donor_id, display_name, email, created_at)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [
      randomId('session'),
      donorId,
      displayName,
      email,
      new Date().toISOString(),
    ]);
    return normalizeSession(result.rows[0]);
  }

  async function sessionById(id) {
    await ensureSchema();
    const result = await db.query('SELECT * FROM sessions WHERE id = $1', [id]);
    return normalizeSession(result.rows[0]);
  }

  async function createOAuthState({ state, guestDonorId }) {
    await ensureSchema();
    await db.query(`
      INSERT INTO oauth_states (state, guest_donor_id, created_at)
      VALUES ($1, $2, $3)
      ON CONFLICT (state)
      DO UPDATE SET guest_donor_id = EXCLUDED.guest_donor_id, created_at = EXCLUDED.created_at
    `, [state, guestDonorId || '', new Date().toISOString()]);
  }

  async function consumeOAuthState(state) {
    await ensureSchema();
    const result = await db.query('DELETE FROM oauth_states WHERE state = $1 RETURNING *', [state]);
    const row = result.rows[0];
    return row ? { state: row.state, guestDonorId: row.guest_donor_id } : null;
  }

  async function linkGuestDonations({ guestDonorId, donorId, displayName }) {
    if (!guestDonorId || !donorId) return 0;
    await ensureSchema();
    const result = await db.query(`
      UPDATE donations
      SET donor_id = $1, display_name = $2
      WHERE donor_id = $3 AND status IN ('pending', 'confirmed')
    `, [donorId, displayName || 'Google donor', guestDonorId]);
    return result.rowCount || 0;
  }

  return {
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

module.exports = { createPostgresStore };
