# eileenalexander.com

Eileen Alexander Therapeutic Services. Static HTML/CSS/vanilla JS rebuild of the old WordPress/Divi/WooCommerce site, with a custom cart, Stripe Checkout (Netlify Function) and a Zelle/Venmo/check path through Formspree.

Built by Live Web Studios, October 2026.

---

## Structure

```
index.html                     Home
about/                         About Eileen
services/                      Services hub (treatment cards + Individual Sessions buy block + FAQ)
services/reiki/                Reiki Sessions (buy block, Reiki preselected)
services/coaching/             Life, Grief & Spiritual Coaching (buy block, Life Coaching preselected)
services/chakra/               Private Chakra Sessions ($315 buy block)
services/yoga-meditation/      Yoga & Meditation (buy block, Yoga preselected)
training/                      Reiki Training (levels, Reiki 1&2 + Master buy blocks, FAQ)
events/                        Events & Retreats (Register buttons add to cart)
cart/  checkout/  thank-you/   Commerce pages (noindex)
contact/                       Contact form (Formspree) + FAQ
404.html                       Sets a relative <base> from the URL depth so assets load at any depth

css/style.css                  All styles. Tokens on :root. Reduced-motion kill switch at the bottom.
js/main.js                     Nav, scroll reveals, butterflies, FAQ, testimonials, contact form
js/cart.js                     Cart state, product blocks, drawer, cart page, checkout, thank-you
data/products.json             Single source of truth for products and prices (cents)
netlify/functions/create-checkout-session.js   Stripe Checkout session (re-prices server side)
tests/checkout.test.js         `npm test` runs local checks on the function
_redirects                     301s from the old WordPress URLs
netlify.toml                   Functions dir, esbuild bundler, headers, blocks /netlify /tests from public
```

Every page carries its own header and footer (no JS injection). All internal paths are relative. Each `<body>` has `data-root` (`""`, `"../"` or `"../../"`) so the JS can build relative URLs.

## Run locally

Static preview (no card checkout):

```bash
python3 -m http.server 8002
```

Full preview with the function: `netlify dev` (Netlify CLI), which serves the site and `/.netlify/functions/*` on port 8888.

Function checks:

```bash
npm install && npm test
```

## Brand

Colors pulled from the live site CSS and the logo PNG:

| Token | Hex | Source |
|---|---|---|
| `--burgundy` | `#800000` | live site headings/buttons, logo |
| `--burgundy-deep` | `#7e1416` | logo "alexander" |
| `--red` | `#c03030` | live accent color, logo "eileen", business card band |
| `--rose` | `#e0b5b5` | live header band, business card |
| `--rose-mid` | `#c18181` | logo "THERAPEUTIC SERVICES" (decorative use only, 3.1:1) |
| `--ink` | `#5b4747` | live body copy color |

Type: Playfair Display (headings) + Mulish (body), Google Fonts. Logo stays `images/logoRGB.png`; over the hero and in the footer it is turned white with a CSS filter, not a second file.

Butterflies: inline SVG built by `js/main.js` from any element with `data-butterflies="n"` (`data-butterflies-light` for dark sections). Two wing groups flap with `scaleX`, the wrapper drifts. On content sections they only glide inside the top and bottom padding bands so they never pass over text. Desktop heroes get free drift on the right half. Max 5 per section, 2 on phones, paused when offscreen, off under `prefers-reduced-motion`.

## Commerce

### Prices (extracted from the live WooCommerce `data-product_variations` JSON on 2026-10-21)

| Product | Combo | Price |
|---|---|---|
| Individual Sessions | any service, 1-Hour Session | $120 |
| Individual Sessions | any service, 3-Session Package | **$315** (was `null` in the handoff) |
| Individual Sessions | any service, 10-Session Package | $975 |
| Reiki 1 & 2 Training | Reiki 1, Group | $230 |
| Reiki 1 & 2 Training | Reiki 2, Group | $280 |
| Reiki 1 & 2 Training | Reiki 1, Private | **$330** (was `null`) |
| Reiki 1 & 2 Training | Reiki 2, Private | **$380** (was `null`) |
| Reiki Master Training | Group | $560 |
| Reiki Master Training | Private | **$660** (was `null`) |
| Private Chakra Session Series | 3 x 1 hour | $315 |

