# Crowned Deployment

## Required Environment

Copy `.env.example` and set production values:

- `APP_BASE_URL`: public HTTPS origin for the app.
- `DATABASE_URL`: PostgreSQL connection string, for example `postgres://user:password@host:5432/crowned`.
- `ADMIN_TOKEN`: long random token required by admin APIs.
- `STRIPE_SECRET_KEY`: Stripe secret API key.
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook signing secret.
- `GOOGLE_CLIENT_ID`: Google OAuth client id.
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret.
- `GOOGLE_REDIRECT_URI`: `${APP_BASE_URL}/api/auth/google/callback`.

See `docs/service-setup.md` for step-by-step PostgreSQL, Stripe, and Google setup.

## Stripe Setup

1. Create a Stripe account and enable the payment methods you want donors to use.
2. Set `STRIPE_SECRET_KEY`.
3. Add a webhook endpoint: `${APP_BASE_URL}/api/stripe/webhook`.
4. Subscribe to `checkout.session.completed`.
5. Set `STRIPE_WEBHOOK_SECRET` from the webhook endpoint details.

## Google OAuth Setup

1. Create a Google OAuth web application client.
2. Add `${APP_BASE_URL}/api/auth/google/callback` as an authorized redirect URI.
3. Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_REDIRECT_URI`.

## Run Locally

```bash
npm install
cp .env.example .env
npm start
```

Set `DATABASE_URL` to a reachable PostgreSQL database before using this as a production-like local run. If `DATABASE_URL` is omitted, Crowned falls back to a JSON file store for local demo use.

For local Google OAuth testing without Postgres, leave `DATABASE_URL` unset.

Then open `http://localhost:8765`.

## Docker

```bash
docker build -t crowned .
docker run --env-file .env -p 8765:8765 crowned
```

## Health Checks

- `GET /healthz`
- `GET /readyz`

Both return `{"ok":true}` when the Node process is serving requests.

## Admin APIs

Send `x-admin-token: $ADMIN_TOKEN`.

- `POST /api/admin/donations`: create a confirmed manual adjustment.
- `GET /api/admin/export.csv`: export donation records.

## Production Notes

- Use HTTPS in front of the Node server.
- Use managed PostgreSQL or a durable self-hosted PostgreSQL instance for `DATABASE_URL`.
- Do not use the JSON fallback for production traffic.
- Rotate `ADMIN_TOKEN`, Stripe keys, and Google secrets through your hosting provider.
- Review donor privacy policy before publishing full names and donation amounts.
