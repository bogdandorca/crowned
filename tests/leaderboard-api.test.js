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

  const server = serverModule.createServer({ root });
  const response = await dispatch(server.handler, '/api/leaderboard?period=all&donorId=tudi');

  assert.equal(response.status, 200);
  assert.match(response.headers['Content-Type'], /application\/json/);

  const payload = JSON.parse(response.body);
  assert.equal(payload.period, 'all');
  assert.equal(payload.activeDonorId, 'tudi');
  assert.equal(payload.ranked[0].rank, 1);
  assert.deepEqual(payload.topRows.map(d => d.rank), [4, 5, 6, 7, 8, 9, 10]);
  assert.equal(payload.nearbyRows.length, 5);
  assert.equal(payload.nearbyRows[2].id, 'tudi');

  const badPeriod = await dispatch(server.handler, '/api/leaderboard?period=week');
  assert.equal(badPeriod.status, 400);
  assert.match(JSON.parse(badPeriod.body).error, /period/);

  console.log('leaderboard api regression passed');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
