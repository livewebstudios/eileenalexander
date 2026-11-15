/* Demo 2 butterfly species: "tropical" swallowtails. Pointed forewings, tailed
   hindwings, a dark velvet border and a jewel-tone gradient that glows out from the
   body, with a soft sheen and white tip spots. Gradients live in the page sprite.
   Art is for the RIGHT wing in a 200x160 box (body at x=100); the engine mirrors it. */
window.EA_BFLY = (function () {
  var FW = 'M103 74C112 40 150 4 192 8c6 1 6 10 2 20-10 26-40 54-91 56z';
  var HW = 'M103 82c24-4 56 0 64 22 5 14 0 26-10 32l6 20c-8-4-14-10-18-16-18 0-34-22-42-50z';
  function inset(d, cx, cy, s, fill) {
    return '<path d="' + d + '" fill="' + fill + '" transform="translate(' + cx + ' ' + cy + ') scale(' + s + ') translate(-' + cx + ' -' + cy + ')"/>';
  }
  function dots(list, fill) {
    return list.map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + p[2] + '" fill="' + fill + '"/>'; }).join('');
  }
  return {
    ways: {
      ruby: { k: '#2a0a10', g: 'url(#gb-ruby)', s: '#ffd9d4' },
      morpho: { k: '#0d1a2b', g: 'url(#gb-morpho)', s: '#9fe9ff' },
      sunset: { k: '#2a1220', g: 'url(#gb-sunset)', s: '#ffe27a' },
      emerald: { k: '#0c1f1a', g: 'url(#gb-emerald)', s: '#f4ff8a' },
      orchid: { k: '#1d1233', g: 'url(#gb-orchid)', s: '#ffd0f0' },
      gold: { k: '#2b1a0c', g: 'url(#gb-gold)', s: '#fff3b0' }
    },
    wing: function (c) {
      return '<path d="' + HW + '" fill="' + c.k + '"/>' + inset(HW, 103, 88, 0.84, c.g) +
        '<path d="M106 88L158 102M106 90L152 126M106 91L132 130" fill="none" stroke="' + c.k + '" stroke-width="1.3" stroke-linecap="round" opacity="0.5"/>' +
        dots([[161.500, 106, 2.6], [160.500, 118, 2.6], [154, 129, 2.4], [141, 136, 2]], c.s) +
        '<path d="' + FW + '" fill="' + c.k + '"/>' + inset(FW, 103, 79, 0.84, c.g) +
        '<path d="M106 78L170 20M106 79L180 30M106 80L168 52M106 81L148 72" fill="none" stroke="' + c.k + '" stroke-width="1.3" stroke-linecap="round" opacity="0.5"/>' +
        '<path d="M112 68C124 46 146 28 170 20" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity="0.3"/>' +
        dots([[184.500, 13.500, 2.2], [189.500, 20, 1.9], [188.500, 29, 1.7], [181.500, 42, 1.6], [170, 56, 1.4]], '#fff');
    },
    body: function (c) {
      return '<path d="M98.600 55C96 42 90 32 82 26M101.400 55c2.600-13 8.600-23 16.600-29" fill="none" stroke="' + c.k + '" stroke-width="1.6" stroke-linecap="round"/>' +
        '<circle cx="82" cy="26" r="2.3" fill="' + c.k + '"/><circle cx="118" cy="26" r="2.3" fill="' + c.k + '"/>' +
        '<path d="M100 60c-3.600 8-4 38 0 62 4-24 3.600-54 0-62z" fill="' + c.k + '"/><circle cx="100" cy="58" r="4.600" fill="' + c.k + '"/>' +
        '<path d="M100 66v44" stroke="#fff" stroke-width="1" stroke-linecap="round" opacity="0.25"/>';
    }
  };
})();

