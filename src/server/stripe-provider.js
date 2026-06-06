function required(name, env) {
  return String(env[name] || '').trim();
}

function createStripeProvider({ env = process.env, fetchImpl = null, stripeClient = null } = {}) {
  const secretKey = required('STRIPE_SECRET_KEY', env);
  const appBaseUrl = required('APP_BASE_URL', env) || 'http://localhost:8765';

  function missingConfig() {
    if (!secretKey) {
      return { ok: false, status: 503, error: 'Missing STRIPE_SECRET_KEY for Stripe Checkout' };
    }
    return null;
  }

  async function createCheckoutSession({ donation }) {
    const missing = missingConfig();
    if (missing) return missing;

    if (!fetchImpl) {
      const Stripe = require('stripe');
      const stripe = stripeClient || new Stripe(secretKey);
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        success_url: `${appBaseUrl}/?checkout=success&donation=${encodeURIComponent(donation.id)}`,
        cancel_url: `${appBaseUrl}/?checkout=cancelled&donation=${encodeURIComponent(donation.id)}`,
        client_reference_id: donation.id,
        metadata: {
          donationId: donation.id,
          donorId: donation.donorId,
        },
        line_items: [{
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: Math.round(donation.amount * 100),
            product_data: {
              name: `Gift from ${donation.displayName || 'Guest donor'}`,
            },
          },
        }],
      });
      return { ok: true, sessionId: session.id, checkoutUrl: session.url };
    }

    const params = new URLSearchParams();
    params.set('mode', 'payment');
    params.set('success_url', `${appBaseUrl}/?checkout=success&donation=${encodeURIComponent(donation.id)}`);
    params.set('cancel_url', `${appBaseUrl}/?checkout=cancelled&donation=${encodeURIComponent(donation.id)}`);
    params.set('client_reference_id', donation.id);
    params.set('metadata[donationId]', donation.id);
    params.set('metadata[donorId]', donation.donorId);
    params.set('line_items[0][quantity]', '1');
    params.set('line_items[0][price_data][currency]', 'usd');
    params.set('line_items[0][price_data][unit_amount]', String(Math.round(donation.amount * 100)));
    params.set('line_items[0][price_data][product_data][name]', `Gift from ${donation.displayName || 'Guest donor'}`);

    const response = await fetchImpl('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });
    const payload = await response.json();
    if (!response.ok) {
      return { ok: false, status: response.status || 502, error: payload.error?.message || 'Stripe Checkout failed' };
    }
    return { ok: true, sessionId: payload.id, checkoutUrl: payload.url };
  }

  function constructWebhookEvent({ payload, signature, webhookSecret }) {
    if (!webhookSecret) {
      return { ok: true, event: JSON.parse(payload) };
    }
    const Stripe = require('stripe');
    const stripe = stripeClient || new Stripe(secretKey || 'sk_missing');
    try {
      return { ok: true, event: stripe.webhooks.constructEvent(payload, signature, webhookSecret) };
    } catch (error) {
      return { ok: false, status: 400, error: 'Invalid Stripe webhook signature' };
    }
  }

  return { createCheckoutSession, constructWebhookEvent };
}

module.exports = { createStripeProvider };
