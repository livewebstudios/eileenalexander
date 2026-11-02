/* Local checks for the checkout function: node tests/checkout.test.js
   Runs without Stripe keys (expects the friendly 503), and with a fake key it
   proves validation passes and the request reaches Stripe (which rejects the key). */
const assert = require('assert');
const fn = require('../netlify/functions/create-checkout-session.js');
const catalog = require('../data/products.json');

const call = (method, body) => fn.handler({ httpMethod: method, body: body && JSON.stringify(body), headers: { host: 'localhost:8888' } });

(async () => {
  let r = await call('GET');
  assert.strictEqual(r.statusCode, 405, 'GET should be 405');

  r = await fn.handler({ httpMethod: 'POST', body: '{nope', headers: {} });
  assert.strictEqual(r.statusCode, 400, 'bad JSON should be 400');

  r = await call('POST', { items: [] });
  assert.strictEqual(r.statusCode, 400, 'empty cart should be 400');

  r = await call('POST', { items: [{ id: 'individual-sessions', options: ['Reiki', 'Gold Package'], qty: 1 }] });
  assert.strictEqual(r.statusCode, 400, 'unknown option should be 400');

  r = await call('POST', { items: [{ id: 'chakra-series', options: [], qty: 0 }] });
  assert.strictEqual(r.statusCode, 400, 'qty 0 should be 400');

  r = await call('POST', { items: [{ id: 'chakra-series', options: [], qty: 1, price: 1 }] });
  assert.strictEqual(r.statusCode, 503, 'no key should be 503 friendly message');

  // Every product/combo resolves to a real price
  let combos = 0;
  for (const p of catalog.products) {
    if (!p.options) { assert.ok(fn._resolve(p, []).price > 0); combos++; continue; }
    const walk = (i, acc) => {
      if (i === p.options.length) { const res = fn._resolve(p, acc); assert.ok(res && res.price > 0, p.id + ' ' + acc); combos++; return; }
      p.options[i].values.forEach((v) => walk(i + 1, acc.concat(v)));
    };
    walk(0, []);
  }
  const v = fn._validate({ items: [{ id: 'reiki-1-2', options: ['Reiki 2', 'Group Training'], qty: 2, price: 1 }] });
  assert.strictEqual(v.lineItems[0].price_data.unit_amount, 28000, 'server price wins over client price');
  const vm = fn._validate({ items: [{ id: 'reiki-master', options: ['Group Training'], qty: 1 }] });
  assert.ok(/December 6, 2026/.test(vm.lineItems[0].price_data.product_data.description));

  process.env.STRIPE_SECRET_KEY = 'sk_test_fake_key_for_local_test';
  r = await call('POST', { items: [{ id: 'individual-sessions', options: ['Yoga', '10-Session Package'], qty: 1 }] });
  assert.strictEqual(r.statusCode, 502, 'fake key should reach Stripe and fail gracefully');

  console.log('checkout function: all checks passed (' + combos + ' priced combos)');
})().catch((e) => { console.error(e); process.exit(1); });