Woo product IDs for reference: individual-sessions 21488 (variations 21973/21975/21974), reiki-one-two 21695 (22022 to 22025), reiki-master 21700 (22020/22021).

To change a price, edit `data/products.json` only. The page JS and the Netlify function both read it. Prices are in cents. A variant whose `price` is not a number cannot be bought (the function rejects it). Optional `schedule` on a variant shows on the product block, in the cart and in the Stripe line description.

### Card path

`checkout/` POSTs `{ items: [{ id, options, qty }] }` to `.netlify/functions/create-checkout-session`. The function ignores any client price, validates every id/option/qty against `products.json`, builds Stripe `line_items`, and returns the hosted Checkout URL. `allow_promotion_codes: true`, phone collection on, success `thank-you/?paid=1`, cancel `checkout/?canceled=1`. Stripe handles cards, Apple Pay, Google Pay and the receipt email. No Apple Pay domain file is needed with hosted Checkout.

Without `STRIPE_SECRET_KEY` the function returns a friendly 503 and the checkout page tells the visitor to use Zelle/Venmo/check or call. Nothing breaks while keys are pending.

Netlify env vars:

- `STRIPE_SECRET_KEY` (required): `sk_test_...` now, `sk_live_...` at launch
- `STRIPE_PUBLISHABLE_KEY` (optional): not used by hosted Checkout redirects; safe to add for later

### Zelle / Venmo / check path

`checkout/` form posts to Formspree `mjygqpyl` with `form_type=offline-order`, `order_items` (one line per item, with options and line totals), `order_total`, `payment_method`, name, email, phone, notes. Subject line reads `New order (Zelle/Venmo/check) from NAME | $TOTAL`. The contact form uses the same endpoint with `form_type=contact`. Both have the `_gotcha` honeypot.

## Image shot list (all current images are labeled placeholders)

Every placeholder has its filename, size and subject printed in the lower right corner. Replace each file at the same name and pixel size; JPG, quality ~82, max 1600px wide, strip metadata. Warm, soft, candid. No stock-corporate look. Brand-friendly tones (rose, cream, soft gold light).

| File | Size | Subject |
|---|---|---|
| `hero-home.jpg` | 1600x1000 | Soft morning light in a serene healing studio, hands hovering in Reiki. Darker left side for white headline |
| `hero-about.jpg` | 1600x900 | Light through trees, golden hour, peaceful path |
| `hero-services.jpg` | 1600x900 | Treatment room: massage table, candles, soft linens |
| `hero-reiki.jpg` | 1600x900 | Close-up of hands above a resting client, warm glow |
| `hero-coaching.jpg` | 1600x900 | Two chairs, tea and a journal by a sunny window |
| `hero-chakra.jpg` | 1600x900 | Seven stones in rainbow order on linen |
| `hero-yoga.jpg` | 1600x900 | Yoga mat, bolster, blanket, morning light |
| `hero-training.jpg` | 1600x900 | Small circle of students, manuals, candles |
| `hero-events.jpg` | 1600x900 | Lakefront retreat house at dawn, mist on the water |
| `hero-contact.jpg` | 1600x900 | Butterfly on flowers, soft garden bokeh |
| `eileen-portrait.jpg` | 900x1125 | Eileen, warm candid portrait, natural light (real photo of Eileen) |
| `eileen-teaching.jpg` | 900x1125 | Eileen guiding a Reiki student (real photo of Eileen) |
| `card-reiki.jpg` | 800x600 | Reiki session, hands and soft light |
| `card-coaching.jpg` | 800x600 | Journal, pen and tea on a cozy table |
| `card-chakra.jpg` | 800x600 | Chakra stones and crystals |
| `card-yoga.jpg` | 800x600 | Restorative yoga props, bolster and blanket |
| `card-meditation.jpg` | 800x600 | Meditation cushion and singing bowl |
| `card-training.jpg` | 800x600 | Reiki manual, certificate, candle |
| `card-clearing.jpg` | 800x600 | Sage bundle, open window, sheer curtain |
| `card-circle.jpg` | 800x600 | Memorial garden stones and flowers |
| `card-retreat.jpg` | 800x600 | Retreat circle outdoors, women on mats |
| `retreat-feature.jpg` | 1600x1000 | Lakefront retreat, canoe, morning light (white card overlaps the right half) |
| `cta-closing.jpg` | 1600x1000 | Butterfly in light through trees (white card overlaps the left half) |

