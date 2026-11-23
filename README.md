# eileenalexander.com

Eileen Alexander Therapeutic Services. Static HTML/CSS/vanilla JS rebuild of the old WordPress/Divi/WooCommerce site, with a custom cart, Stripe Checkout (Netlify Function) and a Zelle/Venmo/check path through Formspree.

Built by Live Web Studios, October 2026.

> **Layout note (November 2026):** the site lives in `build/` and Netlify publishes that folder
> (`publish = "build"` in `netlify.toml`). Every site path below is relative to `build/`.
> `netlify.toml`, `package.json`, `netlify/functions/` and `tests/` stay at the repo root.
> Planning docs, reference screenshots and the page build tools are in `docs/`, which is
> gitignored and never pushed (the repo is public).
>
> **Design (November 16, 2026):** Eileen chose Design 1, Garden Room. Every page is built in it.

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

css/style.css                  All styles. Part 1 plumbing (with the reduced-motion kill switch),
                               Part 2 Garden Room tokens and home/about, Part 3 interior pages.
js/main.js                     Butterfly species (window.EA_BFLY) + nav, reveals, chips, shop tabs,
                               FAQ, testimonials, contact form, butterflies
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
python -m http.server 4173 --directory build
```

Full preview with the function: `netlify dev` (Netlify CLI), which serves the site and `/.netlify/functions/*` on port 8888.

Function checks:

```bash
npm install && npm test
```

## Brand: Garden Room

Sage and cream, arches, rounded cards, potted plants. Tokens live on `:root` in `css/style.css`.

| Token | Hex | Use |
|---|---|---|
| `--bg` | `#f8f4ea` | Page cream |
| `--bg-2` | `#e0e2ce` | Sage band (`.band`, `.strip`) |
| `--bg-3` | `#f1eadb` | Sand sections, heroes (`.section--alt`, `.page-hero`) |
| `--surface` | `#fffdf8` | Cards, panels, fields |
| `--ink` / `--ink-strong` / `--ink-2` | `#575c4a` / `#2e3226` / `#616454` | Body, headings, secondary text |
| `--accent` / `--accent-dark` | `#5f6c4d` / `#4b5838` | Buttons, links, chips, h2 accents (deepened from `#6f7e5a` for AA contrast) |
| `--sage` | `#6f7e5a` | Decorative sage, `theme-color` |
| `--line` / `--line-strong` | `#e5ddc9` / `#cbc6ad` | 1px borders |

Logo accents: `--brand` `#7e1416` (prices, H1 accent, header button, nav underline), `--brand-2` `#9c3a3c` (kickers), `--mauve` `#c18181` and `--mauve-soft`, `--blush` `#f8ebe8` (soft cards, quote blocks).

Type: Marcellus (headings) + Jost 300/400/500/600 (body), Google Fonts. Radii: `--r` 26px cards, `--r-sm` 12px rows and fields, `--r-btn` 10px buttons, `--r-chip` 10px chips; arches use `999px 999px 20px 20px`.

Logo stays `images/logoRGB.png` in its own colors, always an `<img>`.

## Butterflies

The butterflies are the heart of this site (Eileen: "its like Niki is there on every page"). Every page has them, including cart, checkout, thank-you and 404.

The species is `window.EA_BFLY` at the top of `js/main.js`: art for one right wing, a body and six colorways (`ruby`, `honey`, `coral`, `sage`, `sky`, `plum`). The engine mirrors the wing and flaps it in 3D.

- `data-flutter="n"` on a section: n butterflies in flight (max 7, 2 on phones).
- `data-flutter-zone="right | left | sides | top | bottom | full"`: where they may fly. `data-flutter-zone-sm` sets the zone on phones (default `top`).
- `<span class="perch perch--NAME" data-bfly="colorway" aria-hidden="true"></span>`: a resting butterfly, placed by a `.perch--NAME` rule (or by its parent, for example `.panel > .perch`).

Rules: flight in every page hero plus one to three more sections; perches on images and cards; never over body text; `pointer-events: none` and `aria-hidden="true"` always; vary colorways side by side. Flight pauses off screen and in hidden tabs. Under `prefers-reduced-motion` nothing moves and perches stay visible. The empty cart shows a still butterfly (`window.EA_BUTTERFLY_SVG`).

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

## Images

All current photos except the portrait are AI stand-ins (no people's faces). Replace each at the same filename with a real photo when Eileen has them: JPG, quality 82, max 1600px wide, metadata stripped. Rounded frames crop with `object-fit: cover`, so any size near the same shape works.

| File | Size | Subject | Status |
|---|---|---|---|
| `eileen-portrait.jpg` | 600x800 | Eileen smiling, soft sand-to-sage backdrop | **Real photo** (Nov 15 original; tapestry swapped for a plain backdrop 2026-11-23, untouched original in `docs/`) |
| `hero.jpg` | 1600x1195 | Sunlit healing studio, treatment table, arched niches, plants | Stand-in |
| `reiki.jpg` | 1000x1000 | Hands hovering above a clothed client | Stand-in |
| `coaching.jpg` | 1000x1000 | Two linen armchairs, tea and notebook by a window | Stand-in |
| `grief.jpg` | 1000x1000 | Candle, white flowers and a journal | Stand-in |
| `yoga.jpg` | 1000x1000 | Sage yoga mat, bolster, blanket | Stand-in |
| `meditation.jpg` | 1000x1000 | Meditation cushion and singing bowl | Stand-in |
| `chakra.jpg` | 1000x1000 | Seven crystals in rainbow order on linen | Stand-in |
| `training.jpg` | 1000x1000 | Training workbook, certificate, candle | Stand-in |
| `circle.jpg` | 1000x1000 | Floor cushions in a circle around candles | Stand-in |
| `retreat.jpg` | 1000x1000 | Yoga mats on a dock by a misty lake | Stand-in |
| `butterfly.jpg` | 1400x930 | Butterfly on white garden flowers | Stand-in |

Already final: `logoRGB.png` (414x74), `favicon.png`, `favicon.svg` (butterfly), `og-image.jpg` (1200x630), `acep-member.jpg`, `quantum-success.jpg`, `verifiedsecured.png`.

## Redirects

`_redirects` maps every old WordPress URL to the new structure with 301s (`/shop`, `/product/*`, `/coaching-sessions*`, `/reiki-sessions`, `/training-sessions`, `/chakra-sessions`, `/yoga`, `/meditation`, `/sessions`, `/about-eileen`, the testimonial post slugs, `/my-account`, `/feed`, `/wp-*`). `/events/`, `/cart/`, `/checkout/` and `/contact/` keep the same paths, so they need no rule.

## SEO notes

- Canonicals and sitemap URLs use the trailing slash (`/about/`) because Netlify serves folder pages there and 301s the slashless form. This is a deliberate exception to the "no trailing slash" sitemap convention, so the sitemap never lists a URL that redirects.
- JSON-LD on every page: `HealthAndBeautyBusiness`/`LocalBusiness` with address, phone, geo (40.9530, -74.2108) and areas served. Plus `Service`, `Product` (AggregateOffer/Offer), `Event`, `FAQPage`, `BreadcrumbList`, `Person` and `AboutPage` where they apply.
- cart, checkout and thank-you are `noindex` and disallowed in `robots.txt`.
- GA4 snippet is commented out in every `<head>`. Replace `G-XXXXXXXXXX` and uncomment at launch.

## Open items (owner: Jon)

- [x] **Portrait resolution.** Her 600x800 original arrived Nov 15 and is live (2026-11-23) on a soft backdrop. Caps lifted to 380px (About arch) and 420px (home blob). A larger original would still help on retina screens.
- [ ] **Stand-in photos.** The 11 Garden Room images are AI stand-ins. Real studio photos replace them when Eileen has them.
- [ ] **Reiki Master date goes stale after December 6, 2026.** After that day: remove the `schedule` from the Group Training variant in `products.json`, the "NEXT GROUP" kicker on the home and training shop panels, the "Dec 6" chip label (home and training), the calendar card on home, the "NEXT: DEC 6, 2026" link on the training Master card, the December event block on events, and the `Event` schema on events.
- [ ] **Three original designs** live at git tag `design-ideas-v1` and as a reusable kit in `local_project/templates/wellness-three-designs/` (see its `TEMPLATE-README.md`).
- [ ] **Stripe keys.** Sandbox key tested locally 2026-10-22 (`build/.env`, gitignored, loaded by `_dev/devserver.js`): all 22 option combos create sessions, a full 4242 payment lands on thank-you with the cart cleared, cancel returns with the cart kept, bad options and client-sent prices are rejected. Still to do: promo code test (none created yet), add the key to Netlify env at deploy, and swap to live once Eileen finishes Stripe activation (business details, bank, SSN last 4). Turn on Stripe receipt emails, since the thank-you page promises one.
- [x] **Prices.** Eileen confirmed every price 2026-10-23: sessions $120 / $315 / $975, Reiki 1 $230 group / $330 private, Reiki 2 $280 / $380, Reiki Master $560 / $660. All match `products.json`.
- [x] **Check mailing address.** Eileen changed it 2026-10-22: checks go to her home, 15 Jennifer Court, Clifton, NJ 07013. Printed only on the thank-you page check card (page is noindex). Everything else uses the Saddle River office.
- [x] **Zelle 973-600-4030 and Venmo @Eileen-Alexander-1.** Confirmed by Eileen 2026-10-21.
- [x] **Saddle River is the only address.** Per Eileen 2026-10-22/23, the site now uses The Center for Mind Body Balance, 96 East Allendale Road, Saddle River, NJ 07458 everywhere (footer, contact, FAQ, LocalBusiness schema with geo 41.0310, -74.0960, titles/meta, service-area copy). Wayne is gone. Naturally Yoga is only the upstairs studio that hosts group trainings, so it appears only on event venues and her teacher-training credential.
- [x] **Retreat: May 14-16, 2027, West Milford, NJ.** From Eileen's flyer (2026-10-23 email): product `lakefront-retreat-2027` with four options, Full Weekend $745 (Fri 5 pm to Sun noon, shared room, 8 spots), Full Day Saturday $289, Saturday Dinner & Kirtan $80, Saturday Kirtan Only $50. Cancellation: full refund up to 45 days out, then only if the spot is filled. The $845 single room is already taken, so it is not offered. Events page section + Event schema (AggregateOffer). The flyer lists no street address, so the page says West Milford only. The Nov 1 Reiki 2 training was removed (past).
- [x] **Reiki Master (Dec 6, 2026) location.** Naturally Yoga, Saddle River, confirmed by Eileen. On the event card, the Event schema and the cart line.
- [x] **Facebook.** Business page in the footer and schema `sameAs`: https://www.facebook.com/EileenAlexanderTherapeuticServices. She posts mostly on her personal page (https://www.facebook.com/EileenAlexanderLifeCoachAndReikiMaster) and asked about linking both; not added yet.
- [ ] **3% card fee.** Eileen asked to add 3% to card payments. Stripe has no switch for it; it would be a line item in our checkout function. Card-network rules bar surcharging debit cards and require up-front disclosure, so raising prices may be simpler. Decide with Eileen.
- [ ] **Stripe bank account.** Eileen finished most of activation but could not find where to add her bank, and was unsure which payment methods to enable. She added Jon as an Administrator (invite email 2026-10-23).
- [ ] **GA4 ID** and Google Search Console verification + sitemap submit.
- [ ] **Real-device pass** on iPhone Safari and Android Chrome.

## Launch checklist

1. Netlify: connect repo, publish dir `build`, no build command needed (the toml echoes one). Functions are picked up from `netlify/functions`.
2. Set `STRIPE_SECRET_KEY` (live) in Site settings > Environment variables.
3. Point DNS, enable HTTPS.
4. Uncomment GA4 with the real ID.
5. GSC: verify, submit `https://eileenalexander.com/sitemap.xml`.
6. Spot-check a few 301s: `/shop`, `/about-eileen`, `/reiki-sessions`, `/product/reiki-one-two`.
