#!/usr/bin/env node

const dotenv = require('dotenv');

dotenv.config();

const REQUIRED = [
  ['APP_BASE_URL', 'http://localhost:8765'],
  ['ADMIN_TOKEN', 'replace-with-a-long-random-token'],
  ['STRIPE_SECRET_KEY', 'sk_live_or_test_key'],
  ['STRIPE_WEBHOOK_SECRET', 'whsec_from_stripe_dashboard_or_cli'],
  ['GOOGLE_CLIENT_ID', 'google-client-id.apps.googleusercontent.com'],
  ['GOOGLE_CLIENT_SECRET', 'google-client-secret'],
  ['GOOGLE_REDIRECT_URI', 'http://localhost:8765/api/auth/google/callback'],
];

const OPTIONAL = [
  ['DATABASE_URL', 'postgres://crowned:crowned@localhost:5432/crowned', { optional: 'JSON_FALLBACK' }],
];

let failures = 0;

for (const [key, placeholder] of REQUIRED) {
  const value = process.env[key] || '';
  let status = 'SET';
  if (!value) status = 'MISSING';
  if (value === placeholder) status = 'PLACEHOLDER';
  if (status !== 'SET') failures += 1;
  console.log(`${key}=${status}`);
}

for (const [key, placeholder, options] of OPTIONAL) {
  const value = process.env[key] || '';
  let status = 'SET';
  if (!value) status = options.optional;
  if (value === placeholder) status = 'PLACEHOLDER';
  if (status === 'PLACEHOLDER') failures += 1;
  console.log(`${key}=${status}`);
}

if (process.env.GOOGLE_REDIRECT_URI && process.env.APP_BASE_URL) {
  const expected = `${process.env.APP_BASE_URL.replace(/\/$/, '')}/api/auth/google/callback`;
  if (process.env.GOOGLE_REDIRECT_URI !== expected) {
    failures += 1;
    console.log('GOOGLE_REDIRECT_URI_MATCH=MISMATCH');
  } else {
    console.log('GOOGLE_REDIRECT_URI_MATCH=OK');
  }
}

if (failures > 0) {
  console.error(`Service config check failed: ${failures} value(s) are missing, placeholders, or mismatched.`);
  process.exit(1);
}

console.log('Service config check passed.');