Already final: `logoRGB.png` (414x74 from the live site), `favicon.png` (16x16), `favicon.svg` (butterfly), `og-image.jpg` (1200x630, logo on cream; a vector logo would make it crisper), `acep-member.jpg`, `quantum-success.jpg`, `verifiedsecured.png`.

Hero images sit under a burgundy gradient overlay. After swapping finals, re-check that the rose italic in each H1 still reads clearly.

## Redirects

`_redirects` maps every old WordPress URL to the new structure with 301s (`/shop`, `/product/*`, `/coaching-sessions*`, `/reiki-sessions`, `/training-sessions`, `/chakra-sessions`, `/yoga`, `/meditation`, `/sessions`, `/about-eileen`, the testimonial post slugs, `/my-account`, `/feed`, `/wp-*`). `/events/`, `/cart/`, `/checkout/` and `/contact/` keep the same paths, so they need no rule.

## SEO notes

- Canonicals and sitemap URLs use the trailing slash (`/about/`) because Netlify serves folder pages there and 301s the slashless form. This is a deliberate exception to the "no trailing slash" sitemap convention, so the sitemap never lists a URL that redirects.
- JSON-LD on every page: `HealthAndBeautyBusiness`/`LocalBusiness` with address, phone, geo (40.9530, -74.2108) and areas served. Plus `Service`, `Product` (AggregateOffer/Offer), `Event`, `FAQPage`, `BreadcrumbList`, `Person` and `AboutPage` where they apply.
- cart, checkout and thank-you are `noindex` and disallowed in `robots.txt`.
- GA4 snippet is commented out in every `<head>`. Replace `G-XXXXXXXXXX` and uncomment at launch.

## Open items (owner: Jon)

- [ ] **Stripe keys.** Add `STRIPE_SECRET_KEY` (test) in Netlify env, run every combo end to end, try a promo code, cancel once. Swap to live at launch.
- [ ] **Verify the four previously `null` prices** above with Eileen ($315 3-pack, $330 / $380 Reiki private, $660 Master private). They came straight from the live Woo data, but the handoff marks this as a launch blocker until Jon confirms.
- [ ] **Check mailing address.** The thank-you page says "Reach out and I'll share the mailing address" (same as the live site). Add the address if Eileen wants it printed.
- [ ] **Zelle 973-600-4030 and Venmo @Eileen-Alexander-1.** Confirm both are still current.
- [ ] **Next retreat.** Events page shows "Next retreat coming soon, join the list." When a retreat is set, add a tiered product to `products.json` (e.g. Full Weekend / Saturday / Kirtan Only) and an event card.
- [ ] **Reiki Master (Dec 6, 2026) location.** The live site doesn't list it. The page says "Location confirmed when you register"; the Event schema uses Naturally Yoga, Saddle River. Fix both if it's elsewhere.
- [ ] **Facebook.** The live footer's Facebook icon links to `#`. Send the real page URL and it goes in the footer and in schema `sameAs`.
- [ ] **Final images** per the shot list.
- [ ] **GA4 ID** and Google Search Console verification + sitemap submit.
- [ ] **Real-device pass** on iPhone Safari and Android Chrome.

## Launch checklist

1. Netlify: connect repo, publish dir `.`, no build command needed (the toml echoes one). Functions are picked up from `netlify/functions`.
2. Set `STRIPE_SECRET_KEY` (live) in Site settings > Environment variables.
3. Point DNS, enable HTTPS.
4. Uncomment GA4 with the real ID.
5. GSC: verify, submit `https://eileenalexander.com/sitemap.xml`.
6. Spot-check a few 301s: `/shop`, `/about-eileen`, `/reiki-sessions`, `/product/reiki-one-two`.
