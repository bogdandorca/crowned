# Crowned Service Setup

This guide covers the external services Crowned needs for a production-like run:

- PostgreSQL for durable application data.
- Stripe Checkout for donations.
- Stripe webhooks for trusted payment confirmation.
- Google OAuth for donor sign-in.

Never commit real secrets. Put local values in `.env`; the file is ignored by git.

## Environment Variables

Set these values in `.env` for local development or in your hosting provider's secret manager for production:

```env
PORT=8765
HOST=0.0.0.0
APP_BASE_URL=https://your-domain.example

# Leave unset for local JSON fallback. Set for production Postgres.
# DATABASE_URL=postgres://user:password@host:5432/crowned
ADMIN_TOKEN=replace-with-a-long-random-token

STRIPE_SECRET_KEY=sk_live_or_test_key
STRIPE_WEBHOOK_SECRET=whsec_from_stripe_dashboard_or_cli

GOOGLE_CLIENT_ID=google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=google-client-secret
GOOGLE_REDIRECT_URI=https://your-domain.example/api/auth/google/callback
```

For local OAuth testing, use:

```env
APP_BASE_URL=http://localhost:8765
GOOGLE_REDIRECT_URI=http://localhost:8765/api/auth/google/callback
```

## PostgreSQL

1. Create a PostgreSQL role for the application.
2. Either create the database yourself or give the application role permission to create databases.
3. Give the application role permission to create tables and indexes in the selected database.
4. Set `DATABASE_URL` to the connection URI. Crowned accepts `postgres://...` and `postgresql://...`.
5. If your provider requires TLS, use the connection string format they provide. Many hosted providers include an SSL parameter in the copied URI.
6. Start Crowned once. If the target database does not exist and the role can create databases, Crowned connects to the maintenance `postgres` database, creates the target database, reconnects, and creates the required tables:
   - `donations`
   - `share_links`
   - `sessions`
   - `oauth_states`

Quick connection check:

```bash
psql "$DATABASE_URL" -c "select 1;"
```

If `DATABASE_URL` is omitted, Crowned uses the JSON store under `data/` for local demo mode only. Do not use the JSON fallback for production traffic.

For local Google sign-in testing without Postgres, leave `DATABASE_URL` unset so the OAuth state and session are saved to the local JSON fallback.

## Stripe Checkout

1. Create or open a Stripe account.
2. Start in test mode until the full flow has been verified.
3. In Stripe, copy the secret key for the current mode:
   - Test keys start with `sk_test_`.
   - Live keys start with `sk_live_`.
4. Set `STRIPE_SECRET_KEY`.
5. Confirm your account's payment methods in Stripe Dashboard. Crowned creates Stripe-hosted Checkout Sessions, and Stripe controls which payment methods appear.

Crowned creates Checkout Sessions from `POST /api/donations` with:

- `mode=payment`
- one USD line item for the gift amount
- `success_url=${APP_BASE_URL}/?checkout=success&donation=...`
- `cancel_url=${APP_BASE_URL}/?checkout=cancelled&donation=...`
- metadata containing the Crowned donation id and donor id

Use Stripe test cards while in test mode. A common successful test card is `4242 4242 4242 4242` with any future expiry date and any CVC.

When Stripe redirects a donor back to `/?checkout=success&donation=...`, the browser calls `POST /api/donations/:id/sync`. The server looks up the stored Stripe Checkout Session and confirms the donation only if Stripe reports the session as paid or complete.

## Stripe Webhooks

Stripe Checkout redirects are not enough by themselves to trust a payment. Crowned verifies successful returns with Stripe, and the webhook remains the production backstop for delayed, async, or abandoned-browser payment events.

Production setup:

1. In Stripe Dashboard, create a webhook endpoint.
2. Set the endpoint URL to:

```text
${APP_BASE_URL}/api/stripe/webhook
```

3. Subscribe the endpoint to:

```text
checkout.session.completed
```

4. Copy that endpoint's signing secret. It starts with `whsec_`.
5. Set `STRIPE_WEBHOOK_SECRET`.

Local Stripe CLI setup:

```bash
stripe login
stripe listen --events checkout.session.completed --forward-to localhost:8765/api/stripe/webhook
```

The Stripe CLI prints a temporary `whsec_...` value. Use that CLI value in local `.env`; do not reuse the production dashboard webhook secret for CLI forwarding.

## Google OAuth

1. Open Google Cloud Console and select or create a project.
2. Configure the OAuth consent screen for the project.
3. Create OAuth credentials with application type `Web application`.
4. Add the exact redirect URI Crowned will use:

Local:

```text
http://localhost:8765/api/auth/google/callback
```

Production:

```text
https://your-domain.example/api/auth/google/callback
```

5. Copy the generated client id and client secret.
6. Set:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_REDIRECT_URI`

Crowned requests these scopes:

```text
openid email profile
```

Google redirect URIs must match exactly, including scheme, host, port, and path. If production uses HTTPS, the Google redirect URI must also use HTTPS.

## Admin Token

Generate a long random token for admin APIs:

```bash
openssl rand -hex 32
```

Set it as `ADMIN_TOKEN`. Admin requests must include:

```text
x-admin-token: <ADMIN_TOKEN>
```

Current admin APIs:

- `POST /api/admin/donations`
- `GET /api/admin/export.csv`

## Verification Checklist

After setting the service values:

1. Check that local service values are set:

```bash
npm run check:services
```

The checker prints only `SET`, `MISSING`, `PLACEHOLDER`, or redirect URI match status. It does not print secret values.

2. Restart the server:

```bash
npm start
```

3. Check health:

```bash
curl -i "$APP_BASE_URL/healthz"
```

4. Start Google sign-in from the app and confirm it redirects to Google.
5. Create a test Stripe donation and confirm Stripe redirects to Checkout.
6. After successful payment, confirm the donor total changes when Stripe redirects back to the app.
7. Confirm the webhook is also received for the same payment.
8. Check server logs for request ids and provider errors.

## Reference Docs

- [Stripe Checkout quickstart](https://docs.stripe.com/checkout/quickstart)
- [Stripe webhooks](https://docs.stripe.com/webhooks)
- [Stripe API keys](https://docs.stripe.com/keys)
- [Google OAuth 2.0 for web server apps](https://developers.google.com/identity/protocols/oauth2/web-server)
- [node-postgres connection guide](https://node-postgres.com/features/connecting)
- [PostgreSQL connection URI documentation](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING-URIS)
