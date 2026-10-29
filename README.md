# High Fifteen — website

A hand-built, multi-page marketing site for **High Fifteen Ltd** and founder **Vanessa Belleau**:
inclusive high performance culture, executive coaching, leadership learning and speaking.

Static HTML, CSS and vanilla JS. No framework, no CMS lock-in, no tracking scripts.
Fonts and images are self-hosted (UK/EU GDPR friendly); YouTube only loads when someone presses play.

## Pages

| Page | File | What it does |
| --- | --- | --- |
| Home | `index.html` | Hero, pathway selector, services, impact, founder, case studies, TEDx, **Pressure Check**, journal, newsletter, fit check |
| About | `about.html` | Story, founder, credentials, philosophy, timeline, client wall, Vanessa the artist |
| Services | `services.html` | Organisations / individuals toggle, engagement process |
| Culture | `culture.html` | Outcomes, three culture packages, Sony Music proof, FAQ |
| Executive coaching | `coaching.html` | Organisations / individuals, approach, topics, testimonials, FAQ |
| Leadership learning | `learning.html` | Case study metrics, formats, workshop library, process, FAQ |
| Speaking | `speaking.html` | TEDx, speaking topics, gallery, process, FAQ |
| HR Hub | `hr-hub.html` | Six support areas, **cost-of-turnover calculator**, insights |
| Case studies | `case-studies.html` | Sony Music, Levi's, Gymshark, beauty & luxury group, more partnerships |
| Journal | `journal.html` | All articles with category filters |
| Articles (20) | `journal-*.html` | Full article pages: reading progress, share links, author box, related reads |
| Case studies (4) | `case-study-*.html` | Sony Music, Levi's, Gymshark, beauty & luxury group: brief, what we did, impact, quotes |
| Press & media | `press.html` | Podcasts, publications, copyable bio, downloadable headshots |
| Work with us | `contact.html` | **4-step qualifying enquiry form** |
| 404 | `404.html` | Not-found page |

## Lead-qualification features

- **Pressure Check** (home, `#pressure-check`): a 6-question diagnostic that scores a team 0–100,
  names its biggest pressure point and recommends where to start. The result can be sent with an enquiry.
- **Qualifying enquiry form** (`contact.html`): asks who they are, what is going on, seniority, scope,
  timeframe and budget. Each enquiry is tagged **Priority**, **Qualified** or **Nurture** in the email subject,
  so the most serious leads are obvious at a glance.
- **Pathway selector** (home): routes CEOs, HR leaders, individuals and event organisers to the right offer,
  and pre-fills the enquiry form.
- **Fit check** (“We’re a great fit if… / probably not for you if…”) to filter out browsers.
- **Cost of standing still** calculator (HR Hub): helps HR leaders build the business case internally.

## Configure (no build needed)

Edit `assets/js/config.js`:

- `formEndpoint` — paste a Formspree / Basin / Netlify Forms endpoint to receive enquiries as JSON.
  Left empty, the form opens the visitor's email app with the enquiry written out to `contactEmail`.
- `newsletterEndpoint` — optional sign-up endpoint. Empty sends people to the existing sign-up page.
- `calendarUrl` — optional Calendly/TidyCal link, offered straight after Priority and Qualified enquiries.

## Editing content

Page content lives in `_src/pages/*.html`; shared header, footer and blocks live in `_src/partials/`.
After editing, rebuild:

```bash
node build.js
```

This writes the finished pages to the repo root and refreshes `sitemap.xml`. Node 18+ is the only requirement.

**Add a journal article:** add an entry to `_src/data/journal.json` (slug, title, date, category,
image, excerpt, minutes, html) and run `node build.js`. The article page, the journal grid, related
reads and the sitemap all update automatically.

**Add a case study:** add an entry to `_src/data/cases.json` and rebuild. Pages are generated from
`_src/partials/case.html`.

Helpers you can use inside `_src` files:

- `<x-img name="headshot-1" alt="…" sizes="50vw">` — responsive WebP image (see `_src/images.json`)
- `<x-btn href="contact.html" variant="primary|mint|light|ghost">Label</x-btn>` — animated button
- `<x-include file="cta" heading="Text with [[italic accent]]" … />` — reusable blocks
- `{{i:arrow}}` — inline icon; `[[…]]` — serif italic accent; `[[~…]]` adds a hand-drawn underline, `[[@…]]` a hand-drawn circle

## Deploy

It is a static site: upload the repo root to Netlify, Vercel, Cloudflare Pages or GitHub Pages
(no build command needed; the built HTML is committed). Point `www.highfifteen.com` at it.

## Tech notes

- Motion: GSAP 3.12 + ScrollTrigger, Lenis smooth scroll (vendored in `assets/vendor`).
  Everything respects `prefers-reduced-motion` and still works with JavaScript off.
- Type: Bricolage Grotesque (display, optical sizing), Instrument Serif italic accents, Plus Jakarta Sans (body), JetBrains Mono (labels), all self-hosted.
- Accessibility: skip link, keyboard-friendly tabs and accordions, visible focus states, alt text.
- SEO: unique titles and descriptions, Open Graph images, canonical URLs, JSON-LD, sitemap and robots.txt.

Designed and built by Code Bunny.
