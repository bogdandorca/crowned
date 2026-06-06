const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const serverSource = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
const envExample = fs.readFileSync(path.join(root, '.env.example'), 'utf8');
const serviceConfigSource = fs.readFileSync(path.join(root, 'scripts/check-service-config.js'), 'utf8');

assert.equal(typeof packageJson.dependencies, 'object', 'package.json should declare runtime dependencies');
assert(packageJson.dependencies.stripe, 'Stripe should be a runtime dependency');
assert(packageJson.dependencies['google-auth-library'], 'Google auth library should be a runtime dependency');
assert(packageJson.dependencies.dotenv, 'dotenv should be a runtime dependency');
assert(packageJson.dependencies.cookie, 'cookie should be a runtime dependency');
assert(packageJson.dependencies.pg, 'Postgres should be a runtime dependency');
assert(!packageJson.dependencies['better-sqlite3'], 'SQLite should not be the production database dependency');

assert(
  fs.existsSync(path.join(root, 'src/server/create-server.js')),
  'server creation should live in src/server/create-server.js'
);
assert(
  fs.existsSync(path.join(root, 'src/server/http-utils.js')),
  'shared HTTP helpers should live in src/server/http-utils.js'
);
assert(
  fs.existsSync(path.join(root, 'src/server/logger.js')),
  'structured logging should live in src/server/logger.js'
);
assert(
  fs.existsSync(path.join(root, 'src/server/postgres-store.js')),
  'Postgres persistence should live in src/server/postgres-store.js'
);
assert(
  !fs.existsSync(path.join(root, 'src/server/sqlite-store.js')),
  'SQLite persistence should not remain in the live server path'
);
assert(
  fs.existsSync(path.join(root, '.env.example')) &&
    fs.existsSync(path.join(root, 'Dockerfile')) &&
    fs.existsSync(path.join(root, 'docs/deployment.md')),
  'deployment env template, Dockerfile, and docs should exist'
);
assert(
  fs.existsSync(path.join(root, 'scripts/check-service-config.js')) &&
    packageJson.scripts['check:services'],
  'service configuration checker should be available for validating local credentials'
);
assert(
  !/^DATABASE_URL=/m.test(envExample) &&
    /^# DATABASE_URL=postgres:\/\//m.test(envExample),
  'local env template should not force Postgres unless DATABASE_URL is explicitly enabled'
);
assert(
  serviceConfigSource.includes("optional: 'JSON_FALLBACK'"),
  'service config checker should allow the local JSON fallback when DATABASE_URL is unset'
);

assert(
  serverSource.includes("if (require.main === module)") &&
    serverSource.includes("require('dotenv').config()") &&
    serverSource.includes("require('./src/server/create-server')") &&
    !serverSource.includes("function serveDonationApi") &&
    !serverSource.includes("function serveStatic"),
  'server.js should be a thin dependency-ready entrypoint with startup-only dotenv loading'
);

const { createServer } = require('../src/server/create-server');
assert.equal(typeof createServer, 'function', 'createServer should be exported from the server module');

const { createLogger, newRequestId } = require('../src/server/logger');
const logLines = [];
const logger = createLogger({
  env: { CROWNED_LOGS: 'json' },
  output: {
    log(line) {
      logLines.push(line);
    },
    error(line) {
      logLines.push(line);
    },
  },
});
logger.info('dependency.ready', { requestId: newRequestId() });
const structuredLog = JSON.parse(logLines[0]);
assert.equal(structuredLog.level, 'info');
assert.equal(structuredLog.message, 'dependency.ready');
assert(structuredLog.requestId, 'structured logs should include supplied fields');

console.log('dependency-ready server regression passed');
