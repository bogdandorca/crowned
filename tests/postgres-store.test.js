const assert = require('assert');

const { createPostgresStore } = require('../src/server/postgres-store');

function createMissingDatabasePoolFactory() {
  const pools = [];

  function makePool(config) {
    const pool = {
      config,
      queries: [],
      ended: false,
      async query(sql, params) {
        this.queries.push({ sql, params });
        const isTargetPool = pools.indexOf(this) === 0;
        const isSchemaQuery = /CREATE TABLE IF NOT EXISTS donations/.test(sql);
        if (isTargetPool && isSchemaQuery) {
          const error = new Error('database "crowned_missing" does not exist');
          error.code = '3D000';
          throw error;
        }
        if (/SELECT \* FROM donations/.test(sql)) return { rows: [] };
        return { rows: [] };
      },
      async end() {
        this.ended = true;
      },
    };
    pools.push(pool);
    return pool;
  }

  makePool.pools = pools;
  return makePool;
}

(async () => {
  const poolFactory = createMissingDatabasePoolFactory();
  const store = createPostgresStore({
    connectionString: 'postgres://user:pass@localhost:5432/crowned_missing',
    poolFactory,
  });

  const donations = await store.confirmedDonations();

  assert.deepEqual(donations, []);
  assert.equal(poolFactory.pools.length, 3, 'should create target, maintenance, then replacement target pools');
  assert.equal(poolFactory.pools[0].ended, true, 'missing-database target pool should be closed before reconnecting');
  assert.match(poolFactory.pools[1].config.connectionString, /\/postgres$/);
  assert.match(poolFactory.pools[1].queries[0].sql, /CREATE DATABASE "crowned_missing"/);
  assert.match(poolFactory.pools[2].queries[0].sql, /CREATE TABLE IF NOT EXISTS donations/);

  console.log('postgres store regression passed');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
