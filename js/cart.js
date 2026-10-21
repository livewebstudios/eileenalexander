/* Eileen Alexander | cart, product blocks, checkout, thank-you
   Cart state lives in localStorage (falls back to memory if storage is blocked).
   Prices shown here are for display only. The Netlify function re-prices every
   item from data/products.json before Stripe ever sees it. */
(function () {
  'use strict';

  var ROOT = document.body.getAttribute('data-root') || '';
  var STORE_KEY = 'ea_cart_v1';
  var LAST_KEY = 'ea_last_order';
  var FORMSPREE = 'https://formspree.io/f/mjygqpyl';
  var FUNCTION_URL = ROOT + '.netlify/functions/create-checkout-session';
  var MAX_QTY = 20;

  var catalog = null;
  var memoryCart = [];
  var storageOK = (function () {
    try { var k = '__ea'; localStorage.setItem(k, k); localStorage.removeItem(k); return true; } catch (e) { return false; }
  })();

  /* ------------------------------------------------------------- utils */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function money(cents) {
    var d = cents / 100;
    return '$' + d.toLocaleString('en-US', { minimumFractionDigits: cents % 100 ? 2 : 0, maximumFractionDigits: 2 });
  }
  function clampQty(n) { n = parseInt(n, 10); if (isNaN(n) || n < 1) n = 1; return Math.min(n, MAX_QTY); }
  function keyFor(id, options) { return id + '|' + options.join('|'); }
  function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qsa(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function params() { return new URLSearchParams(window.location.search); }

  /* ------------------------------------------------------------- catalog */
  function findProduct(id) {
    if (!catalog) return null;
    for (var i = 0; i < catalog.products.length; i++) if (catalog.products[i].id === id) return catalog.products[i];
    return null;
  }
  // Returns { price, schedule } or null when the combo is unknown / unpriced.
  function resolve(product, options) {
    if (!product) return null;
    if (!product.options || !product.options.length) {
      return typeof product.price === 'number' ? { price: product.price, schedule: product.schedule || '' } : null;
    }
    if (!options || options.length !== product.options.length) return null;
    for (var i = 0; i < product.options.length; i++) {
      if (product.options[i].values.indexOf(options[i]) === -1) return null;
    }
    for (var v = 0; v < product.variants.length; v++) {
      var combo = product.variants[v].combo, ok = true;
      for (var c = 0; c < combo.length; c++) if (combo[c] !== '*' && combo[c] !== options[c]) { ok = false; break; }
      if (ok) return typeof product.variants[v].price === 'number' ? { price: product.variants[v].price, schedule: product.variants[v].schedule || '' } : null;
    }
    return null;
  }
  function priceRange(product) {
    if (!product.options || !product.options.length) return [product.price, product.price];
    var ps = product.variants.map(function (v) { return v.price; }).filter(function (p) { return typeof p === 'number'; });
    return [Math.min.apply(null, ps), Math.max.apply(null, ps)];
  }
  function loadCatalog() {
    return fetch(ROOT + 'data/products.json', { cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw new Error('catalog'); return r.json(); })
      .then(function (data) { catalog = data; return data; });
  }

  /* ------------------------------------------------------------- cart state */
  function read() {
    if (!storageOK) return memoryCart.slice();
    try { var v = JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); return Array.isArray(v) ? v : []; } catch (e) { return []; }
  }
  function write(items) {
    memoryCart = items.slice();
    if (storageOK) { try { localStorage.setItem(STORE_KEY, JSON.stringify(items)); } catch (e) { storageOK = false; } }
    renderAll();
  }
  // Drop anything the catalog no longer recognizes (renamed product, price removed).
  function sanitize() {
    var items = read().filter(function (it) {
      return it && typeof it.id === 'string' && Array.isArray(it.options) && resolve(findProduct(it.id), it.options);
    }).map(function (it) { return { id: it.id, options: it.options, qty: clampQty(it.qty) }; });
    write(items);
  }
  function lines() {
    return read().map(function (it) {
      var p = findProduct(it.id), r = resolve(p, it.options);
      if (!p || !r) return null;
      return { key: keyFor(it.id, it.options), id: it.id, name: p.name, options: it.options, attrs: (p.options || []).map(function (o) { return o.attr; }), qty: it.qty, unit: r.price, schedule: r.schedule, total: r.price * it.qty };
    }).filter(Boolean);
  }
  function count() { return read().reduce(function (n, it) { return n + (parseInt(it.qty, 10) || 0); }, 0); }
  function subtotal() { return lines().reduce(function (n, l) { return n + l.total; }, 0); }

  function add(id, options, qty) {
    var items = read(), k = keyFor(id, options), found = false;
    items.forEach(function (it) { if (keyFor(it.id, it.options) === k) { it.qty = clampQty(it.qty + qty); found = true; } });
    if (!found) items.push({ id: id, options: options, qty: clampQty(qty) });
    write(items);
    qsa('.cart-count').forEach(function (b) { b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); });
  }
  function setQty(k, qty) {
    write(read().map(function (it) { if (keyFor(it.id, it.options) === k) it.qty = clampQty(qty); return it; }));
  }
  function remove(k) { write(read().filter(function (it) { return keyFor(it.id, it.options) !== k; })); }
  function clear() { write([]); }

  /* ------------------------------------------------------------- live region */
  var live = document.createElement('div');
  live.className = 'visually-hidden';
  live.setAttribute('aria-live', 'polite');
  document.body.appendChild(live);
  function announce(msg) { live.textContent = ''; setTimeout(function () { live.textContent = msg; }, 40); }

  /* ------------------------------------------------------------- drawer */
  var drawer, overlay, lastFocus;
  function buildDrawer() {
    overlay = document.createElement('div');
    overlay.className = 'cart-overlay';
    overlay.addEventListener('click', closeDrawer);
    drawer = document.createElement('aside');
    drawer.className = 'cart-drawer';
    drawer.id = 'cart-drawer';
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-modal', 'true');
    drawer.setAttribute('aria-labelledby', 'cart-drawer-title');
    drawer.innerHTML =
      '<div class="cart-drawer__head"><h2 id="cart-drawer-title">Your Cart</h2>' +
      '<button type="button" class="icon-btn cart-close" aria-label="Close cart"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>' +
      '<div class="cart-drawer__body" data-cart-list></div>' +
      '<div class="cart-drawer__foot" data-cart-foot></div>';
    document.body.appendChild(overlay);
    document.body.appendChild(drawer);
    qs('.cart-close', drawer).addEventListener('click', closeDrawer);
    drawer.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { closeDrawer(); return; }
      if (e.key !== 'Tab') return;
      var f = qsa('button, a[href], input, select', drawer).filter(function (el) { return !el.disabled && el.offsetParent !== null; });
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    });
  }
  function openDrawer() {
    if (!drawer) return;
    lastFocus = document.activeElement;
    document.body.classList.add('cart-open', 'is-locked');
    qsa('[data-cart-open]').forEach(function (b) { b.setAttribute('aria-expanded', 'true'); });
    setTimeout(function () { qs('.cart-close', drawer).focus(); }, 60);
  }
  function closeDrawer() {
    document.body.classList.remove('cart-open');
    if (!document.body.classList.contains('menu-open')) document.body.classList.remove('is-locked');
    qsa('[data-cart-open]').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  /* ------------------------------------------------------------- render */
  function optsText(l) {
    return l.options.map(function (o, i) { return '<span>' + esc(l.attrs[i] ? o : o) + '</span>'; }).join(' &middot; ');
  }
  function itemHTML(l) {
    return '<li class="cart-item" data-key="' + esc(l.key) + '">' +
      '<div><p class="cart-item__name">' + esc(l.name) + '</p>' +
      (l.options.length ? '<p class="cart-item__opts">' + optsText(l) + '</p>' : '') +
      (l.schedule ? '<p class="cart-item__opts">' + esc(l.schedule) + '</p>' : '') + '</div>' +
      '<div class="cart-item__price">' + money(l.total) + '</div>' +
      '<div class="cart-item__controls">' +
      '<div class="qty qty--sm" role="group" aria-label="Quantity for ' + esc(l.name) + '">' +
      '<button type="button" data-qty="-1" aria-label="One fewer">&minus;</button>' +
      '<input type="number" inputmode="numeric" min="1" max="' + MAX_QTY + '" value="' + l.qty + '" aria-label="Quantity">' +
      '<button type="button" data-qty="1" aria-label="One more">+</button></div>' +
      '<button type="button" class="cart-remove" data-remove aria-label="Remove ' + esc(l.name) + '">&#10005; Remove</button>' +
      '</div></li>';
  }
  function emptyHTML() {
    return '<div class="cart-empty"><div class="bfly-static bfly">' + (window.EA_BUTTERFLY_SVG || '') + '</div>' +
      '<p>Your cart is empty for now. Whenever you’re ready, I’m here.</p>' +
      '<a class="btn btn--sm" href="' + ROOT + 'services/">SEE SESSIONS</a></div>';
  }
  function bindList(container) {
    container.addEventListener('click', function (e) {
      var li = e.target.closest('.cart-item');
      if (!li) return;
      var k = li.getAttribute('data-key');
      var q = e.target.closest('[data-qty]');
      if (q) {
        var input = qs('input', li);
        var n = clampQty(parseInt(input.value, 10) + parseInt(q.getAttribute('data-qty'), 10));
        setQty(k, n);
        announce('Quantity updated to ' + n);
        var again = qs('.cart-item[data-key="' + cssEsc(k) + '"] [data-qty="' + q.getAttribute('data-qty') + '"]', container);
        if (again) again.focus();
      }
      if (e.target.closest('[data-remove]')) {
        remove(k);
        announce('Item removed from your cart');
        var next = qs('.cart-remove, .cart-close, .btn', container.closest('.cart-drawer') || container);
        if (next) next.focus();
      }
    });
    container.addEventListener('change', function (e) {
      if (e.target.matches('.cart-item input')) {
        setQty(e.target.closest('.cart-item').getAttribute('data-key'), e.target.value);
        announce('Quantity updated');
      }
    });
  }
  function cssEsc(s) { return window.CSS && CSS.escape ? CSS.escape(s) : s.replace(/"/g, '\\"'); }

  function renderBadges() {
    var n = count();
    qsa('.cart-count').forEach(function (b) { b.textContent = n; b.classList.toggle('has-items', n > 0); });
    qsa('[data-cart-open]').forEach(function (b) { b.setAttribute('aria-label', 'Cart, ' + n + (n === 1 ? ' item' : ' items')); });
  }
  function renderDrawer() {
    if (!drawer) return;
    var ls = lines(), list = qs('[data-cart-list]', drawer), foot = qs('[data-cart-foot]', drawer);
    if (!ls.length) { list.innerHTML = emptyHTML(); foot.innerHTML = ''; foot.hidden = true; return; }
    foot.hidden = false;
    list.innerHTML = '<ul class="cart-list">' + ls.map(itemHTML).join('') + '</ul>';
    foot.innerHTML =
      '<div class="cart-subtotal"><span>Subtotal</span><span>' + money(subtotal()) + '</span></div>' +
      '<a class="btn btn--block" href="' + ROOT + 'checkout/">CHECKOUT</a>' +
      '<a class="btn btn--outline btn--block btn--sm" href="' + ROOT + 'cart/">VIEW FULL CART</a>' +
      '<p class="cart-fine">After you purchase, call or text 973-600-4030 or email info@eileenalexander.com and we’ll set up your time together.</p>';
  }
  function summaryHTML(ls) {
    return '<ul class="summary-lines">' + ls.map(function (l) {
      return '<li><span><span class="s-name">' + l.qty + ' &times; ' + esc(l.name) + '</span>' +
        (l.options.length ? '<span class="s-opts">' + esc(l.options.join(' · ')) + '</span>' : '') +
        (l.schedule ? '<span class="s-opts">' + esc(l.schedule) + '</span>' : '') +
        '</span><span>' + money(l.total) + '</span></li>';
    }).join('') + '</ul>' +
      '<div class="summary-total"><span>Total</span><span>' + money(ls.reduce(function (n, l) { return n + l.total; }, 0)) + '</span></div>';
  }
  function renderCartPage() {
    var list = qs('#cart-page-list'), sum = qs('#cart-page-summary');
    if (!list) return;
    var ls = lines();
    qsa('[data-has-items]').forEach(function (el) { el.hidden = !ls.length; });
    if (!ls.length) { list.innerHTML = emptyHTML(); if (sum) sum.innerHTML = ''; return; }
    list.innerHTML = '<ul class="cart-list">' + ls.map(itemHTML).join('') + '</ul>';
    if (sum) sum.innerHTML = summaryHTML(ls);
  }
  function renderCheckout() {
    var sum = qs('#checkout-summary');
    if (!sum) return;
    var ls = lines();
    var main = qs('.checkout-main'), empty = qs('.checkout-empty');
    if (main) main.hidden = !ls.length;
    if (empty) empty.hidden = !!ls.length;
    sum.innerHTML = ls.length ? summaryHTML(ls) : '';
  }
  function renderAll() { renderBadges(); renderDrawer(); renderCartPage(); renderCheckout(); }

  /* ------------------------------------------------------------- product blocks */
  function initBuy(form) {
    var product = findProduct(form.getAttribute('data-product'));
    if (!product) return;
    var selects = qsa('.buy-opt', form);
    var priceEl = qs('.buy__price', form);
    var schedEl = qs('.buy__schedule', form);
    var msg = qs('.buy__msg', form);
    var qtyInput = qs('.qty input', form);
    var range = priceRange(product);

    function chosen() { return selects.map(function (s) { return s.value; }); }
    function update() {
      var opts = chosen();
      var complete = opts.every(function (v) { return v !== ''; });
      var r = complete ? resolve(product, opts) : null;
      if (msg && complete) { msg.textContent = ''; msg.className = 'buy__msg'; }
      selects.forEach(function (s) { if (s.value) s.removeAttribute('aria-invalid'); });
      if (!priceEl) return;
      if (r) {
        var q = qtyInput ? clampQty(qtyInput.value) : 1;
        priceEl.innerHTML = money(r.price * q) + (q > 1 ? ' <small>' + q + ' &times; ' + money(r.price) + '</small>' : '');
        if (schedEl) { schedEl.hidden = !r.schedule; schedEl.textContent = r.schedule ? 'Next group date: ' + r.schedule : ''; }
      } else {
        priceEl.innerHTML = range[0] === range[1] ? money(range[0]) : '<small>From</small>' + money(range[0]);
        if (schedEl) schedEl.hidden = true;
      }
    }
    selects.forEach(function (s) { s.addEventListener('change', update); });

    qsa('.qty button', form).forEach(function (b) {
      b.addEventListener('click', function () {
        qtyInput.value = clampQty(parseInt(qtyInput.value, 10) + parseInt(b.getAttribute('data-step'), 10));
        update();
      });
    });
    if (qtyInput) qtyInput.addEventListener('change', function () { qtyInput.value = clampQty(qtyInput.value); update(); });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var opts = chosen();
      var missing = selects.filter(function (s) { return !s.value; });
      if (missing.length) {
        missing.forEach(function (s) { s.setAttribute('aria-invalid', 'true'); });
        var label = qs('label[for="' + missing[0].id + '"]', form);
        if (!msg) return;
        msg.className = 'buy__msg';
        msg.textContent = 'Please choose your ' + (label ? label.textContent.toLowerCase() : 'option') + ' first.';
        missing[0].focus();
        return;
      }
      if (!resolve(product, opts)) {
        if (!msg) return;
        msg.className = 'buy__msg';
        msg.textContent = 'That combination needs a quick chat. Please call or text 973-600-4030.';
        return;
      }
      var q = qtyInput ? clampQty(qtyInput.value) : 1;
      add(product.id, opts, q);
      if (msg) { msg.className = 'buy__msg is-ok'; msg.textContent = 'Added to your cart.'; }
      announce(product.name + ' added to your cart');
      openDrawer();
    });
    update();
  }

  /* ------------------------------------------------------------- checkout */
  function payloadItems() { return read().map(function (it) { return { id: it.id, options: it.options, qty: clampQty(it.qty) }; }); }
  function orderText(ls) {
    return ls.map(function (l) {
      return l.qty + ' x ' + l.name + (l.options.length ? ' (' + l.options.join(', ') + ')' : '') +
        (l.schedule ? ' [' + l.schedule + ']' : '') + ' @ ' + money(l.unit) + ' = ' + money(l.total);
    }).join('\n');
  }

  function initCheckout() {
    var cardBtn = qs('#pay-card-btn');
    var cardErr = qs('#card-error');
    if (params().get('canceled')) { var n = qs('#canceled-note'); if (n) n.hidden = false; }

    if (cardBtn) {
      cardBtn.addEventListener('click', function () {
        if (!count()) return;
        cardBtn.disabled = true;
        cardBtn.classList.add('is-busy');
        cardBtn.textContent = 'ONE MOMENT…';
        cardErr.hidden = true;
        fetch(FUNCTION_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: payloadItems() })
        })
          .then(function (r) { return r.json().catch(function () { return {}; }).then(function (d) { return { ok: r.ok, d: d }; }); })
          .then(function (res) {
            if (res.ok && res.d.url) { window.location.href = res.d.url; return; }
            throw new Error(res.d.error || '');
          })
          .catch(function (err) {
            cardErr.textContent = (err && err.message) || 'Card checkout isn’t reachable right now. You can still reserve with Zelle, Venmo or check, or call 973-600-4030.';
            cardErr.hidden = false;
            cardBtn.disabled = false;
            cardBtn.classList.remove('is-busy');
            cardBtn.textContent = 'PAY BY CARD';
          });
      });
    }

    var off = qs('#offline-form');
    if (off) {
      var status = qs('.form-status', off);
      off.addEventListener('submit', function (e) {
        e.preventDefault();
        var ls = lines();
        if (!ls.length) return;
        var bad = null;
        qsa('[required]', off).forEach(function (f) {
          var ok = f.value.trim() !== '' && (f.type !== 'email' || /.+@.+\..+/.test(f.value));
          f.setAttribute('aria-invalid', String(!ok));
          if (!ok && !bad) bad = f;
        });
        if (bad) {
          status.className = 'form-status is-err';
          status.textContent = 'Please add your name, email and phone so Eileen can confirm your order.';
          bad.focus();
          return;
        }
        var total = ls.reduce(function (n, l) { return n + l.total; }, 0);
        qs('[name="order_items"]', off).value = orderText(ls);
        qs('[name="order_total"]', off).value = money(total);
        qs('[name="_subject"]', off).value = 'New order (Zelle/Venmo/check) from ' + qs('[name="name"]', off).value.trim() + ' | ' + money(total);
        var btn = qs('button[type="submit"]', off);
        btn.disabled = true;
        btn.classList.add('is-busy');
        status.className = 'form-status';
        status.textContent = 'Sending your order…';
        fetch(FORMSPREE, { method: 'POST', body: new FormData(off), headers: { Accept: 'application/json' } })
          .then(function (r) {
            if (!r.ok) throw new Error('send');
            try { sessionStorage.setItem(LAST_KEY, JSON.stringify({ lines: ls, total: total, method: qs('[name="payment_method"]', off).value })); } catch (x) { /* storage blocked: thank-you page shows generic copy */ }
            clear();
            window.location.href = ROOT + 'thank-you/?offline=1';
          })
          .catch(function () {
            status.className = 'form-status is-err';
            status.textContent = 'That didn’t go through. Please try again, or call or text Eileen at 973-600-4030.';
            btn.disabled = false;
            btn.classList.remove('is-busy');
          });
      });
    }
  }

  function initThankYou() {
    var wrap = qs('[data-thank-you]');
    if (!wrap) return;
    var p = params();
    var mode = p.get('paid') ? 'paid' : p.get('offline') ? 'offline' : 'default';
    qsa('.ty-block', wrap).forEach(function (b) { b.hidden = b.getAttribute('data-mode') !== mode; });
    if (mode === 'paid') clear();
    if (mode === 'offline') {
      var last = null;
      try { last = JSON.parse(sessionStorage.getItem(LAST_KEY) || 'null'); } catch (e) { last = null; }
      var box = qs('#ty-order');
      if (last && box && last.lines && last.lines.length) {
        box.innerHTML = summaryHTML(last.lines);
        box.hidden = false;
      }
    }
    var h = qs('.ty-block:not([hidden]) h2', wrap);
    if (h) { h.setAttribute('tabindex', '-1'); }
  }

  /* ------------------------------------------------------------- boot */
  buildDrawer();
  qsa('[data-cart-open]').forEach(function (b) {
    b.addEventListener('click', function (e) { e.preventDefault(); openDrawer(); });
  });
  bindList(qs('[data-cart-list]', drawer));
  var pageList = qs('#cart-page-list');
  if (pageList) bindList(pageList);
  window.addEventListener('storage', function (e) { if (e.key === STORE_KEY) renderAll(); });

  loadCatalog()
    .then(function () {
      sanitize();
      qsa('form[data-product]').forEach(initBuy);
      initCheckout();
      initThankYou();
    })
    .catch(function () {
      qsa('.buy__msg').forEach(function (m) { m.textContent = 'Online booking is taking a breather. Please call or text 973-600-4030.'; });
      initThankYou();
    });

  window.EACart = { add: add, clear: clear, items: read, open: openDrawer };
})();
