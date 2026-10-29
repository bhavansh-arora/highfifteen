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

// ---------- build ----------
const pagesDir = path.join(SRC, 'pages');
const pages = fs.readdirSync(pagesDir).filter((f) => f.endsWith('.html')).sort();
const head = read('partials/head.html');
const header = read('partials/header.html');
const footer = read('partials/footer.html');
const sitemap = [];

for (const file of pages) {
  const raw = fs.readFileSync(path.join(pagesDir, file), 'utf8');
  const mm = raw.match(/^<!--meta\s+([\s\S]*?)-->\s*/);
  if (!mm) throw new Error('Missing meta in ' + file);
  const meta = JSON.parse(mm[1]);
  const body = raw.slice(mm[0].length);
  const slug = file === 'index.html' ? '' : file;
  const vars = {
    title: meta.title,
    description: meta.description,
    canonical: `${SITE_URL}/${slug}`,
    ogimage: `${SITE_URL}/assets/img/${meta.og || 'og-default'}.jpg`,
    bodyclass: meta.bodyclass || '',
    accent: meta.accent || 'acc-mint',
    schema: meta.schema ? read(`partials/${meta.schema}.html`) : '',
    robots: meta.noindex ? 'noindex, follow' : 'index, follow',
  };
  let hdr = header;
  const nav = meta.nav || '';
  hdr = hdr.replace(/\{\{cur:(\w[\w-]*)\}\}/g, (_, k) => (k === nav ? ' aria-current="page"' : ''));
  const svcPages = ['services', 'culture', 'coaching', 'learning', 'speaking', 'hr-hub'];
  hdr = hdr.replace('{{svc-current}}', svcPages.includes(nav) ? ' is-current' : '');
  const out = render(head, vars) + render(hdr, vars) + render(body, vars) + render(footer, vars);
  const leftover = out.match(/\{\{[^}]+\}\}|<x-[a-z]+/);
  if (leftover) throw new Error(`Unrendered token in ${file}: ${leftover[0]}`);
  fs.writeFileSync(path.join(ROOT, file), out);
  if (!meta.noindex) sitemap.push(`  <url><loc>${SITE_URL}/${slug}</loc><changefreq>monthly</changefreq><priority>${slug ? '0.8' : '1.0'}</priority></url>`);
  console.log('built', file);
}
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemap.join('\n')}\n</urlset>\n`);
console.log('built sitemap.xml');
