const path = require('path');
const { createJsonStore } = require('./json-store');
const { createPostgresStore } = require('./postgres-store');

function createStore({ env = process.env, storePath, postgresPool } = {}) {
  const databaseUrl = env.DATABASE_URL || env.POSTGRES_URL || '';
  if (/^sqlite:/i.test(databaseUrl) || env.CROWNED_SQLITE_PATH) {
    throw new Error('SQLite is not supported for Crowned production storage. Use DATABASE_URL=postgres://...');
  }
  if (databaseUrl) {
    if (!/^postgres(ql)?:\/\//i.test(databaseUrl)) {
      throw new Error('DATABASE_URL must be a postgres:// or postgresql:// URL');
    }
    return createPostgresStore({ connectionString: databaseUrl, pool: postgresPool });
  }
  return createJsonStore({ filePath: storePath || path.join(process.cwd(), 'data/crowned-store.json') });
}

module.exports = { createStore };