/* Eileen Alexander | demo behavior: header, menu, reveals, shop chips/tabs/filters,
   testimonials and the butterflies. Vanilla JS only. The cart itself is the site's
   own js/cart.js, loaded right after this file. */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function qsa(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  /* ---------------------------------------------------------------- header + menu */
  var header = document.querySelector('.site-header');
  function setHeader() { if (header) header.classList.toggle('is-scrolled', window.scrollY > 24); }
  setHeader();
  window.addEventListener('scroll', setHeader, { passive: true });

  var menuBtn = document.querySelector('.menu-toggle');
  var desktop = window.matchMedia('(min-width: 1241px)');
  function closeMenu() {
    document.body.classList.remove('menu-open');
    if (menuBtn) { menuBtn.setAttribute('aria-expanded', 'false'); menuBtn.setAttribute('aria-label', 'Open menu'); }
  }
  if (menuBtn) {
    menuBtn.addEventListener('click', function () {
      var open = !document.body.classList.contains('menu-open');
      document.body.classList.toggle('menu-open', open);
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    desktop.addEventListener('change', function (e) { if (e.matches) closeMenu(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.body.classList.contains('menu-open')) { closeMenu(); menuBtn.focus(); }
    });
    qsa('.main-nav a').forEach(function (a) { a.addEventListener('click', closeMenu); });
  }

  /* ---------------------------------------------------------------- scroll reveals */
  qsa('[data-stagger]').forEach(function (group) {
    Array.prototype.forEach.call(group.children, function (child, i) {
      child.classList.add('reveal');
      child.style.setProperty('--i', i);
    });
  });
  var reveals = qsa('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('in-view'); io.unobserve(entry.target); }
      });
    }, { threshold: 0 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in-view'); });
  }

  /* ---------------------------------------------------------------- shop: option chips
     Each chip row feeds a hidden .buy-opt input, which is what js/cart.js reads. */
  qsa('[data-chips]').forEach(function (row) {
    var input = document.getElementById(row.getAttribute('data-chips'));
    row.addEventListener('click', function (e) {
      var chip = e.target.closest('.chip');
      if (!chip || !input) return;
      qsa('.chip', row).forEach(function (c) {
        var on = c === chip;
        c.classList.toggle('is-on', on);
        c.setAttribute('aria-pressed', String(on));
      });
      input.value = chip.getAttribute('data-value');
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
  });

  /* ---------------------------------------------------------------- shop: tabs */
  var tabSets = [];
  qsa('[data-tabs]').forEach(function (wrap) {
    var tabs = qsa('[role="tab"]', wrap);
    var panels = tabs.map(function (t) { return document.getElementById(t.getAttribute('aria-controls')); });
    function select(i, focus) {
      tabs.forEach(function (t, k) {
        var on = k === i;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        if (panels[k]) panels[k].hidden = !on;
      });
      if (focus) tabs[i].focus();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(i); });
      t.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
        if (!d) return;
        e.preventDefault();
        select((i + d + tabs.length) % tabs.length, true);
      });
    });
    select(0);
    tabSets.push({ wrap: wrap, panels: panels, select: select });
  });

  /* ---------------------------------------------------------------- shop: filter pills */
  qsa('[data-filters]').forEach(function (bar) {
    var grid = document.getElementById(bar.getAttribute('data-filters'));
    if (!grid) return;
    function apply(cat) {
      qsa('[data-filter]', bar).forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-filter') === cat)); });
      qsa('[data-cat]', grid).forEach(function (card) {
        var cats = card.getAttribute('data-cat').split(' ');
        card.hidden = cat !== 'all' && cats.indexOf(cat) === -1;
      });
    }
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('[data-filter]');
      if (b) apply(b.getAttribute('data-filter'));
    });
    grid._showAll = function () { apply('all'); };
  });

  /* ---------------------------------------------------------------- shop: anchors
     Nav links point at products. A product may live in a tab, an accordion row or a
     filtered grid, so open it before the browser scrolls to it. */
  function reveal(id) {
    var el = id && document.getElementById(id);
    if (!el) return false;
    for (var s = 0; s < tabSets.length; s++) {
      var k = tabSets[s].panels.indexOf(el);
      if (k > -1) {
        tabSets[s].select(k);
        tabSets[s].wrap.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
        return true;
      }
    }
    if (el.tagName === 'DETAILS') {
      el.open = true;
      el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      return true;
    }
    var grid = el.closest('[data-filter-grid]');
    if (grid && grid._showAll) grid._showAll();
    return false;
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href*="#"]');
    if (!a) return;
    var url;
    try { url = new URL(a.href); } catch (x) { return; }
    if (url.pathname !== window.location.pathname || !url.hash) return;
    if (reveal(url.hash.slice(1))) {
      e.preventDefault();
      history.replaceState(null, '', url.hash);
    }
  });
  if (window.location.hash) setTimeout(function () { reveal(window.location.hash.slice(1)); }, 60);
  window.addEventListener('hashchange', function () { reveal(window.location.hash.slice(1)); });

  /* ---------------------------------------------------------------- testimonials */
  qsa('[data-testimonials]').forEach(function (wrap) {
    var slides = qsa('.t-slide', wrap);
    var dotsWrap = wrap.querySelector('.t-dots');
    var prev = wrap.querySelector('.t-prev');
    var next = wrap.querySelector('.t-next');
    var current = 0, timer = null, dots = [];
    if (slides.length < 2) return;
    if (dotsWrap) {
      slides.forEach(function (s, i) {
        var d = document.createElement('button');
        d.type = 'button';
        d.className = 't-dot';
        d.setAttribute('aria-label', 'Show testimonial ' + (i + 1) + ' of ' + slides.length);
        d.addEventListener('click', function () { go(i); restart(); });
        dotsWrap.appendChild(d);
        dots.push(d);
      });
    }
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
      clearInterval(timer);
      if (reduceMotion) return;
      timer = setInterval(function () { go(current + 1); }, 8000);
    }
    if (prev) prev.addEventListener('click', function () { go(current - 1); restart(); });
    if (next) next.addEventListener('click', function () { go(current + 1); restart(); });
    wrap.addEventListener('mouseenter', function () { clearInterval(timer); });
    wrap.addEventListener('mouseleave', restart);
    wrap.addEventListener('focusin', function () { clearInterval(timer); });
    go(0);
    restart();
  });

  /* Card rail (demo 2 testimonials): arrows scroll one card at a time */
  qsa('[data-rail]').forEach(function (wrap) {
    var track = wrap.querySelector('.rail__track');
    if (!track) return;
    function step(dir) {
      var card = track.children[0];
      if (!card) return;
      var w = card.getBoundingClientRect().width + 20;
      var max = track.scrollWidth - track.clientWidth;
      var to = track.scrollLeft + dir * w;
      if (to > max + 4) to = 0;
      if (to < -4) to = max;
      track.scrollTo({ left: to, behavior: reduceMotion ? 'auto' : 'smooth' });
    }
    qsa('[data-rail-step]', wrap).forEach(function (b) {
      b.addEventListener('click', function () { step(parseInt(b.getAttribute('data-rail-step'), 10)); });
    });
  });

  /* ---------------------------------------------------------------- butterflies
     Each demo ships its own species in window.EA_BFLY (art for one right wing, a body
     and a set of colorways). Every butterfly is two wing SVGs hinged at the body and
     flapped in 3D, so the wings really fold.
       data-bfly="colorway"            a resting butterfly, placed by the page
       data-flutter="n"                n butterflies in flight inside this section
       data-flutter-zone="right"       where they may fly: right | left | sides | top | bottom | full
       data-flutter-zone-sm="bottom"   the zone on phones (default: top, clear of the copy) */
  var B = window.EA_BFLY;
  if (B) {
    var wayNames = Object.keys(B.ways);
    var artFor = function (way) {
      var c = B.ways[way] || B.ways[wayNames[0]];
      var wing = B.wing(c);
      return '<span class="bf-in">' +
        '<svg class="bf-w bf-w--l" viewBox="0 0 100 160" aria-hidden="true" focusable="false"><g transform="matrix(-1 0 0 1 200 0)">' + wing + '</g></svg>' +
        '<svg class="bf-w bf-w--r" viewBox="100 0 100 160" aria-hidden="true" focusable="false">' + wing + '</svg>' +
        '<svg class="bf-b" viewBox="0 0 200 160" aria-hidden="true" focusable="false">' + B.body(c) + '</svg></span>';
    };
    // Flat, still butterfly for the empty cart (used by js/cart.js).
    (function () {
      var c = B.ways[wayNames[0]], wing = B.wing(c);
      window.EA_BUTTERFLY_SVG = '<svg viewBox="0 0 200 160" aria-hidden="true" focusable="false"><g transform="matrix(-1 0 0 1 200 0)">' + wing + '</g>' + wing + B.body(c) + '</svg>';
    })();

    var rng = function (seed) {
      return function () {
        seed |= 0; seed = seed + 0x6D2B79F5 | 0;
        var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
      };
    };

    // Resting butterflies
    qsa('[data-bfly]').forEach(function (el, i) {
      var r = rng(i * 97 + 13);
      el.classList.add('bf', 'bf--rest');
      el.style.setProperty('--f', (1.5 + r() * 1.3).toFixed(2) + 's');
      el.style.setProperty('--fd', (-r() * 2).toFixed(2) + 's');
      el.innerHTML = artFor(el.getAttribute('data-bfly'));
    });

    // Butterflies in flight: each follows its own closed, smooth loop.
    var fliers = [];
    var small = window.innerWidth < 760;
    qsa('[data-flutter]').forEach(function (host, h) {
      var n = Math.min(parseInt(host.getAttribute('data-flutter'), 10) || 3, 7);
      if (small) n = Math.min(n, 2);
      var zone = small ? (host.getAttribute('data-flutter-zone-sm') || 'top') : (host.getAttribute('data-flutter-zone') || 'full');
      var layer = document.createElement('div');
      layer.className = 'flutter-layer';
      layer.setAttribute('aria-hidden', 'true');
      for (var i = 0; i < n; i++) {
        var r = rng(h * 131 + i * 17 + 5);
        var fly = document.createElement('span');
        fly.className = 'bf-fly';
        var bf = document.createElement('span');
        bf.className = 'bf bf--fly';
        var size = small ? 34 + Math.round(r() * 16) : 44 + Math.round(r() * 44);
        bf.style.setProperty('--s', size + 'px');
        bf.style.setProperty('--f', (0.24 + r() * 0.16).toFixed(2) + 's');
        bf.style.setProperty('--fd', (-r()).toFixed(2) + 's');
        fly.style.setProperty('--d', (26 + Math.round(r() * 22)) + 's');
        fly.style.setProperty('--delay', (-r() * 40).toFixed(1) + 's');
        bf.innerHTML = artFor(wayNames[(i + h) % wayNames.length]);
        fly.appendChild(bf);
        layer.appendChild(fly);
        fliers.push({ layer: layer, fly: fly, zone: zone, i: i, seed: h * 977 + i * 53 + 3 });
      }
      host.insertBefore(layer, host.firstChild);
    });

    var zoneRect = function (zone, W, H, i) {
      var z = zone;
      if (z === 'right') return [W * 0.5, H * 0.06, W * 0.98, H * 0.94];
      if (z === 'left') return [W * 0.02, H * 0.06, W * 0.5, H * 0.94];
      if (z === 'top') return [W * 0.04, 6, W * 0.96, Math.min(H * 0.3, small ? 130 : 190)];
      if (z === 'bottom') return [W * 0.04, H - Math.min(H * 0.34, 260), W * 0.96, H - 8];
      if (z === 'sides') return i % 2 ? [W * 0.8, H * 0.05, W * 0.99, H * 0.95] : [W * 0.01, H * 0.05, W * 0.2, H * 0.95];
      return [W * 0.03, H * 0.05, W * 0.97, H * 0.95];
    };
    var loopPath = function (rect, seed) {
      var r = rng(seed);
      var cx = (rect[0] + rect[2]) / 2, cy = (rect[1] + rect[3]) / 2;
      var rx = (rect[2] - rect[0]) / 2, ry = (rect[3] - rect[1]) / 2;
      var k = 7, pts = [], a0 = r() * 6.283, dir = r() > 0.5 ? 1 : -1, j;
      for (j = 0; j < k; j++) {
        var a = a0 + dir * (j / k) * 6.283 + (r() - 0.5) * 0.5;
        var rr = 0.42 + r() * 0.58;
        pts.push([cx + Math.cos(a) * rx * rr, cy + Math.sin(a) * ry * rr]);
      }
      var f = function (v) { return v.toFixed(1); };
      var d = 'M' + f(pts[0][0]) + ' ' + f(pts[0][1]);
      for (j = 0; j < k; j++) {
        var p0 = pts[(j - 1 + k) % k], p1 = pts[j], p2 = pts[(j + 1) % k], p3 = pts[(j + 2) % k];
        d += 'C' + f(p1[0] + (p2[0] - p0[0]) / 6) + ' ' + f(p1[1] + (p2[1] - p0[1]) / 6) + ' ' +
          f(p2[0] - (p3[0] - p1[0]) / 6) + ' ' + f(p2[1] - (p3[1] - p1[1]) / 6) + ' ' + f(p2[0]) + ' ' + f(p2[1]);
      }
      return d + 'Z';
    };
    var layoutFliers = function () {
      fliers.forEach(function (it) {
        var W = it.layer.clientWidth, H = it.layer.clientHeight;
        if (!W || !H) return;
        it.fly.style.offsetPath = "path('" + loopPath(zoneRect(it.zone, W, H, it.i), it.seed) + "')";
      });
    };
    layoutFliers();
    window.addEventListener('load', layoutFliers);
    var rt;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(layoutFliers, 200); });

    // Pause anything off screen or in a hidden tab
    var layers = qsa('.flutter-layer');
    if ('IntersectionObserver' in window && layers.length) {
      var lio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { en.target.classList.toggle('is-paused', !en.isIntersecting); });
      });
      layers.forEach(function (l) { lio.observe(l); });
    }
    document.addEventListener('visibilitychange', function () {
      document.body.classList.toggle('tab-hidden', document.hidden);
    });
  }

  /* ---------------------------------------------------------------- footer year */
  qsa('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
