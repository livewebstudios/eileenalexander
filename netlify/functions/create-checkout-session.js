/**
 * Netlify Function: create-checkout-session
 * POST { items: [{ id, options: [..], qty }] }  ->  { url }  (Stripe-hosted Checkout)
 *
 * Every price is looked up here from data/products.json. Client-sent prices are ignored
 * on purpose. Keys come from Netlify env: STRIPE_SECRET_KEY (sk_test_... until launch).
 */
const Stripe = require('stripe');
const catalog = require('../../data/products.json');

const MAX_LINES = 20;
const MAX_QTY = 20;
const PHONE = '973-600-4030';

const HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
};

function reply(statusCode, body, extra) {
  return { statusCode, headers: Object.assign({}, HEADERS, extra || {}), body: JSON.stringify(body) };
}

function findProduct(id) {
  return catalog.products.find((p) => p.id === id) || null;
}

// Mirrors js/cart.js resolve(): returns { price, schedule } or null.
function resolve(product, options) {
  if (!product) return null;
  if (!product.options || !product.options.length) {
    if (options.length) return null;
    return Number.isInteger(product.price) ? { price: product.price, schedule: product.schedule || '' } : null;
  }
  if (options.length !== product.options.length) return null;
  for (let i = 0; i < product.options.length; i++) {
    if (!product.options[i].values.includes(options[i])) return null;
  }
  const variant = product.variants.find((v) => v.combo.every((c, i) => c === '*' || c === options[i]));
  if (!variant || !Number.isInteger(variant.price) || variant.price <= 0) return null;
  return { price: variant.price, schedule: variant.schedule || '' };
}

function siteUrl(event) {
  // Deploy previews / branch deploys use their own URL so test runs come back to the same build.
  if (process.env.CONTEXT && process.env.CONTEXT !== 'production' && process.env.DEPLOY_PRIME_URL) {
    return process.env.DEPLOY_PRIME_URL.replace(/\/$/, '');
  }
  if (process.env.URL) return process.env.URL.replace(/\/$/, '');
  const host = (event.headers && (event.headers['x-forwarded-host'] || event.headers.host)) || 'localhost:8888';
  const proto = host.startsWith('localhost') ? 'http' : 'https';
  return `${proto}://${host}`;
}

function validate(body) {
  if (!body || !Array.isArray(body.items) || !body.items.length) {
    return { error: 'Your cart looks empty. Please add a session and try again.' };
  }
  if (body.items.length > MAX_LINES) return { error: 'That cart is a little too full. Please call ' + PHONE + ' and Eileen will help.' };

  const lineItems = [];
  for (const raw of body.items) {
    if (!raw || typeof raw.id !== 'string') return { error: 'Something in your cart was not recognized. Please refresh and try again.' };
    const options = Array.isArray(raw.options) ? raw.options.map((o) => String(o)) : [];
    const qty = Number(raw.qty);
    if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) return { error: 'Please check the quantities in your cart.' };

    const product = findProduct(raw.id);
    const resolved = resolve(product, options);
    if (!resolved) {
      return { error: 'One item in your cart is no longer available online. Please call or text ' + PHONE + '.' };
    }

    const parts = [];
    if (product.options && product.options.length) {
      product.options.forEach((o, i) => parts.push(`${o.attr}: ${options[i]}`));
    } else if (product.note) {
      parts.push(product.note);
    }
    if (resolved.schedule) parts.push(resolved.schedule);

    lineItems.push({
      quantity: qty,
      price_data: {
        currency: catalog.currency || 'usd',
        unit_amount: resolved.price,
        product_data: {
          name: product.name,
          description: parts.join(' | ').slice(0, 500) || undefined,
          metadata: { product_id: product.id, options: options.join(' / ').slice(0, 450) },
        },
      },
    });
  }
  return { lineItems };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return reply(204, {});
  if (event.httpMethod !== 'POST') return reply(405, { error: 'Method not allowed' }, { Allow: 'POST' });

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (e) {
    return reply(400, { error: 'We could not read that request. Please refresh and try again.' });
  }

  const checked = validate(body);
  if (checked.error) return reply(400, { error: checked.error });

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return reply(503, {
      error: 'Card payments are not switched on just yet. Please choose Zelle, Venmo or check below, or call ' + PHONE + '.',
    });
  }

  try {
    const stripe = new Stripe(key);
    const base = siteUrl(event);
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: checked.lineItems,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      phone_number_collection: { enabled: true },
      custom_text: {
        submit: { message: 'After you pay, call or text Eileen at ' + PHONE + ' or email info@eileenalexander.com to schedule.' },
      },
      success_url: `${base}/thank-you/?paid=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/checkout/?canceled=1`,
      metadata: { source: 'eileenalexander.com' },
    });
    return reply(200, { url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err && err.message);
    return reply(502, {
      error: 'Card checkout hit a snag on our end. Please try again in a minute, choose Zelle, Venmo or check, or call ' + PHONE + '.',
    });
  }
};

// Exposed for local tests.
exports._resolve = resolve;
exports._validate = validate;
