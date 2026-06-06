const crypto = require('crypto');

function required(name, env) {
  return String(env[name] || '').trim();
}

function createGoogleAuthProvider({ env = process.env, fetchImpl = null, googleOAuthClient = null } = {}) {
  const clientId = required('GOOGLE_CLIENT_ID', env);
  const clientSecret = required('GOOGLE_CLIENT_SECRET', env);
  const appBaseUrl = required('APP_BASE_URL', env) || 'http://localhost:8765';
  const redirectUri = required('GOOGLE_REDIRECT_URI', env) || `${appBaseUrl}/api/auth/google/callback`;

  function missingConfig() {
    if (!clientId) return { ok: false, status: 503, error: 'Missing GOOGLE_CLIENT_ID for Google sign-in' };
    if (!clientSecret) return { ok: false, status: 503, error: 'Missing GOOGLE_CLIENT_SECRET for Google sign-in' };
    return null;
  }

  function startUrl({ state: providedState } = {}) {
    const missing = missingConfig();
    if (missing) return missing;

    const state = providedState || crypto.randomBytes(12).toString('hex');
    if (!fetchImpl) {
      const { OAuth2Client } = require('google-auth-library');
      const client = googleOAuthClient || new OAuth2Client(clientId, clientSecret, redirectUri);
      return {
        ok: true,
        state,
        redirectUrl: client.generateAuthUrl({
          access_type: 'offline',
          prompt: 'select_account',
          scope: ['openid', 'email', 'profile'],
          state,
        }),
      };
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      prompt: 'select_account',
      state,
    });
    return {
      ok: true,
      state,
      redirectUrl: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
    };
  }

  async function completeCallback({ code }) {
    const missing = missingConfig();
    if (missing) return missing;
    if (!code) return { ok: false, status: 400, error: 'Missing Google authorization code' };

    if (!fetchImpl) {
      const { OAuth2Client } = require('google-auth-library');
      const client = googleOAuthClient || new OAuth2Client(clientId, clientSecret, redirectUri);
      const { tokens } = await client.getToken(code);
      client.setCredentials(tokens);
      const ticket = await client.verifyIdToken({
        idToken: tokens.id_token,
        audience: clientId,
      });
      const profile = ticket.getPayload();
      if (!profile || !profile.sub) {
        return { ok: false, status: 502, error: 'Google profile lookup failed' };
      }
      return {
        ok: true,
        donor: {
          id: `google_${profile.sub}`,
          displayName: profile.name || profile.email || 'Google donor',
          email: profile.email || '',
        },
      };
    }

    const tokenParams = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    });
    const tokenResponse = await fetchImpl('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenParams.toString(),
    });
    const tokenPayload = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenPayload.access_token) {
      return { ok: false, status: tokenResponse.status || 502, error: tokenPayload.error_description || 'Google token exchange failed' };
    }

    const profileResponse = await fetchImpl('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${tokenPayload.access_token}` },
    });
    const profile = await profileResponse.json();
    if (!profileResponse.ok || !profile.sub) {
      return { ok: false, status: profileResponse.status || 502, error: 'Google profile lookup failed' };
    }

    return {
      ok: true,
      donor: {
        id: `google_${profile.sub}`,
        displayName: profile.name || profile.email || 'Google donor',
        email: profile.email || '',
      },
    };
  }

  return { startUrl, completeCallback };
}

module.exports = { createGoogleAuthProvider };
