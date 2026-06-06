const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const serverPath = path.join(root, 'server.js');
const serverSource = fs.readFileSync(serverPath, 'utf8');

function loadServerModule() {
  const module = { exports: {} };
  const context = {
    __dirname: root,
    require(id) {
      if (id === 'http') {
        return {
          createServer(handler) {
            return {
              handler,
              listen() {},
              close() {},
            };
          },
        };
      }
      if (id.startsWith('.')) {
        return require(path.resolve(root, id));
      }
      return require(id);
    },
    module,
    exports: module.exports,
    process: {
      env: {},
      on() {},
    },
    console,
  };
  vm.runInNewContext(serverSource, context, { filename: serverPath });
  return module.exports;
}

function dispatch(handler, url, method = 'GET') {
  return new Promise((resolve) => {
    const req = { url, method };
    const res = {
      writeHead(status, headers) {
        this.status = status;
        this.headers = headers;
      },
      end(body) {
        resolve({
          status: this.status,
          headers: this.headers,
          body: String(body),
        });
      },
    };
    handler(req, res);
  });
}

(async () => {
  const serverModule = loadServerModule();
  assert.equal(typeof serverModule.createServer, 'function');

  const emptyStore = {
    async confirmedDonations() {
      return [];
    },
  };
  const server = serverModule.createServer({ root, store: emptyStore });
  const response = await dispatch(server.handler, '/api/leaderboard?period=all&donorId=tudi');

  assert.equal(response.status, 200);
  assert.match(response.headers['Content-Type'], /application\/json/);

  const payload = JSON.parse(response.body);
  assert.equal(payload.period, 'all');
  assert.equal(payload.activeDonorId, 'tudi');
  assert.deepEqual(payload.ranked, []);
  assert.deepEqual(payload.topRows, []);
  assert.deepEqual(payload.nearbyRows, []);
  assert.equal(payload.shouldShowNearby, false);

  const badPeriod = await dispatch(server.handler, '/api/leaderboard?period=week');
  assert.equal(badPeriod.status, 400);
  assert.match(JSON.parse(badPeriod.body).error, /period/);

  console.log('leaderboard api regression passed');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
