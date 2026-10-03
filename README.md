# FamilyBandhan website — handover & testing guide

Static site, no build step. Upload the folder to any host (Hostinger, Netlify, Vercel, GitHub Pages, cPanel).

```
index.html        main landing page
privacy.html      privacy policy (draft — review before publishing)
terms.html        terms of service (draft — review before publishing)
css/styles.css    all styles, brand tokens at the top
js/main.js        contact settings + menu, validation, WhatsApp handoff
assets/           hero images (webp + jpg, 3 sizes), logo, favicons, OG image
manifest.json     PWA manifest (install-to-home-screen)
robots.txt        allows indexing, points to sitemap
sitemap.xml       3 URLs
_legacy_index.html  the previous single-file version, kept for reference only — do NOT upload
```

## Change contact details

Open `js/main.js`, edit the block at the top:

```js
var PHONE_DIGITS  = "917742583308";   // WhatsApp number, digits only
var PHONE_DISPLAY = "77425 83308";    // shown after "+91 "
var EMAIL         = "hello@familybandhan.com";
var FORM_ENDPOINT = "";               // optional Formspree/Getform URL for email copies
```

Also update `telephone` / `email` in the JSON-LD block in `index.html` `<head>`.

## Change prices or services

- Service cards: `index.html` → `<section id="services">`. Each `<article class="svc" data-service="...">`. The `data-service` text must match an `<option>` in the booking form's "Service needed" select exactly — that is how "Book this" pre-selects it.
- Plans: `<section id="plans">`.
- Also update prices in the JSON-LD `hasOfferCatalog` block.

## Change colours

`css/styles.css` → `:root` tokens. Rules of thumb used:

| Token | Use for | Never for |
|---|---|---|
| `--teal #087F7B` | buttons with white text, icons, links | small grey-on-teal text |
| `--teal-deep #065E5B` | small teal text on ivory/white | — |
| `--teal-ink #0F3F3D` | headings, dark sections | — |
| `--gold #C9A227` | eyebrows on dark, accents, gold button (dark text) | body text on white (2.4:1 contrast) |
| `--gold-deep #8A6A10` | small gold text on white/ivory | — |

## How to test (10 minutes)

### 1. Open locally
Double-click `index.html`, or run `python3 -m http.server 8000` in the folder and open `http://localhost:8000`.

### 2. Responsive
Chrome → F12 → toggle device toolbar (Ctrl+Shift+M). Check at **390** (iPhone), **820** (iPad) and **1366** widths:
- Hero image shows both faces, nothing overflows horizontally
- Six service cards: 1 column → 2 → 3
- Form fields: 1 column → 2 on wider screens
- Floating WhatsApp button hides when the booking form or footer is on screen

### 3. Navigation & accessibility
- Press **Tab** from the top: first stop is "Skip to main content"; focus rings are gold and visible
- On mobile: hamburger opens the menu, **Esc** closes it, tapping outside closes it, `aria-expanded` toggles
- Desktop nav highlights the section you are in while scrolling
- Click every anchor link in header, footer, service cards and plan buttons
- Lighthouse (F12 → Lighthouse → Accessibility + SEO): expect 95+ on both

### 4. Booking form
| Test | Expected |
|---|---|
| Submit empty | Name, phone, service, area turn red with messages; focus jumps to first error; status reads "Please check the highlighted fields." |
| Phone `12345` | Phone error (needs 10–15 digits) |
| Click "Book this →" on the Railway card | Scrolls to form, "Service needed" shows "Railway station assistance" |
| Fill valid data, submit | WhatsApp opens with a pre-filled message containing all fields incl. date formatted like "Sat, 10 Oct, 2026"; green success message; form clears |
| Block pop-ups, submit again | Red message with a direct "Tap here to open WhatsApp" link and a tel: link |
| Date picker | Cannot pick a past date |

### 5. Performance
- F12 → Network → reload with cache disabled: total should be ≈130 KB (hero webp ~93 KB, CSS 26 KB, JS 10 KB)
- Lighthouse Performance on mobile: expect 90+
- No console errors

### 6. SEO
- View source: one `<h1>`, `<title>`, meta description, canonical, OG/Twitter tags
- Paste the URL into [Google Rich Results Test](https://search.google.com/test/rich-results): should detect LocalBusiness and FAQPage
- `/robots.txt` and `/sitemap.xml` load; after going live, submit the sitemap in Google Search Console

## Before going live — decisions for you

1. **Pricing**: at the stated allowances, single visits are cheaper per visit than yearly plans (Care+: 4×₹800 = ₹3,200/month vs ₹40,000/12 = ₹3,333; Saath: 3×₹1,200 = ₹3,600 vs ₹4,167). Yearly card now lists "dedicated coordinator, priority slots" as extras — confirm, or adjust prices.
2. **Airport/railway intercity travel**: page says the companion's travel is "billed at cost". Confirm.
3. **Opening hours**: JSON-LD and the contact block say 8 am – 8 pm, 7 days. Confirm.
4. **Legal pages**: `privacy.html` and `terms.html` are reasonable drafts. Have them reviewed.
5. **Domain**: all canonical/OG URLs point to `https://familybandhan.com/`. Change if the domain differs.
