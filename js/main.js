/* Eileen Alexander | site behavior (nav, reveals, butterflies, FAQ, testimonials, forms)
   Vanilla JS only. Cart lives in js/cart.js. */
(function () {
  'use strict';

  var doc = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------
     Header: transparent over hero, solid rose on scroll
     --------------------------------------------------------------- */
  var header = document.querySelector('.site-header');
  function setHeader() {
    if (!header) return;
    header.classList.toggle('is-solid', window.scrollY > 40 || document.body.classList.contains('menu-open'));
  }
  setHeader();
  window.addEventListener('scroll', setHeader, { passive: true });

  /* ---------------------------------------------------------------
     Mobile menu + sub menus
     --------------------------------------------------------------- */
  var menuBtn = document.querySelector('.menu-toggle');
  var nav = document.getElementById('main-nav');
  var desktop = window.matchMedia('(min-width: 1024px)');

  function closeMenu() {
    document.body.classList.remove('menu-open', 'is-locked');
    if (menuBtn) {
      menuBtn.setAttribute('aria-expanded', 'false');
      menuBtn.setAttribute('aria-label', 'Open menu');
    }
    setHeader();
  }
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = !document.body.classList.contains('menu-open');
      document.body.classList.toggle('menu-open', open);
      document.body.classList.toggle('is-locked', open);
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      setHeader();
    });
    desktop.addEventListener('change', function (e) { if (e.matches) closeMenu(); });
  }

  document.querySelectorAll('.has-sub').forEach(function (li) {
    var btn = li.querySelector('.sub-toggle');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var open = !li.classList.contains('is-open');
      document.querySelectorAll('.has-sub.is-open').forEach(function (o) {
        if (o !== li) { o.classList.remove('is-open'); o.querySelector('.sub-toggle').setAttribute('aria-expanded', 'false'); }
      });
      li.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
    });
    li.addEventListener('mouseleave', function () {
      if (desktop.matches) { li.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); }
    });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var openSub = document.querySelector('.has-sub.is-open');
    if (openSub) {
      openSub.classList.remove('is-open');
      var t = openSub.querySelector('.sub-toggle');
      t.setAttribute('aria-expanded', 'false');
      t.focus();
    }
    if (document.body.classList.contains('menu-open')) { closeMenu(); if (menuBtn) menuBtn.focus(); }
  });
  document.addEventListener('click', function (e) {
    if (!desktop.matches) return;
    document.querySelectorAll('.has-sub.is-open').forEach(function (li) {
      if (!li.contains(e.target)) { li.classList.remove('is-open'); li.querySelector('.sub-toggle').setAttribute('aria-expanded', 'false'); }
    });
  });

  /* ---------------------------------------------------------------
     Scroll reveals
     --------------------------------------------------------------- */
  var reveals = document.querySelectorAll('.reveal');
  document.querySelectorAll('[data-stagger]').forEach(function (group) {
    Array.prototype.forEach.call(group.children, function (child, i) {
      child.classList.add('reveal');
      child.style.setProperty('--i', i);
    });
  });
  reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('in-view'); io.unobserve(entry.target); }
      });
    }, { rootMargin: '0px 0px 0px 0px', threshold: 0 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in-view'); });
  }

  /* ---------------------------------------------------------------
     Butterflies: inline SVG, two wing groups that flap, wrapper drifts.
     Decorative only. Placed in section margins, paused when offscreen.
     --------------------------------------------------------------- */
  var WING =
    '<path class="w" d="M51 38C57 20 73 5 89 6c10 1 9 15-2 23-10 7-24 10-36 12z"/>' +
    '<path class="w" d="M51 43c11 2 24 8 26 19 2 10-8 14-15 8-6-6-10-16-11-25z"/>' +
    '<path class="w-acc" d="M57 33c8-10 18-18 30-22"/>' +
    '<path class="w-acc2" d="M59 37c9-6 18-11 30-16"/>' +
    '<path class="w-acc" d="M57 48c7 5 11 11 12 18"/>';
  var SVG =
    '<svg viewBox="0 0 100 80" aria-hidden="true" focusable="false">' +
    '<g class="wing wing-l"><g transform="matrix(-1 0 0 1 100 0)">' + WING + '</g></g>' +
    '<g class="wing wing-r">' + WING + '</g>' +
    '<path class="b-body" d="M50 31c-1.6 6-1.6 19 0 27 1.6-8 1.6-21 0-27z"/>' +
    '<path class="b-ant" d="M49.4 32c-2.4-8-6.4-13-11.4-16M50.6 32c2.4-8 6.4-13 11.4-16"/>' +
    '</svg>';

  // Content sections: butterflies glide only inside the top/bottom padding bands,
  // so they never pass over text. Desktop heroes: free drift on the right half,
  // away from the headline.
  var BAND_SLOTS = [
    { x: 4, band: 'top', path: 'bfly-glide-r' },
    { x: 84, band: 'bottom', path: 'bfly-glide-l' },
    { x: 58, band: 'top', path: 'bfly-glide-l' },
    { x: 20, band: 'bottom', path: 'bfly-glide-r' },
    { x: 72, band: 'top', path: 'bfly-glide-l' }
  ];
  var HERO_SLOTS = [
    { x: 66, y: 22, path: 'bfly-drift-a' },
    { x: 88, y: 34, path: 'bfly-drift-b' },
    { x: 74, y: 64, path: 'bfly-drift-c' },
    { x: 90, y: 74, path: 'bfly-drift-b' },
    { x: 60, y: 78, path: 'bfly-drift-a' }
  ];
  function rand(seed) { var x = Math.sin(seed * 9301 + 49297) * 233280; return x - Math.floor(x); }

  var layers = [];
  var wide = window.innerWidth >= 1000;
  document.querySelectorAll('[data-butterflies]').forEach(function (host, h) {
    var n = Math.min(parseInt(host.getAttribute('data-butterflies'), 10) || 3, 5);
    if (!wide) n = Math.min(n, 2);
    var light = host.hasAttribute('data-butterflies-light');
    var free = wide && host.classList.contains('hero');
    var slots = free ? HERO_SLOTS : BAND_SLOTS;
    var layer = document.createElement('div');
    layer.className = 'bfly-layer';
    layer.setAttribute('aria-hidden', 'true');
    for (var i = 0; i < n; i++) {
      var r1 = rand(h * 11 + i), r2 = rand(h * 17 + i * 3), r3 = rand(h * 23 + i * 7);
      var slot = slots[(i + h) % slots.length];
      var b = document.createElement('div');
      b.className = 'bfly' + (light ? ' bfly--light' : '') + (free ? '' : ' bfly--' + slot.band);
      var size = free ? 36 + Math.round(r1 * 44) : 24 + Math.round(r1 * 18);
      b.style.setProperty('--x', (slot.x + r2 * 4).toFixed(1) + '%');
      if (free) b.style.setProperty('--y', (slot.y + r3 * 6).toFixed(1) + '%');
      b.style.setProperty('--s', size + 'px');
      b.style.setProperty('--o', (0.4 + r2 * 0.3).toFixed(2));
      b.style.setProperty('--d', (18 + Math.round(r3 * 12)) + 's');
      b.style.setProperty('--delay', (-r1 * 20).toFixed(1) + 's');
      b.style.setProperty('--path', slot.path);
      b.style.setProperty('--f', (0.6 + r3 * 0.3).toFixed(2) + 's');
      b.style.setProperty('--fd', (-r2).toFixed(2) + 's');
      b.innerHTML = SVG;
      layer.appendChild(b);
    }
    host.insertBefore(layer, host.firstChild);
    layers.push(layer);
  });
  if ('IntersectionObserver' in window && layers.length) {
    var lio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { en.target.classList.toggle('is-paused', !en.isIntersecting); });
    });
    layers.forEach(function (l) { lio.observe(l); });
  }
  document.addEventListener('visibilitychange', function () {
    layers.forEach(function (l) { l.classList.toggle('is-paused', document.hidden); });
  });
  window.EA_BUTTERFLY_SVG = SVG;

  /* ---------------------------------------------------------------
     FAQ accordion (one open at a time)
     --------------------------------------------------------------- */
  document.querySelectorAll('.faq').forEach(function (faq) {
    var items = faq.querySelectorAll('.faq-item');
    items.forEach(function (item) {
      var btn = item.querySelector('.faq-q button');
      var panel = item.querySelector('.faq-a');
      btn.addEventListener('click', function () {
        var open = btn.getAttribute('aria-expanded') !== 'true';
        items.forEach(function (other) {
          if (other === item) return;
          other.classList.remove('is-open');
          other.querySelector('.faq-q button').setAttribute('aria-expanded', 'false');
          other.querySelector('.faq-a').setAttribute('aria-hidden', 'true');
        });
        item.classList.toggle('is-open', open);
        btn.setAttribute('aria-expanded', String(open));
        panel.setAttribute('aria-hidden', String(!open));
      });
    });
  });

  /* ---------------------------------------------------------------
     Testimonials rotator
     --------------------------------------------------------------- */
  document.querySelectorAll('[data-testimonials]').forEach(function (wrap) {
    var slides = wrap.querySelectorAll('.t-slide');
    var dotsWrap = wrap.querySelector('.t-dots');
    var current = 0, timer = null, paused = false;
    var pauseBtn = wrap.querySelector('.t-pause');
    if (slides.length < 2) return;
    slides.forEach(function (s, i) {
      var d = document.createElement('button');
      d.type = 'button';
      d.className = 't-dot';
      d.setAttribute('aria-label', 'Show testimonial ' + (i + 1) + ' of ' + slides.length);
      d.addEventListener('click', function () { go(i); restart(); });
      dotsWrap.appendChild(d);
    });
    var dots = dotsWrap.querySelectorAll('.t-dot');
    function go(i) {
      current = (i + slides.length) % slides.length;
      slides.forEach(function (s, k) {
        var on = k === current;
        s.classList.toggle('is-active', on);
        s.setAttribute('aria-hidden', String(!on));
      });
      dots.forEach(function (d, k) { d.setAttribute('aria-current', String(k === current)); });
    }
    function restart() {
      if (reduceMotion || paused) return;
      clearInterval(timer);
      timer = setInterval(function () { go(current + 1); }, 8000);
    }
    wrap.querySelector('.t-prev').addEventListener('click', function () { go(current - 1); restart(); });
    wrap.querySelector('.t-next').addEventListener('click', function () { go(current + 1); restart(); });
    if (pauseBtn) {
      pauseBtn.addEventListener('click', function () {
        paused = !paused;
        pauseBtn.setAttribute('aria-pressed', String(paused));
        pauseBtn.setAttribute('aria-label', paused ? 'Play testimonials' : 'Pause testimonials');
        if (paused) clearInterval(timer); else restart();
      });
    }
    wrap.addEventListener('mouseenter', function () { clearInterval(timer); });
    wrap.addEventListener('mouseleave', restart);
    wrap.addEventListener('focusin', function () { clearInterval(timer); });
    go(0);
    restart();
  });

  /* ---------------------------------------------------------------
     Contact form (Formspree via fetch, falls back to a normal POST)
     --------------------------------------------------------------- */
  var contact = document.getElementById('contact-form');
  if (contact && window.fetch) {
    var status = contact.querySelector('.form-status');
    contact.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = contact.querySelector('button[type="submit"]');
      var required = contact.querySelectorAll('[required]');
      var bad = null;
      required.forEach(function (f) {
        var ok = f.value.trim() !== '' && (f.type !== 'email' || /.+@.+\..+/.test(f.value));
        f.setAttribute('aria-invalid', String(!ok));
        if (!ok && !bad) bad = f;
      });
      if (bad) {
        status.className = 'form-status is-err';
        status.textContent = 'Please add your name, a working email and a short note so I can reach you.';
        bad.focus();
        return;
      }
      btn.disabled = true;
      btn.classList.add('is-busy');
      status.className = 'form-status';
      status.textContent = 'Sending…';
      fetch(contact.action, { method: 'POST', body: new FormData(contact), headers: { Accept: 'application/json' } })
        .then(function (r) {
          if (!r.ok) throw new Error('bad');
          contact.reset();
          status.className = 'form-status is-ok';
          status.textContent = 'Thank you! Your message is on its way. I’ll be in touch soon, usually within a day.';
        })
        .catch(function () {
          status.className = 'form-status is-err';
          status.textContent = 'Something went wrong sending that. Please call or text 973-600-4030, or email info@eileenalexander.com.';
        })
        .then(function () { btn.disabled = false; btn.classList.remove('is-busy'); });
    });
  }

  // Preselect the contact "interest" from ?topic=
  var topic = new URLSearchParams(window.location.search).get('topic');
  var interest = document.getElementById('cf-interest');
  if (topic && interest) {
    Array.prototype.forEach.call(interest.options, function (o) { if (o.value === topic) interest.value = topic; });
  }

  // Footer year
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
