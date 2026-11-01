/* High Fifteen — interface behaviour (no framework). Motion lives in motion.js. */
(function () {
  'use strict';
  var d = document, h = d.documentElement, w = window;
  var CFG = w.HF_CONFIG || {};
  var reduce = w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var store = {
    get: function (k) { try { return w.sessionStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { w.sessionStorage.setItem(k, v); } catch (e) {} },
    del: function (k) { try { w.sessionStorage.removeItem(k); } catch (e) {} }
  };
  var HF = w.HF = w.HF || {};

  /* ---------- Smooth scroll ---------- */
  var lenis = null;
  if (!reduce && w.Lenis && !('ontouchstart' in w && w.innerWidth < 1024)) {
    lenis = new w.Lenis({ lerp: .14, wheelMultiplier: 1, smoothWheel: true });  // responsive, no trailing 'drag'
    HF.lenis = lenis;
    if (w.gsap && w.ScrollTrigger) {
      lenis.on('scroll', w.ScrollTrigger.update);
      w.gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      w.gsap.ticker.lagSmoothing(0);
    } else {
      var raf = function (t) { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }
  HF.scrollTo = function (target, offset) {
    var el = typeof target === 'string' ? $(target) : target;
    if (!el) return;
    var off = offset == null ? -90 : offset;
    if (lenis) lenis.scrollTo(el, { offset: off, duration: 1.4 });
    else w.scrollTo({ top: el.getBoundingClientRect().top + w.pageYOffset + off, behavior: reduce ? 'auto' : 'smooth' });
  };

  /* ---------- Intro: preloader (first visit) or curtain (page to page) ---------- */
  var introDone = false;
  function finishIntro() {
    if (introDone) return; introDone = true;
    h.classList.remove('is-loading', 'is-entering');
    h.classList.add('ready');
    HF.introDone = true;
    d.dispatchEvent(new CustomEvent('hf:intro'));
    if (location.hash && location.hash.length > 1) {
      var t = $(location.hash);
      if (t) setTimeout(function () { HF.scrollTo(t); }, 250);
    }
  }
  function runIntro() {
    var g = w.gsap;
    store.del('hf-nav');
    if (h.classList.contains('is-loading') && g) {
      store.set('hf-seen', '1');
      var num = $('[data-pl-num]'), word = $('[data-pl-word]'), obj = { v: 0 }, shown = -1;
      var WORDS = ['Clarity', 'Confidence', 'Performance'];
      var tick = function () {
        var n = Math.round(obj.v);
        if (n !== shown) { shown = n; num.textContent = String(n).padStart(2, '0'); }
        var k = obj.v < 5 ? 0 : obj.v < 10.5 ? 1 : 2;
        if (word.textContent !== WORDS[k]) {
          g.fromTo(word, { yPercent: 0, opacity: 1 }, { yPercent: -60, opacity: 0, duration: .16, ease: 'power2.in', onComplete: function () {
            word.textContent = WORDS[k];
            g.fromTo(word, { yPercent: 70, opacity: 0 }, { yPercent: 0, opacity: 1, duration: .32, ease: 'power3.out' });
          } });
        }
      };
      var small = w.innerWidth < 760;
      var tl = g.timeline({ onComplete: finishIntro });
      if (small) tl.timeScale(1.2);   // a slightly quicker cut on phones
      // Keep the intro on screen until its own timeline ends (finishIntro removes .is-loading early).
      tl.set('.preloader', { display: 'block' }, 0)
        .fromTo('.pl-logo, .pl-label, .pl-foot', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: .6, ease: 'power3.out', stagger: .05 }, 0)
        .fromTo(num, small ? { yPercent: 18, opacity: 0 } : { yPercent: 18, opacity: 0, filter: 'blur(14px)' }, small ? { yPercent: 0, opacity: 1, duration: .8, ease: 'expo.out' } : { yPercent: 0, opacity: 1, filter: 'blur(0px)', duration: .9, ease: 'expo.out', clearProps: 'filter' }, .05)
        .to('.pl-glow', { opacity: 1, duration: 1.6, ease: 'power2.inOut' }, .2)
        .fromTo('.pl-word', { opacity: 0 }, { opacity: 1, duration: .5 }, .2)
        .to(obj, { v: 15, duration: 1.4, ease: 'power2.inOut', onUpdate: tick }, .2)
        .to('.pl-line i', { scaleX: 1, duration: 1.4, ease: 'power2.inOut' }, .2)
        .add(function () { num.classList.add('is-done'); }, 1.6)
        // Split open along the line; the page starts animating in as it opens.
        .to('.pl-line', { opacity: 0, duration: .3 }, 1.95)
        .to('.pl-half--top', { yPercent: -100, duration: 1, ease: 'power4.inOut' }, 1.9)
        .to('.pl-half--bot', { yPercent: 100, duration: 1, ease: 'power4.inOut', onStart: function () { setTimeout(finishIntro, 120); } }, 1.9)
        .set('.preloader', { display: 'none' });
    } else if (h.classList.contains('is-entering') && g) {
      // Arrival: the cover (destination name printed on it) carries straight on upward. No separate text steps.
      var lbl = $('[data-curtain-label]'); if (lbl) lbl.textContent = store.get('hf-nav-label') || '';
      var curEl = $('.curtain'); curEl.classList.add('is-active');   // stays visible after .is-entering is removed
      g.timeline({ onComplete: function () { curEl.classList.remove('is-active'); g.set('.curtain', { clearProps: 'all' }); } })
        .fromTo(curEl, { y: 0, yPercent: 0 }, { y: -w.innerHeight * .14, yPercent: -100, duration: .7, ease: 'power3.inOut', onStart: function () { setTimeout(finishIntro, 120); } }, .02);
    } else {
      store.set('hf-seen', '1');
      finishIntro();
    }
  }
  // Start as soon as the page is parsed: never wait for every image to download.
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', runIntro); else runIntro();
  setTimeout(finishIntro, 2500);

  /* Destination names shown on the page transition */
  function pageName(path) {
    var f = (path.split('/').pop() || 'index.html').replace('.html', '');
    var map = { '': 'Home', index: 'Home', about: 'About', services: 'Services', culture: 'Culture', coaching: 'Executive coaching',
      learning: 'Leadership learning', speaking: 'Speaking', 'hr-hub': 'HR Hub', 'case-studies': 'Case studies', journal: 'The Journal',
      press: 'Press & media', contact: 'Work with us', '404': 'High Fifteen' };
    if (map[f] !== undefined) return map[f];
    if (f.indexOf('journal-') === 0) return 'The Journal';
    if (f.indexOf('case-study-') === 0) return 'Case study';
    return 'High Fifteen';
  }

  /* Curtain on internal navigation */
  d.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || reduce || !h.classList.contains('is-desktop') || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    if (a.target === '_blank' || a.hasAttribute('download')) return;
    var href = a.getAttribute('href');
    if (!href || href.charAt(0) === '#' || /^(mailto|tel|javascript):/i.test(href)) return;
    var url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname && url.hash) {
      e.preventDefault(); closeMenu(); var t = $(url.hash); if (t) HF.scrollTo(t); return;
    }
    if (!/\.html$|\/$/.test(url.pathname)) return;
    e.preventDefault();
    store.set('hf-nav', '1');
    closeMenu();
    var g = w.gsap;
    if (!g) { location.href = url.href; return; }
    var label = pageName(url.pathname); store.set('hf-nav-label', label);
    var cur = $('.curtain'); cur.classList.add('is-active');
    var lblEl = $('[data-curtain-label]'); if (lblEl) lblEl.textContent = label;
    // Exit: one motion. The cover rises with the name already on it, then the next page loads.
    g.fromTo(cur, { y: w.innerHeight * .14, yPercent: 100 }, { y: 0, yPercent: 0, duration: .5, ease: 'power3.inOut', onComplete: function () { location.href = url.href; } });
  });
  w.addEventListener('pageshow', function (e) {
    if (e.persisted) { h.classList.remove('is-entering'); if (w.gsap) w.gsap.set('.curtain', { clearProps: 'all' }); }
  });

  /* ---------- Header: hide on scroll down, dark mode over dark sections ---------- */
  var header = $('[data-header]');
  var darkSections = $$('[data-header="dark"]');
  var lastY = w.pageYOffset, ticking = false;
  var dock = $('[data-dock]');
  var heroEl = $('.hero, .page-hero');
  function onScroll() {
    var y = w.pageYOffset;
    if (header) {
      var menuOpen = h.classList.contains('menu-open');
      if (!menuOpen && y > 160 && y > lastY + 4) header.classList.add('is-hidden');
      else if (y < lastY - 4 || y < 160) header.classList.remove('is-hidden');
      var probe = 40, onDark = false;
      for (var i = 0; i < darkSections.length; i++) {
        var r = darkSections[i].getBoundingClientRect();
        if (r.top <= probe && r.bottom >= probe) { onDark = true; break; }
      }
      header.classList.toggle('on-dark', onDark || menuOpen);
      h.classList.toggle('on-dark-cursor', onDark);
    }
    if (dock) {
      var past = heroEl ? heroEl.getBoundingClientRect().bottom < 0 : y > 600;
      var foot = $('.site-footer'); var nearFoot = foot && foot.getBoundingClientRect().top < w.innerHeight;
      dock.classList.toggle('is-on', past && !nearFoot);
    }
    lastY = y; ticking = false;
  }
  w.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  var burger = $('[data-burger]'), menu = $('#menu');
  function openMenu() {
    h.classList.add('menu-open'); burger.setAttribute('aria-expanded', 'true'); menu.setAttribute('aria-hidden', 'false');
    $('[data-burger-label]').textContent = 'Close'; header.classList.remove('is-hidden'); header.classList.add('on-dark');
    if (lenis) lenis.stop(); else d.body.style.overflow = 'hidden';
  }
  function closeMenu() {
    if (!h.classList.contains('menu-open')) return;
    h.classList.remove('menu-open'); burger.setAttribute('aria-expanded', 'false'); menu.setAttribute('aria-hidden', 'true');
    $('[data-burger-label]').textContent = 'Menu';
    if (lenis) lenis.start(); else d.body.style.overflow = '';
    onScroll();
  }
  if (burger && menu) {
    burger.addEventListener('click', function () { h.classList.contains('menu-open') ? closeMenu() : openMenu(); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
    w.addEventListener('resize', function () { if (w.innerWidth >= 1140) closeMenu(); });
  }

  /* ---------- Rotating words ----------
     The incoming word rises into the pill while the outgoing one exits upward.
     Outgoing words are reset below the pill with transitions off, so nothing
     ever travels back through the visible area. The pill eases to each word's
     width and changes colour. */
  $$('[data-rotator]').forEach(function (el) {
    var items = $$('span', el), i = 0;
    var colors = (el.getAttribute('data-colors') || '').split(',').filter(Boolean);
    var EASE = 'cubic-bezier(.16,1,.3,1)';
    function fit(s) {
      var cs = getComputedStyle(el);
      el.style.width = (s.getBoundingClientRect().width + parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight)) + 'px';
    }
    function place(s, y, o, animate) {
      s.style.transition = animate ? 'transform .75s ' + EASE + ', opacity .45s ease' : 'none';
      s.style.transform = 'translateY(' + y + ')';
      s.style.opacity = o;
    }
    items.forEach(function (s, k) { place(s, k === 0 ? '0%' : '115%', k === 0 ? 1 : 0, false); });
    if (colors[0]) el.style.backgroundColor = colors[0];
    fit(items[0]);
    w.addEventListener('resize', function () { fit(items[i]); });
    if (d.fonts && d.fonts.ready) d.fonts.ready.then(function () { fit(items[i]); });
    if (reduce || items.length < 2) return;
    var timer = null;
    function step() {
      var cur = items[i]; i = (i + 1) % items.length; var nxt = items[i];
      place(nxt, '115%', 0, false);   // park the next word below, invisibly
      void nxt.offsetWidth;            // commit before animating
      place(cur, '-115%', 0, true);
      place(nxt, '0%', 1, true);
      if (colors.length) el.style.backgroundColor = colors[i % colors.length];
      fit(nxt);
    }
    function start() { if (!timer) timer = setInterval(step, 2400); }
    function stop() { clearInterval(timer); timer = null; }
    d.addEventListener('visibilitychange', function () { d.hidden ? stop() : start(); });
    start();
  });

  /* ---------- Hand-drawn doodles: draw when they scroll into view ---------- */
  function drawDoodles() {
    var ds = $$('.doodle');
    if (!ds.length) return;
    if (!('IntersectionObserver' in w) || !h.classList.contains('motion-ok')) { ds.forEach(function (x) { x.classList.add('is-drawn'); }); return; }
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (e) {
        if (!e.isIntersecting) return;
        var t = e.target, inHero = t.closest('.hero, .page-hero');
        setTimeout(function () { t.classList.add('is-drawn'); }, inHero ? 900 : 350);
        io.unobserve(t);
      });
    }, { threshold: .6 });
    ds.forEach(function (x) { io.observe(x); });
  }
  if (HF.introDone) drawDoodles(); else d.addEventListener('hf:intro', drawDoodles, { once: true });

  /* ---------- Tabs (pathways, segmented controls) ---------- */
  $$('[data-tabs]').forEach(function (root) {
    var tabs = $$('[role="tab"]', root);
    var pill = $('.seg__pill', root);
    function movePill(tab) {
      if (!pill) return;
      pill.style.width = tab.offsetWidth + 'px';
      pill.style.transform = 'translateX(' + tab.offsetLeft + 'px)';
    }
    function select(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        var p = d.getElementById(t.getAttribute('aria-controls'));
        if (p) { p.hidden = !on; if (on) { p.classList.remove('is-in'); void p.offsetWidth; p.classList.add('is-in'); } }
      });
      movePill(tab);
      if (focus) tab.focus();
      root.dispatchEvent(new CustomEvent('hf:tab', { detail: { panel: d.getElementById(tab.getAttribute('aria-controls')) } }));
      if (w.ScrollTrigger) setTimeout(function () { w.ScrollTrigger.refresh(); }, 50);
    }
    // Phones/tablets (panels with photos): every option is shown as its own card, stacked.
    // Each card animates in as it scrolls into view (see motion.js); nothing is pinned.
    var stackMode = false;
    if (root.classList.contains('pathways--rich') && w.matchMedia('(max-width: 1079px)').matches) {
      stackMode = true; root.classList.add('is-stack');
      tabs.forEach(function (t, k) {
        var p = d.getElementById(t.getAttribute('aria-controls')); p.hidden = false;
        var fig = $('.pathway-panel__media', p);
        if (fig && !$('.pw-num', fig)) fig.insertAdjacentHTML('beforeend', '<span class="pw-num" aria-hidden="true">' + String(k + 1).padStart(2, '0') + '</span>');
      });
      w.addEventListener('resize', function () {
        if (w.matchMedia('(min-width: 1080px)').matches && root.classList.contains('is-stack')) location.reload();
      });
    }
    // Optional auto-play (data-autoplay="ms"): cycles while on screen, pauses on hover,
    // stops for good once the visitor picks a tab themselves.
    var auto = +root.getAttribute('data-autoplay') || 0, raf = 0, last = 0, elapsed = 0, inView = false, hovering = false, stopped = reduce || !auto || stackMode;
    if (auto || root.hasAttribute('data-scrollsteps')) tabs.forEach(function (t) { t.classList.add('has-bar'); var b = d.createElement('span'); b.className = 'pathway-tab__bar'; b.setAttribute('aria-hidden', 'true'); b.innerHTML = '<i></i>'; t.appendChild(b); });
    function current() { return tabs.filter(function (t) { return t.getAttribute('aria-selected') === 'true'; })[0]; }
    function frame(ts) {
      if (stopped) return;
      if (!last) last = ts;
      if (inView && !hovering) elapsed += ts - last;
      last = ts;
      var cur = current(), bar = cur && $('.pathway-tab__bar', cur);
      if (bar) bar.style.setProperty('--p', Math.min(1, elapsed / auto));
      if (elapsed >= auto) { elapsed = 0; if (bar) bar.style.setProperty('--p', 0); select(tabs[(tabs.indexOf(cur) + 1) % tabs.length]); }
      raf = requestAnimationFrame(frame);
    }
    function stopAuto() { if (stopped) return; stopped = true; cancelAnimationFrame(raf); root.classList.remove('is-auto'); }
    // Scroll-driven (data-scrollsteps, desktop): the block pins and each tab takes a slice of the scroll.
    var stepST = null;
    if (root.hasAttribute('data-scrollsteps') && !reduce && w.gsap && w.ScrollTrigger && w.matchMedia('(min-width: 1080px)').matches) {
      stopped = true; root.classList.add('is-scroll');
      w.gsap.registerPlugin(w.ScrollTrigger);
      var n = tabs.length;
      // Pin the whole block (heading + options) when it fits on screen so no empty band shows above;
      // otherwise pin just the options, just below the header.
      var block = root.closest('.container') || root, headerH = ($('.nav') || { offsetHeight: 68 }).offsetHeight + 14;
      var fits = function () { return block.offsetHeight <= w.innerHeight - headerH - 24; };
      var pinEl = fits() ? block : root, ph = null;
      if (pinEl === root && block !== root) {
        // Compact title + live counter that fades in above the options while they're pinned
        var eb = $('.eyebrow', block), h2 = $('h2', block);
        ph = d.createElement('div'); ph.className = 'pw-pinhead'; ph.setAttribute('aria-hidden', 'true');
        ph.innerHTML = '<span class="pw-pinhead__t">' + (h2 ? h2.textContent.replace(/\s+/g, ' ').trim() : '') + '</span><span class="pw-pinhead__n"><b>01</b> / ' + String(n).padStart(2, '0') + '</span>';
        root.appendChild(ph);
      }
      stepST = w.ScrollTrigger.create({
        trigger: pinEl, toggleClass: { targets: root, className: 'is-pinned' },
        start: function () {
          if (pinEl === root) return 'center ' + Math.round(w.innerHeight / 2 + 34) + 'px';   // header hides while scrolling down
          var free = w.innerHeight - headerH; return 'top ' + Math.round(headerH + Math.max(12, (free - pinEl.offsetHeight) / 2)) + 'px';
        },
        end: function () { return '+=' + Math.round(w.innerHeight * .55 * (n - 1) + w.innerHeight * .25); },
        pin: pinEl, pinSpacing: true, anticipatePin: 1, invalidateOnRefresh: true,
        onUpdate: function (self) {
          var x = self.progress * n, idx = Math.min(n - 1, Math.floor(x)), cur = current();
          if (tabs[idx] !== cur) { select(tabs[idx]); if (ph) $('b', ph).textContent = String(idx + 1).padStart(2, '0'); }
          var bar = $('.pathway-tab__bar', tabs[idx]); if (bar) bar.style.setProperty('--p', Math.min(1, x - idx));
        }
      });
      root._stepTo = function (i) {
        var y = stepST.start + (stepST.end - stepST.start) * ((i + .5) / n);
        if (HF.lenis) HF.lenis.scrollTo(y, { duration: .9 }); else w.scrollTo({ top: y, behavior: 'smooth' });
      };
    }
    if (!stopped) {
      root.classList.add('is-auto');
      root.addEventListener('mouseenter', function () { hovering = true; });
      root.addEventListener('mouseleave', function () { hovering = false; });
      if ('IntersectionObserver' in w) new IntersectionObserver(function (en) { inView = en[0].isIntersecting; }, { threshold: .35 }).observe(root);
      else inView = true;
      raf = requestAnimationFrame(frame);
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function (e) { if (e.isTrusted) stopAuto(); if (root._stepTo && e.isTrusted) { root._stepTo(i); return; } select(t); });
      t.addEventListener('keydown', function (e) {
        var k = e.key, n = null;
        if (k === 'ArrowRight' || k === 'ArrowDown') n = tabs[(i + 1) % tabs.length];
        if (k === 'ArrowLeft' || k === 'ArrowUp') n = tabs[(i - 1 + tabs.length) % tabs.length];
        if (n) { e.preventDefault(); stopAuto(); select(n, true); }
      });
    });
    var start = tabs.filter(function (t) { return t.getAttribute('aria-selected') === 'true'; })[0] || tabs[0];
    requestAnimationFrame(function () { movePill(start); });
    w.addEventListener('resize', function () { movePill(tabs.filter(function (t) { return t.getAttribute('aria-selected') === 'true'; })[0]); });
    if (d.fonts && d.fonts.ready) d.fonts.ready.then(function () { movePill(start); });
  });

  /* ---------- Accordions (animated <details>) ---------- */
  $$('.acc__item').forEach(function (item) {
    var sum = $('summary', item), body = $('.acc__content', item);
    sum.addEventListener('click', function (e) {
      if (reduce || !body.animate) return;
      e.preventDefault();
      if (item.open) {
        var a = body.animate([{ height: body.offsetHeight + 'px' }, { height: '0px' }], { duration: 420, easing: 'cubic-bezier(.16,1,.3,1)' });
        item.classList.add('is-closing');
        a.onfinish = function () { item.open = false; item.classList.remove('is-closing'); refreshST(); };
      } else {
        item.open = true;
        var hgt = body.offsetHeight;
        body.animate([{ height: '0px' }, { height: hgt + 'px' }], { duration: 520, easing: 'cubic-bezier(.16,1,.3,1)' }).onfinish = refreshST;
      }
    });
  });
  function refreshST() { if (w.ScrollTrigger) w.ScrollTrigger.refresh(); }

  /* ---------- Testimonial slider ---------- */
  $$('[data-quotes]').forEach(function (root) {
    var slides = $$('.quote', root), i = 0, timer = null, dur = 8000;
    var prog = $('[data-quotes-progress]', root), count = $('[data-quotes-count]', root);
    root.style.setProperty('--qdur', dur / 1000 + 's');
    var bars = slides.map(function (_, n) {
      var b = d.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', 'Show testimonial ' + (n + 1));
      b.addEventListener('click', function () { go(n); }); prog.appendChild(b); return b;
    });
    function pad(n) { return String(n).padStart(2, '0'); }
    function go(n) {
      slides[i].classList.remove('is-active');
      i = (n + slides.length) % slides.length;
      slides[i].classList.add('is-active');
      bars.forEach(function (b, k) { b.classList.toggle('is-done', k < i); b.classList.remove('is-active'); });
      void bars[i].offsetWidth; bars[i].classList.add('is-active');
      if (count) count.textContent = pad(i + 1) + ' / ' + pad(slides.length);
      if (HF.animateQuote) HF.animateQuote(slides[i]);
      restart();
    }
    function restart() { clearTimeout(timer); if (!reduce) timer = setTimeout(function () { go(i + 1); }, dur); }
    var nx = $('[data-quotes-next]', root), pv = $('[data-quotes-prev]', root);
    if (nx) nx.addEventListener('click', function () { go(i + 1); });
    if (pv) pv.addEventListener('click', function () { go(i - 1); });
    root.addEventListener('mouseenter', function () { root.classList.add('is-paused'); clearTimeout(timer); });
    root.addEventListener('mouseleave', function () { root.classList.remove('is-paused'); restart(); });
    var sx = null;
    root.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    root.addEventListener('touchend', function (e) { if (sx == null) return; var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) go(i + (dx < 0 ? 1 : -1)); sx = null; });
    bars[0].classList.add('is-active');
    // Start the clock only once the slider is on screen.
    if ('IntersectionObserver' in w) {
      var io = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { restart(); io.disconnect(); } }, { threshold: .3 });
      io.observe(root);
    } else restart();
  });

  /* ---------- Video facade (loads YouTube only on click) ---------- */
  $$('[data-video]').forEach(function (v) {
    var btn = $('.video__btn', v);
    btn.addEventListener('click', function () {
      var f = d.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + v.getAttribute('data-video') + '?autoplay=1&rel=0&modestbranding=1';
      f.title = btn.getAttribute('aria-label') || 'Video';
      f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      f.allowFullscreen = true;
      v.appendChild(f); v.classList.add('is-playing');
    });
  });

  /* ---------- Case rail buttons (when not pinned) ---------- */
  $$('[data-rail]').forEach(function (rail) {
    var track = $('[data-rail-track]', rail);
    var sec = rail.closest('section');
    var prev = sec && $('[data-rail-prev]', sec), next = sec && $('[data-rail-next]', sec);
    function step() { var c = track.children[0]; return c ? c.getBoundingClientRect().width + 24 : 400; }
    function upd() {
      if (!prev) return;
      prev.disabled = track.scrollLeft < 8;
      next.disabled = track.scrollLeft + track.clientWidth > track.scrollWidth - 8;
    }
    if (prev) prev.addEventListener('click', function () { if (HF.railStep && rail.classList.contains('is-pinned')) HF.railStep(-1); else track.scrollBy({ left: -step(), behavior: 'smooth' }); });
    if (next) next.addEventListener('click', function () { if (HF.railStep && rail.classList.contains('is-pinned')) HF.railStep(1); else track.scrollBy({ left: step(), behavior: 'smooth' }); });
    track.addEventListener('scroll', upd, { passive: true }); upd();
  });

  /* ---------- Pressure Check ---------- */
  var BANDS = [
    { max: 30, key: 'performing', label: 'Performing · protect it', color: 'var(--mint)',
      headline: 'You’ve built something worth protecting.',
      diag: 'Your answers show the signs of a healthy, high-performing culture: decisions move, people speak up and energy is sustainable. The risk now is complacency, and growth or change quietly eroding what works.',
      rec: 'Keep the edge: a leadership learning programme, or a keynote and facilitated offsite to stretch your best people. <a class="link-arrow" href="learning.html" style="color:var(--mint)">Leadership learning</a>' },
    { max: 60, key: 'strain', label: 'Under strain · act now', color: 'var(--sun)',
      headline: 'The cracks are showing, and they’re fixable.',
      diag: 'Performance is holding, but at a cost. Some decisions stall, some conversations happen too late and some of your people are surviving rather than thriving. This is the moment to act, before it gets expensive.',
      rec: 'A focused coaching sprint for key leaders, or a Culture Foundations Audit to find the real barriers in 6 to 8 weeks. <a class="link-arrow" href="culture.html" style="color:var(--mint)">Culture solutions</a>' },
    { max: 101, key: 'red', label: 'Red zone · reset needed', color: 'var(--coral)',
      headline: 'Performance is running on borrowed energy.',
      diag: 'Your answers point to high pressure across decisions, energy and trust. Teams in this zone often look busy and fine from the outside while burnout, rework and quiet exits pile up. You don’t need more effort. You need a reset.',
      rec: 'Culture Reset &amp; Strategy Development (10 to 12 weeks), paired with leadership team coaching to stabilise performance while the change lands. <a class="link-arrow" href="culture.html" style="color:var(--mint)">See the reset</a>' }
  ];
  $$('[data-quiz]').forEach(function (quiz) {
    var qs = $$('.quiz__q', quiz), answers = [], idx = 0;
    var stepLbl = $('[data-quiz-step]', quiz), bar = $('.quiz__progress .bar i', quiz);
    var back = $('[data-quiz-back]', quiz), nav = $('[data-quiz-nav]', quiz), res = $('[data-quiz-result]', quiz);
    function pad(n) { return String(n).padStart(2, '0'); }
    function show(n) {
      idx = n;
      qs.forEach(function (q, k) { q.classList.toggle('is-active', k === n); });
      res.classList.remove('is-active'); nav.style.display = '';
      stepLbl.textContent = pad(n + 1) + ' / ' + pad(qs.length);
      bar.style.width = (n / qs.length * 100) + '%';
      back.disabled = n === 0;
      $$('.quiz__opt', qs[n]).forEach(function (o, k) { o.classList.toggle('is-picked', answers[n] === +o.getAttribute('data-v')); });
    }
    qs.forEach(function (q, n) {
      $$('.quiz__opt', q).forEach(function (o) {
        o.addEventListener('click', function () {
          answers[n] = +o.getAttribute('data-v');
          $$('.quiz__opt', q).forEach(function (x) { x.classList.toggle('is-picked', x === o); });
          setTimeout(function () { n < qs.length - 1 ? show(n + 1) : result(); }, 260);
        });
      });
    });
    back.addEventListener('click', function () { if (idx > 0) show(idx - 1); });
    $('[data-quiz-restart]', quiz).addEventListener('click', function () { answers = []; show(0); });
    function result() {
      var total = answers.reduce(function (a, b) { return a + b; }, 0);
      var score = Math.round(total / (qs.length * 3) * 100);
      var band = BANDS.filter(function (b) { return score <= b.max; })[0];
      var worst = 0; answers.forEach(function (v, k) { if (v > answers[worst]) worst = k; });
      var hot = qs[worst].getAttribute('data-area');
      qs.forEach(function (q) { q.classList.remove('is-active'); });
      nav.style.display = 'none';
      bar.style.width = '100%'; stepLbl.textContent = 'Your result';
      quiz.style.setProperty('--gauge', band.color);
      $('[data-band]', quiz).textContent = band.label;
      $('[data-headline]', quiz).textContent = band.headline;
      $('[data-diagnosis]', quiz).textContent = band.diag;
      $('[data-rec]', quiz).innerHTML = band.rec;
      $('[data-hotspot]', quiz).textContent = answers[worst] === 0 ? 'Nothing is flashing red. Keep listening for early signals.' : hot + ': this is where pressure is leaking out first.';
      res.classList.add('is-active');
      var ring = $('.gauge__ring .fg', quiz), val = $('[data-gauge-val]', quiz);
      ring.style.strokeDashoffset = 327;
      requestAnimationFrame(function () { requestAnimationFrame(function () { ring.style.strokeDashoffset = 327 - 327 * score / 100; }); });
      var t0 = null;
      (function tick(t) { if (!t0) t0 = t; var p = Math.min(1, (t - t0) / 1400); val.textContent = Math.round(score * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(tick); })(performance.now());
      var data = { score: score, band: band.key, label: band.label, hot: answers[worst] === 0 ? '' : hot };
      store.set('hf-pressure', JSON.stringify(data));
      $('[data-result-cta]', quiz).href = 'contact.html?from=pressure-check';
    }
  });

  /* ---------- Cost of turnover calculator ---------- */
  $$('[data-calc]').forEach(function (c) {
    var cur = CFG.currency || '£';
    var inputs = $$('input[type="range"]', c);
    function money(n) {
      if (n >= 1e6) return cur + (n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace(/\.0$/, '') + 'm';
      if (n >= 1e3) return cur + Math.round(n / 1e3) + 'k';
      return cur + Math.round(n);
    }
    function fmt(input) {
      var v = +input.value, f = input.getAttribute('data-format');
      if (f === 'money') return cur + v.toLocaleString('en-GB');
      if (f === 'pct') return v + '%';
      return v.toLocaleString('en-GB');
    }
    function calc() {
      var get = function (n) { return +$('[name="' + n + '"]', c).value; };
      inputs.forEach(function (i) {
        var p = (i.value - i.min) / (i.max - i.min) * 100; i.style.setProperty('--p', p + '%');
        var o = $('output[for="' + i.id + '"]', c); if (o) o.textContent = fmt(i);
      });
      var leavers = get('headcount') * get('turnover') / 100 * get('avoidable') / 100;
      var low = leavers * get('salary') * 0.5, high = leavers * get('salary') * 2;
      $('[data-out="low"]', c).textContent = money(low);
      $('[data-out="high"]', c).textContent = money(high);
      $('[data-out="leavers"]', c).textContent = Math.round(leavers).toLocaleString('en-GB');
      $('[data-out="per"]', c).textContent = money(get('salary') * 0.5) + ' – ' + money(get('salary') * 2);
      $('[data-out="save"]', c).textContent = money(low * 0.2);
    }
    inputs.forEach(function (i) { i.addEventListener('input', calc); });
    calc();
  });

  /* ---------- Journal filters ---------- */
  $$('[data-filters]').forEach(function (bar) {
    var grid = $(bar.getAttribute('data-filters')), posts = $$('.post', grid);
    $$('.filter-btn', bar).forEach(function (b) {
      var f = b.getAttribute('data-filter');
      var n = f === 'all' ? posts.length : posts.filter(function (p) { return p.getAttribute('data-cat') === f; }).length;
      var s = d.createElement('sup'); s.textContent = n; b.appendChild(s);
      b.addEventListener('click', function () {
        $$('.filter-btn', bar).forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        posts.forEach(function (p) {
          var show = f === 'all' || p.getAttribute('data-cat') === f;
          p.hidden = !show;
          if (show && !reduce && p.animate) p.animate([{ opacity: 0, transform: 'translateY(20px)' }, { opacity: 1, transform: 'none' }], { duration: 600, easing: 'cubic-bezier(.16,1,.3,1)' });
        });
        refreshST();
      });
    });
  });

  /* ---------- Copy to clipboard ---------- */
  $$('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      var src = $(b.getAttribute('data-copy')); if (!src) return;
      var text = src.innerText.trim(), label = $('span', b), old = label.textContent;
      var done = function () { label.textContent = 'Copied'; setTimeout(function () { label.textContent = old; }, 1800); };
      if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, function () {});
      else { var t = d.createElement('textarea'); t.value = text; d.body.appendChild(t); t.select(); try { d.execCommand('copy'); done(); } catch (e) {} t.remove(); }
    });
  });

  /* ---------- Newsletter ---------- */
  $$('[data-newsletter]').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = $('input[type="email"]', f).value.trim(); if (!email) return;
      var btn = $('button span', f);
      if (CFG.newsletterEndpoint) {
        fetch(CFG.newsletterEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ email: email, source: 'website' }) })
          .then(function (r) { btn.textContent = r.ok ? 'You’re in' : 'Try again'; if (r.ok) f.reset(); })
          .catch(function () { btn.textContent = 'Try again'; });
      } else {
        w.open((CFG.newsletterFallback || '#') + '?email=' + encodeURIComponent(email), '_blank', 'noopener');
        btn.textContent = 'Almost there';
      }
    });
  });

  /* ---------- Enquiry form ---------- */
  var form = $('[data-enquiry]');
  if (form) (function () {
    var steps = $$('.fstep', form), i = 0;
    var bars = $$('.enquiry__steps span', form);
    var lbl = $('[data-step-label]', form), name = $('[data-step-name]', form);
    var prev = $('[data-prev]', form), next = $('[data-next]', form), submit = $('[data-submit]', form);
    var shell = form.closest('.enquiry');
    var params = new URLSearchParams(location.search);
    var pc = null; try { pc = JSON.parse(store.get('hf-pressure') || 'null'); } catch (e) {}

    function typeVal() { var r = $('input[name="type"]:checked', form); return r ? r.value : ''; }
    function filterByType() {
      var t = typeVal();
      $$('[data-for]', form).forEach(function (el) {
        var on = !t || el.getAttribute('data-for').split(' ').indexOf(t) > -1;
        el.hidden = !on;
        if (!on) $$('input', el).forEach(function (x) { x.checked = false; });
      });
    }
    function show(n) {
      i = n;
      steps.forEach(function (s, k) { s.classList.toggle('is-active', k === n); });
      bars.forEach(function (b, k) { b.classList.toggle('is-done', k <= n); });
      lbl.textContent = 'Step ' + (n + 1) + ' of ' + steps.length;
      name.textContent = steps[n].getAttribute('data-name');
      prev.style.visibility = n === 0 ? 'hidden' : 'visible';
      next.hidden = n === steps.length - 1; submit.hidden = n !== steps.length - 1;
      var top = shell.getBoundingClientRect().top;
      if (top < 0 || top > w.innerHeight * .6) HF.scrollTo(shell, -110);
    }
    function valid(step) {
      var ok = true;
      step.classList.remove('has-error');
      $$('[data-required-group]', step).forEach(function (g) {
        if (g.hidden) return;
        if (!$('input:checked', g)) { ok = false; step.classList.add('has-error'); }
      });
      $$('.field', step).forEach(function (f) {
        var inp = $('input, select, textarea', f); if (!inp || !inp.required) return;
        var bad = !inp.value.trim() || (inp.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(inp.value.trim()));
        f.classList.toggle('has-error', bad); if (bad) ok = false;
      });
      var cons = $('input[name="consent"]', step);
      if (cons && !cons.checked) { ok = false; step.classList.add('has-error'); }
      if (!ok) { var first = $('.has-error input, .has-error select, .has-error textarea', step) || $('input', step); if (first) first.focus({ preventScroll: true }); }
      return ok;
    }
    $$('input[name="type"]', form).forEach(function (r) { r.addEventListener('change', function () { filterByType(); setTimeout(function () { if (i === 0) { valid(steps[0]) && show(1); } }, 280); }); });
    next.addEventListener('click', function () { if (valid(steps[i])) show(i + 1); });
    prev.addEventListener('click', function () { if (i > 0) show(i - 1); });
    $$('input, select, textarea', form).forEach(function (el) { el.addEventListener('input', function () { var f = el.closest('.field'); if (f) f.classList.remove('has-error'); }); });

    // Prefill from links (?type=hr) and from the Pressure Check result.
    var t = params.get('type');
    if (t) { var r = $('input[name="type"][value="' + t + '"]', form); if (r) { r.checked = true; } }
    var note = $('[data-prefill]', form.closest('.form-shell') || d);
    if (pc && (params.get('from') === 'pressure-check' || store.get('hf-pressure'))) {
      if (note) { note.innerHTML = '<b>Pressure Check attached:</b>&nbsp;' + pc.score + '/100, ' + pc.label + (pc.hot ? '. Biggest pressure point: ' + pc.hot + '.' : '.'); note.classList.add('is-on'); }
    }
    filterByType();
    show(t && $('input[name="type"]:checked', form) ? 1 : 0);

    function score(data) {
      var s = 0;
      s += { csuite: 3, director: 2, senior: 1 }[data.seniority] || 0;
      s += { asap: 3, '1-3': 2, '3-6': 1 }[data.timeframe] || 0;
      s += { '40k+': 3, '15-40k': 3, '5-15k': 2, 'under-5k': 1, unsure: 1 }[data.budget] || 0;
      if (data.email && !/@(gmail|yahoo|hotmail|outlook|icloud|aol|live|me)\./i.test(data.email)) s += 1;
      if (pc && pc.band === 'red') s += 1;
      return s >= 7 ? 'Priority' : s >= 4 ? 'Qualified' : 'Nurture';
    }
    function collect() {
      var fd = new FormData(form), data = {};
      fd.forEach(function (v, k) { if (k === 'challenges') { (data[k] = data[k] || []).push(v); } else data[k] = v; });
      data.challenges = (data.challenges || []).join(', ');
      if (pc) data.pressure_check = pc.score + '/100 (' + pc.label + ')' + (pc.hot ? ', pressure point: ' + pc.hot : '');
      data.lead_tier = score(data);
      data.page = location.href;
      return data;
    }
    var labels = { type: 'I am', challenges: 'What is going on', outcome: 'Success in 6 months', seniority: 'Seniority', size: 'People in scope', timeframe: 'Timeframe', budget: 'Indicative budget', name: 'Name', email: 'Email', company: 'Organisation', role: 'Role', source: 'Heard about us via', message: 'Anything else', pressure_check: 'Pressure Check', lead_tier: 'Lead tier' };
    function readable(data, k) {
      var el = $('[name="' + k + '"]', form);
      if (el && el.tagName === 'SELECT') { var o = $('option[value="' + data[k] + '"]', el); return o ? o.textContent : data[k]; }
      var r = $('input[name="' + k + '"][value="' + data[k] + '"]', form);
      if (r) { var s = r.parentNode.querySelector('strong'); return s ? s.textContent : data[k]; }
      return data[k];
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!valid(steps[i])) return;
      if ($('input[name="website"]', form).value) return; // bot
      var data = collect();
      var typeLabel = readable(data, 'type');
      var subject = '[' + data.lead_tier + '] New enquiry: ' + typeLabel + (data.company ? ' · ' + data.company : '');
      submit.disabled = true; $('span', submit).textContent = 'Sending…';
      function done(viaMail) {
        shell.classList.add('is-done');
        var tier = data.lead_tier;
        $('[data-done-name]', shell).textContent = (data.name || '').split(' ')[0] || 'there';
        $('[data-done-mail]', shell).hidden = !viaMail;
        var book = $('[data-done-book]', shell);
        if (book) { book.hidden = !(CFG.calendarUrl && tier !== 'Nurture'); if (CFG.calendarUrl) book.href = CFG.calendarUrl; }
        $('[data-done-nurture]', shell).hidden = tier !== 'Nurture';
        store.del('hf-pressure');
        HF.scrollTo(shell, -120);
      }
      if (CFG.formEndpoint) {
        data._subject = subject;
        fetch(CFG.formEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) })
          .then(function (r) { if (!r.ok) throw new Error('bad'); done(false); })
          .catch(function () { mailto(); done(true); });
      } else { mailto(); done(true); }
      function mailto() {
        var lines = Object.keys(labels).filter(function (k) { return data[k]; }).map(function (k) { return labels[k] + ': ' + readable(data, k); });
        location.href = 'mailto:' + (CFG.contactEmail || '') + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(lines.join('\n') + '\n\nSent from ' + location.host);
      }
    });
  })();

  /* ---------- Homepage graphics on every inner page header ---------- */
  $$('.page-hero').forEach(function (hero) {
    if (hero.hasAttribute('data-plain')) return;   // photo-led heroes skip the dot field
    if (!$('[data-dotfield]', hero)) { var c = d.createElement('canvas'); c.className = 'dotfield'; c.setAttribute('data-dotfield', ''); c.setAttribute('aria-hidden', 'true'); hero.insertBefore(c, hero.firstChild); }
    var media = $('.page-hero__media', hero);
    if (media && !$('.rings', media)) {
      media.insertAdjacentHTML('afterbegin', '<svg class="rings" viewBox="0 0 600 600" aria-hidden="true"><circle class="r1" cx="300" cy="300" r="292"/><circle class="r2" cx="300" cy="300" r="240"/><circle class="r3" cx="300" cy="300" r="188"/><circle class="r4" cx="300" cy="300" r="292" pathLength="100"/></svg>');
      media.setAttribute('data-tilt', '');
    }
  });

  /* ---------- Hero dot field ----------
     A grid of dots that breathes slowly and swells towards the cursor.
     Static on touch devices and with reduced motion; pauses off-screen. */
  $$('[data-dotfield]').forEach(function (cv) {
    var ctx = cv.getContext('2d'); if (!ctx) return;
    var host = cv.parentNode, W = 0, H = 0, dots = [], mx = -9999, my = -9999, sx = -9999, sy = -9999, visible = true, raf = 0;
    var fine = w.matchMedia('(hover: hover) and (pointer: fine)').matches, animate = fine && !reduce;
    function size() {
      var dpr = Math.min(2, w.devicePixelRatio || 1), r = host.getBoundingClientRect();
      W = r.width; H = r.height; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var gap = W < 700 ? 24 : 30; dots = [];
      for (var y = gap / 2; y < H; y += gap) for (var x = gap / 2; x < W; x += gap) dots.push(x, y);
      if (!animate) draw(0);
    }
    function draw(t) {
      ctx.clearRect(0, 0, W, H);
      sx += (mx - sx) * .12; sy += (my - sy) * .12;
      for (var i = 0; i < dots.length; i += 2) {
        var x = dots[i], y = dots[i + 1], dx = x - sx, dy = y - sy, d = Math.sqrt(dx * dx + dy * dy) || 1;
        var inf = Math.max(0, 1 - d / 170), wave = (Math.sin(t / 1600 + x * .011 + y * .007) + 1) / 2;
        var px = x + dx / d * inf * 14, py = y + dy / d * inf * 14;
        if (inf > .02) {
          ctx.fillStyle = 'rgba(131,239,192,' + (.25 + inf * .75).toFixed(3) + ')';
          var s = 1.4 + inf * 3.2; ctx.fillRect(px - s / 2, py - s / 2, s, s);
        } else {
          ctx.fillStyle = 'rgba(246,243,236,' + (.13 + wave * .16).toFixed(3) + ')';
          ctx.fillRect(px - .9, py - .9, 1.8, 1.8);
        }
      }
    }
    function loop(t) { draw(t); if (visible) raf = requestAnimationFrame(loop); }
    size(); w.addEventListener('resize', size);
    if (!animate) return;
    host.addEventListener('mousemove', function (e) { var r = host.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; if (sx < -999) { sx = mx; sy = my; } });
    host.addEventListener('mouseleave', function () { mx = my = -9999; });
    if ('IntersectionObserver' in w) new IntersectionObserver(function (en) {
      visible = en[0].isIntersecting; cancelAnimationFrame(raf); if (visible) raf = requestAnimationFrame(loop);
    }).observe(host);
    raf = requestAnimationFrame(loop);
  });

  /* ---------- Article pages: reading progress + copy link ---------- */
  var prog = $('[data-read-progress]'), artBody = $('.article-body');
  if (prog && artBody) {
    var upd = function () {
      var r = artBody.getBoundingClientRect(), total = r.height - w.innerHeight * .6;
      var p = Math.min(1, Math.max(0, (-r.top + w.innerHeight * .3) / Math.max(1, total)));
      prog.style.transform = 'scaleX(' + p + ')';
    };
    w.addEventListener('scroll', function () { requestAnimationFrame(upd); }, { passive: true }); upd();
  }
  $$('[data-copy-url]').forEach(function (b) {
    b.addEventListener('click', function () {
      var done = $('[data-copy-done]');
      var ok = function () { if (done) { done.textContent = 'Link copied'; setTimeout(function () { done.textContent = ''; }, 1800); } };
      if (navigator.clipboard) navigator.clipboard.writeText(location.href).then(ok, function () {});
    });
  });

  /* ---------- Misc ---------- */
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
