const cookie = require('cookie');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.jsx': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json; charset=utf-8',
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'Cache-Control': 'no-cache', ...headers });
  res.end(body);
}

function sendJson(res, status, payload) {
  send(res, status, JSON.stringify(payload), { 'Content-Type': 'application/json; charset=utf-8' });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) reject(new Error('Request body too large'));
    });
    req.on('end', () => resolve(raw));
    req.on('error', reject);
  });
}

async function readJsonBody(req) {
  const raw = await readBody(req);
  if (!raw) return {};
  return JSON.parse(raw);
}

const readRawBody = readBody;

function cookieValue(req, name) {
  const parsed = cookie.parse(req.headers?.cookie || '');
  return parsed[name] || '';
}

function sessionCookie(sessionId) {
  return cookie.serialize('crowned_session', sessionId, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
  });
}

function publicBaseUrl(env, fallbackPort) {
  return String(env.APP_BASE_URL || `http://localhost:${fallbackPort}`).replace(/\/$/, '');
}

module.exports = {
  MIME,
  send,
  sendJson,
  readBody,
  readRawBody,
  readJsonBody,
  cookieValue,
  sessionCookie,
  publicBaseUrl,
};
