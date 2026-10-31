/* High Fifteen — motion layer (GSAP + ScrollTrigger). Everything degrades to static content. */
(function () {
  'use strict';
  var d = document, h = d.documentElement, w = window;
  var g = w.gsap, ST = w.ScrollTrigger;
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var HF = w.HF = w.HF || {};
  if (!g || !ST || !h.classList.contains('motion-ok')) { h.classList.remove('motion-ok'); return; }
  g.registerPlugin(ST);
  ST.config({ ignoreMobileResize: true });   // don't recalculate when the phone's address bar shows/hides
  g.defaults({ ease: 'power3.out' });
  var mm = g.matchMedia();

  /* ---------- Split text into masked words (keeps inner spans like .it) ---------- */
  function splitWords(el) {
    if (el.__split) return el.__split;
    var words = [];
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var parts = n.textContent.split(/(\s+)/), frag = d.createDocumentFragment();
          parts.forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(d.createTextNode(' ')); return; }
            var o = d.createElement('span'); o.className = 'sw';
            var i = d.createElement('span'); i.textContent = p; o.appendChild(i);
            frag.appendChild(o); words.push(i);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1 && !(n.classList && n.classList.contains('sw'))) {
          if (n.tagName === 'BR' || n.namespaceURI === 'http://www.w3.org/2000/svg') return;
          walk(n);
        }
      });
    })(el);
    el.__split = words;
    return words;
  }

  /* ---------- Hero intro (runs after preloader / curtain) ---------- */
  var heroTitle = $('[data-hero-title]');
  var pageTitle = $('.page-hero [data-split]');
  if (heroTitle) splitWords(heroTitle);
  if (pageTitle) splitWords(pageTitle);
  var heroFade = $$('[data-hero-fade]'), heroMedia = $$('[data-hero-media]'), heroMeta = $$('.page-hero .crumbs, .page-hero .eyebrow');
  g.set(heroFade, { opacity: 0, y: 30 });
  g.set(heroMedia, { opacity: 0, y: 60, rotate: 4, scale: .94 });
  g.set(heroMeta, { opacity: 0, y: 24 });

  function intro() {
    var tl = g.timeline({ defaults: { ease: 'expo.out' } });
    var t = heroTitle || pageTitle;
    if (t) tl.to(splitWords(t), { y: 0, duration: 1.3, stagger: .055 }, 0);
    if (heroMedia.length) tl.to(heroMedia, { opacity: 1, y: 0, rotate: 0, scale: 1, duration: 1.6 }, .15);
    if (heroMeta.length) tl.to(heroMeta, { opacity: 1, y: 0, duration: 1 }, 0);
    if (heroFade.length) tl.to(heroFade, { opacity: 1, y: 0, duration: 1.1, stagger: .09 }, .35);
    if (t) t.setAttribute('data-split-done', '');
  }
  if (HF.introDone) intro(); else d.addEventListener('hf:intro', intro, { once: true });

  /* ---------- Section headings: masked word reveal ---------- */
  $$('[data-split]').forEach(function (el) {
    if (el === heroTitle || el === pageTitle) return;
    var words = splitWords(el);
    g.to(words, { y: 0, duration: 1.15, ease: 'expo.out', stagger: .045, scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
  });

  /* ---------- Generic reveals ---------- */
  ST.batch('[data-reveal]', {
    start: 'top 96%', once: true,
    onEnter: function (els) { g.to(els, { opacity: 1, y: 0, scale: 1, duration: .85, ease: 'expo.out', stagger: .06, overwrite: true }); }
  });

  /* ---------- Scroll-lit statement ---------- */
  $$('[data-scrub-words]').forEach(function (el) {
    var words = [];
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = d.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(d.createTextNode(p)); return; }
            var s = d.createElement('span'); s.className = 'w'; s.textContent = p; frag.appendChild(s); words.push(s);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.namespaceURI !== 'http://www.w3.org/2000/svg') walk(n);
      });
    })(el);
    g.fromTo(words, { opacity: .14 }, { opacity: 1, ease: 'none', stagger: .08, scrollTrigger: { trigger: el, start: 'top 82%', end: 'bottom 50%', scrub: .6 } });
  });

  /* ---------- Counters & bars ---------- */
  $$('[data-count]').forEach(function (el) {
    var end = +el.getAttribute('data-count'), obj = { v: 0 }, dec = (el.getAttribute('data-count').split('.')[1] || '').length;
    el.textContent = '0';
    g.to(obj, { v: end, duration: 2, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      onUpdate: function () { el.textContent = dec ? obj.v.toFixed(dec) : Math.round(obj.v).toLocaleString('en-GB'); } });
  });
  $$('.stat__bar i').forEach(function (b) {
    g.fromTo(b, { scaleX: 0 }, { scaleX: 1, duration: 1.8, ease: 'expo.out', scrollTrigger: { trigger: b, start: 'top 92%', once: true } });
  });

  /* ---------- Image motion ---------- */
  $$('[data-parallax-img] img').forEach(function (img) {
    g.fromTo(img, { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: img.parentNode, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
  $$('[data-clip]').forEach(function (el) {
    var img = $('img', el);
    var tl = g.timeline({ scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
    tl.to(el, { clipPath: 'inset(0% 0% 0% 0% round 0px)', duration: 1.6, ease: 'expo.out' }, 0);
    if (img) tl.to(img, { scale: 1, duration: 1.8, ease: 'expo.out' }, 0);
  });
  mm.add('(min-width: 1024px)', function () {
    $$('.hero .atmos, .page-hero .atmos').forEach(function (a) {
      g.to(a, { yPercent: 18, ease: 'none', scrollTrigger: { trigger: a.parentNode, start: 'top top', end: 'bottom top', scrub: true } });
    });
  });
  mm.add('(min-width: 1080px)', function () {
    $$('.hero__media, .page-hero__media').forEach(function (m) {
      g.to(m, { yPercent: -10, ease: 'none', scrollTrigger: { trigger: m.closest('section'), start: 'top top', end: 'bottom top', scrub: true } });
    });
  });

  /* ---------- Service stack: cards recede as the next one arrives ---------- */
  mm.add('(min-width: 960px)', function () {
    var cards = $$('[data-stack] .svc-card');
    cards.forEach(function (c, i) {
      var nx = cards[i + 1]; if (!nx) return;
      g.to(c, { scale: .93, '--dim': .45, ease: 'none', scrollTrigger: { trigger: nx, start: 'top bottom', end: 'top 20%', scrub: true } });
    });
  });

  /* ---------- Horizontal case rail (pinned on desktop) ---------- */
  mm.add('(min-width: 1080px)', function () {
    var rail = $('[data-rail]'); if (!rail) return;
    var track = $('[data-rail-track]', rail), sec = rail.closest('section');
    rail.classList.add('is-pinned');
    sec.classList.add('has-pin');   // section becomes exactly one screen tall, so nothing is cut off while pinned
    var dist = function () { return Math.max(0, track.scrollWidth - w.innerWidth + 16); };
    var tween = g.to(track, { x: function () { return -dist(); }, ease: 'none',
      scrollTrigger: { trigger: sec, start: 'top top', end: function () { return '+=' + dist(); }, pin: true, scrub: .8, invalidateOnRefresh: true, anticipatePin: 1 } });
    HF.railStep = function (dir) {
      var st = tween.scrollTrigger, card = track.children[0].getBoundingClientRect().width + 24;
      var target = st.start + (st.end - st.start) * Math.min(1, Math.max(0, st.progress + dir * card / dist()));
      if (HF.lenis) HF.lenis.scrollTo(target, { duration: 1 }); else w.scrollTo({ top: target, behavior: 'smooth' });
    };
    return function () { rail.classList.remove('is-pinned'); sec.classList.remove('has-pin'); HF.railStep = null; };
  });

  /* ---------- Timeline & steps ---------- */
  $$('.timeline').forEach(function (t) {
    var fill = $('.timeline__fill', t);
    if (fill) g.fromTo(fill, { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: t, start: 'top 70%', end: 'bottom 60%', scrub: true } });
  });
  $$('.steps').forEach(function (s) {
    g.fromTo($$('.step', s), { '--sx': 0 }, { '--sx': 1, duration: 1.4, ease: 'expo.out', stagger: .14, scrollTrigger: { trigger: s, start: 'top 85%', once: true } });
  });

  /* ---------- Feelings: pop in with a wobble ---------- */
  $$('[data-feel]').forEach(function (f) {
    var spans = $$('span', f);
    var tilt = function (i, el) { return parseFloat(getComputedStyle(el).getPropertyValue('--r')) || 0; };
    g.set(spans, { transition: 'none' });
    g.fromTo(spans, { scale: .4, opacity: 0, rotate: function (i) { return i % 2 ? 14 : -14; } },
      { scale: 1, opacity: 1, rotate: tilt, duration: 1, ease: 'back.out(2)', stagger: .1,
        scrollTrigger: { trigger: f, start: 'top 88%', once: true },
        onComplete: function () { g.set(spans, { clearProps: 'transition,transform,opacity' }); } });
  });

  /* ---------- Footer giant word ---------- */
  /* ---------- Footer wordmark: letters filled with Vanessa's painting ----------
     Each letter clips the same wide painting texture, offset by its position,
     so the word reads as one continuous canvas. */
  var mega = $('[data-mega]');
  if (mega) {
    var n = 0;
    mega.innerHTML = mega.textContent.split('').map(function (ch) {
      if (ch === ' ') return '<span class="sp"></span>';
      return '<span class="ml" style="--i:' + (n++) + '">' + ch + '</span>';
    }).join('');
    var letters = $$('.ml', mega);
    var paint = function () {
      var W = mega.scrollWidth;
      letters.forEach(function (l) { l.style.setProperty('--bgw', W + 'px'); l.style.setProperty('--bgx', (-l.offsetLeft) + 'px'); });
    };
    paint(); w.addEventListener('resize', paint);
    if (d.fonts && d.fonts.ready) d.fonts.ready.then(paint);
    g.fromTo(letters, { yPercent: 80, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1.2, ease: 'expo.out', stagger: .045,
      scrollTrigger: { trigger: mega, start: 'top 95%', once: true, onEnter: function () { setTimeout(function () { mega.classList.add('is-lit'); }, 900); } },
      onComplete: function () { g.set(letters, { clearProps: 'transform' }); } });
  }

  /* ---------- "We want you to feel": outline words fill as you scroll ---------- */
  $$('[data-feel2]').forEach(function (list) {
    $$('.feel2__w', list).forEach(function (wd) {
      g.fromTo(wd, { '--f': '0%' }, { '--f': '100%', ease: 'none', scrollTrigger: { trigger: wd, start: 'top 85%', end: 'top 45%', scrub: .4 } });
    });
  });

  /* ---------- Big ticker: speed and lean follow scroll velocity ---------- */
  $$('.ticker .marquee__track').forEach(function (track) {
    var anim = track.getAnimations ? track.getAnimations()[0] : null;
    var skewTo = g.quickTo(track, 'skewX', { duration: .5, ease: 'power3' });
    var rate = 1, target = 1;
    ST.create({ trigger: track.closest('.ticker'), start: 'top bottom', end: 'bottom top', onUpdate: function (self) {
      var v = self.getVelocity();
      target = Math.max(-6, Math.min(6, 1 + v / 300)); if (Math.abs(target) < 1) target = target < 0 ? -1 : 1;
      skewTo(Math.max(-10, Math.min(10, -v / 220)));
    } });
    g.ticker.add(function () {
      rate += (target - rate) * .08; target += ((target > 0 ? 1 : -1) - target) * .04;
      if (anim) anim.playbackRate = rate;
    });
    ST.addEventListener('scrollEnd', function () { skewTo(0); });
  });

  /* ---------- Mask-wipe image reveals ---------- */
  $$('[data-wipe]').forEach(function (el) {
    var img = $('img', el);
    var tl = g.timeline({ scrollTrigger: { trigger: el, start: 'top 85%', once: true }, onComplete: function () { el.classList.add('is-wiped'); g.set(el, { clearProps: 'clipPath' }); } });
    tl.to(el, { clipPath: 'inset(0% 0 0 0 round 0px)', duration: 1.3, ease: 'expo.inOut' }, 0);
    if (img) tl.to(img, { scale: 1, duration: 1.8, ease: 'expo.out' }, .1);
  });

  /* ---------- Portrait: gentle 3D tilt towards the cursor ---------- */
  mm.add('(hover: hover) and (pointer: fine) and (min-width: 1080px)', function () {
    var box = $('[data-tilt]'); if (!box) return;
    var card = $('.portrait-card', box), frame = $('.portrait-card__frame', box), rings = $('.rings', box);
    var hero = box.closest('section');
    var rx = g.quickTo(card, 'rotationX', { duration: .8, ease: 'power3' }), ry = g.quickTo(card, 'rotationY', { duration: .8, ease: 'power3' });
    var fx = g.quickTo(frame, 'x', { duration: 1, ease: 'power3' }), fy = g.quickTo(frame, 'y', { duration: 1, ease: 'power3' });
    var gx = g.quickTo(rings, 'x', { duration: 1.4, ease: 'power3' }), gy = g.quickTo(rings, 'y', { duration: 1.4, ease: 'power3' });
    var move = function (e) {
      var r = box.getBoundingClientRect(), px = (e.clientX - (r.left + r.width / 2)) / innerWidth, py = (e.clientY - (r.top + r.height / 2)) / innerHeight;
      ry(px * 14); rx(-py * 12); fx(-18 - px * 22); fy(18 - py * 22); gx(-px * 30); gy(-py * 30);
    };
    hero.addEventListener('mousemove', move);
    hero.addEventListener('mouseleave', function () { rx(0); ry(0); fx(-18); fy(18); gx(0); gy(0); });
    return function () { hero.removeEventListener('mousemove', move); };
  });

  /* ---------- Pathway panels: photo wipe, headline rise, list stagger ---------- */
  function playPanel(panel) {
    if (!panel || !panel.classList.contains('pathway-panel')) return;
    var media = $('.pathway-panel__media', panel), img = media && $('img', media);
    var words = splitWords($('h3', panel)), items = $$('.pathway-panel__kicker, h4, .dots li, .btn-row', panel);
    g.killTweensOf([media, img, words, items]);
    if (media) {
      g.fromTo(media, { clipPath: 'inset(0% 0% 0% 100%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.1, ease: 'expo.inOut', clearProps: 'clipPath' });
      g.fromTo(img, { scale: 1.25 }, { scale: 1, duration: 1.6, ease: 'expo.out' });
    }
    g.fromTo(words, { y: '115%' }, { y: 0, duration: .9, ease: 'expo.out', stagger: .035, delay: .1 });
    g.fromTo(items, { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: .7, ease: 'power3.out', stagger: .035, delay: .25 });
  }
  $$('[data-tabs]').forEach(function (root) {
    root.addEventListener('hf:tab', function (e) { playPanel(e.detail.panel); });
    var first = $('.pathway-panel:not([hidden])', root);
    if (first) {
      var fm = $('.pathway-panel__media', first);
      g.set(splitWords($('h3', first)), { y: '115%' });
      g.set($$('.pathway-panel__kicker, h4, .dots li, .btn-row', first), { opacity: 0, y: 18 });
      if (fm) g.set(fm, { clipPath: 'inset(0% 0% 0% 100%)' });
      ST.create({ trigger: root, start: 'top 70%', once: true, onEnter: function () { playPanel(first); } });
    }
  });

  /* ---------- Testimonial word cascade ---------- */
  HF.animateQuote = function (fig) {
    var bq = $('blockquote', fig); if (!bq) return;
    var words = splitWords(bq);
    g.fromTo(words, { y: '110%' }, { y: 0, duration: .9, ease: 'expo.out', stagger: .012, overwrite: true });
    g.fromTo($('figcaption', fig), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: .8, delay: .25 });
  };

  /* ---------- Topic list: floating image follows the cursor ---------- */
  mm.add('(hover: hover) and (min-width: 900px)', function () {
    var list = $('[data-topics]'); if (!list) return;
    var float = $('.topic-float'); if (!float) return;
    var xTo = g.quickTo(float, 'x', { duration: .6, ease: 'power3' }), yTo = g.quickTo(float, 'y', { duration: .6, ease: 'power3' });
    var imgs = $$('img', float);
    $$('.topic', list).forEach(function (t, i) {
      t.addEventListener('mouseenter', function () { float.classList.add('is-on'); imgs.forEach(function (im, k) { im.classList.toggle('is-on', k === i % imgs.length); }); });
    });
    list.addEventListener('mouseleave', function () { float.classList.remove('is-on'); });
    list.addEventListener('mousemove', function (e) { xTo(e.clientX + 30); yTo(e.clientY - 180); });
  });

  /* ---------- Magnetic buttons & custom cursor (fine pointers only) ---------- */
  mm.add('(hover: hover) and (pointer: fine)', function () {
    $$('[data-magnetic]').forEach(function (b) {
      var xTo = g.quickTo(b, 'x', { duration: .5, ease: 'power3' }), yTo = g.quickTo(b, 'y', { duration: .5, ease: 'power3' });
      b.addEventListener('mousemove', function (e) {
        var r = b.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * .22); yTo((e.clientY - r.top - r.height / 2) * .3);
      });
      b.addEventListener('mouseleave', function () { xTo(0); yTo(0); });
    });
    var cur = $('.cursor'); if (!cur) return;
    h.classList.add('has-cursor');
    var dot = $('.cursor__dot', cur), lab = $('.cursor__label', cur);
    var dx = g.quickTo(dot, 'x', { duration: .15, ease: 'power3' }), dy = g.quickTo(dot, 'y', { duration: .15, ease: 'power3' });
    var lx = g.quickTo(lab, 'x', { duration: .5, ease: 'power3' }), ly = g.quickTo(lab, 'y', { duration: .5, ease: 'power3' });
    w.addEventListener('mousemove', function (e) { dx(e.clientX); dy(e.clientY); lx(e.clientX); ly(e.clientY); }, { passive: true });
    d.addEventListener('mouseover', function (e) {
      var t = e.target.closest && e.target.closest('[data-cursor], a, button, summary, label.choice');
      if (t && t.hasAttribute('data-cursor')) { lab.textContent = t.getAttribute('data-cursor'); cur.classList.add('is-label'); cur.classList.remove('is-hover'); }
      else if (t) { cur.classList.add('is-hover'); cur.classList.remove('is-label'); }
      else cur.classList.remove('is-hover', 'is-label');
    });
    d.addEventListener('mouseleave', function () { cur.classList.remove('is-hover', 'is-label'); });
    return function () { h.classList.remove('has-cursor'); };
  });

  /* Keep ScrollTrigger in sync with late-loading images and fonts */
  w.addEventListener('load', function () { ST.refresh(); });
  if (d.fonts && d.fonts.ready) d.fonts.ready.then(function () { ST.refresh(); });
})();
