#!/usr/bin/env node
/*
 * High Fifteen static site builder (no dependencies).
 *
 *   node build.js
 *
 * Reads page bodies from _src/pages/*.html, wraps them in the shared
 * head / header / footer partials and writes finished pages to the repo root.
 *
 * Page files start with a meta comment:
 *   <!--meta {"title": "...", "description": "...", "nav": "coaching"} -->
 *
 * Helpers available inside pages and partials:
 *   <x-img name="vanessa-portrait" alt="..." sizes="50vw" class="" eager>
 *   <x-btn href="contact.html" variant="primary|mint|light|ghost" size="sm">Label</x-btn>
 *   <x-include file="cta" />
 *   <x-logos set="clients" />
 *   {{i:arrow}}  inline SVG icon
 */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SRC = path.join(ROOT, '_src');
const SITE_URL = 'https://www.highfifteen.com';
const images = JSON.parse(fs.readFileSync(path.join(SRC, 'images.json'), 'utf8'));
const read = (p) => fs.readFileSync(path.join(SRC, p), 'utf8');

const icons = {
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  'arrow-left': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6"/></svg>',
  'arrow-up-right': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17L17 7M8 7h9v9"/></svg>',
  chev: '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 4.5L6 8l3.5-3.5"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5z"/></svg>',
  linkedin: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.75h4v11H3v-11zm6.5 0h3.8v1.5h.06c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.77 2.65 4.77 6.1v5.45h-4v-4.83c0-1.15-.02-2.63-1.6-2.63-1.6 0-1.85 1.25-1.85 2.55v4.91h-4v-11z"/></svg>',
  instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>',
  youtube: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8zM9.75 15.02V8.98L15.5 12l-5.75 3.02z"/></svg>',
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3.5 7l8.5 6 8.5-6"/></svg>',
  download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>',
  copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2.5"/><path d="M5 15V6a2 2 0 0 1 2-2h8"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.5l2.6 6.4 6.9.5-5.3 4.4 1.7 6.7L12 16.9l-5.9 3.6 1.7-6.7-5.3-4.4 6.9-.5z"/></svg>',
  burst: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0l2.4 7.2L21.6 4l-3.2 7.2L24 12l-5.6.8 3.2 7.2-7.2-3.2L12 24l-2.4-7.2L2.4 20l3.2-7.2L0 12l5.6-.8L2.4 4l7.2 3.2z"/></svg>',
  spark: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0c.6 6.3 5.7 11.4 12 12-6.3.6-11.4 5.7-12 12-.6-6.3-5.7-11.4-12-12C6.3 11.4 11.4 6.3 12 0z"/></svg>',
  hand: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V12m0-6.5v-1a1.5 1.5 0 0 1 3 0V12m0-5.5a1.5 1.5 0 0 1 3 0V13m0-3.5a1.5 1.5 0 0 1 3 0V15a7 7 0 0 1-7 7h-1.2a7 7 0 0 1-5.6-2.8L3.6 15.9a1.6 1.6 0 0 1 2.5-2L8 15.6"/></svg>',
  compass: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><path d="M15.8 8.2l-2.1 5.5-5.5 2.1 2.1-5.5z"/></svg>',
  people: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.6"/><path d="M16.5 14.2A5.5 5.5 0 0 1 21.5 20"/></svg>',
  spark2: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/></svg>',
  mic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="2.5" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3.5"/></svg>',
  book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5zM4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2.5l8 3v6c0 5-3.4 8.6-8 10-4.6-1.4-8-5-8-10v-6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/></svg>',
  chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 20h18M6 16v-4M11 16V8M16 16v-6M20.5 5.5L16 9l-5-3-5 4"/></svg>',
  heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20.5s-8.5-5-8.5-11A4.8 4.8 0 0 1 12 6.6a4.8 4.8 0 0 1 8.5 2.9c0 6-8.5 11-8.5 11z"/></svg>',
  globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><path d="M2.5 12h19M12 2.5c2.6 2.6 3.8 6 3.8 9.5s-1.2 6.9-3.8 9.5c-2.6-2.6-3.8-6-3.8-9.5s1.2-6.9 3.8-9.5z"/></svg>',
  seed: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21v-9M12 12c0-4.4 3.6-8 8-8 0 4.4-3.6 8-8 8zM12 15c0-3.3-2.7-6-6-6 0 3.3 2.7 6 6 6z"/></svg>',
  tool: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.7 6.3a4 4 0 0 0 5 5L22 13.6 13.6 22l-2.3-2.3a4 4 0 0 0-5-5L4 12.4 12.4 4z"/></svg>',
};

// Hand-drawn doodles: [[~word]] underlines, [[@word]] circles. Paths use pathLength=1 so CSS can draw them.
const doodles = {
  '~': '<svg class="doodle doodle--under" viewBox="0 0 300 24" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M4 15 C 52 7, 112 4, 172 8 C 222 11, 262 13, 296 6"/><path pathLength="1" d="M34 21 C 104 15, 192 14, 270 18"/></svg>',
  '@': '<svg class="doodle doodle--circle" viewBox="0 0 300 100" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M172 9 C 94 1, 16 16, 9 49 C 3 82, 98 97, 178 91 C 254 85, 298 63, 291 37 C 284 13, 214 1, 116 12"/></svg>',
};

// ---------- helpers ----------
function attrs(str) {
  const out = {};
  str.replace(/([\w-]+)(?:="([^"]*)")?/g, (_, k, v) => { out[k] = v === undefined ? true : v; return ''; });
  return out;
}
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

function imgTag(a) {
  const name = a.name;
  const m = images[name];
  if (!m) throw new Error('Unknown image: ' + name);
  const isLogo = name === 'logo' || name.startsWith('logos/');
  const ext = isLogo ? 'png' : 'webp';
  const file = (w) => isLogo ? `assets/img/${name}.png` : `assets/img/${name}-${w}.${ext}`;
  const widths = m.w;
  const largest = widths[widths.length - 1];
  const def = widths.find((w) => w >= 1200) || largest;
  const h = Math.round(largest / m.ar);
  const srcset = widths.length > 1 ? ` srcset="${widths.map((w) => `${file(w)} ${w}w`).join(', ')}" sizes="${a.sizes || '100vw'}"` : '';
  const cls = a.class ? ` class="${a.class}"` : '';
  const load = a.eager ? ' fetchpriority="high"' : ' loading="lazy"';
  let style = a.pos ? ` style="object-position:${a.pos}"` : '';
  if (a.area) { // optical sizing for logos: equal visual area, clamped height
    const hh = Math.max(16, Math.min(+a.max || 46, Math.sqrt(+a.area / m.ar)));
    style = ` style="height:${hh.toFixed(1)}px;width:auto"`;
  }
  return `<img src="${file(def)}"${srcset} width="${largest}" height="${h}" alt="${esc(a.alt || '')}"${cls}${style}${load} decoding="async">`;
}

function btnTag(a, label) {
  const v = a.variant ? ` btn--${a.variant}` : '';
  const s = a.size ? ` btn--${a.size}` : '';
  const extra = a.class ? ' ' + a.class : '';
  const icon = icons[a.icon || 'arrow'];
  const ext = a.external ? ' target="_blank" rel="noopener"' : '';
  const data = a.data ? ' ' + a.data.replace(/'/g, '"') : '';
  const tag = a.href ? 'a' : 'button';
  const href = a.href ? ` href="${a.href}"` : ` type="${a.type || 'button'}"`;
  return `<${tag}${href} class="btn${v}${s}${extra}" data-magnetic${ext}${data}><span>${label}</span><span class="btn__ic">${icon}</span></${tag}>`;
}

const logoSets = {
  clients: ['logos/louis-vuitton', 'logos/sony-music-logo', 'logos/nike-logo', 'logos/levi-strauss-and-co-logo', 'logos/lvmh-perfumes-and-cosmetics-logo', 'logos/gymshark-logo', 'logos/walt-disney-logo-transparent', 'logos/dior-logo-transparent', 'logos/nestle-text-only', 'logos/cbre-logo-smaller', 'logos/givenchy-logo', 'logos/jll-logo', 'logos/bt-logo', 'logos/refuge-logo'],
  coaching: ['logos/louis-vuitton', 'logos/nestle-text-only', 'logos/chillys', 'logos/walt-disney-logo-transparent', 'logos/better-nature', 'logos/sony-music-logo', 'logos/stella-mccartney', 'logos/cbre-logo-smaller', 'logos/dover-street-market', 'logos/your-place'],
  culture: ['logos/nike-logo', 'logos/porter-novelli', 'logos/lvmh-perfumes-and-cosmetics-logo', 'logos/gymshark-logo', 'logos/sony-music-logo', 'logos/cbre-logo-smaller', 'logos/tala', 'logos/jll-logo', 'logos/mango', 'logos/puig'],
  learning: ['logos/adanola', 'logos/allbright', 'logos/refuge-logo', 'logos/cancer-research', 'logos/wwf', 'logos/moet-hennessy', 'logos/ralph-lauren', 'logos/puig', 'logos/exec-foundation', 'logos/lvmh-perfumes-and-cosmetics-logo'],
  speaking: ['logos/levi-strauss-and-co-logo', 'logos/gcuc', 'logos/thortful', 'logos/lvmh-perfumes-and-cosmetics-logo', 'logos/sony-music-logo', 'logos/allbright', 'logos/gymshark-logo', 'logos/refuge-logo', 'logos/nike-logo'],
  press: ['logos/wwd-logo', 'logos/refinery29-logo', 'logos/greatist-logo', 'logos/drapers-logo', 'logos/foundandflourish-logo'],
};
const wallSet = ['logos/louis-vuitton', 'logos/dior-logo-transparent', 'logos/givenchy-logo', 'logos/loewe', 'logos/fenty', 'logos/maison-francis-kurkdjian', 'logos/stella-mccartney', 'logos/ralph-lauren', 'logos/moet-hennessy', 'logos/lvmh-perfumes-and-cosmetics-logo', 'logos/puig', 'logos/nike-logo', 'logos/adidas', 'logos/gymshark-logo', 'logos/levi-strauss-and-co-logo', 'logos/mango', 'logos/sony-music-logo', 'logos/walt-disney-logo-transparent', 'logos/samsung', 'logos/nestle-text-only', 'logos/cbre-logo-smaller', 'logos/jll-logo', 'logos/bt-logo', 'logos/british-fashion-council', 'logos/wwf', 'logos/cancer-research', 'logos/comic-relief', 'logos/refuge-logo', 'logos/alzheimers-society', 'logos/better-nature'];
const altNames = { 'levis-logo-transparent': "Levi's", 'levi-strauss-and-co-logo': 'Levi Strauss & Co', 'lvmh-perfumes-and-cosmetics-logo': 'LVMH Perfumes & Cosmetics', 'walt-disney-logo-transparent': 'The Walt Disney Company', 'cbre-logo-smaller': 'CBRE', 'jll-logo': 'JLL', 'bt-logo': 'BT', 'wwd-logo': 'WWD', 'wwf': 'WWF', 'chillys': "Chilly's", 'moet-hennessy': 'Moët Hennessy', 'foundandflourish-logo': 'Found & Flourish', 'gcuc': 'GCUC', 'tala': 'TALA', 'pha-group': 'PHA Group', 'nestle-text-only': 'Nestlé' };
const logoAlt = (n) => altNames[n.replace('logos/', '')] || n.replace('logos/', '').replace(/-(logo|text|only|transparent|smaller|and|perfumes|cosmetics).*$/, '').replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
function logosTag(a) {
  const set = (logoSets[a.set] || []).filter((n) => images[n]);
  const group = (hidden) => `<div class="marquee__group"${hidden ? ' aria-hidden="true"' : ''}>${set.map((n) => {
    const ar = images[n].ar; const cls = ar < 1.4 ? 'tall' : ar > 6 ? 'wide' : '';
    return imgTag({ name: n, alt: hidden ? '' : logoAlt(n) + ' logo', area: 3000, max: 40 });
  }).join('')}</div>`;
  return `<div class="marquee" style="--marquee-speed:${a.speed || 46}s"><div class="marquee__track">${group(false)}${group(true)}</div></div>`;
}

function render(html, vars = {}, depth = 0) {
  if (depth > 6) throw new Error('Include depth exceeded');
  html = html.replace(/<x-include\s+([^>]*?)\/?>/g, (_, s) => {
    const a = attrs(s);
    return render(read(`partials/${a.file}.html`), { ...vars, ...a }, depth + 1);
  });
  html = html.replace(/\{\{(\w[\w-]*)\}\}/g, (m, k) => (vars[k] !== undefined ? vars[k] : m));
  html = html.replace(/\[\[([~@]?)([\s\S]*?)\]\]/g, (_, mark, text) => `<span class="it">${text}${doodles[mark] || ''}</span>`);
  html = html.replace(/\{\{i:([\w-]+)\}\}/g, (_, k) => { if (!icons[k]) throw new Error('Unknown icon ' + k); return icons[k]; });
  html = html.replace(/<x-img\s+([^>]*?)\/?>/g, (_, s) => imgTag(attrs(s)));
  html = html.replace(/<x-logos\s+([^>]*?)\/?>/g, (_, s) => logosTag(attrs(s)));
  html = html.replace(/<x-logowall\s*\/?>/g, () => `<div class="logo-wall">${wallSet.filter((n) => images[n]).map((n) => `<div>${imgTag({ name: n, alt: logoAlt(n) + ' logo', area: 3400, max: 52 })}</div>`).join('')}</div>`);
  html = html.replace(/<x-btn\s*([^>]*)>([\s\S]*?)<\/x-btn>/g, (_, s, label) => btnTag(attrs(s), label.trim()));
  return html;
}

// ---------- journal data ----------
const journal = fs.existsSync(path.join(SRC, 'data/journal.json')) ? JSON.parse(read('data/journal.json')) : [];
const CATS = { leadership: 'Leadership', culture: 'Culture &amp; inclusion', resilience: 'Resilience', career: 'Career' };
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const dateLabel = (iso) => { const [y, m, d] = iso.split('-'); return `${+d} ${MONTHS[+m - 1]} ${y}`; };
const postUrl = (a) => `journal-${a.slug}.html`;
function postCard(a, opts = {}) {
  const sizes = opts.featured ? '(min-width: 1000px) 55vw, 92vw' : '(min-width: 1080px) 30vw, (min-width: 720px) 45vw, 92vw';
  const meta = `<div class="post__meta"><span class="cat">${CATS[a.cat]}</span><span>${dateLabel(a.date)}</span><span>${a.minutes} min read</span></div>`;
  const body = opts.featured
    ? `<div>${meta}<h3 class="mt-s">${a.title}</h3><p class="mt-s">${a.excerpt}</p><span class="link-arrow mt-m" style="display:inline-flex">Read the article {{i:arrow}}</span></div>`
    : `${meta}<h3>${a.title}</h3><p>${a.excerpt}</p>`;
  return `<a class="post${opts.featured ? ' post--featured' : ''}" href="${postUrl(a)}" data-cat="${a.cat}" data-cursor="Read"${opts.reveal ? ' data-reveal' : ''}><div class="post__img"><x-img name="journal/${a.img}" alt="" sizes="${sizes}"></div>${body}</a>`;
}
function related(slug, n = 3) {
  const me = journal.find((a) => a.slug === slug);
  const same = journal.filter((a) => a.slug !== slug && me && a.cat === me.cat);
  const rest = journal.filter((a) => a.slug !== slug && !same.includes(a));
  return same.concat(rest).slice(0, n);
}
function journalTags(html) {
  html = html.replace(/<x-journal-grid\s*\/?>/g, () => journal.map((a, k) => postCard(a, { featured: k === 0 })).join('\n'));
  html = html.replace(/<x-journal-latest\s*([^>]*?)\/?>/g, (_, s) => {
    const a = attrs(s); const pick = a.slugs ? a.slugs.split(',').map((x) => journal.find((j) => j.slug === x.trim())).filter(Boolean) : journal.slice(0, +(a.n || 3));
    return pick.map((p) => postCard(p, { reveal: true })).join('\n');
  });
  html = html.replace(/<x-journal-related\s+slug="([^"]+)"\s*\/?>/g, (_, slug) => related(slug).map((p) => postCard(p, { reveal: true })).join('\n'));
  return html;
}

const crypto = require('crypto');
const fpCache = {};
function fingerprint(file) {
  if (!fpCache[file]) fpCache[file] = crypto.createHash('md5').update(fs.readFileSync(path.join(ROOT, file))).digest('hex').slice(0, 8);
  return fpCache[file];
}

// ---------- build ----------
const pagesDir = path.join(SRC, 'pages');
const pages = fs.readdirSync(pagesDir).filter((f) => f.endsWith('.html')).sort();
const head = read('partials/head.html');
const header = read('partials/header.html');
const footer = read('partials/footer.html');
const sitemap = [];

function writePage(file, meta, body) {
  const slug = file === 'index.html' ? '' : file;
  const vars = {
    title: meta.title,
    description: meta.description,
    canonical: `${SITE_URL}/${slug}`,
    ogimage: meta.ogimage || `${SITE_URL}/assets/img/${meta.og || 'og-default'}.jpg`,
    bodyclass: meta.bodyclass || '',
    accent: meta.accent || 'acc-mint',
    schema: meta.schemaHtml || (meta.schema ? read(`partials/${meta.schema}.html`) : ''),
    robots: meta.noindex ? 'noindex, follow' : 'index, follow',
  };
  let hdr = header;
  const nav = meta.nav || '';
  hdr = hdr.replace(/\{\{cur:(\w[\w-]*)\}\}/g, (_, k) => (k === nav ? ' aria-current="page"' : ''));
  const svcPages = ['services', 'culture', 'coaching', 'learning', 'speaking', 'hr-hub'];
  hdr = hdr.replace('{{svc-current}}', svcPages.includes(nav) ? ' is-current' : '');
  let main = render(journalTags(body), vars);
  // Mask-wipe reveals on content images site-wide (hero images animate with the header instead)
  main = main.replace(/<div class="(media-card(?: media-card--\w+)?|post__img)"(?![^>]*data-(?:clip|wipe))/g, (m, cls, off, str) =>
    /page-hero__media|article-cover/.test(str.slice(Math.max(0, off - 160), off)) ? m : `${m} data-wipe`);
  let out = render(head, vars) + render(hdr, vars) + main + render(footer, vars);
  // Cache-busting: stamp CSS/JS links with a fingerprint of the file's contents, so browsers never mix
  // a new page with an old cached stylesheet or script after an update.
  out = out.replace(/(["'])(assets\/(?:css|js|vendor)\/[\w.-]+\.(?:css|js))\1/g, (m, q, f) => `${q}${f}?v=${fingerprint(f)}${q}`);
  const leftover = out.match(/\{\{[^}]+\}\}|<x-[a-z]+/);
  if (leftover) throw new Error(`Unrendered token in ${file}: ${leftover[0]}`);
  fs.writeFileSync(path.join(ROOT, file), out);
  if (!meta.noindex) sitemap.push(`  <url><loc>${SITE_URL}/${slug}</loc><changefreq>monthly</changefreq><priority>${slug ? (meta.priority || '0.8') : '1.0'}</priority></url>`);
  console.log('built', file);
}

for (const file of pages) {
  const raw = fs.readFileSync(path.join(pagesDir, file), 'utf8');
  const mm = raw.match(/^<!--meta\s+([\s\S]*?)-->\s*/);
  if (!mm) throw new Error('Missing meta in ' + file);
  writePage(file, JSON.parse(mm[1]), raw.slice(mm[0].length));
}

// One page per journal article, from _src/data/journal.json + _src/partials/article.html
const articleTpl = journal.length ? read('partials/article.html') : '';
for (const a of journal) {
  const fill = { slug: a.slug, 'a-title': a.title, 'a-cat': CATS[a.cat], 'a-catkey': a.cat, 'a-date': dateLabel(a.date), 'a-iso': a.date,
    'a-min': String(a.minutes), 'a-img': a.img, 'a-body': a.html, 'a-url': encodeURIComponent(`${SITE_URL}/${postUrl(a)}`),
    'a-series': a.series ? `<span class="chip">Series · ${a.series.replace(/ series$/i, '')}</span>` : '' };
  const body = articleTpl.replace(/\{\{(slug|a-[\w-]+)\}\}/g, (_, k) => fill[k]);
  const imgW = (images['journal/' + a.img] || { w: [960] }).w.slice(-1)[0];
  const schemaHtml = `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'Article', headline: a.title.replace(/&amp;/g, '&'), description: a.excerpt, datePublished: a.date, image: `${SITE_URL}/assets/img/journal/${a.img}-${imgW}.webp`, author: { '@type': 'Person', name: 'Vanessa Belleau', url: `${SITE_URL}/about.html` }, publisher: { '@type': 'Organization', name: 'High Fifteen Ltd', logo: `${SITE_URL}/assets/img/logo.png` }, mainEntityOfPage: `${SITE_URL}/${postUrl(a)}` })}</script>`;
  writePage(postUrl(a), { title: `${a.title.replace(/&amp;/g, '&')} | High Fifteen Journal`, description: a.excerpt, nav: 'journal', accent: 'acc-indigo', bodyclass: 'page-article', ogimage: `${SITE_URL}/assets/img/journal/${a.img}-${imgW}.webp`, schemaHtml, priority: '0.6' }, body);
}

// One page per case study, from _src/data/cases.json + _src/partials/case.html
const cases = fs.existsSync(path.join(SRC, 'data/cases.json')) ? JSON.parse(read('data/cases.json')) : [];
const caseTpl = cases.length ? read('partials/case.html') : '';
const caseUrl = (c) => `case-study-${c.slug}.html`;
cases.forEach((c, k) => {
  const next = cases[(k + 1) % cases.length];
  const statCls = ['stat--mint', '', 'stat--sun'];
  const quotes = c.quotes.length ? `<section class="section t-paper"><div class="container"><div class="section-head"><div><p class="eyebrow" data-reveal>In their words</p><h2 class="h-m" data-split>What the client [[@said.]]</h2></div></div><div class="case-quotes">${c.quotes.map(([q, who], i) => `<figure class="t-card${i === 0 ? ' t-card--feature' : ''}" data-reveal><blockquote>“${q}”</blockquote><figcaption><span class="quote__avatar">${c.client.replace(/[^A-Z]/g, '').slice(0, 2) || 'HF'}</span><div><strong>${who}</strong></div></figcaption></figure>`).join('')}</div></div></section>` : '';
  const fill = {
    'c-client': c.client, 'c-tag': c.tag, 'c-title': c.title, 'c-summary': c.summary, 'c-img': c.img, 'c-imgalt': c.imgAlt, 'c-accent': c.accent,
    'c-logo': c.logo ? `<x-img name="${c.logo}" alt="${c.client} logo" class="case-hero__logo">` : '',
    'c-metrics': c.metrics.map(([v, l]) => `<div class="fact"><span class="mono">${l}</span><strong class="fact__big">${v}</strong></div>`).join(''),
    'c-stats': c.metrics.map(([v, l], i) => `<article class="stat ${statCls[i] || ''}" data-reveal><div class="stat__num" style="font-size:clamp(3rem,5.4vw,5.4rem)">${v}</div><p>${l}</p></article>`).join(''),
    'c-brief': c.brief, 'c-impact': c.impact, 'c-did-n': String(Math.min(4, c.did.length)),
    'c-did': c.did.map(([t, d]) => `<div class="step" data-reveal><h3>${t}</h3><p>${d}</p></div>`).join(''),
    'c-quotes': quotes,
    'c-services': c.services.map(([href, label]) => `<a class="chip" href="${href}">${label.replace(/&(?!amp;)/g, '&amp;')} {{i:arrow}}</a>`).join(''),
    'c-next-url': caseUrl(next), 'c-next-client': next.client, 'c-next-tag': next.tag,
  };
  const body = caseTpl.replace(/\{\{(c-[\w-]+)\}\}/g, (_, key) => { if (fill[key] === undefined) throw new Error('case field ' + key); return fill[key]; });
  writePage(caseUrl(c), { title: `${c.client.replace(/&amp;/g, '&')} case study: ${c.tag} | High Fifteen`, description: c.summary, nav: 'cases', accent: c.accent, ogimage: `${SITE_URL}/assets/img/${c.img}-${images[c.img].w.slice(-1)[0]}.webp`, priority: '0.7' }, body);
});

fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemap.join('\n')}\n</urlset>\n`);
console.log('built sitemap.xml');
